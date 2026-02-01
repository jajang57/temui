package main

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Test connection to Laptop via Radmin
	host := "26.214.2.247"
	port := "5432"
	user := "postgres"
	password := "12Maktab!"
	dbname := "akuntan"

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port)

	fmt.Printf("Testing connection to: %s@%s:%s/%s\n", user, host, port, dbname)
	fmt.Printf("DSN: %s\n", dsn)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("❌ Connection FAILED: %v\n", err)
		return
	}

	sqlDB, _ := db.DB()
	if err := sqlDB.Ping(); err != nil {
		fmt.Printf("❌ Ping FAILED: %v\n", err)
		return
	}

	fmt.Println("✅ Connection SUCCESSFUL!")

	// Test query
	var count int64
	db.Table("users").Count(&count)
	fmt.Printf("📊 Users count: %d\n", count)

	sqlDB.Close()
}
