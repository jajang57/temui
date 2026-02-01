package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/database"
	"project-akuntansi-backend/models"
	"sync"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var (
	migratedClients sync.Map
)

// DynamicDBMiddleware switches the "db" context based on X-Target-Client-ID
// Requires the "Consultant DB" (master db) to be passed as argument
func DynamicDBMiddleware(masterDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get Client ID Header
		clientID := c.GetHeader("X-Target-Client-ID")

		// Jika tidak ada ID, gunakan Master DB (Consultant's own DB)
		// KECUALI untuk API Consultant Management sendiri (/api/consultant/*), itu harus tetap pakai Master DB
		// TAPI logic middleware ini dipasang global.
		// Jadi default = MasterDB.
		c.Set("db", masterDB)

		if clientID != "" {
			// Cek apakah route ini termasuk route Management Konsultan?
			// Route /api/consultant/... adalah untuk manage daftar klien, jadi pakai Master DB.
			// Route /api/login, /api/register juga pakai Master DB (untuk konsultan).
			// Hanya route bisnis (/api/master-coa, /api/pembelian, dll) yang switch ke Client DB.

			// Simplifikasi: Jika header ada, KITA COBA switch.
			// Tapi kita harus filter route mana yang BOLEH di-switch.
			// Route bisnis biasanya tidak punya prefix /api/consultant

			path := c.Request.URL.Path
			if len(path) >= 15 && path[:15] == "/api/consultant" {
				// Keep Master DB
				c.Next()
				return
			}
			if path == "/api/login" || path == "/api/register" || path == "/api/user-theme-setting" {
				// Keep Master DB for Consultant Login
				c.Next()
				return
			}

			// 2. Load Client Config from Master DB
			var clientReg models.ClientRegistry
			if err := masterDB.Where("id = ?", clientID).First(&clientReg).Error; err != nil {
				// Client not found in Registry
				c.JSON(http.StatusNotFound, gin.H{"error": "Client Access Denied: Unknown Client ID"})
				c.Abort()
				return
			}

			// [PROXY MODE] If Client has API URL, forward request instead of direct DB connection
			// EXCEPTION: If ID is "local", we force Direct DB (to avoid proxy loop to self)
			if clientReg.URL != "" && clientID != "local" {
				ProxyRequest(c, clientReg.URL)
				return
			}

			// 3. Get/Connect to Client DB
			if clientReg.DBConfig == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Client Database Configuration missing"})
				c.Abort()
				return
			}

			clientDB, err := database.GetClientDB(clientID, clientReg.DBConfig)
			if err != nil {
				fmt.Printf("Failed to connect to client DB: %v\n", err)
				c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to connect to Client Database: " + err.Error()})
				c.Abort()
				return
			}

			// 4. Inject Client DB
			c.Set("db", clientDB)
			// fmt.Printf("Switched to Client DB: %s\n", clientReg.Name)

			// 5. Auto Migrate (Once per session)
			if _, ok := migratedClients.Load(clientID); !ok {
				fmt.Printf("🔄 Auto Migrating DB for Client: %s...\n", clientReg.Name)
				if err := models.AutoMigrateClient(clientDB); err != nil {
					fmt.Printf("⚠️  Auto Migration Failed for Client %s: %v\n", clientID, err)
				} else {
					migratedClients.Store(clientID, true)
				}
			}
		}

		c.Next()
	}
}
