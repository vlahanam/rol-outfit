package initialize

import (
	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/controllers"
	"github.com/vlahanam/rol-outfit/src/internal/middleware"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

// InitRoutes đăng ký toàn bộ route của ứng dụng vào Fiber app.
func InitRoutes(app *fiber.App, db *gorm.DB, cfg *AppConfig) {
	jwtSecret := cfg.JWTSecret
	api := app.Group("/api")

	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	v1 := api.Group("/v1")

	// Auth (public)
	auth := v1.Group("/auth")
	auth.Post("/register", controllers.Register(db, jwtSecret))
	auth.Post("/login", controllers.Login(db, jwtSecret))

	// Categories
	cats := v1.Group("/categories")
	cats.Get("/", controllers.ListCategories(db))
	cats.Get("/:id", controllers.GetCategory(db))
	adminCats := cats.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminCats.Post("/", controllers.CreateCategory(db))
	adminCats.Put("/:id", controllers.UpdateCategory(db))
	adminCats.Delete("/:id", controllers.DeleteCategory(db))

	// Products
	prods := v1.Group("/products")
	prods.Get("/", controllers.ListProducts(db))
	prods.Get("/:id", controllers.GetProduct(db))
	adminProds := prods.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminProds.Post("/", controllers.CreateProduct(db))
	adminProds.Put("/:id", controllers.UpdateProduct(db))
	adminProds.Delete("/:id", controllers.DeleteProduct(db))

	// Product Variants (nested under products)
	variants := v1.Group("/products/:productID/variants")
	variants.Get("/", controllers.ListVariants(db))
	variants.Get("/:id", controllers.GetVariant(db))
	adminVariants := variants.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
	adminVariants.Post("/", controllers.CreateVariant(db))
	adminVariants.Put("/:id", controllers.UpdateVariant(db))
	adminVariants.Delete("/:id", controllers.DeleteVariant(db))

	// Cart (user auth required)
	cart := v1.Group("/cart", middleware.JWTAuth(jwtSecret))
	cart.Get("/", controllers.GetCart(db))
	cart.Post("/items", controllers.AddCartItem(db))
	cart.Put("/items/:itemID", controllers.UpdateCartItem(db))
	cart.Delete("/items/:itemID", controllers.RemoveCartItem(db))

	// Orders (user auth required)
	orders := v1.Group("/orders", middleware.JWTAuth(jwtSecret))
	orders.Post("/", controllers.CreateOrder(db))
	orders.Get("/", controllers.ListOrders(db))
	orders.Get("/:id", controllers.GetOrder(db))
	orders.Delete("/:id", controllers.CancelOrder(db))

	// Admin orders
	adminOrders := v1.Group("/admin/orders",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminOrders.Get("/", controllers.ListAllOrders(db))
	adminOrders.Put("/:id/status", controllers.UpdateOrderStatus(db))

	// Uploads
	uploadSvc := services.NewUploadService(cfg.UploadDir, cfg.UploadURL)
	uploads := v1.Group("/uploads", middleware.JWTAuth(jwtSecret))
	uploads.Post("/", controllers.UploadFile(uploadSvc, cfg.UploadMaxSize))
	adminUploads := v1.Group("/uploads",
		middleware.JWTAuth(jwtSecret),
		middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
	)
	adminUploads.Delete("/:filename", controllers.DeleteFile(uploadSvc))

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
}
