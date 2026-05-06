package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

const (
	PRODUCT_STATUS_ACTIVE = int8(1)
	PRODUCT_STATUS_HIDDEN = int8(2)
)

// StringSlice maps a Go []string to a PostgreSQL TEXT[] column.
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if len(s) == 0 {
		return "{}", nil
	}
	elems := make([]string, len(s))
	for i, v := range s {
		elems[i] = `"` + strings.ReplaceAll(strings.ReplaceAll(v, `\`, `\\`), `"`, `\"`) + `"`
	}
	return "{" + strings.Join(elems, ",") + "}", nil
}

func (s *StringSlice) Scan(src interface{}) error {
	if src == nil {
		*s = StringSlice{}
		return nil
	}
	var str string
	switch v := src.(type) {
	case string:
		str = v
	case []byte:
		str = string(v)
	default:
		return fmt.Errorf("StringSlice.Scan: unsupported type %T", src)
	}
	str = strings.TrimSpace(str)
	if str == "{}" || str == "" {
		*s = StringSlice{}
		return nil
	}
	if !strings.HasPrefix(str, "{") || !strings.HasSuffix(str, "}") {
		return fmt.Errorf("StringSlice.Scan: invalid array format")
	}
	*s = parseStringArray(str[1 : len(str)-1])
	return nil
}

func parseStringArray(s string) StringSlice {
	if s == "" {
		return StringSlice{}
	}
	var result StringSlice
	var cur strings.Builder
	inQuote := false
	escaped := false
	for _, c := range s {
		if escaped {
			cur.WriteRune(c)
			escaped = false
			continue
		}
		switch c {
		case '\\':
			escaped = true
		case '"':
			inQuote = !inQuote
		case ',':
			if !inQuote {
				result = append(result, cur.String())
				cur.Reset()
			} else {
				cur.WriteRune(c)
			}
		default:
			cur.WriteRune(c)
		}
	}
	result = append(result, cur.String())
	return result
}

type Product struct {
	ID             string         `gorm:"type:uuid;primaryKey"`
	CategoryID     string         `gorm:"column:category_id;type:uuid"`
	Name           string         `gorm:"column:name"`
	Slug           string         `gorm:"column:slug"`
	DefaultPrice   float64        `gorm:"column:default_price;type:numeric(12,2)"`
	Description    string         `gorm:"column:description"`
	Status         int8           `gorm:"column:status"`
	AttributeNames StringSlice    `gorm:"column:attribute_names;type:text[]"`
	Avatar         string         `gorm:"column:avatar"`
	CreatedAt      time.Time      `gorm:"column:created_at"`
	UpdatedAt      time.Time      `gorm:"column:updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Product) TableName() string { return "products" }

// ProductWithVariants is used by admin queries that need product + all its variants.
type ProductWithVariants struct {
	*Product
	Variants []*ProductVariant
}
