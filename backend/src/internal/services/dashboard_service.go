package services

import (
	"context"

	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type DashboardService struct {
	db *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

func (s *DashboardService) GetStats(ctx context.Context) (*dto.DashboardStatsDTO, error) {
	stats := &dto.DashboardStatsDTO{}

	// Total revenue JPY from completed orders
	s.db.WithContext(ctx).Model(&models.Order{}).
		Where("status = ? AND currency_type = ?", models.ORDER_STATUS_COMPLETED, models.PRODUCT_TYPE_JAPANESE).
		Select("COALESCE(SUM(total_price), 0)").
		Scan(&stats.TotalRevenueJPY)

	// Total revenue VND from completed orders
	s.db.WithContext(ctx).Model(&models.Order{}).
		Where("status = ? AND currency_type = ?", models.ORDER_STATUS_COMPLETED, models.PRODUCT_TYPE_VIETNAMESE).
		Select("COALESCE(SUM(total_price), 0)").
		Scan(&stats.TotalRevenueVND)

	// Total orders count
	s.db.WithContext(ctx).Model(&models.Order{}).Count(&stats.TotalOrders)

	// Total users count
	s.db.WithContext(ctx).Model(&models.User{}).Count(&stats.TotalUsers)

	// Total products count
	s.db.WithContext(ctx).Model(&models.Product{}).Count(&stats.TotalProducts)

	// Recent orders (last 10)
	var recentOrders []struct {
		ID           string
		OrderCode    *string
		FullName     string
		TotalPrice   float64
		CurrencyType int8
		Status       int8
		CreatedAt    string
	}
	s.db.WithContext(ctx).Table("orders").
		Select("orders.id, orders.order_code, users.full_name, orders.total_price, orders.currency_type, orders.status, TO_CHAR(orders.created_at, 'DD/MM/YYYY') as created_at").
		Joins("LEFT JOIN users ON orders.user_id = users.id").
		Where("orders.deleted_at IS NULL").
		Order("orders.created_at DESC").
		Limit(10).
		Scan(&recentOrders)

	stats.RecentOrders = make([]dto.RecentOrderDTO, 0, len(recentOrders))
	for _, o := range recentOrders {
		orderCode := ""
		if o.OrderCode != nil {
			orderCode = *o.OrderCode
		}
		stats.RecentOrders = append(stats.RecentOrders, dto.RecentOrderDTO{
			ID:           o.ID,
			OrderCode:    orderCode,
			Customer:     o.FullName,
			TotalPrice:   o.TotalPrice,
			CurrencyType: o.CurrencyType,
			Status:       o.Status,
			CreatedAt:    o.CreatedAt,
		})
	}

	// Top selling products (by total sold from variants)
	var topProducts []struct {
		ID      string
		Name    string
		Sold    int64
		Revenue float64
	}
	s.db.WithContext(ctx).Table("products").
		Select(`products.id, products.name,
			COALESCE(SUM(product_variants.sold), 0) as sold,
			COALESCE(SUM(product_variants.sold * product_variants.price), 0) as revenue`).
		Joins("LEFT JOIN product_variants ON products.id = product_variants.product_id").
		Where("products.deleted_at IS NULL").
		Group("products.id").
		Order("sold DESC").
		Limit(5).
		Scan(&topProducts)

	stats.TopProducts = make([]dto.TopProductDTO, 0, len(topProducts))
	for _, p := range topProducts {
		stats.TopProducts = append(stats.TopProducts, dto.TopProductDTO{
			ID:      p.ID,
			Name:    p.Name,
			Sold:    p.Sold,
			Revenue: p.Revenue,
		})
	}

	// Enrich top products with uploads
	var topIDs []string
	for _, p := range stats.TopProducts {
		topIDs = append(topIDs, p.ID)
	}
	if len(topIDs) > 0 {
		var uploads []struct {
			ModelID      string
			ID           string
			OriginalName string
			FilePath     string
			FileSize     int64
			MimeType     string
		}
		s.db.WithContext(ctx).Table("uploads").
			Select("model_id, id, original_name, file_path, file_size, mime_type").
			Where("model_type IN ? AND model_id IN ? AND deleted_at IS NULL", []string{"product", "product_variant"}, topIDs).
			Order("created_at DESC").
			Scan(&uploads)
		uploadMap := make(map[string][]*dto.UploadDTO)
		for _, u := range uploads {
			uploadMap[u.ModelID] = append(uploadMap[u.ModelID], &dto.UploadDTO{
				ID:           u.ID,
				OriginalName: u.OriginalName,
				FilePath:     u.FilePath,
				FileSize:     u.FileSize,
				MimeType:     u.MimeType,
			})
		}
		for _, p := range stats.TopProducts {
			p.Images = uploadMap[p.ID]
		}
	}

	// Orders by status
	var statusCounts []struct {
		Status int8
		Count  int64
	}
	s.db.WithContext(ctx).Table("orders").
		Select("status, COUNT(*) as count").
		Where("deleted_at IS NULL").
		Group("status").
		Scan(&statusCounts)

	stats.OrdersByStatus = make([]dto.OrderStatusCountDTO, 0, len(statusCounts))
	for _, sc := range statusCounts {
		stats.OrdersByStatus = append(stats.OrdersByStatus, dto.OrderStatusCountDTO{
			Status: sc.Status,
			Count:  sc.Count,
		})
	}

	return stats, nil
}
