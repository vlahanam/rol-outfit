package initialize

import (
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
	prods.Get("/", controllers.ListProducts(db))
	prods.Get("/:id", controllers.GetProduct(db))
	prods.Post("/", jwtAuth, requireAdmin, controllers.CreateProduct(db))
	prods.Put("/:id", jwtAuth, requireAdmin, controllers.UpdateProduct(db))
	prods.Put("/:id/tags", jwtAuth, requireAdmin, controllers.AssignProductTags(db))
	prods.Delete("/:id", jwtAuth, requireAdmin, controllers.DeleteProduct(db))

	// Product Variants (nested under products)
	variants := v1.Group("/products/:productID/variants")
	variants.Get("/", controllers.ListVariants(db))
	variants.Get("/:id", controllers.GetVariant(db))
	variants.Post("/", jwtAuth, requireAdmin, controllers.CreateVariant(db))
	variants.Put("/:id", jwtAuth, requireAdmin, controllers.UpdateVariant(db))
	variants.Delete("/:id", jwtAuth, requireAdmin, controllers.DeleteVariant(db))

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
	uploadSvc := services.NewUploadService(cfg.UploadDir, cfg.UploadURL)

	// Orders (user auth required)
	orders := v1.Group("/orders", middleware.JWTAuth(jwtSecret))
	orders.Post("/", controllers.CreateOrder(db))
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
	adminProductsGroup.Get("/", controllers.AdminListProducts(db))
	adminProductsGroup.Get("/:id", controllers.AdminGetProduct(db))

	// Uploads (admin-only)
	adminUploads := v1.Group("/uploads",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminUploads.Post("/", controllers.UploadFile(uploadSvc, cfg.UploadMaxSize))
	adminUploads.Delete("/:filename", controllers.DeleteFile(uploadSvc))

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
	adminWidgetsGroup.Get("/", controllers.AdminListWidgets(db))
	adminWidgetsGroup.Get("/:id", controllers.AdminGetWidget(db))

	// Widgets
	widgets := v1.Group("/widgets")
	widgets.Get("/", controllers.ListWidgets(db))
	widgets.Get("/:id", controllers.GetWidget(db))
	adminWidgets := widgets.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminWidgets.Post("/", controllers.CreateWidget(db))
	adminWidgets.Put("/:id", controllers.UpdateWidget(db))
	adminWidgets.Delete("/:id", controllers.DeleteWidget(db))

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
	settings.Get("/social-links", controllers.GetSocialLinks(db))
	settings.Get("/chat-url", controllers.GetChatURL(db))

	// Admin settings
	adminSettings := v1.Group("/admin/settings",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminSettings.Put("/social-links", controllers.UpdateSocialLinks(db))
	adminSettings.Put("/chat-url", controllers.UpdateChatURL(db))

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
