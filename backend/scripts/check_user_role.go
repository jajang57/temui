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

	// Check user role
	var user models.User
	err = db.Where("username = ?", "finaltest").First(&user).Error
	if err != nil {
		log.Printf("User finaltest not found: %v", err)
		return
	}

	fmt.Printf("User: %s, Role: %s\n", user.Username, user.Role)
}
