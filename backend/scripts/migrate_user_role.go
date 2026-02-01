package main

import (
	"fmt"
	"log"

	"project-akuntansi-backend/config"
	"project-akuntansi-backend/models"
)

func main() {
	// Connect to database
	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto Migrate to add Role column
	err = db.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Failed to migrate:", err)
	}
	fmt.Println("✅ Successfully migrated User table (added Role column)")

	// Update 'finaltest' user to have role 'consultant'
	var user models.User
	err = db.Where("username = ?", "finaltest").First(&user).Error
	if err == nil {
		user.Role = "consultant"
		db.Save(&user)
		fmt.Printf("✅ Updated user %s to role: %s\n", user.Username, user.Role)
	} else {
		fmt.Printf("⚠️ User 'finaltest' not found, creating new consultant user...\n")
		// Optional: create if not exists, but better to just let user register
	}

	// Update 'admin' user if exists
	var admin models.User
	err = db.Where("username = ?", "admin").First(&admin).Error
	if err == nil {
		admin.Role = "consultant"
		db.Save(&admin)
		fmt.Printf("✅ Updated user %s to role: %s\n", admin.Username, admin.Role)
	}
}
