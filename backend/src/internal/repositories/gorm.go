package repositories

import "gorm.io/gorm"

type PostgreSQL *gorm.DB

type postgreStorage struct {
	db *gorm.DB
}

func NewPostgreSQLStorage(db *gorm.DB) *postgreStorage {
	return &postgreStorage{db: db}
}
