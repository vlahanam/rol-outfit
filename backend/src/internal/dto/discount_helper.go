package dto

import "time"

// IsDiscountActive returns true if percent > 0 and current time falls within [start, end].
// Nil start/end means no constraint on that side.
func IsDiscountActive(percent float64, start, end *time.Time) bool {
	if percent <= 0 {
		return false
	}
	now := time.Now()
	if start != nil && now.Before(*start) {
		return false
	}
	if end != nil && now.After(*end) {
		return false
	}
	return true
}

// EffectivePrice returns price after applying discount if active, else original price.
func EffectivePrice(price float64, percent float64, start, end *time.Time) float64 {
	if !IsDiscountActive(percent, start, end) {
		return price
	}
	return price * (1 - percent/100)
}

func formatTimePtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(time.RFC3339)
}
