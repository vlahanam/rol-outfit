package models

type OrderCodeSequence struct {
	DateKey      string `gorm:"column:date_key;primaryKey;type:varchar(6)"`
	LastSequence int    `gorm:"column:last_sequence;not null;default:0"`
}

func (OrderCodeSequence) TableName() string { return "order_code_sequences" }
