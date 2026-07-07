package dto

import (
	"encoding/json"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/utils"
)

type ProductDTO struct {
	ID              string          `json:"id"`
	CategoryID      string          `json:"category_id"`
	Name            string          `json:"name"`
	NameJa          string          `json:"name_ja,omitempty"`
	Slug            string          `json:"slug"`
	DefaultPrice    float64         `json:"default_price"`
	ShippingCost    float64         `json:"shipping_cost"`
	Description     string          `json:"description"`
	DescriptionJa   string          `json:"description_ja,omitempty"`
	Status          int8            `json:"status"`
	ProductType     int8            `json:"product_type"`
	AttributeNames  []string        `json:"attribute_names"`
	Avatar          string          `json:"avatar,omitempty"`
	DiscountPercent float64         `json:"discount_percent"`
	DiscountStartAt string          `json:"discount_start_at,omitempty"`
	DiscountEndAt   string          `json:"discount_end_at,omitempty"`
	SalePrice       float64         `json:"sale_price"`
	SizeGuide       json.RawMessage `json:"size_guide,omitempty"`
	SizeGuideJa     json.RawMessage `json:"size_guide_ja,omitempty"`
	DeliveryInfo    json.RawMessage `json:"delivery_info,omitempty"`
	DeliveryInfoJa  json.RawMessage `json:"delivery_info_ja,omitempty"`
	Tags            []*TagDTO       `json:"tags,omitempty"`
	CreatedAt       string          `json:"created_at"`
	UpdatedAt       string          `json:"updated_at"`
}

func ToProductDTO(p *models.Product) *ProductDTO {
	attrNames := []string(p.AttributeNames)
	if attrNames == nil {
		attrNames = []string{}
	}
	var tags []*TagDTO
	if len(p.Tags) > 0 {
		tags = make([]*TagDTO, 0, len(p.Tags))
		for _, t := range p.Tags {
			tags = append(tags, ToTagDTO(&t))
		}
	}
	return &ProductDTO{
		ID:              p.ID,
		CategoryID:      p.CategoryID,
		Name:            p.Name,
		NameJa:          p.NameJa,
		Slug:            p.Slug,
		DefaultPrice:    p.DefaultPrice,
		ShippingCost:    p.ShippingCost,
		Description:     p.Description,
		DescriptionJa:   p.DescriptionJa,
		Status:          p.Status,
		ProductType:     p.ProductType,
		AttributeNames:  attrNames,
		Avatar:          p.Avatar,
		DiscountPercent: p.DiscountPercent,
		DiscountStartAt: formatTimePtr(p.DiscountStartAt),
		DiscountEndAt:   formatTimePtr(p.DiscountEndAt),
		SalePrice:       EffectivePrice(p.DefaultPrice, p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt),
		SizeGuide:       json.RawMessage(p.SizeGuide),
		SizeGuideJa:     json.RawMessage(p.SizeGuideJa),
		DeliveryInfo:    json.RawMessage(p.DeliveryInfo),
		DeliveryInfoJa:  json.RawMessage(p.DeliveryInfoJa),
		Tags:            tags,
		CreatedAt:       p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       p.UpdatedAt.Format(time.RFC3339),
	}
}

type LocalizedProductDTO struct {
	ID              string             `json:"id"`
	CategoryID      string             `json:"category_id"`
	Name            string             `json:"name"`
	Slug            string             `json:"slug"`
	DefaultPrice    float64            `json:"default_price"`
	ShippingCost    float64            `json:"shipping_cost"`
	Description     string             `json:"description"`
	Status          int8               `json:"status"`
	ProductType     int8               `json:"product_type"`
	AttributeNames  []string           `json:"attribute_names"`
	Avatar          string             `json:"avatar,omitempty"`
	DiscountPercent float64            `json:"discount_percent"`
	DiscountStartAt string             `json:"discount_start_at,omitempty"`
	DiscountEndAt   string             `json:"discount_end_at,omitempty"`
	SalePrice       float64            `json:"sale_price"`
	SizeGuide       json.RawMessage    `json:"size_guide,omitempty"`
	DeliveryInfo    json.RawMessage    `json:"delivery_info,omitempty"`
	Tags            []*LocalizedTagDTO `json:"tags,omitempty"`
	CreatedAt       string             `json:"created_at"`
	UpdatedAt       string             `json:"updated_at"`
}

func (p *ProductDTO) ToLocalized(lang string) *LocalizedProductDTO {
	var tags []*LocalizedTagDTO
	if len(p.Tags) > 0 {
		tags = make([]*LocalizedTagDTO, 0, len(p.Tags))
		for _, t := range p.Tags {
			tags = append(tags, t.ToLocalized(lang))
		}
	}
	return &LocalizedProductDTO{
		ID:              p.ID,
		CategoryID:      p.CategoryID,
		Name:            utils.GetLocalizedString(p.Name, p.NameJa, lang),
		Slug:            p.Slug,
		DefaultPrice:    p.DefaultPrice,
		ShippingCost:    p.ShippingCost,
		Description:     utils.GetLocalizedString(p.Description, p.DescriptionJa, lang),
		Status:          p.Status,
		ProductType:     p.ProductType,
		AttributeNames:  p.AttributeNames,
		Avatar:          p.Avatar,
		DiscountPercent: p.DiscountPercent,
		DiscountStartAt: p.DiscountStartAt,
		DiscountEndAt:   p.DiscountEndAt,
		SalePrice:       p.SalePrice,
		SizeGuide:       getLocalizedJSON(p.SizeGuide, p.SizeGuideJa, lang),
		DeliveryInfo:    getLocalizedJSON(p.DeliveryInfo, p.DeliveryInfoJa, lang),
		Tags:            tags,
		CreatedAt:       p.CreatedAt,
		UpdatedAt:       p.UpdatedAt,
	}
}

func getLocalizedJSON(vi, ja json.RawMessage, lang string) json.RawMessage {
	if lang == "ja" && len(ja) > 0 && string(ja) != "null" {
		return ja
	}
	return vi
}

// ProductWithVariantsDTO is the admin response shape: product data + aggregated stats + variants.
type ProductWithVariantsDTO struct {
	ID              string               `json:"id"`
	CategoryID      string               `json:"category_id"`
	Name            string               `json:"name"`
	NameJa          string               `json:"name_ja,omitempty"`
	Slug            string               `json:"slug"`
	DefaultPrice    float64              `json:"default_price"`
	ShippingCost    float64              `json:"shipping_cost"`
	Description     string               `json:"description"`
	DescriptionJa   string               `json:"description_ja,omitempty"`
	Status          int8                 `json:"status"`
	ProductType     int8                 `json:"product_type"`
	AttributeNames  []string             `json:"attribute_names"`
	Avatar          string               `json:"avatar,omitempty"`
	DiscountPercent float64              `json:"discount_percent"`
	DiscountStartAt string               `json:"discount_start_at,omitempty"`
	DiscountEndAt   string               `json:"discount_end_at,omitempty"`
	SalePrice       float64              `json:"sale_price"`
	SizeGuide       json.RawMessage      `json:"size_guide,omitempty"`
	SizeGuideJa     json.RawMessage      `json:"size_guide_ja,omitempty"`
	DeliveryInfo    json.RawMessage      `json:"delivery_info,omitempty"`
	DeliveryInfoJa  json.RawMessage      `json:"delivery_info_ja,omitempty"`
	TotalStock      int                  `json:"total_stock"`
	TotalSold       int                  `json:"total_sold"`
	VariantCount    int                  `json:"variant_count"`
	Variants        []*ProductVariantDTO `json:"variants"`
	Tags            []*TagDTO            `json:"tags"`
	CreatedAt       string               `json:"created_at"`
	UpdatedAt       string               `json:"updated_at"`
}

func ToProductWithVariantsDTO(p *models.ProductWithVariants) *ProductWithVariantsDTO {
	attrNames := []string(p.AttributeNames)
	if attrNames == nil {
		attrNames = []string{}
	}

	variants := make([]*ProductVariantDTO, 0, len(p.Variants))
	var totalStock, totalSold int
	for _, v := range p.Variants {
		variants = append(variants, ToVariantDTOWithProduct(v, p.Product))
		totalStock += v.Stock
		totalSold += v.Sold
	}

	return &ProductWithVariantsDTO{
		ID:              p.ID,
		CategoryID:      p.CategoryID,
		Name:            p.Name,
		NameJa:          p.NameJa,
		Slug:            p.Slug,
		DefaultPrice:    p.DefaultPrice,
		ShippingCost:    p.ShippingCost,
		Description:     p.Description,
		DescriptionJa:   p.DescriptionJa,
		Status:          p.Status,
		ProductType:     p.ProductType,
		AttributeNames:  attrNames,
		Avatar:          p.Avatar,
		DiscountPercent: p.DiscountPercent,
		DiscountStartAt: formatTimePtr(p.DiscountStartAt),
		DiscountEndAt:   formatTimePtr(p.DiscountEndAt),
		SalePrice:       EffectivePrice(p.DefaultPrice, p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt),
		SizeGuide:       json.RawMessage(p.SizeGuide),
		SizeGuideJa:     json.RawMessage(p.SizeGuideJa),
		DeliveryInfo:    json.RawMessage(p.DeliveryInfo),
		DeliveryInfoJa:  json.RawMessage(p.DeliveryInfoJa),
		TotalStock:      totalStock,
		TotalSold:       totalSold,
		VariantCount:    len(p.Variants),
		Variants:        variants,
		Tags:            []*TagDTO{},
		CreatedAt:       p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       p.UpdatedAt.Format(time.RFC3339),
	}
}

// ProductDetailDTO is the public product detail shape: product + active tags.
type ProductDetailDTO struct {
	*ProductDTO
	Tags []*TagDTO `json:"tags"`
}

func ToProductDetailDTO(p *models.Product, tags []*models.Tag) *ProductDetailDTO {
	tagDTOs := make([]*TagDTO, 0, len(tags))
	for _, t := range tags {
		tagDTOs = append(tagDTOs, ToTagDTO(t))
	}
	return &ProductDetailDTO{
		ProductDTO: ToProductDTO(p),
		Tags:       tagDTOs,
	}
}

type LocalizedProductDetailDTO struct {
	*LocalizedProductDTO
	Tags []*LocalizedTagDTO `json:"tags"`
}

func (p *ProductDetailDTO) ToLocalized(lang string) *LocalizedProductDetailDTO {
	var tags []*LocalizedTagDTO
	if len(p.Tags) > 0 {
		tags = make([]*LocalizedTagDTO, 0, len(p.Tags))
		for _, t := range p.Tags {
			tags = append(tags, t.ToLocalized(lang))
		}
	}
	return &LocalizedProductDetailDTO{
		LocalizedProductDTO: p.ProductDTO.ToLocalized(lang),
		Tags:                tags,
	}
}

func ToProductWithVariantsDTOWithTags(p *models.ProductWithVariants, tags []*models.Tag) *ProductWithVariantsDTO {
	d := ToProductWithVariantsDTO(p)
	d.Tags = make([]*TagDTO, 0, len(tags))
	for _, t := range tags {
		d.Tags = append(d.Tags, ToTagDTO(t))
	}
	return d
}

func MapProduct[T any](p *models.Product, mapper func(*models.Product) T) T {
	return mapper(p)
}
