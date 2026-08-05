package initialize

import (
	"fmt"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/controllers"
	"github.com/vlahanam/rol-outfit/src/internal/middleware"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

// InitRoutes đăng ký toàn bộ route của ứng dụng vào Fiber app.
func InitRoutes(app *fiber.App, db *gorm.DB, cfg *AppConfig) {
	jwtSecret := cfg.JWTSecret

	// Create OAuth service
	repo := repositories.NewPostgreSQLStorage(db)
	oauthRepo := repositories.NewOAuthRepository(db)
	authSvc := services.NewAuthService(repo, repo, jwtSecret)
	oauthSvc := services.NewOAuthService(
		cfg.GoogleClientID, cfg.GoogleClientSecret,
		cfg.OAuthCallbackBaseURL,
		cfg.OAuthAllowedRedirects,
		oauthRepo, repo, authSvc,
	)

	api := app.Group("/api")

	// Upload service (used by orders for bill upload, admin uploads, and orphan cleanup)
	uploadSvc, err := services.NewUploadService(cfg.UploadDriver, cfg.AWSRegion, cfg.AWSAccessKeyID, cfg.AWSSecretAccessKey, cfg.AWSBucket, cfg.UploadDir, cfg.UploadURL, repo)
	if err != nil {
		panic(err)
	}

	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	v1 := api.Group("/v1")

	// Auth (public)
	auth := v1.Group("/auth")
	auth.Post("/register", controllers.Register(db, jwtSecret))
	auth.Post("/login", controllers.Login(db, jwtSecret))
	auth.Post("/refresh", controllers.Refresh(db, jwtSecret))
	auth.Post("/logout", controllers.Logout(db, jwtSecret))

	// OAuth (public)
	oauth := auth.Group("/oauth")
	oauth.Get("/google", controllers.OAuthGoogle(oauthSvc))
	oauth.Get("/google/callback", controllers.OAuthGoogleCallback(oauthSvc))

	// Categories
	cats := v1.Group("/categories")
	cats.Get("/", controllers.ListCategories(db))
	cats.Get("/:id", controllers.GetCategory(db))
	adminCats := cats.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminCats.Post("/", controllers.CreateCategory(db))
	adminCats.Put("/:id", controllers.UpdateCategory(db))
	adminCats.Delete("/:id", controllers.DeleteCategory(db))

	// Products
	jwtAuth := middleware.JWTAuth(jwtSecret)
	requireAdmin := middleware.RequireRole(float64(models.USER_ROLE_ADMIN))
	prods := v1.Group("/products")
	prods.Get("/", controllers.ListProducts(db, uploadSvc))
	prods.Get("/:id", controllers.GetProduct(db, uploadSvc))
	prods.Post("/", jwtAuth, requireAdmin, controllers.CreateProduct(db, uploadSvc))
	prods.Put("/:id", jwtAuth, requireAdmin, controllers.UpdateProduct(db, uploadSvc))
	prods.Put("/:id/tags", jwtAuth, requireAdmin, controllers.AssignProductTags(db))
	prods.Delete("/:id", jwtAuth, requireAdmin, controllers.DeleteProduct(db, uploadSvc))

	// Product Variants (nested under products)
	variants := v1.Group("/products/:productID/variants")
	variants.Get("/", controllers.ListVariants(db, uploadSvc))
	variants.Get("/:id", controllers.GetVariant(db, uploadSvc))
	variants.Post("/", jwtAuth, requireAdmin, controllers.CreateVariant(db, uploadSvc))
	variants.Put("/:id", jwtAuth, requireAdmin, controllers.UpdateVariant(db, uploadSvc))
	variants.Delete("/:id", jwtAuth, requireAdmin, controllers.DeleteVariant(db, uploadSvc))

	// Product Reviews (public read, auth for write)
	prods.Get("/:id/reviews", controllers.ListProductReviews(db))
	prods.Get("/:id/reviews/stats", controllers.GetReviewStats(db))
	prods.Get("/:id/reviews/can-review", jwtAuth, controllers.CanUserReview(db))
	prods.Post("/:id/reviews", jwtAuth, controllers.CreateReview(db))

	// Cart (user auth required)
	cart := v1.Group("/cart", middleware.JWTAuth(jwtSecret))
	cart.Get("/", controllers.GetCart(db))
	cart.Post("/items", controllers.AddCartItem(db))
	cart.Put("/items/:itemID", controllers.UpdateCartItem(db))
	cart.Delete("/items/:itemID", controllers.RemoveCartItem(db))

	// Upload service (used by orders for bill upload and admin uploads)
	// Email service (used for order notifications)
	emailSvc := services.NewEmailService(
		cfg.SmtpHost, cfg.SmtpPort, cfg.SmtpUser, cfg.SmtpPassword,
		cfg.SmtpFromEmail, cfg.AdminEmail,
	)
	adminURL := fmt.Sprintf("%s/admin/orders", cfg.OAuthCallbackBaseURL)

	// Orders (user auth required)
	orders := v1.Group("/orders", middleware.JWTAuth(jwtSecret))
	orders.Post("/", controllers.CreateOrder(db, emailSvc, adminURL))
	orders.Get("/", controllers.ListOrders(db))
	orders.Get("/:id", controllers.GetOrder(db))
	orders.Put("/:id/shipping", controllers.UpdateOrderShipping(db))
	orders.Post("/:id/bill", controllers.UploadOrderBill(db, uploadSvc, cfg.UploadMaxSize))
	orders.Delete("/:id", controllers.CancelOrder(db))
	orders.Post("/:id/refund", controllers.RequestRefund(db))
	orders.Get("/:id/history", controllers.GetOrderHistory(db, false))

	// Addresses (user auth required)
	addresses := v1.Group("/addresses", middleware.JWTAuth(jwtSecret))
	addresses.Get("/", controllers.ListAddresses(db))
	addresses.Post("/", controllers.CreateAddress(db))
	addresses.Put("/:id", controllers.UpdateAddress(db))
	addresses.Delete("/:id", controllers.DeleteAddress(db))
	addresses.Put("/:id/default", controllers.SetDefaultAddress(db))

	// Admin orders
	adminOrders := v1.Group("/admin/orders",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminOrders.Get("/", controllers.ListAllOrders(db))
	adminOrders.Get("/:id", controllers.GetAdminOrder(db))
	adminOrders.Put("/:id/status", controllers.UpdateOrderStatus(db))
	adminOrders.Put("/:id/approve-refund", controllers.ApproveRefund(db))
	adminOrders.Put("/:id/reject-refund", controllers.RejectRefund(db))
	adminOrders.Put("/:id/refund-cancelled", controllers.AdminRefundCancelledOrder(db))
	adminOrders.Get("/:id/history", controllers.GetOrderHistory(db, true))

	// Admin carts
	adminCarts := v1.Group("/admin/carts",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminCarts.Get("/", controllers.AdminListCarts(db))
	adminCarts.Get("/:id", controllers.AdminGetCart(db))
	adminCarts.Delete("/:id", controllers.AdminDeleteCart(db))

	// Admin categories
	adminCatsGroup := v1.Group("/admin/categories",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminCatsGroup.Get("/", controllers.AdminListCategories(db))
	adminCatsGroup.Get("/:id", controllers.AdminGetCategory(db))

	// Admin products (with variants)
	adminProductsGroup := v1.Group("/admin/products",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminProductsGroup.Get("/", controllers.AdminListProducts(db, uploadSvc))
	adminProductsGroup.Get("/:id", controllers.AdminGetProduct(db, uploadSvc))

	// Public file serving (proxy for S3)
	v1.Get("/files/*", controllers.GetFile(uploadSvc))

	// Uploads (admin-only)
	adminUploads := v1.Group("/uploads",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminUploads.Post("/", controllers.UploadFile(uploadSvc, cfg.UploadMaxSize))
	adminUploads.Delete("/:id", controllers.DeleteFile(uploadSvc))

	// Tags
	tags := v1.Group("/tags")
	tags.Get("/", controllers.ListTags(db))
	tags.Get("/:id", controllers.GetTag(db))
	adminTagsWrite := tags.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminTagsWrite.Post("/", controllers.CreateTag(db))
	adminTagsWrite.Put("/:id", controllers.UpdateTag(db))
	adminTagsWrite.Delete("/:id", controllers.DeleteTag(db))

	// Admin tags (all tags including inactive)
	adminTagsGroup := v1.Group("/admin/tags",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminTagsGroup.Get("/", controllers.AdminListTags(db))
	adminTagsGroup.Get("/:id", controllers.AdminGetTag(db))

	// Admin widgets
	adminWidgetsGroup := v1.Group("/admin/widgets",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminWidgetsGroup.Get("/", controllers.AdminListWidgets(db, uploadSvc))
	adminWidgetsGroup.Get("/:id", controllers.AdminGetWidget(db, uploadSvc))

	// Widgets
	widgets := v1.Group("/widgets")
	widgets.Get("/", controllers.ListWidgets(db, uploadSvc))
	widgets.Get("/:id", controllers.GetWidget(db, uploadSvc))
	adminWidgets := widgets.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminWidgets.Post("/", controllers.CreateWidget(db, uploadSvc))
	adminWidgets.Put("/:id", controllers.UpdateWidget(db, uploadSvc))
	adminWidgets.Delete("/:id", controllers.DeleteWidget(db, uploadSvc))

	// Users — self profile
	me := v1.Group("/users", middleware.JWTAuth(jwtSecret))
	me.Get("/me", controllers.GetMe(db))
	me.Put("/me", controllers.UpdateMe(db))
	me.Put("/me/password", controllers.ChangePassword(db))
	me.Get("/me/oauth-providers", controllers.GetMyOAuthProviders(db))
	me.Delete("/me/oauth-providers/:provider", controllers.UnlinkOAuthProvider(oauthSvc))

	// Admin users
	adminUsers := v1.Group("/admin/users",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminUsers.Post("/", controllers.CreateUser(db))
	adminUsers.Get("/", controllers.ListUsers(db))
	adminUsers.Get("/:id", controllers.GetUser(db))
	adminUsers.Put("/:id", controllers.UpdateUser(db))
	adminUsers.Delete("/:id", controllers.DeleteUser(db))

	// Admin dashboard
	adminDashboard := v1.Group("/admin/dashboard",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminDashboard.Get("/", controllers.GetDashboardStats(db))

	// Site settings (public)
	settings := v1.Group("/settings")
	settings.Get("/social-links", controllers.GetSocialLinks(db, uploadSvc))
	settings.Get("/chat-url", controllers.GetChatURL(db, uploadSvc))
	settings.Get("/qr", controllers.GetQRData(db, uploadSvc))

	// Admin settings
	adminSettings := v1.Group("/admin/settings",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminSettings.Put("/social-links", controllers.UpdateSocialLinks(db, uploadSvc))
	adminSettings.Put("/chat-url", controllers.UpdateChatURL(db, uploadSvc))
	adminSettings.Put("/qr", controllers.UpdateQRData(db, uploadSvc))

	// Admin reviews
	adminReviews := v1.Group("/admin/reviews",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminReviews.Get("/", controllers.AdminListReviews(db))
	adminReviews.Put("/:id/approve", controllers.ApproveReview(db))
	adminReviews.Put("/:id/reject", controllers.RejectReview(db))
	adminReviews.Delete("/:id", controllers.DeleteReview(db))
}
