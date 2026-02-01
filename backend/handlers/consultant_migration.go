package handlers

import (
	"net/http"
	"project-akuntansi-backend/database"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MigrateClientDatabaseDB triggers migration for a specific client database
func MigrateClientDatabaseDB(c *gin.Context) {
	clientID := c.Param("id")

	// Get Master DB
	db := c.MustGet("db").(*gorm.DB)

	// Get Client Registry
	var clientReg models.ClientRegistry
	if err := db.Where("id = ?", clientID).First(&clientReg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	if clientReg.DBConfig == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Client DB Config is empty"})
		return
	}

	// Connect to Client DB
	clientConnection, err := database.GetClientDB(clientID, clientReg.DBConfig)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to connect to Client DB: " + err.Error()})
		return
	}

	// Run Migration
	if err := models.AutoMigrateClient(clientConnection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Migration failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Database migrated successfully!",
		"client_id": clientID,
	})
}
