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

	// Total revenue from completed orders
	s.db.WithContext(ctx).Model(&models.Order{}).
		Where("status = ?", models.ORDER_STATUS_COMPLETED).
		Select("COALESCE(SUM(total_price + shipping_cost), 0)").
		Scan(&stats.TotalRevenue)

	// Total orders count
	s.db.WithContext(ctx).Model(&models.Order{}).Count(&stats.TotalOrders)

	// Total users count
	s.db.WithContext(ctx).Model(&models.User{}).Count(&stats.TotalUsers)

	// Total products count
	s.db.WithContext(ctx).Model(&models.Product{}).Count(&stats.TotalProducts)

	// Recent orders (last 10)
	var recentOrders []struct {
		ID         string
		OrderCode  *string
		FullName   string
		TotalPrice float64
		Status     int8
		CreatedAt  string
	}
	s.db.WithContext(ctx).Table("orders").
		Select("orders.id, orders.order_code, users.full_name, orders.total_price, orders.status, TO_CHAR(orders.created_at, 'DD/MM/YYYY') as created_at").
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
			ID:         o.ID,
			OrderCode:  orderCode,
			Customer:   o.FullName,
			TotalPrice: o.TotalPrice,
			Status:     o.Status,
			CreatedAt:  o.CreatedAt,
		})
	}

	// Top selling products (by total sold from variants)
	var topProducts []struct {
		ID      string
		Name    string
		Avatar  string
		Sold    int64
		Revenue float64
	}
	s.db.WithContext(ctx).Table("products").
		Select(`products.id, products.name, products.avatar,
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
			Avatar:  p.Avatar,
			Sold:    p.Sold,
			Revenue: p.Revenue,
		})
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
