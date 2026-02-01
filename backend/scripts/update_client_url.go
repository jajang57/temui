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

	// Update client demo URL
	var client models.ClientRegistry
	err = db.Where("id = ?", "client-demo").First(&client).Error
	if err != nil {
		log.Printf("Client demo not found: %v", err)
		return
	}

	client.URL = "http://localhost:8081"
	err = db.Save(&client).Error
	if err != nil {
		log.Fatal("Failed to update client:", err)
	}

	fmt.Println("✅ Successfully updated client-demo URL to http://localhost:8081")
}
