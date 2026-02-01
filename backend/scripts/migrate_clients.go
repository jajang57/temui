package main

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ClientRegistry struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	URL       string    `gorm:"not null" json:"url"`
	DBConfig  string    `gorm:"column:db_config;type:text" json:"dbConfig"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (ClientRegistry) TableName() string {
	return "client_registry"
}

func main() {
	godotenv.Load()

	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "ithITtech"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "akuntan"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", host, user, password, dbname, port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		return
	}

	// Auto migrate the table
	db.AutoMigrate(&ClientRegistry{})

	// Insert/Update clients
	clientsData := []ClientRegistry{
		{
			ID:        "client-demo",
			Name:      "PT Demo Client (Lokal)",
			URL:       "http://localhost:8081",
			DBConfig:  `{"host":"localhost","port":"5432","database":"akuntan","user":"postgres","password":"ithITtech"}`,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        "laptop-client",
			Name:      "Laptop (Radmin VPN)",
			URL:       "http://26.214.2.247:8080",
			DBConfig:  `{"host":"26.214.2.247","port":"5432","database":"akuntan","user":"postgres","password":"12Maktab!"}`,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	for _, client := range clientsData {
		result := db.Where("id = ?", client.ID).First(&ClientRegistry{})
		if result.RowsAffected == 0 {
			if err := db.Create(&client).Error; err != nil {
				fmt.Printf("Failed to insert client %s: %v\n", client.ID, err)
				continue
			}
			fmt.Printf("✅ Client '%s' inserted successfully!\n", client.Name)
		} else {
			if err := db.Model(&ClientRegistry{}).Where("id = ?", client.ID).Updates(map[string]interface{}{
				"name":       client.Name,
				"url":        client.URL,
				"db_config":  client.DBConfig,
				"updated_at": time.Now(),
			}).Error; err != nil {
				fmt.Printf("Failed to update client %s: %v\n", client.ID, err)
				continue
			}
			fmt.Printf("✅ Client '%s' updated successfully!\n", client.Name)
		}
	}

	// List all clients
	var allClients []ClientRegistry
	db.Find(&allClients)
	fmt.Printf("\n📋 Registered Clients (%d):\n", len(allClients))
	for _, c := range allClients {
		fmt.Printf("   - %s: %s\n", c.ID, c.Name)
	}
}
