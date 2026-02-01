package main

import (
	"fmt"
	"log"
	"project-akuntansi-backend/config"
	"project-akuntansi-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("🔍 Checking Master Departement...")

	// Function to ensure department exists
	ensureDepartment := func(id uint, kode, nama string) {
		var dept models.MasterDepartement
		if err := db.First(&dept, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				fmt.Printf("⚠️  Department ID %d not found. Creating default...\n", id)
				newDept := models.MasterDepartement{
					ID:    id,
					Kode:  kode,
					Nama:  nama,
					Aktif: true,
				}
				if err := db.Create(&newDept).Error; err != nil {
					log.Printf("❌ Failed to create department: %v", err)
				} else {
					fmt.Printf("✅ Created Department: %s (ID: %d)\n", nama, id)
				}
			} else {
				log.Printf("❌ Error checking department: %v", err)
			}
		} else {
			fmt.Printf("✅ Department ID %d already exists: %s\n", dept.ID, dept.Nama)
		}
	}

	// Ensure ID 1 exists (Default used by frontend)
	ensureDepartment(1, "DEPT-001", "Office")

	fmt.Println("🎉 Fix Missing Department Completed!")
}
