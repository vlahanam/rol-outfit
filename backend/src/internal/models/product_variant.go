package models

import (
	"encoding/json"
	"sort"
	"strings"
	"time"
)

const (
	VARIANT_STATUS_ACTIVE = int8(1)
	VARIANT_STATUS_HIDDEN = int8(2)
)

type ProductVariant struct {
	ID              string          `gorm:"type:uuid;primaryKey"`
	ProductID       string          `gorm:"column:product_id;type:uuid"`
	Name            string          `gorm:"column:name"`
	NameJa          string          `gorm:"column:name_ja"`
	Attributes      json.RawMessage `gorm:"column:attributes;type:jsonb"`
	Price           float64         `gorm:"column:price;type:numeric(12,2)"`
	Stock           int             `gorm:"column:stock"`
	Sold            int             `gorm:"column:sold"`
	Status          int8            `gorm:"column:status"`
	DiscountPercent float64         `gorm:"column:discount_percent;type:numeric(5,2)"`
	DiscountStartAt *time.Time      `gorm:"column:discount_start_at"`
	DiscountEndAt   *time.Time      `gorm:"column:discount_end_at"`
	CreatedAt       time.Time       `gorm:"column:created_at"`
	UpdatedAt       time.Time       `gorm:"column:updated_at"`
	Uploads         []*Upload       `gorm:"-"`
}

func (ProductVariant) TableName() string { return "product_variants" }

// DisplayName returns the variant name derived from attributes (e.g. "M, Đen"),
// falling back to the Name column when attributes are empty.
func (v *ProductVariant) DisplayName() string {
	if len(v.Attributes) > 0 {
		var attrs map[string]string
		if err := json.Unmarshal(v.Attributes, &attrs); err == nil {
			keys := make([]string, 0, len(attrs))
			for k := range attrs {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			values := make([]string, 0, len(keys))
			for _, k := range keys {
				values = append(values, attrs[k])
			}
			return strings.Join(values, ", ")
		}
	}
	return v.Name
}
