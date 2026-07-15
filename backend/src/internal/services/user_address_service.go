package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrAddressNotFound     = errors.New("address not found")
	ErrAddressNotOwned     = errors.New("address does not belong to user")
	ErrMaxAddressReached   = errors.New("maximum 5 addresses allowed")
	ErrCannotDeleteDefault = errors.New("cannot delete default address, set another as default first")
)

type UserAddressService interface {
	List(ctx context.Context, userID string) ([]*models.UserAddress, error)
	Create(ctx context.Context, userID string, req *requests.CreateAddressRequest) (*models.UserAddress, error)
	Update(ctx context.Context, userID, addressID string, req *requests.UpdateAddressRequest) error
	Delete(ctx context.Context, userID, addressID string) error
	SetDefault(ctx context.Context, userID, addressID string) error
}

type userAddressService struct {
	repo repositories.UserAddressRepository
}

func NewUserAddressService(repo repositories.UserAddressRepository) UserAddressService {
	return &userAddressService{repo: repo}
}

func (s *userAddressService) List(ctx context.Context, userID string) ([]*models.UserAddress, error) {
	return s.repo.ListAddressesByUserID(ctx, userID)
}

func (s *userAddressService) Create(ctx context.Context, userID string, req *requests.CreateAddressRequest) (*models.UserAddress, error) {
	address := &models.UserAddress{
		UserID:        userID,
		RecipientName: req.RecipientName,
		Phone:         req.Phone,
		Address:       req.Address,
		PostalCode:    req.PostalCode,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
	}

	if err := s.repo.CreateAddressAtomic(ctx, address); err != nil {
		if errors.Is(err, repositories.ErrMaxAddressesReached) {
			return nil, ErrMaxAddressReached
		}
		return nil, fmt.Errorf("failed to create address: %w", err)
	}
	return address, nil
}

func (s *userAddressService) Update(ctx context.Context, userID, addressID string, req *requests.UpdateAddressRequest) error {
	if err := s.verifyOwnership(ctx, userID, addressID); err != nil {
		return err
	}

	fields := make(map[string]interface{})
	if req.RecipientName != nil {
		fields["recipient_name"] = *req.RecipientName
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}
	if req.Address != nil {
		fields["address"] = *req.Address
	}
	if req.PostalCode != nil {
		fields["postal_code"] = *req.PostalCode
	}
	if req.Latitude != nil {
		fields["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		fields["longitude"] = *req.Longitude
	}

	if len(fields) == 0 {
		return nil
	}

	return s.repo.UpdateAddress(ctx, addressID, fields)
}

func (s *userAddressService) Delete(ctx context.Context, userID, addressID string) error {
	address, err := s.repo.FindAddressByID(ctx, addressID)
	if err != nil {
		return fmt.Errorf("failed to find address: %w", err)
	}
	if address == nil {
		return ErrAddressNotFound
	}
	if address.UserID != userID {
		return ErrAddressNotOwned
	}

	if address.IsDefault {
		count, err := s.repo.CountAddressesByUserID(ctx, userID)
		if err != nil {
			return fmt.Errorf("failed to count addresses: %w", err)
		}
		if count > 1 {
			return ErrCannotDeleteDefault
		}
	}

	return s.repo.SoftDeleteAddress(ctx, addressID)
}

func (s *userAddressService) SetDefault(ctx context.Context, userID, addressID string) error {
	if err := s.verifyOwnership(ctx, userID, addressID); err != nil {
		return err
	}
	return s.repo.SetDefaultAddress(ctx, userID, addressID)
}

func (s *userAddressService) verifyOwnership(ctx context.Context, userID, addressID string) error {
	address, err := s.repo.FindAddressByID(ctx, addressID)
	if err != nil {
		return fmt.Errorf("failed to find address: %w", err)
	}
	if address == nil {
		return ErrAddressNotFound
	}
	if address.UserID != userID {
		return ErrAddressNotOwned
	}
	return nil
}
