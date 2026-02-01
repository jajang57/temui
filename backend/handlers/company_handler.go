package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CompanyHandler struct {
	DB *gorm.DB
}

func NewCompanyHandler(db *gorm.DB) *CompanyHandler {
	return &CompanyHandler{DB: db}
}

// GetProfile retrieves the first company profile record
func (h *CompanyHandler) GetProfile(c *gin.Context) {
	var profile models.CompanyProfile
	// Always get the first record (assumes single company)
	err := h.DB.First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return empty if not found, frontend manages creation
			c.JSON(http.StatusOK, gin.H{"data": nil})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": profile})
}

// UpdateProfile creates or updates the company profile
func (h *CompanyHandler) UpdateProfile(c *gin.Context) {
	// Parse Multipart Form for file upload
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	var body models.CompanyProfile

	// Manual binding because ShouldBind can be tricky with Multipart
	body.Nama = c.PostForm("nama")
	body.Alamat = c.PostForm("alamat")
	body.NoTelepon = c.PostForm("noTelepon")
	body.Email = c.PostForm("email")
	body.Website = c.PostForm("website")
	body.NPWP = c.PostForm("npwp")

	// Check if record exists
	var existing models.CompanyProfile
	result := h.DB.First(&existing)

	// Handle File Upload
	file, err := c.FormFile("logo")
	logoPath := existing.LogoPath // Default to existing
	if err == nil {
		// New file uploaded
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("logo_%d%s", time.Now().Unix(), ext)
		dst := filepath.Join("uploads", "company", filename)

		// Ensure dir exists
		os.MkdirAll(filepath.Join("uploads", "company"), 0755)

		if err := c.SaveUploadedFile(file, dst); err == nil {
			logoPath = "/" + strings.ReplaceAll(dst, "\\", "/") // Store relative web path
		}
	}
	body.LogoPath = logoPath

	if result.Error == gorm.ErrRecordNotFound {
		// Create
		if err := h.DB.Create(&body).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// Update
		updates := map[string]interface{}{
			"nama":       body.Nama,
			"alamat":     body.Alamat,
			"no_telepon": body.NoTelepon,
			"email":      body.Email,
			"website":    body.Website,
			"npwp":       body.NPWP,
			"logo_path":  body.LogoPath,
		}
		if err := h.DB.Model(&existing).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		body = existing // Reload for response
	}

	c.JSON(http.StatusOK, gin.H{"data": body})
}
