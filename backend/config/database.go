package config

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB, error) {
	// Read Check Env
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
		password = "password"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "akuntan"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	// 1. Logic Auto-Create Database
	// Kita perlu connect ke default DB "postgres" dulu untuk cek/buat DB baru
	dsnDefault := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=%s sslmode=disable", host, user, password, port)
	dbDefault, err := gorm.Open(postgres.Open(dsnDefault), &gorm.Config{})
	if err == nil {
		// Cek apakah database target sudah ada
		var exists bool
		checkSQL := fmt.Sprintf("SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = '%s')", dbname)
		dbDefault.Raw(checkSQL).Scan(&exists)

		if !exists {
			fmt.Printf("📦 Database '%s' not found. Creating...\n", dbname)
			// CREATE DATABASE tidak boleh dalam transaksi, jadi pakai Exec biasa
			// Note: Gorm Exec mungkin wrap tx? Sebaiknya pakai sql.DB langsung kalau bisa, tapi coba DB().Exec
			createSQL := fmt.Sprintf("CREATE DATABASE %s", dbname)
			// Kita harus close connection gorm dulu atau gunakan sql db interface
			sqlDB, _ := dbDefault.DB()
			if _, err := sqlDB.Exec(createSQL); err != nil {
				fmt.Printf("⚠️  Failed to create database: %v\n", err)
			} else {
				fmt.Println("✅ Database created successfully!")
			}
			// Close connection default
			sqlDB.Close()
		} else {
			sqlDB, _ := dbDefault.DB()
			sqlDB.Close()
		}
	} else {
		fmt.Printf("⚠️  Warning: Could not connect to 'postgres' DB to check existence: %v\n", err)
	}

	// 2. Connect ke Database Target
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", host, user, password, dbname, port)

	// Override with full URL if valid
	if os.Getenv("DATABASE_URL") != "" {
		dsn = os.Getenv("DATABASE_URL")
		fmt.Printf("Using DATABASE_URL: %s\n", dsn)
	} else {
		fmt.Printf("Connecting to DB: %s @ %s:%s\n", dbname, host, port)
	}
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
