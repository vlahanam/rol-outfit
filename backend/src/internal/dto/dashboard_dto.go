package dto

type DashboardStatsDTO struct {
	TotalRevenue   float64               `json:"total_revenue"`
	TotalOrders    int64                 `json:"total_orders"`
	TotalUsers     int64                 `json:"total_users"`
	TotalProducts  int64                 `json:"total_products"`
	RecentOrders   []RecentOrderDTO      `json:"recent_orders"`
	TopProducts    []TopProductDTO       `json:"top_products"`
	OrdersByStatus []OrderStatusCountDTO `json:"orders_by_status"`
}

type RecentOrderDTO struct {
	ID         string  `json:"id"`
	OrderCode  string  `json:"order_code"`
	Customer   string  `json:"customer"`
	TotalPrice float64 `json:"total_price"`
	Status     int8    `json:"status"`
	CreatedAt  string  `json:"created_at"`
}

type TopProductDTO struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Avatar   string  `json:"avatar"`
	Sold     int64   `json:"sold"`
	Revenue  float64 `json:"revenue"`
}

type OrderStatusCountDTO struct {
	Status int8  `json:"status"`
	Count  int64 `json:"count"`
}
