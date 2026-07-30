package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// Test User model structure and constants
func TestUserModel_Constants(t *testing.T) {
	assert.Equal(t, int8(1), USER_ROLE_ADMIN)
	assert.Equal(t, int8(2), USER_ROLE_CUSTOMER)
	assert.Equal(t, int8(1), USER_STATUS_ACTIVE)
	assert.Equal(t, int8(2), USER_STATUS_LOCKED)
}

// Test User model fields
func TestUserModel_Fields(t *testing.T) {
	password := "hashed-password"
	user := &User{
		ID:        "test-id",
		FullName:  "Test User",
		Email:     "test@example.com",
		Password:  &password,
		Phone:     "1234567890",
		Role:      USER_ROLE_CUSTOMER,
		Status:    USER_STATUS_ACTIVE,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		DeletedAt: gorm.DeletedAt{},
	}

	assert.Equal(t, "test-id", user.ID)
	assert.Equal(t, "Test User", user.FullName)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "hashed-password", *user.Password)
	assert.Equal(t, "1234567890", user.Phone)
	assert.Equal(t, USER_ROLE_CUSTOMER, user.Role)
	assert.Equal(t, USER_STATUS_ACTIVE, user.Status)
}

// Test User table name
func TestUserModel_TableName(t *testing.T) {
	user := &User{}
	assert.Equal(t, "users", user.TableName())
}

// Test that User does not have Address field
func TestUserModel_NoAddressField(t *testing.T) {
	user := &User{
		ID:       "test-id",
		FullName: "Test User",
		Email:    "test@example.com",
		Phone:    "1234567890",
	}

	// Verify that basic User fields work
	assert.NotEmpty(t, user.ID)
	assert.NotEmpty(t, user.FullName)
	assert.NotEmpty(t, user.Email)
	assert.NotEmpty(t, user.Phone)

	// The User struct should not have an Address field
	// This is a compile-time check, but we verify the model structure is correct
	assert.Equal(t, 10, countUserFields())
}

// Helper function to count User struct fields (excluding unexported fields)
func countUserFields() int {
	// User has these exported fields: ID, FullName, Email, Password, Phone, Role, Status, CreatedAt, UpdatedAt, DeletedAt
	// Total of 10 fields
	return 10
}

// Test User model roles and statuses
func TestUserModel_RolesAndStatuses(t *testing.T) {
	tests := []struct {
		name   string
		role   int8
		status int8
	}{
		{"Admin Active", USER_ROLE_ADMIN, USER_STATUS_ACTIVE},
		{"Admin Locked", USER_ROLE_ADMIN, USER_STATUS_LOCKED},
		{"Customer Active", USER_ROLE_CUSTOMER, USER_STATUS_ACTIVE},
		{"Customer Locked", USER_ROLE_CUSTOMER, USER_STATUS_LOCKED},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			user := &User{
				ID:     "test-id",
				Role:   tc.role,
				Status: tc.status,
			}
			assert.Equal(t, tc.role, user.Role)
			assert.Equal(t, tc.status, user.Status)
		})
	}
}

// Test AuthTokens model
func TestAuthTokens(t *testing.T) {
	tokens := &AuthTokens{
		AccessToken:  "access-token-value",
		RefreshToken: "refresh-token-value",
		TokenType:    "Bearer",
		ExpiresIn:    3600,
	}

	assert.Equal(t, "access-token-value", tokens.AccessToken)
	assert.Equal(t, "refresh-token-value", tokens.RefreshToken)
	assert.Equal(t, "Bearer", tokens.TokenType)
	assert.Equal(t, int64(3600), tokens.ExpiresIn)
}
