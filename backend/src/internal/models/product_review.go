package models

import "time"

const (
	REVIEW_STATUS_PENDING  = int8(1)
	REVIEW_STATUS_APPROVED = int8(2)
	REVIEW_STATUS_REJECTED = int8(3)
)

type ProductReview struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	ProductID string    `gorm:"column:product_id;type:uuid"`
	UserID    string    `gorm:"column:user_id;type:uuid"`
	OrderID   *string   `gorm:"column:order_id;type:uuid"`
	Rating    int8      `gorm:"column:rating"`
	Comment   string    `gorm:"column:comment"`
	Status    int8      `gorm:"column:status"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`

	User    *User    `gorm:"foreignKey:UserID"`
	Product *Product `gorm:"foreignKey:ProductID"`
}

func (ProductReview) TableName() string { return "product_reviews" }

type ReviewStats struct {
	AverageRating float64        `json:"average_rating"`
	TotalCount    int            `json:"total_count"`
	Distribution  map[int]int    `json:"distribution"`
}
