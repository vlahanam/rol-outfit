package services

import (
	"fmt"
	"log/slog"
	"net/smtp"
	"strings"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type EmailService interface {
	SendNewOrderNotification(order *models.Order, items []*models.OrderItem, adminURL string) error
}

type emailService struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	fromEmail    string
	adminEmail   string
}

func NewEmailService(smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, adminEmail string) EmailService {
	return &emailService{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		smtpUser:     smtpUser,
		smtpPassword: smtpPassword,
		fromEmail:    fromEmail,
		adminEmail:   adminEmail,
	}
}

func (s *emailService) SendNewOrderNotification(order *models.Order, items []*models.OrderItem, adminURL string) error {
	if s.smtpHost == "" {
		slog.Warn("SMTP not configured, skipping email notification")
		return nil
	}

	subject := fmt.Sprintf("[ROL Outfit] Đơn hàng mới - %s", *order.OrderCode)

	currency := "₫"
	if order.CurrencyType == models.PRODUCT_TYPE_JAPANESE {
		currency = "¥"
	}

	var itemRows strings.Builder
	for _, item := range items {
		subtotal := item.Price * float64(item.Quantity)
		itemRows.WriteString(fmt.Sprintf(`
			<tr>
				<td style="padding:8px;border-bottom:1px solid #eee">%s</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">%d</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">%s %s</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">%s %s</td>
			</tr>`,
			item.ProductID[:8],
			item.Quantity,
			formatPrice(item.Price), currency,
			formatPrice(subtotal), currency,
		))
	}

	statusText := statusLabel(order.Status)

	noteHTML := ""
	if strings.TrimSpace(order.Note) != "" {
		noteHTML = fmt.Sprintf(`
		<h3 style="color:#333">Ghi chú</h3>
		<p style="background:#fff3cd;padding:12px;border-radius:4px;color:#856404">%s</p>`, order.Note)
	}

	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
	<div style="background:#f8f9fa;padding:20px;border-radius:8px">
		<h2 style="color:#e74c3c;margin-top:0">Đơn hàng mới</h2>
		<p style="color:#666">Một đơn hàng mới vừa được tạo trên cửa hàng.</p>
		<table style="width:100%%;border-collapse:collapse;margin:16px 0;background:white;border-radius:4px;overflow:hidden">
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold;width:120px">Mã đơn hàng</td><td style="padding:8px 12px">%s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Trạng thái</td><td style="padding:8px 12px">%s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Tổng tiền</td><td style="padding:8px 12px">%s %s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Phí vận chuyển</td><td style="padding:8px 12px">%s %s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Địa chỉ</td><td style="padding:8px 12px">%s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Mã bưu điện</td><td style="padding:8px 12px">%s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Số điện thoại</td><td style="padding:8px 12px">%s</td></tr>
		</table>
		<h3 style="color:#333">Sản phẩm</h3>
		<table style="width:100%%;border-collapse:collapse;background:white;border-radius:4px;overflow:hidden">
			<thead>
				<tr style="background:#f1f1f1">
					<th style="padding:8px;text-align:left">Sản phẩm</th>
					<th style="padding:8px;text-align:center">SL</th>
					<th style="padding:8px;text-align:right">Đơn giá</th>
					<th style="padding:8px;text-align:right">Thành tiền</th>
				</tr>
			</thead>
			<tbody>%s
			</tbody>
		</table>%s
		<p style="margin-top:24px">
			<a href="%s" style="display:inline-block;background:#e74c3c;color:white;padding:10px 20px;text-decoration:none;border-radius:4px">Xem chi tiết</a>
		</p>
	</div>
</body>
</html>`,
		*order.OrderCode,
		statusText,
		formatPrice(order.TotalPrice), currency,
		formatPrice(order.ShippingCost), currency,
		order.ShippingAddress,
		order.PostalCode,
		order.Phone,
		itemRows.String(),
		noteHTML,
		adminURL,
	)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", s.adminEmail, subject, body))
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)

	if err := smtp.SendMail(addr, auth, s.fromEmail, []string{s.adminEmail}, msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	slog.Info("order notification email sent", "order_code", *order.OrderCode)
	return nil
}

func formatPrice(p float64) string {
	return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.2f", p), "0"), ".")
}

func statusLabel(status int8) string {
	switch status {
	case models.ORDER_STATUS_AWAITING_PAYMENT:
		return "Chờ chuyển khoản"
	case models.ORDER_STATUS_PAYMENT_SUBMITTED:
		return "Đã báo chuyển khoản"
	case models.ORDER_STATUS_CONFIRMED:
		return "Xác nhận thành công"
	case models.ORDER_STATUS_SHIPPING:
		return "Đang giao"
	case models.ORDER_STATUS_COMPLETED:
		return "Hoàn thành"
	case models.ORDER_STATUS_CANCELLED:
		return "Đã hủy"
	case models.ORDER_STATUS_REFUND_REQUESTED:
		return "Yêu cầu hoàn tiền"
	case models.ORDER_STATUS_REFUNDED:
		return "Đã hoàn tiền"
	default:
		return "Không xác định"
	}
}
