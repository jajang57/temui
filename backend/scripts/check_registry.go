package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ClientRegistry struct {
	ID       string `gorm:"primaryKey"`
	Name     string
	URL      string
	DBConfig string `gorm:"column:db_config"`
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
	db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	var clients []ClientRegistry
	db.Find(&clients)

	fmt.Println("=== CLIENT REGISTRY ===")
	for _, c := range clients {
		fmt.Printf("\nID: %s\n", c.ID)
		fmt.Printf("Name: %s\n", c.Name)
		fmt.Printf("URL: %s\n", c.URL)
		fmt.Printf("DBConfig: %s\n", c.DBConfig)
	}
}
