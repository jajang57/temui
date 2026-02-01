package main

import (
	"fmt"
	"os"

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

	// Fix laptop entry - update host to Radmin VPN IP
	correctConfig := `{"host":"26.214.2.247","port":"5432","database":"akuntan","user":"postgres","password":"12Maktab!"}`

	result := db.Exec("UPDATE client_registry SET db_config = ?, name = 'Laptop (Radmin VPN)' WHERE id = '2'", correctConfig)
	if result.Error != nil {
		fmt.Printf("Update error: %v\n", result.Error)
		return
	}

	fmt.Printf("✅ Updated %d rows\n", result.RowsAffected)
	fmt.Printf("New config: %s\n", correctConfig)
}
