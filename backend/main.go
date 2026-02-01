package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"project-akuntansi-backend/config"
	"project-akuntansi-backend/handlers"
	"project-akuntansi-backend/models"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// ---------------------------------------------------------
	// 1. SETUP LOGGING
	// ---------------------------------------------------------
	// Ensure logs directory exists
	logDir := "logs"
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		_ = os.Mkdir(logDir, 0755)
	}

	// Create/Append to log file
	logFile, err := os.OpenFile(filepath.Join(logDir, "app.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Println("Failed to open log file:", err)
	} else {
		// Write to both stdout (if available) and file
		gin.DefaultWriter = io.MultiWriter(logFile, os.Stdout)
		log.SetOutput(gin.DefaultWriter)
	}

	// Load .env file if exists
	err = godotenv.Load()
	if err != nil {
		log.Println("⚠️  Warning: Error loading .env file:", err)
	} else {
		log.Println("✅ .env file loaded successfully")
	}

	// DEBUG: Print Env Vars
	dir, _ := os.Getwd()
	log.Println("--- DEBUG INFO ---")
	log.Println("📂 Current Dir:", dir)
	log.Println("🗄️  DB_NAME:", os.Getenv("DB_NAME"))
	log.Println("🎮 APP_MODE:", os.Getenv("APP_MODE"))
	log.Println("------------------")

	config.InitAppMode()

	// Create Router
	r := gin.Default()

	// CORS Setup
	corsConfig := cors.Config{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Target-Client-ID", "X-App-Secret"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	// Channel for Graceful Shutdown
	quit := make(chan struct{})

	// ---------------------------------------------------------
	// SERVE FRONTEND (React Static Files) - Single Binary Setup
	// ---------------------------------------------------------
	// Check if 'dist' folder exists (Production Mode)
	if _, err := os.Stat("./dist"); err == nil {
		log.Println("📂 Serving static frontend from ./dist")

		// Serve specific static asset folders
		r.Static("/assets", "./dist/assets")
		r.StaticFile("/favicon.ico", "./dist/favicon.ico")
		r.StaticFile("/logo.png", "./dist/logo.png") // If you have logo at root

		// SPA Fallback: For any route not matching above or /api, serve index.html
		r.NoRoute(func(c *gin.Context) {
			// If it's an API request that 404'd, return JSON error
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(404, gin.H{"error": "API endpoint not found"})
				return
			}
			// Otherwise serve index.html for React Router
			c.File("./dist/index.html")
		})
	} else {
		log.Println("⚠️  ./dist folder not found. Running in API-Only mode.")
	}

	// Health Check Endpoint (Available in both modes)
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "mode": config.AppMode})
	})

	// Configuration Endpoint (Available in both modes)
	r.GET("/api/config/mode", func(c *gin.Context) {
		c.JSON(200, gin.H{"mode": config.AppMode})
	})

	var globalDB *gorm.DB // Hold reference for cleanup

	if config.IsConsultantMode() {
		log.Println("🚀 Starting in CONSULTANT MODE")

		// Connect to database (consultant uses same database)
		db, err := config.ConnectDB()
		if err != nil {
			panic("failed to connect consultant database")
		}
		globalDB = db

		// Migrate master tables (Registry + Full Accounting Schema)
		db.AutoMigrate(&models.ClientRegistry{})
		if err := models.AutoMigrateClient(db); err != nil {
			log.Println("⚠️  Master DB Migration Error:", err)
		}

		// Middleware DB Global: Dynamic Switching
		r.Use(handlers.DynamicDBMiddleware(db))

		// Public Routes (Consultant Login/Reg always uses MasterDB handled by Middleware exclusion)
		r.POST("/api/register", handlers.Register(db))
		r.POST("/api/login", handlers.Login(db))
		r.GET("/api/user-theme-setting", handlers.GetUserThemeSetting(db))
		r.POST("/api/user-theme-setting", handlers.SaveUserThemeSetting(db))

		// Public endpoint - Get clients list
		r.GET("/api/consultant/clients", handlers.GetConsultantClientsDB) // Keep for backward compat/admin
		r.GET("/api/public/clients", handlers.GetPublicClientsDB)         // NEW: Secure list for dropdown

		// Consultant Management Routes (Protected)
		consultantAPI := r.Group("/api/consultant")
		consultantAPI.Use(handlers.AuthMiddleware(db)) // Pass Master DB
		consultantAPI.POST("/clients", handlers.AddConsultantClientDB)
		consultantAPI.PUT("/clients/:id", handlers.UpdateConsultantClientDB)
		consultantAPI.DELETE("/clients/:id", handlers.DeleteConsultantClientDB)
		// handlers.TestClientConnectionDB akan kita update nanti untuk Test DB Connection
		consultantAPI.GET("/clients/:id/test-connection", handlers.TestClientConnectionDB)

		// Backup & Restore Routes
		consultantAPI.POST("/clients/:id/backup", handlers.BackupClientDatabaseDB)
		consultantAPI.GET("/clients/:id/backups", handlers.ListBackupFilesDB)
		consultantAPI.POST("/clients/:id/restore", handlers.RestoreDatabaseDB)
		consultantAPI.POST("/clients/:id/migrate", handlers.MigrateClientDatabaseDB) // NEW: Trigger Migration

		// Internal/Master Backup & Restore
		consultantAPI.POST("/master-backup", handlers.BackupInternalDatabaseDB)
		consultantAPI.GET("/master-backups", handlers.ListInternalBackupsDB)
		consultantAPI.POST("/master-restore", handlers.RestoreInternalDatabaseDB)

		// Business Routes (Will be switched to Client DB by Middleware)
		// Kita RE-USE setupClientRoutes!
		api := r.Group("/api")
		api.Use(handlers.AuthMiddleware(db)) // Pass Master DB

		setupClientRoutes(api, db)

	} else {
		log.Println("🏢 Starting in CLIENT MODE (Full Database)")

		// Client Mode Standard Startup
		db, err := config.ConnectDB()
		if err != nil {
			panic("failed to connect database")
		}
		globalDB = db

		// Auto Migrate & Seeds
		if err := models.AutoMigrateClient(db); err != nil {
			log.Println("⚠️  Migration Error:", err)
		}

		// Middleware DB
		r.Use(func(c *gin.Context) {
			c.Set("db", db)
			c.Next()
		})

		// ---------------------------------------------------------
		// [SECURE] CLIENT MODE SHUTDOWN ENDPOINT
		// ---------------------------------------------------------
		// Only available in Client Mode
		// Only accessible from Localhost
		// Requires Secret Header
		r.POST("/api/system/shutdown", func(c *gin.Context) {
			// 1. IP Check
			clientIP := c.ClientIP()
			if clientIP != "127.0.0.1" && clientIP != "::1" {
				log.Printf("⛔ Shutdown attempt from unauthorized IP: %s\n", clientIP)
				c.JSON(403, gin.H{"error": "Forbidden"})
				return
			}

			// 2. Header Check
			secret := c.GetHeader("X-App-Secret")
			if secret != "internal-shutdown-trigger" {
				log.Println("⛔ Shutdown attempt with invalid secret")
				c.JSON(403, gin.H{"error": "Forbidden"})
				return
			}

			log.Println("🛑 Shutdown signal received from authorized client.")
			c.JSON(200, gin.H{"message": "Shutting down..."})

			// Signal the main goroutine to stop
			close(quit)
		})

		// Public Routes
		r.POST("/api/register", handlers.Register(db))
		r.POST("/api/login", handlers.Login(db))
		r.GET("/api/user-theme-setting", handlers.GetUserThemeSetting(db))
		r.POST("/api/user-theme-setting", handlers.SaveUserThemeSetting(db))
		r.GET("/api/input-transaksi/bulk-import-template", handlers.DownloadBulkImportTemplate())

		// Protected Routes
		api := r.Group("/api")
		api.Use(handlers.AuthMiddleware(db)) // Pass Master DB

		// Client Mode Internal Backup
		api.POST("/backup", handlers.BackupInternalDatabaseDB)
		api.GET("/backups", handlers.ListInternalBackupsDB)
		api.POST("/restore", handlers.RestoreInternalDatabaseDB)

		setupClientRoutes(api, db)
	}

	// Start Server
	port := "8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Run server in a goroutine so it doesn't block
	go func() {
		log.Printf("Starting server on port %s...\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for shutdown signal (forever or until chan closed)
	<-quit

	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	// Close Database
	if globalDB != nil {
		sqlDB, err := globalDB.DB()
		if err == nil {
			log.Println("Closing database connection...")
			sqlDB.Close()
		}
	}

	log.Println("Server exiting")
}

// Helper to keep main clean
func setupClientRoutes(api *gin.RouterGroup, db *gorm.DB) {
	api.POST("/logout", handlers.Logout(db))

	pembelianHandler := handlers.NewPembelianHandler(db)
	api.GET("/pembelian", pembelianHandler.GetAllPembelian)                               // Get all AP invoices
	api.GET("/pembelian/:id", pembelianHandler.GetPembelianByID)                          // Get AP invoice by ID
	api.POST("/pembelian", pembelianHandler.CreatePembelian)                              // Create new AP invoice
	api.PUT("/pembelian/:id", pembelianHandler.UpdatePembelian)                           // Update AP invoice
	api.DELETE("/pembelian/:id", pembelianHandler.DeletePembelian)                        // Delete AP invoice
	api.GET("/pembelian/nomor/:nomor", pembelianHandler.GetPembelianByNomor)              // Get AP invoice by nomor
	api.PATCH("/pembelian/:id/status", pembelianHandler.UpdatePembelianStatus)            // Update status only
	api.GET("/pembelian/report", pembelianHandler.GetPembelianReport)                     // Generate report
	api.GET("/pembelian/next-ap-invoice-number", pembelianHandler.GetNextAPInvoiceNumber) // Generate next AP invoice number

	api.GET("/master-coa", handlers.GetMasterCOA(db))
	api.POST("/master-coa", handlers.PostMasterCOA(db))
	api.PUT("/master-coa/:id", handlers.UpdateMasterCOA(db))
	api.DELETE("/master-coa/:id", handlers.DeleteMasterCOA(db))
	api.GET("/master-category-coa", handlers.GetMasterCategoryCOA(db))
	api.POST("/master-category-coa", handlers.PostMasterCategoryCOA(db))
	api.PUT("/master-category-coa/:id", handlers.UpdateMasterCategoryCOA(db))
	api.DELETE("/master-category-coa/:id", handlers.DeleteMasterCategoryCOA(db))
	api.GET("/coa-kas-bank", handlers.GetCOAKasBank(db))

	api.GET("/input-transaksi", handlers.GetInputTransaksi(db))
	api.POST("/input-transaksi", handlers.PostInputTransaksi(db))
	api.PUT("/input-transaksi/:id", handlers.UpdateInputTransaksi(db))
	api.DELETE("/input-transaksi/:id", handlers.DeleteInputTransaksi(db))
	api.GET("/input-transaksi/:id/audit", handlers.GetInputTransaksiAudit(db)) // ✅ NEW: Audit Trail
	api.GET("/generate-no-transaksi", handlers.GetGenerateNoTransaksi(db))
	api.GET("/trial-balance", handlers.GetTrialBalance(db))
	api.GET("/buku-besar", handlers.GetBukuBesar(db))

	// Master Project Routes
	masterProjectRoutes := api.Group("/master-project")
	{
		masterProjectRoutes.GET("", handlers.GetMasterProjects(db))
		masterProjectRoutes.POST("", handlers.CreateMasterProject(db))
		masterProjectRoutes.PUT(":id", handlers.UpdateMasterProject(db))
		masterProjectRoutes.DELETE(":id", handlers.DeleteMasterProject(db))
	}

	// GL Routes
	api.GET("/gl", handlers.GetGLs(db))
	api.POST("/gl", handlers.CreateGL(db))
	api.PUT("/gl/:id", handlers.UpdateGL(db))
	api.DELETE("/gl/:id", handlers.DeleteGL(db))

	// AJE Routes
	api.GET("/aje", handlers.GetAJE(db))
	api.GET("/aje/coa-akun-aje", handlers.GetCOAAkunAJE(db))
	api.POST("/aje", handlers.PostAJE(db))                             // save
	api.POST("/aje/posting", handlers.PostingAJE(db))                  // posting
	api.POST("/aje/unposting", handlers.UnpostingAJE(db))              // unposting
	api.GET("/aje/generate-no-bukti", handlers.GenerateNoBuktiAJE(db)) // generate nomor otomatis
	api.POST("/aje/delete", handlers.DeleteAJE(db))                    // delete
	api.GET("/aje/cek-no-bukti", handlers.CekNoBuktiAJE(db))           // cek no bukti di AJE
	api.GET("/gl/cek-no-bukti", handlers.CekNoBuktiGL(db))             // cek no bukti di GL

	// Master Kelompok Item Routes
	api.GET("/master-kelompok-item", handlers.GetMasterKelompokItem(db))
	api.POST("/master-kelompok-item", handlers.CreateMasterKelompokItem(db))
	api.PUT("/master-kelompok-item/:id", handlers.UpdateMasterKelompokItem(db))
	api.DELETE("/master-kelompok-item/:id", handlers.DeleteMasterKelompokItem(db))

	// Master Kategori Routes
	api.GET("/master-kategori", handlers.GetMasterKategori(db))
	api.POST("/master-kategori", handlers.CreateMasterKategori(db))
	api.PUT("/master-kategori/:id", handlers.UpdateMasterKategori(db))
	api.DELETE("/master-kategori/:id", handlers.DeleteMasterKategori(db))

	// Master Barang Jasa Routes
	api.GET("/master-barang-jasa", handlers.GetMasterBarangJasa(db))
	api.POST("/master-barang-jasa", handlers.CreateMasterBarangJasa(db))
	api.PUT("/master-barang-jasa/:id", handlers.UpdateMasterBarangJasa(db))
	api.DELETE("/master-barang-jasa/:id", handlers.DeleteMasterBarangJasa(db))
	api.GET("/master-barang-jasa/by-jenis", handlers.GetMasterBarangJasaByJenis(db))
	api.GET("/master-barang-jasa/for-sale", handlers.GetMasterBarangJasaForSale(db))
	api.GET("/master-barang-jasa/for-purchase", handlers.GetMasterBarangJasaForPurchase(db))

	// Master Aset Tetap Routes
	api.GET("/master-aset-tetap", handlers.GetMasterAsetTetap(db))
	api.GET("/master-aset-tetap/:id", handlers.GetMasterAsetTetapByID(db))
	api.POST("/master-aset-tetap", handlers.CreateMasterAsetTetap(db))
	api.PUT("/master-aset-tetap/:id", handlers.UpdateMasterAsetTetap(db))
	api.DELETE("/master-aset-tetap/:id", handlers.DeleteMasterAsetTetap(db))
	api.POST("/master-aset-tetap/:id/jual", handlers.JualAsetTetap(db))

	// Aset Tetap Registrasi Routes
	api.GET("/aset-tetap/items-for-registration", handlers.GetPembelianItemsForAssetRegistration(db))
	api.GET("/aset-tetap/draft-assets", handlers.GetDraftAssets(db))
	api.POST("/aset-tetap/post-to-gl", handlers.PostAssetsToGL(db))
	api.GET("/aset-tetap/assets-for-depreciation", handlers.GetAssetsForDepreciation(db))
	api.POST("/aset-tetap/post-depreciation", handlers.PostDepreciationToGL(db))

	penjualanHandler := handlers.NewPenjualanHandler(db)
	api.GET("/penjualan", penjualanHandler.GetAllPenjualan)
	api.POST("/penjualan", penjualanHandler.CreatePenjualan)
	api.PUT("/penjualan/:id", penjualanHandler.UpdatePenjualan)
	api.GET("/penjualan/:id", penjualanHandler.GetPenjualanByID)
	api.DELETE("/penjualan/:id", penjualanHandler.DeletePenjualan)
	api.GET("/penjualan/list-with-customer", penjualanHandler.GetPenjualanListWithCustomer)
	api.GET("/penjualan/nomor/:nomor", penjualanHandler.GetPenjualanByNomor)
	api.PATCH("/penjualan/:id/status", penjualanHandler.UpdatePenjualanStatus)
	api.GET("/penjualan/report", penjualanHandler.GetPenjualanReport)
	api.GET("/penjualan/next-invoice-number", penjualanHandler.GetNextInvoiceNumber)

	// Master Gudang Routes
	api.POST("/master-gudang", handlers.CreateGudang(db))
	api.GET("/master-gudang", handlers.GetGudangList(db))
	api.PUT("/master-gudang/:id", handlers.UpdateGudang(db))
	api.DELETE("/master-gudang/:id", handlers.DeleteGudang(db))

	// Master Gudang Group Routes
	api.GET("/master-gudang-group", handlers.GetMasterGudangGroup(db))
	api.POST("/master-gudang-group", handlers.CreateMasterGudangGroup(db))
	api.PUT("/master-gudang-group/:id", handlers.UpdateMasterGudangGroup(db))
	api.DELETE("/master-gudang-group/:id", handlers.DeleteMasterGudangGroup(db))

	// Master Departement Routes
	api.GET("/master-departement", handlers.GetMasterDepartement(db))
	api.POST("/master-departement", handlers.CreateMasterDepartement(db))
	api.PUT("/master-departement/:id", handlers.UpdateMasterDepartement(db))
	api.DELETE("/master-departement/:id", handlers.DeleteMasterDepartement(db))

	// Master Pembeli Routes
	api.GET("/master-pembeli", handlers.GetMasterPembeli(db))
	api.POST("/master-pembeli", handlers.CreateMasterPembeli(db))
	api.PUT("/master-pembeli/:id", handlers.UpdateMasterPembeli(db))
	api.DELETE("/master-pembeli/:id", handlers.DeleteMasterPembeli(db))

	api.GET("/pemasok", handlers.GetMasterPemasok(db))
	api.GET("/pemasok-list", handlers.GetPemasokList(db))
	api.POST("/pemasok", handlers.CreateMasterPemasok(db))
	api.PUT("/pemasok/:id", handlers.UpdateMasterPemasok(db))
	api.DELETE("/pemasok/:id", handlers.DeleteMasterPemasok(db))

	//Master Mata Uang Routes
	api.GET("/master-mata-uang", handlers.GetMasterMataUang(db))           // Mengambil semua data mata uang
	api.POST("/master-mata-uang", handlers.CreateMasterMataUang(db))       // Menambahkan data mata uang
	api.PUT("/master-mata-uang/:id", handlers.UpdateMasterMataUang(db))    // Mengupdate data mata uang berdasarkan ID
	api.DELETE("/master-mata-uang/:id", handlers.DeleteMasterMataUang(db)) // Menghapus data mata uang berdasarkan ID
	//api.GET("/master-mata-uang/by-kode", handlers.GetMasterMataUangByKode(db)) // Mengambil data mata uang berdasarkan kode
	api.GET("/master-mata-uang/:id", handlers.GetMasterMataUangByID(db)) // Mengambil data mata uang berdasarkan ID

	// Master Pajak Routes
	api.POST("/master-pajak", handlers.CreateMasterPajak(db))
	api.GET("/master-pajak", handlers.GetMasterPajakList(db))
	api.GET("/master-pajak/:id", handlers.GetMasterPajakByID(db))
	api.PUT("/master-pajak/:id", handlers.UpdateMasterPajak(db))
	api.DELETE("/master-pajak/:id", handlers.DeleteMasterPajak(db))

	inv := handlers.NewInventoryHandler(db)
	api.GET("/persediaan/summary", inv.GetInventorySummary)
	api.GET("/persediaan/mutasi", inv.GetInventoryMutasi)

	// Adjustment Routes
	adj := handlers.NewAdjustmentHandler(db)
	api.GET("/adjustment", adj.GetAdjustments)
	api.POST("/adjustment", adj.CreateAdjustment)
	api.PUT("/adjustment/:id", adj.UpdateAdjustment)
	api.GET("/adjustment/no-bukti", adj.GenerateNoBukti)
	api.DELETE("/adjustment/:id", adj.DeleteAdjustment)

	// Laporan Keuangan Routes
	api.GET("/laporan/laba-rugi", handlers.GetLaporanLabaRugi(db))
	api.GET("/laporan/neraca", handlers.GetNeraca(db))
	api.GET("/laporan/neraca-komparatif", handlers.GetNeracaKomparatif(db))
	api.GET("/laporan/arus-kas", handlers.GetLaporanArusKas(db))
	api.GET("/laporan/perubahan-modal", handlers.GetLaporanPerubahanModal(db))
	api.GET("/dashboard/summary", handlers.GetDashboardSummary(db))
	// Company Profile Routes
	compHandler := handlers.NewCompanyHandler(db)
	api.GET("/company/profile", compHandler.GetProfile)
	api.POST("/company/profile", compHandler.UpdateProfile)

	// Karyawan Routes
	karHandler := handlers.NewKaryawanHandler(db)
	api.GET("/karyawan", karHandler.GetKaryawan)
	api.POST("/karyawan", karHandler.CreateKaryawan)
	api.PUT("/karyawan/:id", karHandler.UpdateKaryawan)
	api.DELETE("/karyawan/:id", karHandler.DeleteKaryawan)
}
