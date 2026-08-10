package initialize

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

const billReminderLocation = "Asia/Tokyo"

// StartBillReminderScheduler chạy cronjob nhắc nhở thanh toán mỗi ngày
// lúc 10:00 sáng theo giờ Nhật Bản (Asia/Tokyo) cho các đơn hàng chưa
// upload bill chuyển khoản.
func StartBillReminderScheduler(db *gorm.DB, cfg *AppConfig, emailSvc services.EmailService) {
	if !cfg.BillReminderEnabled {
		slog.Info("bill reminder scheduler disabled")
		return
	}

	loc, err := time.LoadLocation(billReminderLocation)
	if err != nil {
		slog.Error("failed to load bill reminder timezone", "error", err, "location", billReminderLocation)
		return
	}

	remindAt, err := time.Parse("15:04", cfg.BillReminderTime)
	if err != nil {
		slog.Error("invalid bill reminder time, falling back to 10:00", "error", err, "time", cfg.BillReminderTime)
		remindAt, _ = time.Parse("15:04", "10:00")
	}

	go func() {
		for {
			now := time.Now().In(loc)
			next := time.Date(now.Year(), now.Month(), now.Day(), remindAt.Hour(), remindAt.Minute(), 0, 0, loc)
			if !next.After(now) {
				next = next.AddDate(0, 0, 1)
			}
			slog.Info("bill reminder scheduler next run", "at", next.Format(time.RFC3339))
			time.Sleep(time.Until(next))

			if err := runBillReminder(db, cfg, emailSvc); err != nil {
				slog.Error("bill reminder run failed", "error", err)
			}
		}
	}()
}

func runBillReminder(db *gorm.DB, cfg *AppConfig, emailSvc services.EmailService) error {
	ctx := context.Background()
	repo := repositories.NewPostgreSQLStorage(db)

	orders, err := repo.ListAwaitingPaymentOrders(ctx)
	if err != nil {
		return fmt.Errorf("failed to list awaiting payment orders: %w", err)
	}
	if len(orders) == 0 {
		slog.Info("bill reminder: no awaiting payment orders")
		return nil
	}

	userIDs := make([]string, 0, len(orders))
	seen := make(map[string]bool)
	for _, o := range orders {
		if !seen[o.UserID] {
			seen[o.UserID] = true
			userIDs = append(userIDs, o.UserID)
		}
	}

	userMap, err := repo.FindByIDs(ctx, userIDs)
	if err != nil {
		return fmt.Errorf("failed to fetch users: %w", err)
	}

	sent, skipped := 0, 0
	for _, order := range orders {
		user := userMap[order.UserID]
		if user == nil || user.Email == "" {
			skipped++
			continue
		}

		orderURL := fmt.Sprintf("%s/orders/%s", cfg.OAuthCallbackBaseURL, order.ID)
		if err := emailSvc.SendBillReminderNotification(user.Email, order, orderURL); err != nil {
			slog.Error("bill reminder: failed to send email", "error", err, "order_code", *order.OrderCode)
			skipped++
			continue
		}
		sent++
	}

	slog.Info("bill reminder finished", "orders", len(orders), "sent", sent, "skipped", skipped)
	return nil
}
