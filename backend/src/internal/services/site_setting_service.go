package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"gorm.io/gorm"
)

var ErrSettingNotFound = errors.New("setting not found")

type SocialLinksData struct {
	FacebookURL  string `json:"facebook_url"`
	ZaloURL      string `json:"zalo_url"`
	InstagramURL string `json:"instagram_url"`
	LineURL      string `json:"line_url"`
	Email        string `json:"email"`
}

type SiteSettingService interface {
	GetSocialLinks(ctx context.Context) (*SocialLinksData, error)
	UpdateSocialLinks(ctx context.Context, data *SocialLinksData) error
}

type siteSettingService struct {
	repo repositories.SiteSettingRepository
}

func NewSiteSettingService(repo repositories.SiteSettingRepository) SiteSettingService {
	return &siteSettingService{repo: repo}
}

func (s *siteSettingService) GetSocialLinks(ctx context.Context) (*SocialLinksData, error) {
	keys := []string{
		"social_facebook_url", "social_zalo_url",
		"social_instagram_url", "social_line_url", "contact_email",
	}
	settings, err := s.repo.GetSettings(ctx, keys)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to get social links: %w", err)
	}

	data := &SocialLinksData{}
	for _, setting := range settings {
		switch setting.Key {
		case "social_facebook_url":
			data.FacebookURL = setting.Value
		case "social_zalo_url":
			data.ZaloURL = setting.Value
		case "social_instagram_url":
			data.InstagramURL = setting.Value
		case "social_line_url":
			data.LineURL = setting.Value
		case "contact_email":
			data.Email = setting.Value
		}
	}
	return data, nil
}

func (s *siteSettingService) UpdateSocialLinks(ctx context.Context, data *SocialLinksData) error {
	settings := map[string]string{
		"social_facebook_url":  data.FacebookURL,
		"social_zalo_url":      data.ZaloURL,
		"social_instagram_url": data.InstagramURL,
		"social_line_url":      data.LineURL,
		"contact_email":        data.Email,
	}
	if err := s.repo.UpdateSettings(ctx, settings); err != nil {
		return fmt.Errorf("failed to update social links: %w", err)
	}
	return nil
}
