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

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable", host, user, password, dbname)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Failed to connect: %v\n", err)
		return
	}

	// Delete old entries and recreate clean ones
	db.Exec("DELETE FROM client_registry WHERE id IN ('client-demo', 'laptop-client')")
	fmt.Println("Cleaned up old entries")

	// Update existing entry ID=2 with correct name
	db.Exec("UPDATE client_registry SET name = 'Laptop (Radmin VPN)', url = 'http://26.214.2.247:8080', db_config = ? WHERE id = '2'",
		`{"host":"26.214.2.247","port":"5432","database":"akuntan","user":"postgres","password":"12Maktab!"}`)
	fmt.Println("Updated laptop entry (ID: 2)")

	// Add local client
	localClient := ClientRegistry{
		ID:        "local",
		Name:      "Server Lokal",
		URL:       "http://localhost:8080",
		DBConfig:  `{"host":"localhost","port":"5432","database":"akuntan","user":"postgres","password":"ithITtech"}`,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Where("id = ?", localClient.ID).FirstOrCreate(&localClient)
	fmt.Println("Added/Updated local client")

	// Show all clients
	var clients []ClientRegistry
	db.Find(&clients)
	fmt.Printf("\n📋 Final Client Registry (%d entries):\n", len(clients))
	for _, c := range clients {
		fmt.Printf("  ID: %-10s | Name: %-25s | DBConfig: %s\n", c.ID, c.Name, c.DBConfig[:min(50, len(c.DBConfig))]+"...")
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
