package handlers

import (
	"fmt"
	"net/http"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdjustmentHandler struct {
	DB *gorm.DB
}

func NewAdjustmentHandler(db *gorm.DB) *AdjustmentHandler {
	return &AdjustmentHandler{DB: db}
}

// GetAdjustments returns list of adjustments with filters
func (h *AdjustmentHandler) GetAdjustments(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var adjustments []models.Adjustment
	query := db.Preload("Gudang").Preload("Item").Preload("ContraAccount").Order("tanggal desc, id desc")

	if startDate := c.Query("startDate"); startDate != "" {
		query = query.Where("tanggal >= ?", startDate)
	}
	if endDate := c.Query("endDate"); endDate != "" {
		query = query.Where("tanggal <= ?", endDate)
	}
	if gudangId := c.Query("gudangId"); gudangId != "" {
		query = query.Where("gudang_id = ?", gudangId)
	}

	if err := query.Find(&adjustments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": adjustments})
}

// GenerateNoBukti generates auto number like ADJ/2023/10/001
func (h *AdjustmentHandler) GenerateNoBukti(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	tanggalStr := c.Query("tanggal")
	if tanggalStr == "" {
		tanggalStr = time.Now().Format("2006-01-02")
	}
	t, _ := time.Parse("2006-01-02", tanggalStr)
	prefix := fmt.Sprintf("ADJ/%s/%s", t.Format("2006"), t.Format("01"))

	var last models.Adjustment
	db.Where("no_bukti LIKE ?", prefix+"%").Order("no_bukti desc").First(&last)

	newSort := 1
	if last.NoBukti != "" {
		var lastSeq int
		fmt.Sscanf(last.NoBukti, prefix+"/%04d", &lastSeq)
		newSort = lastSeq + 1
	}

	newNo := fmt.Sprintf("%s/%04d", prefix, newSort)
	c.JSON(http.StatusOK, gin.H{"noBukti": newNo})
}

// CreateAdjustment saves a new adjustment
func (h *AdjustmentHandler) CreateAdjustment(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var body models.Adjustment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto generate no bukti if empty
	if body.NoBukti == "" {
		prefix := fmt.Sprintf("ADJ/%s/%s", body.Tanggal.Format("2006"), body.Tanggal.Format("01"))
		var last models.Adjustment
		db.Where("no_bukti LIKE ?", prefix+"%").Order("no_bukti desc").First(&last)
		newSort := 1
		if last.NoBukti != "" {
			var lastSeq int
			fmt.Sscanf(last.NoBukti, prefix+"/%04d", &lastSeq)
			newSort = lastSeq + 1
		}
		body.NoBukti = fmt.Sprintf("%s/%04d", prefix, newSort)
	}

	// Calculate Diff
	body.QtyDiff = body.QtyActual - body.QtySystem

	// Start Transaction
	tx := db.Begin()

	if err := tx.Create(&body).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// GL Integration
	if body.QtyDiff != 0 && body.ContraAccountID != nil {
		var item models.MasterBarangJasa
		if err := tx.Where("kode = ?", body.ItemID).First(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item not found for GL posting"})
			return
		}

		if item.AkunPersediaan == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item does not have AkunPersediaan mapped"})
			return
		}

		// Calculate Value (Standard Cost / Harga Beli)
		totalValue := body.QtyDiff * item.HargaBeli
		if totalValue < 0 {
			totalValue = -totalValue // Absolute value for debit/credit
		}

		var debitAkun, kreditAkun string
		var contra models.MasterCOA
		if err := tx.First(&contra, *body.ContraAccountID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Contra Account not found"})
			return
		}

		if body.QtyDiff > 0 {
			// Surplus: Dr Persediaan, Cr Contra (Pendapatan/Lainnya)
			debitAkun = item.AkunPersediaan
			kreditAkun = contra.Kode
		} else {
			// Deficit: Dr Contra (Beban), Cr Persediaan
			debitAkun = contra.Kode
			kreditAkun = item.AkunPersediaan
		}

		// Entry 1: Debit Row
		glDebit := models.GL{
			NomorTransaksi: body.NoBukti,
			NomorJurnal:    body.NoBukti, // Use same number
			Tanggal:        body.Tanggal,
			AkunTransaksi:  debitAkun,
			Deskripsi:      fmt.Sprintf("Adj Stok %s (Qty: %+v): %s", body.ItemID, body.QtyDiff, body.Alasan),
			Debit:          totalValue,
			Kredit:         0,
			ContactType:    "adjustment",
			// ProjectNo/Name could be added if available
		}
		if err := tx.Create(&glDebit).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GL Debit Entry"})
			return
		}

		// Entry 2: Credit Row
		glCredit := models.GL{
			NomorTransaksi: body.NoBukti,
			NomorJurnal:    body.NoBukti,
			Tanggal:        body.Tanggal,
			AkunTransaksi:  kreditAkun,
			Deskripsi:      fmt.Sprintf("Adj Stok %s (Qty: %+v): %s", body.ItemID, body.QtyDiff, body.Alasan),
			Debit:          0,
			Kredit:         totalValue,
			ContactType:    "adjustment",
		}
		if err := tx.Create(&glCredit).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GL Credit Entry"})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"data": body})
}

// UpdateAdjustment updates an existing adjustment and revises GL
func (h *AdjustmentHandler) UpdateAdjustment(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")
	var body models.Adjustment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := db.Begin()

	var existing models.Adjustment
	if err := tx.First(&existing, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Adjustment not found"})
		return
	}

	// 1. Cleanup Old GL (Hard Delete for simplicity in this context)
	// Find GL based on NoBukti and Transaction Type
	var existingGL models.GL
	if err := tx.Where("nomor_transaksi = ? AND tipe_transaksi = 'Adjustment'", existing.NoBukti).First(&existingGL).Error; err == nil {
		// Delete GL Summary
		tx.Where("gl_id = ?", existingGL.ID).Delete(&models.GLSummary{})
		// Delete GL Header
		tx.Delete(&existingGL)
	}

	// 2. Update Adjustment Record
	// Recalculate Diff based on new input
	body.QtyDiff = body.QtyActual - body.QtySystem

	if err := tx.Model(&existing).Updates(map[string]interface{}{
		"tanggal":           body.Tanggal,
		"gudang_id":         body.GudangID,
		"item_id":           body.ItemID,
		"qty_system":        body.QtySystem,
		"qty_actual":        body.QtyActual,
		"qty_diff":          body.QtyDiff,
		"alasan":            body.Alasan,
		"contra_account_id": body.ContraAccountID,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Re-Post GL (Same Logic as Create)
	if body.QtyDiff != 0 && body.ContraAccountID != nil {
		var item models.MasterBarangJasa
		if err := tx.Where("kode = ?", body.ItemID).First(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item not found for GL posting"})
			return
		}

		if item.AkunPersediaan == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item does not have AkunPersediaan mapped"})
			return
		}

		// Calculate Value
		totalValue := body.QtyDiff * item.HargaBeli
		if totalValue < 0 {
			totalValue = -totalValue
		}

		var debitAkun, kreditAkun string
		var contra models.MasterCOA
		if err := tx.First(&contra, *body.ContraAccountID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Contra Account not found"})
			return
		}

		if body.QtyDiff > 0 {
			debitAkun = item.AkunPersediaan
			kreditAkun = contra.Kode
		} else {
			debitAkun = contra.Kode
			kreditAkun = item.AkunPersediaan
		}

		// Entry 1: Debit Row
		glDebit := models.GL{
			NomorTransaksi: existing.NoBukti, // Use existing NoBukti
			NomorJurnal:    existing.NoBukti,
			Tanggal:        body.Tanggal,
			AkunTransaksi:  debitAkun,
			Deskripsi:      fmt.Sprintf("Adj Stok %s (Qty: %+v): %s", body.ItemID, body.QtyDiff, body.Alasan),
			Debit:          totalValue,
			Kredit:         0,
			ContactType:    "adjustment",
		}
		if err := tx.Create(&glDebit).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GL Debit Entry"})
			return
		}

		// Entry 2: Credit Row
		glCredit := models.GL{
			NomorTransaksi: existing.NoBukti,
			NomorJurnal:    existing.NoBukti,
			Tanggal:        body.Tanggal,
			AkunTransaksi:  kreditAkun,
			Deskripsi:      fmt.Sprintf("Adj Stok %s (Qty: %+v): %s", body.ItemID, body.QtyDiff, body.Alasan),
			Debit:          0,
			Kredit:         totalValue,
			ContactType:    "adjustment",
		}
		if err := tx.Create(&glCredit).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GL Credit Entry"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Updated successfully"})
}

// DeleteAdjustment removes an adjustment
func (h *AdjustmentHandler) DeleteAdjustment(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")
	if err := db.Delete(&models.Adjustment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
