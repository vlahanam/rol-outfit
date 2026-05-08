package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
)

// hashToken returns the SHA256 hex digest of the token string.
func hashToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

// Refresh verifies a refresh token, detects theft via family rotation,
// revokes the old token, and issues a new access+refresh pair.
func (s *authService) Refresh(ctx context.Context, refreshTokenStr string) (*models.AuthTokens, error) {
	// Parse and verify JWT signature + expiry
	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrRefreshTokenInvalid
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrRefreshTokenInvalid
	}

	familyID, _ := claims["family_id"].(string)
	userID, _ := claims["sub"].(string)
	if familyID == "" || userID == "" {
		return nil, ErrRefreshTokenInvalid
	}

	// Look up hash in DB — JWT signature alone is not sufficient
	hash := hashToken(refreshTokenStr)
	dbToken, err := s.refreshTokenRepo.FindRefreshTokenByHash(ctx, hash)
	if err != nil {
		return nil, fmt.Errorf("failed to look up refresh token: %w", err)
	}
	if dbToken == nil {
		return nil, ErrRefreshTokenInvalid
	}

	// Theft detection: revoked token reused → attacker has leaked token → nuke entire family
	if dbToken.RevokedAt != nil {
		_ = s.refreshTokenRepo.RevokeTokenFamily(ctx, familyID)
		return nil, ErrTokenFamilyRevoked
	}

	// Find user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, ErrRefreshTokenInvalid
	}

	// Revoke old token (single-use rotation).
	// ErrNotFound means a concurrent request already revoked it — treat as invalid
	// to preserve single-use invariant (not a theft signal, but issuing a second pair is wrong).
	if err := s.refreshTokenRepo.RevokeRefreshToken(ctx, hash); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrRefreshTokenInvalid
		}
		return nil, fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	// Issue new pair, preserving family ID for rotation chain
	return s.generateTokens(ctx, user, &familyID)
}

// Logout revokes all active refresh tokens for the user identified in the JWT.
// Idempotent: malformed or already-expired tokens are silently treated as logged out.
func (s *authService) Logout(ctx context.Context, refreshTokenStr string) error {
	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil // idempotent — malformed tokens treated as already logged out
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil
	}

	userID, _ := claims["sub"].(string)
	if userID == "" {
		return nil
	}

	return s.refreshTokenRepo.RevokeUserRefreshTokens(ctx, userID)
}
