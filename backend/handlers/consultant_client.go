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

	"github.com/gin-gonic/gin"
)

type ClientRegistry struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	DBConfig string `json:"dbConfig"`
}

const registryFile = "consultant_clients.json"

// GetConsultantClients returns list of registered clients
func GetConsultantClients(c *gin.Context) {
	clients, err := loadClientRegistry()
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load client registry"})
		return
	}
	c.JSON(200, clients)
}

// AddConsultantClient adds a new client to the registry
func AddConsultantClient(c *gin.Context) {
	var newClient ClientRegistry
	if err := c.ShouldBindJSON(&newClient); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	clients, _ := loadClientRegistry()

	// Check if client ID already exists
	for _, client := range clients {
		if client.ID == newClient.ID {
			c.JSON(400, gin.H{"error": "Client ID already exists"})
			return
		}
	}

	// Trim whitespace from URL
	newClient.URL = strings.TrimSpace(newClient.URL)
	newClient.URL = strings.TrimSuffix(newClient.URL, "/")

	clients = append(clients, newClient)
	if err := saveClientRegistry(clients); err != nil {
		c.JSON(500, gin.H{"error": "Failed to save client registry"})
		return
	}

	c.JSON(200, gin.H{"message": "Client added successfully", "client": newClient})
}

// UpdateConsultantClient updates an existing client
func UpdateConsultantClient(c *gin.Context) {
	clientID := c.Param("id")
	var updatedClient ClientRegistry
	if err := c.ShouldBindJSON(&updatedClient); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	clients, _ := loadClientRegistry()
	found := false
	for i, client := range clients {
		if client.ID == clientID {
			// Trim whitespace from URL
			updatedClient.URL = strings.TrimSpace(updatedClient.URL)
			updatedClient.URL = strings.TrimSuffix(updatedClient.URL, "/")

			clients[i] = updatedClient
			clients[i].ID = clientID // Ensure ID doesn't change
			found = true
			break
		}
	}

	if !found {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	if err := saveClientRegistry(clients); err != nil {
		c.JSON(500, gin.H{"error": "Failed to save client registry"})
		return
	}

	c.JSON(200, gin.H{"message": "Client updated successfully"})
}

// DeleteConsultantClient removes a client from the registry
func DeleteConsultantClient(c *gin.Context) {
	clientID := c.Param("id")
	clients, _ := loadClientRegistry()

	newClients := []ClientRegistry{}
	found := false
	for _, client := range clients {
		if client.ID != clientID {
			newClients = append(newClients, client)
		} else {
			found = true
		}
	}

	if !found {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	if err := saveClientRegistry(newClients); err != nil {
		c.JSON(500, gin.H{"error": "Failed to save client registry"})
		return
	}

	c.JSON(200, gin.H{"message": "Client deleted successfully"})
}

// BackupClientDatabase creates a backup of the client's database
func BackupClientDatabase(c *gin.Context) {
	clientID := c.Param("id")

	// Create backups directory if it doesn't exist
	backupDir := "backups"
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create backup directory"})
		return
	}

	// Generate backup filename with timestamp
	timestamp := time.Now().Format("20060102_150405")
	backupFile := filepath.Join(backupDir, fmt.Sprintf("%s_backup_%s.sql", clientID, timestamp))

	// In a real implementation, you would:
	// 1. Get the client's database connection info
	// 2. Use pg_dump or mysqldump to create the backup
	// 3. Save it to the backup file

	// For now, we'll create a placeholder file
	placeholder := fmt.Sprintf("-- Backup for client %s created at %s\n", clientID, time.Now().Format(time.RFC3339))
	if err := ioutil.WriteFile(backupFile, []byte(placeholder), 0644); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create backup file"})
		return
	}

	c.JSON(200, gin.H{
		"message":     "Backup created successfully",
		"backup_file": backupFile,
		"timestamp":   timestamp,
	})
}

// ListBackupFiles returns all backup files for a specific client
func ListBackupFiles(c *gin.Context) {
	clientID := c.Param("id")

	backupDir := "backups"
	pattern := filepath.Join(backupDir, fmt.Sprintf("%s_backup_*.sql", clientID))

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

// RestoreDatabase restores a database from a backup file
func RestoreDatabase(c *gin.Context) {
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

	// In a real implementation, you would:
	// 1. Get the client's database connection info
	// 2. Use psql or mysql to restore the backup
	// 3. Execute: psql -U username -d database < backup_file.sql

	// For now, we'll simulate a successful restore
	c.JSON(200, gin.H{
		"message":     "Database restored successfully",
		"client_id":   clientID,
		"backup_file": req.BackupFile,
		"restored_at": time.Now().Format(time.RFC3339),
	})
}

// TestClientConnection tests the connection to a client's server
func TestClientConnection(c *gin.Context) {
	clientID := c.Param("id")

	clients, _ := loadClientRegistry()
	var targetClient *ClientRegistry
	for _, client := range clients {
		if client.ID == clientID {
			targetClient = &client
			break
		}
	}

	if targetClient == nil {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	// Clean and validate URL
	url := strings.TrimSpace(targetClient.URL)
	url = strings.TrimSuffix(url, "/")

	// For localhost, ensure it has http:// prefix
	if strings.HasPrefix(url, "localhost") || strings.HasPrefix(url, "127.0.0.1") {
		url = "http://" + url
	}

	// Test connection to the client's URL
	healthURL := url + "/api/health"
	resp, err := http.Get(healthURL)
	if err != nil {
		c.JSON(500, gin.H{"error": "Connection failed: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Server returned status %d", resp.StatusCode)})
		return
	}

	c.JSON(200, gin.H{"message": "Connection successful", "status": "healthy"})
}

// Helper functions
func loadClientRegistry() ([]ClientRegistry, error) {
	// Check if file exists
	if _, err := os.Stat(registryFile); os.IsNotExist(err) {
		// Return empty list if file doesn't exist
		return []ClientRegistry{}, nil
	}

	data, err := ioutil.ReadFile(registryFile)
	if err != nil {
		return nil, err
	}

	var clients []ClientRegistry
	if err := json.Unmarshal(data, &clients); err != nil {
		return nil, err
	}

	return clients, nil
}

func saveClientRegistry(clients []ClientRegistry) error {
	data, err := json.MarshalIndent(clients, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(registryFile, data, 0644)
}

// ConsultantProxy proxies requests to the target client's server
func ConsultantProxy(c *gin.Context) {
	// Get target client ID from header
	clientID := c.GetHeader("X-Target-Client-ID")
	if clientID == "" {
		c.JSON(400, gin.H{"error": "Target Client ID is required in Consultant Mode"})
		return
	}

	// Load client registry to get the target URL
	clients, err := loadClientRegistry()
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load client registry"})
		return
	}

	var targetURL string
	for _, client := range clients {
		if client.ID == clientID {
			targetURL = client.URL
			break
		}
	}

	if targetURL == "" {
		c.JSON(404, gin.H{"error": "Client not found"})
		return
	}

	// Proxy the request to the target client
	proxyURL := targetURL + c.Request.URL.Path
	if c.Request.URL.RawQuery != "" {
		proxyURL += "?" + c.Request.URL.RawQuery
	}

	// Create new request
	req, err := http.NewRequest(c.Request.Method, proxyURL, c.Request.Body)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create proxy request"})
		return
	}

	// Copy headers
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(500, gin.H{"error": "Proxy request failed: " + err.Error()})
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
