package main

import (
	"encoding/json"
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

type DBConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
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

	fmt.Println("=== TESTING ALL CLIENT CONNECTIONS ===\n")
	for _, c := range clients {
		fmt.Printf("Testing: %s (%s)\n", c.Name, c.ID)
		fmt.Printf("  DBConfig: %s\n", c.DBConfig)

		if c.DBConfig == "" {
			fmt.Println("  ❌ SKIP: No DBConfig\n")
			continue
		}

		var config DBConfig
		if err := json.Unmarshal([]byte(c.DBConfig), &config); err != nil {
			fmt.Printf("  ❌ FAIL: Invalid JSON: %v\n\n", err)
			continue
		}

		fmt.Printf("  Parsed: host=%s, port=%s, db=%s, user=%s\n", config.Host, config.Port, config.Database, config.User)

		if config.Host == "" || config.Database == "" || config.User == "" {
			fmt.Println("  ❌ FAIL: Incomplete config (missing host/db/user)\n")
			continue
		}

		// Try connect
		clientDSN := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			config.Host, config.User, config.Password, config.Database, config.Port)

		clientDB, err := gorm.Open(postgres.Open(clientDSN), &gorm.Config{})
		if err != nil {
			fmt.Printf("  ❌ FAIL: Connection error: %v\n\n", err)
			continue
		}

		sqlDB, _ := clientDB.DB()
		if err := sqlDB.Ping(); err != nil {
			fmt.Printf("  ❌ FAIL: Ping error: %v\n\n", err)
			sqlDB.Close()
			continue
		}

		fmt.Println("  ✅ SUCCESS: Connection OK!\n")
		sqlDB.Close()
	}
}
