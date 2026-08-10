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
	SendBillUploadNotification(customerEmail string, order *models.Order, orderURL string) error
	SendBillReminderNotification(customerEmail string, order *models.Order, orderURL string) error
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
		variant := item.VariantName
		if variant == "" {
			variant = "-"
		}
		itemRows.WriteString(fmt.Sprintf(`
			<tr>
				<td style="padding:8px;border-bottom:1px solid #eee">%s</td>
				<td style="padding:8px;border-bottom:1px solid #eee">%s</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">%d</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">%s %s</td>
				<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">%s %s</td>
			</tr>`,
			item.ProductName,
			variant,
			item.Quantity,
			formatPrice(item.Price), currency,
			formatPrice(subtotal), currency,
		))
	}

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
					<th style="padding:8px;text-align:left">Biến thể</th>
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

// SendBillUploadNotification gửi email cho khách hàng yêu cầu upload bill chuyển khoản.
func (s *emailService) SendBillUploadNotification(customerEmail string, order *models.Order, orderURL string) error {
	return s.sendBillEmail(
		customerEmail,
		order,
		orderURL,
		fmt.Sprintf("[ROL Outfit] Vui lòng tải bill chuyển khoản - %s", *order.OrderCode),
		"Cảm ơn bạn đã đặt hàng!",
		fmt.Sprintf("Đơn hàng <strong>%s</strong> của bạn đang chờ thanh toán. Vui lòng chuyển khoản và tải lên bill (ảnh chụp màn hình xác nhận chuyển khoản) để shop xác nhận đơn hàng.", *order.OrderCode),
		"Tải bill chuyển khoản lên",
	)
}

// SendBillReminderNotification gửi email nhắc nhở khách hàng chưa upload bill chuyển khoản.
func (s *emailService) SendBillReminderNotification(customerEmail string, order *models.Order, orderURL string) error {
	return s.sendBillEmail(
		customerEmail,
		order,
		orderURL,
		fmt.Sprintf("[ROL Outfit] Nhắc nhở thanh toán - %s", *order.OrderCode),
		"Nhắc nhở thanh toán",
		fmt.Sprintf("Đơn hàng <strong>%s</strong> của bạn vẫn chưa được thanh toán. Vui lòng chuyển khoản và tải lên bill để shop xác nhận đơn hàng, tránh đơn hàng bị hủy.", *order.OrderCode),
		"Tải bill chuyển khoản lên",
	)
}

func (s *emailService) sendBillEmail(customerEmail string, order *models.Order, orderURL, subject, heading, intro, buttonText string) error {
	if s.smtpHost == "" {
		slog.Warn("SMTP not configured, skipping bill email")
		return nil
	}
	if strings.TrimSpace(customerEmail) == "" {
		slog.Warn("customer has no email, skipping bill email", "order_code", *order.OrderCode)
		return nil
	}

	currency := "₫"
	if order.CurrencyType == models.PRODUCT_TYPE_JAPANESE {
		currency = "¥"
	}

	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
	<div style="background:#f8f9fa;padding:20px;border-radius:8px">
		<h2 style="color:#2d89ef;margin-top:0">%s</h2>
		<p style="color:#666">%s</p>
		<table style="width:100%%;border-collapse:collapse;margin:16px 0;background:white;border-radius:4px;overflow:hidden">
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold;width:140px">Mã đơn hàng</td><td style="padding:8px 12px">%s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Tổng tiền cần chuyển</td><td style="padding:8px 12px">%s %s</td></tr>
			<tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:bold">Nội dung CK</td><td style="padding:8px 12px">%s</td></tr>
		</table>
		<h3 style="color:#333">Hướng dẫn thanh toán</h3>
		<ol style="color:#555;line-height:1.8;padding-left:20px">
			<li>Chuyển khoản đúng số tiền <strong>%s %s</strong> với nội dung ghi <strong>%s</strong>.</li>
			<li>Chụp màn hình bill chuyển khoản sau khi thực hiện.</li>
			<li>Nhấn nút bên dưới để tải bill lên hệ thống.</li>
		</ol>
		<p style="margin-top:24px">
			<a href="%s" style="display:inline-block;background:#2d89ef;color:white;padding:12px 24px;text-decoration:none;border-radius:4px">%s</a>
		</p>
		<p style="color:#999;font-size:12px;margin-top:16px">Nếu bạn có thắc mắc, hãy liên hệ với chúng tôi qua email %s.</p>
	</div>
</body>
</html>`,
		heading,
		intro,
		*order.OrderCode,
		formatPrice(order.TotalPrice), currency,
		*order.OrderCode,
		formatPrice(order.TotalPrice), currency, *order.OrderCode,
		orderURL,
		buttonText,
		s.fromEmail,
	)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", customerEmail, subject, body))
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)

	if err := smtp.SendMail(addr, auth, s.fromEmail, []string{customerEmail}, msg); err != nil {
		return fmt.Errorf("failed to send bill email: %w", err)
	}

	slog.Info("bill email sent", "order_code", *order.OrderCode, "to", customerEmail, "subject", subject)
	return nil
}

func formatPrice(p float64) string {
	return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.2f", p), "0"), ".")
}
