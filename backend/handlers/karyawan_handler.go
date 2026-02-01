package handlers

import (
	"net/http"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type KaryawanHandler struct {
	DB *gorm.DB
}

func NewKaryawanHandler(db *gorm.DB) *KaryawanHandler {
	return &KaryawanHandler{DB: db}
}

// GetKaryawan returns list of karyawan with search and pagination
func (h *KaryawanHandler) GetKaryawan(c *gin.Context) {
	var list []models.MasterKaryawan
	query := h.DB.Model(&models.MasterKaryawan{})

	if search := c.Query("search"); search != "" {
		wildcard := "%" + search + "%"
		query = query.Where("nama ILIKE ? OR nik ILIKE ? OR jabatan ILIKE ?", wildcard, wildcard, wildcard)
	}

	if err := query.Order("nama asc").Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CreateKaryawan
func (h *KaryawanHandler) CreateKaryawan(c *gin.Context) {
	var body models.MasterKaryawan
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check NIK uniqueness
	var count int64
	h.DB.Model(&models.MasterKaryawan{}).Where("nik = ?", body.NIK).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "NIK sudah terdaftar"})
		return
	}

	if err := h.DB.Create(&body).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": body})
}

// UpdateKaryawan
func (h *KaryawanHandler) UpdateKaryawan(c *gin.Context) {
	id := c.Param("id")
	var body models.MasterKaryawan
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.MasterKaryawan
	if err := h.DB.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Karyawan not found"})
		return
	}

	// NIK Check if changed
	if body.NIK != existing.NIK {
		var count int64
		h.DB.Model(&models.MasterKaryawan{}).Where("nik = ?", body.NIK).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NIK sudah digunakan karyawan lain"})
			return
		}
	}

	// Update Fields
	existing.NIK = body.NIK
	existing.Nama = body.Nama
	existing.TempatLahir = body.TempatLahir
	existing.TanggalLahir = body.TanggalLahir
	existing.JenisKelamin = body.JenisKelamin
	existing.StatusPernikahan = body.StatusPernikahan
	existing.Alamat = body.Alamat
	existing.Kota = body.Kota
	existing.KodePos = body.KodePos
	existing.NoTelepon = body.NoTelepon
	existing.Email = body.Email
	existing.Departemen = body.Departemen
	existing.Jabatan = body.Jabatan
	existing.TanggalMasuk = body.TanggalMasuk
	existing.StatusKaryawan = body.StatusKaryawan
	existing.GajiPokok = body.GajiPokok
	existing.Tunjangan = body.Tunjangan
	existing.NoRekening = body.NoRekening
	existing.NamaBank = body.NamaBank
	existing.NPWP = body.NPWP

	if err := h.DB.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existing})
}

// DeleteKaryawan
func (h *KaryawanHandler) DeleteKaryawan(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.MasterKaryawan{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
