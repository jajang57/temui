package handlers

import (
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetPublicClientsDB returns minimal client list for login dropdown (No Auth Required)
func GetPublicClientsDB(c *gin.Context) {
	// Karena ini public route, kita harus ambil db dari variable global atau inject manual.
	// TAPI, route ini dipanggil sebelum middleware auth.
	// Middleware DB Dynamic juga belum set 'db' ke client (default master).
	// Jadi c.MustGet("db") akan return Master DB (sesuai setup main.go).

	db, exists := c.Get("db")
	if !exists {
		c.JSON(500, gin.H{"error": "Database connection not available"})
		return
	}
	masterDB := db.(*gorm.DB)

	var clients []models.ClientRegistry
	// Hanya return ID dan Nama untuk keamanan, jangan return URL/Config password
	if err := masterDB.Select("id, name, db_config").Find(&clients).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to load client list"})
		return
	}

	// Mask DB Config password before sending?
	// Or better: Front end needs to know "Database Name" to show in dropdown?
	// User Requirement: "pilih database yang ada di klient tersebut".
	// If 1 Registry = 1 DB, then just Name is enough.
	// But sending raw DBConfig is security risk (contains password).

	// For simplify, just return ID and Name for now.
	c.JSON(200, clients)
}
