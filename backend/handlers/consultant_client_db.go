package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"project-akuntansi-backend/database"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetConsultantClientsDB returns list of registered clients from database
func GetConsultantClientsDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var clients []models.ClientRegistry
	if err := db.Find(&clients).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to load client registry"})
		return
	}
	c.JSON(200, clients)
}

// AddConsultantClientDB adds a new client to the database
func AddConsultantClientDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var newClient models.ClientRegistry
	if err := c.ShouldBindJSON(&newClient); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	// Check if client ID already exists
	var existing models.ClientRegistry
	if err := db.Where("id = ?", newClient.ID).First(&existing).Error; err == nil {
		c.JSON(400, gin.H{"error": "Client ID already exists"})
		return
	}

	// Create new client
	if err := db.Create(&newClient).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to create client"})
		return
	}

	c.JSON(201, newClient)
}

// UpdateConsultantClientDB updates an existing client in the database
func UpdateConsultantClientDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	clientID := c.Param("id")

	var updatedClient models.ClientRegistry
	if err := c.ShouldBindJSON(&updatedClient); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	// Find existing client
	var existing models.ClientRegistry
	if err := db.Where("id = ?", clientID).First(&existing).Error; err != nil {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	// Update fields
	existing.Name = updatedClient.Name
	existing.URL = updatedClient.URL
	existing.DBConfig = updatedClient.DBConfig

	if err := db.Save(&existing).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update client"})
		return
	}

	// ✅ Clear Cache so next request uses new config
	database.ClearClientDB(clientID)

	c.JSON(200, existing)
}

// DeleteConsultantClientDB deletes a client from the database
func DeleteConsultantClientDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	clientID := c.Param("id")

	result := db.Where("id = ?", clientID).Delete(&models.ClientRegistry{})
	if result.Error != nil {
		c.JSON(500, gin.H{"error": "Failed to delete client"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Client deleted successfully"})
	// ✅ Clear Cache
	database.ClearClientDB(clientID)
}

// TestClientConnectionDB tests connection to a client server (database version)
func TestClientConnectionDB(c *gin.Context) {
	clientID := c.Param("id")

	// Get DB from Context (Master DB)
	db := c.MustGet("db").(*gorm.DB)

	// Get Client Registry
	var clientReg models.ClientRegistry
	if err := db.Where("id = ?", clientID).First(&clientReg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	// DEBUG: Print what we got from database
	fmt.Printf("DEBUG TestConnection - ID: %s, Name: %s, DBConfig: '%s'\n", clientReg.ID, clientReg.Name, clientReg.DBConfig)

	if clientReg.DBConfig == "" {
		// Fallback for transition: if DBConfig empty, try strict URL check?
		// User said "wajib pilih database". So we enforce valid config.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Database configuration not set. Please update client settings."})
		return
	}

	// Try to connect
	clientConnection, err := database.GetClientDB(clientID, clientReg.DBConfig)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  "error",
			"message": "Failed to connect to Client Database: " + err.Error(),
		})
		return
	}

	// Verify connection with Ping (Raw SQL)
	sqlDB, err := clientConnection.DB()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  "error",
			"message": "Database instance error: " + err.Error(),
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  "error",
			"message": "Connection Ping Failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Successfully connected to Client Database (" + clientReg.Name + ")",
	})
}

// BackupClientDatabaseDB creates a backup of client database (database version)
func BackupClientDatabaseDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	clientID := c.Param("id")

	var targetClient models.ClientRegistry
	if err := db.Where("id = ?", clientID).First(&targetClient).Error; err != nil {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	if targetClient.DBConfig == "" {
		c.JSON(400, gin.H{"error": "Client Database Configuration missing"})
		return
	}

	// Parse DB Config
	var conf database.ClientDBConfig
	if err := json.Unmarshal([]byte(targetClient.DBConfig), &conf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse client db config"})
		return
	}

	// Create backups directory if not exists
	backupDir := "backups"
	os.MkdirAll(backupDir, 0755)

	// Generate backup filename with timestamp
	timestamp := time.Now().Format("20060102_150405")
	backupFile := filepath.Join(backupDir, fmt.Sprintf("%s_backup_%s.dump", clientID, timestamp))

	// Get PG_BIN_PATH from DB
	userID := c.GetUint("user_id")
	var setting models.UserThemeSetting
	db.Where("user_id = ?", userID).First(&setting)

	if err := ExecuteBackup(conf.Host, conf.Port, conf.User, conf.Password, conf.DBName, backupFile, setting.PgBinPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message":     "Backup created successfully",
		"backup_file": backupFile,
		"filename":    filepath.Base(backupFile),
	})
}

// ListBackupFilesDB returns all backup files for a specific client (database version)
func ListBackupFilesDB(c *gin.Context) {
	clientID := c.Param("id")

	backupDir := "backups"
	pattern := filepath.Join(backupDir, fmt.Sprintf("%s_backup_*.dump", clientID))

	files, err := filepath.Glob(pattern)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to list backup files"})
		return
	}

	// Get file info for each backup
	backups := []gin.H{}
	for _, file := range files {
		info, err := os.Stat(file)
		if err != nil {
			continue
		}

		backups = append(backups, gin.H{
			"filename":   filepath.Base(file),
			"path":       file,
			"size":       info.Size(),
			"created_at": info.ModTime().Format(time.RFC3339),
		})
	}

	c.JSON(200, backups)
}

// RestoreDatabaseDB restores a database from a backup file (database version)
func RestoreDatabaseDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB) // Master DB
	clientID := c.Param("id")

	var req struct {
		BackupFile string `json:"backup_file"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate backup file exists
	if _, err := os.Stat(req.BackupFile); os.IsNotExist(err) {
		c.JSON(404, gin.H{"error": "Backup file not found"})
		return
	}

	// Get Client Config
	var targetClient models.ClientRegistry
	if err := db.Where("id = ?", clientID).First(&targetClient).Error; err != nil {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	// Parse DB Config
	var conf database.ClientDBConfig
	if err := json.Unmarshal([]byte(targetClient.DBConfig), &conf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse client db config"})
		return
	}

	// Get PG_BIN_PATH from DB
	userID := c.GetUint("user_id")
	var setting models.UserThemeSetting
	db.Where("user_id = ?", userID).First(&setting)

	if err := ExecuteRestore(conf.Host, conf.Port, conf.User, conf.Password, conf.DBName, req.BackupFile, setting.PgBinPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "Database restored successfully",
		"client":  clientID,
		"backup":  req.BackupFile,
	})
}

// ConsultantProxyDB proxies requests to the target client's server (Database Version)
func ConsultantProxyDB(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// Get target client ID from header
	clientID := c.GetHeader("X-Target-Client-ID")
	fmt.Printf("[DEBUG PROXY] Received Header X-Target-Client-ID: |%s|\n", clientID) // INSTRUMENTATION
	if clientID == "" {
		c.JSON(400, gin.H{"error": "Target Client ID is required in Consultant Mode"})
		return
	}

	// Load client registry from DB
	var targetClient models.ClientRegistry
	err := db.Where("id = ?", clientID).First(&targetClient).Error
	if err != nil {
		fmt.Printf("[DEBUG PROXY] DB Error searching ID '%s': %v\n", clientID, err) // INSTRUMENTATION
		// DEBUGGING BLOCK START
		fmt.Printf("❌ PROXY ERROR: Client ID '%s' not found. Error: %v\n", clientID, err)
		var allClients []models.ClientRegistry
		db.Find(&allClients)
		fmt.Println("📋 AVAILABLE CLIENTS IN DB:")
		for _, c := range allClients {
			fmt.Printf(" - ID: '%s', Name: '%s', URL: '%s'\n", c.ID, c.Name, c.URL)
		}
		// DEBUGGING BLOCK END

		c.JSON(404, gin.H{"error": fmt.Sprintf("Client not found in database (ID: %s)", clientID)})
		return
	}

	targetURL := targetClient.URL
	if targetURL == "" {
		c.JSON(404, gin.H{"error": "Client URL not configured"})
		return
	}

	// Clean URL
	targetURL = strings.TrimSpace(targetURL)
	targetURL = strings.TrimSuffix(targetURL, "/")
	if strings.HasPrefix(targetURL, "localhost") || strings.HasPrefix(targetURL, "127.0.0.1") || strings.HasPrefix(targetURL, ":") {
		if !strings.HasPrefix(targetURL, "http") {
			targetURL = "http://" + targetURL
		}
	} else if !strings.HasPrefix(targetURL, "http") {
		targetURL = "http://" + targetURL
	}

	// Proxy the request to the target client
	proxyURL := targetURL + c.Request.URL.Path
	if c.Request.URL.RawQuery != "" {
		proxyURL += "?" + c.Request.URL.RawQuery
	}

	fmt.Printf("[DEBUG PROXY] Forwarding Request to: %s\n", proxyURL) // INSTRUMENTATION

	// Create new request
	req, err := http.NewRequest(c.Request.Method, proxyURL, c.Request.Body)
	if err != nil {
		fmt.Printf("[DEBUG PROXY] Failed to create request: %v\n", err) // INSTRUMENTATION
		c.JSON(500, gin.H{"error": "Failed to create proxy request"})
		return
	}

	// Copy headers
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Send request with timeout
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[DEBUG PROXY] Connection Failed: %v\n", err) // INSTRUMENTATION
		c.JSON(502, gin.H{"error": "Proxy request failed (Target Server Unreachable): " + err.Error()})
		return
	}
	defer resp.Body.Close()

	// Read response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to read proxy response"})
		return
	}

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	// Send response
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
}
