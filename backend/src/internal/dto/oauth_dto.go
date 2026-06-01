package dto

type OAuthProviderDTO struct {
	Provider  string `json:"provider"`
	Email     string `json:"email,omitempty"`
	Name      string `json:"name,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
	LinkedAt  string `json:"linked_at"`
}
