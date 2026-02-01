package main

import (
	"fmt"
	"os"

	"project-akuntansi-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

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

	// Test reading with the CORRECT model
	var clients []models.ClientRegistry
	if err := db.Find(&clients).Error; err != nil {
		fmt.Printf("Query error: %v\n", err)
		return
	}

	fmt.Println("=== Using models.ClientRegistry ===")
	for _, c := range clients {
		fmt.Printf("\nID: %s\n", c.ID)
		fmt.Printf("Name: %s\n", c.Name)
		fmt.Printf("URL: %s\n", c.URL)
		fmt.Printf("DBConfig (len=%d): '%s'\n", len(c.DBConfig), c.DBConfig)
		if c.DBConfig == "" {
			fmt.Println("  ⚠️  DBConfig is EMPTY!")
		} else {
			fmt.Println("  ✅ DBConfig has value")
		}
	}
}
