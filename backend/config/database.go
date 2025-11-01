package config

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB, error) {
	dsn := "host=localhost user=postgres password=ithITtech dbname=akuntan port=5432 sslmode=disable"
	if os.Getenv("DATABASE_URL") != "" {
		dsn = os.Getenv("DATABASE_URL")
		fmt.Printf("Using DATABASE_URL: %s\n", dsn)
	} else {
		fmt.Println("DATABASE_URL not set, using default localhost connection")
	}
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
