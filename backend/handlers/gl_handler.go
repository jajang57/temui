package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/gl
func GetGLs(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		nomorTransaksi := c.Query("nomor_transaksi")
		var gls []models.GL

		query := db
		if nomorTransaksi != "" {
			query = query.Where("nomor_transaksi = ?", nomorTransaksi)
		}

		if err := query.Find(&gls).Error; err != nil {
			fmt.Printf("[ERROR] GetGLs failed: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if nomorTransaksi != "" {
			fmt.Printf("[DEBUG] GetGLs: nomor_transaksi='%s', found %d records\n", nomorTransaksi, len(gls))
		}
		c.JSON(http.StatusOK, gls)
	}
}

// POST /api/gl
func CreateGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		var input models.GL
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, input)
	}
}

// PUT /api/gl/:id
func UpdateGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		id := c.Param("id")
		var gl models.GL
		if err := db.First(&gl, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
			return
		}
		var input models.GL
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Model(&gl).Updates(input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gl)
	}
}

// DELETE /api/gl/:id
func DeleteGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		id := c.Param("id")
		if err := db.Unscoped().Delete(&models.GL{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Data berhasil dihapus"})
	}
}
