package handlers

import (
	"fmt"
	"project-akuntansi-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetMasterAsetTetap - Get all master aset tetap
func GetMasterAsetTetap(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data []models.MasterAsetTetap
		if err := db.Order("kode_aset ASC").Find(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Tambahkan akumulasi penyusutan dari histori
		type AsetTetapWithAkumulasi struct {
			models.MasterAsetTetap
			AkumulasiPenyusutan float64 `json:"akumulasiPenyusutan"`
			NilaiBuku           float64 `json:"nilaiBuku"`
		}

		result := make([]AsetTetapWithAkumulasi, 0)
		for _, aset := range data {
			// Hitung total akumulasi penyusutan dari histori yang sudah Posted
			var totalAkumulasi float64
			db.Model(&models.HistoriPenyusutan{}).
				Where("kode_aset = ? AND status_posting = ?", aset.KodeAset, "Posted").
				Select("COALESCE(SUM(nilai_penyusutan), 0)").
				Scan(&totalAkumulasi)

			nilaiBuku := aset.HargaPerolehan - totalAkumulasi
			if nilaiBuku < aset.NilaiResidu {
				nilaiBuku = aset.NilaiResidu
			}

			result = append(result, AsetTetapWithAkumulasi{
				MasterAsetTetap:     aset,
				AkumulasiPenyusutan: totalAkumulasi,
				NilaiBuku:           nilaiBuku,
			})
		}

		c.JSON(http.StatusOK, result)
	}
}

// GetMasterAsetTetapByID - Get master aset tetap by ID
func GetMasterAsetTetapByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var data models.MasterAsetTetap
		if err := db.First(&data, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
			return
		}
		c.JSON(http.StatusOK, data)
	}
}

// CreateMasterAsetTetap - Create new master aset tetap
func CreateMasterAsetTetap(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			KodeAset                string  `json:"kodeAset" binding:"required"`
			NamaAset                string  `json:"namaAset" binding:"required"`
			KategoriAset            string  `json:"kategoriAset"`
			TanggalPerolehan        string  `json:"tanggalPerolehan"`
			HargaPerolehan          float64 `json:"hargaPerolehan"`
			UmurEkonomis            int     `json:"umurEkonomis"`
			NilaiResidu             float64 `json:"nilaiResidu"`
			MetodePenyusutan        string  `json:"metodePenyusutan"`
			KodePembelian           string  `json:"kodePembelian"`
			NomorTransaksiPembelian string  `json:"nomorTransaksiPembelian"`
			TanggalMulaiPenyusutan  string  `json:"tanggalMulaiPenyusutan"`
			AkunAsetTetap           string  `json:"akunAsetTetap"`
			AkunAkumulasiPenyusutan string  `json:"akunAkumulasiPenyusutan"`
			AkunBebanPenyusutan     string  `json:"akunBebanPenyusutan"`
			AkunLawan               string  `json:"akunLawan"`
			Keterangan              string  `json:"keterangan"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Parse dates
		tanggalPerolehan, err := time.Parse("2006-01-02", req.TanggalPerolehan)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal perolehan tidak valid (gunakan YYYY-MM-DD)"})
			return
		}

		tanggalMulaiPenyusutan, err := time.Parse("2006-01-02", req.TanggalMulaiPenyusutan)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal mulai penyusutan tidak valid (gunakan YYYY-MM-DD)"})
			return
		}

		data := models.MasterAsetTetap{
			KodeAset:                req.KodeAset,
			NamaAset:                req.NamaAset,
			KategoriAset:            req.KategoriAset,
			TanggalPerolehan:        tanggalPerolehan,
			HargaPerolehan:          req.HargaPerolehan,
			UmurEkonomis:            req.UmurEkonomis,
			NilaiResidu:             req.NilaiResidu,
			MetodePenyusutan:        req.MetodePenyusutan,
			StatusPosting:           "Draft",
			KodePembelian:           req.KodePembelian,
			NomorTransaksiPembelian: req.NomorTransaksiPembelian,
			TanggalMulaiPenyusutan:  tanggalMulaiPenyusutan,
			AkunAsetTetap:           req.AkunAsetTetap,
			AkunAkumulasiPenyusutan: req.AkunAkumulasiPenyusutan,
			AkunBebanPenyusutan:     req.AkunBebanPenyusutan,
			AkunLawan:               req.AkunLawan,
			Keterangan:              req.Keterangan,
			Aktif:                   true,
		}

		// Check duplicate kode
		var existing models.MasterAsetTetap
		if err := db.Where("kode_aset = ?", data.KodeAset).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode aset sudah terdaftar"})
			return
		}

		if err := db.Create(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, data)
	}
}

// UpdateMasterAsetTetap - Update master aset tetap
func UpdateMasterAsetTetap(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var data models.MasterAsetTetap
		if err := db.First(&data, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
			return
		}

		var req struct {
			KodeAset                string  `json:"kodeAset"`
			NamaAset                string  `json:"namaAset"`
			KategoriAset            string  `json:"kategoriAset"`
			TanggalPerolehan        string  `json:"tanggalPerolehan"`
			HargaPerolehan          float64 `json:"hargaPerolehan"`
			UmurEkonomis            int     `json:"umurEkonomis"`
			NilaiResidu             float64 `json:"nilaiResidu"`
			MetodePenyusutan        string  `json:"metodePenyusutan"`
			KodePembelian           string  `json:"kodePembelian"`
			NomorTransaksiPembelian string  `json:"nomorTransaksiPembelian"`
			TanggalMulaiPenyusutan  string  `json:"tanggalMulaiPenyusutan"`
			AkunAsetTetap           string  `json:"akunAsetTetap"`
			AkunAkumulasiPenyusutan string  `json:"akunAkumulasiPenyusutan"`
			AkunBebanPenyusutan     string  `json:"akunBebanPenyusutan"`
			AkunLawan               string  `json:"akunLawan"`
			Keterangan              string  `json:"keterangan"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Parse dates if provided
		if req.TanggalPerolehan != "" {
			tanggalPerolehan, err := time.Parse("2006-01-02", req.TanggalPerolehan)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal perolehan tidak valid (gunakan YYYY-MM-DD)"})
				return
			}
			data.TanggalPerolehan = tanggalPerolehan
		}

		if req.TanggalMulaiPenyusutan != "" {
			tanggalMulaiPenyusutan, err := time.Parse("2006-01-02", req.TanggalMulaiPenyusutan)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal mulai penyusutan tidak valid (gunakan YYYY-MM-DD)"})
				return
			}
			data.TanggalMulaiPenyusutan = tanggalMulaiPenyusutan
		}

		// Check duplicate kode (excluding current record)
		if req.KodeAset != "" && req.KodeAset != data.KodeAset {
			var existing models.MasterAsetTetap
			if err := db.Where("kode_aset = ? AND id != ?", req.KodeAset, id).First(&existing).Error; err == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Kode aset sudah terdaftar"})
				return
			}
			data.KodeAset = req.KodeAset
		}

		// Update other fields
		if req.NamaAset != "" {
			data.NamaAset = req.NamaAset
		}
		if req.KategoriAset != "" {
			data.KategoriAset = req.KategoriAset
		}
		data.HargaPerolehan = req.HargaPerolehan
		data.UmurEkonomis = req.UmurEkonomis
		data.NilaiResidu = req.NilaiResidu
		if req.MetodePenyusutan != "" {
			data.MetodePenyusutan = req.MetodePenyusutan
		}
		if req.KodePembelian != "" {
			data.KodePembelian = req.KodePembelian
		}
		if req.NomorTransaksiPembelian != "" {
			data.NomorTransaksiPembelian = req.NomorTransaksiPembelian
		}
		if req.AkunAsetTetap != "" {
			data.AkunAsetTetap = req.AkunAsetTetap
		}
		if req.AkunAkumulasiPenyusutan != "" {
			data.AkunAkumulasiPenyusutan = req.AkunAkumulasiPenyusutan
		}
		if req.AkunBebanPenyusutan != "" {
			data.AkunBebanPenyusutan = req.AkunBebanPenyusutan
		}
		if req.AkunLawan != "" {
			data.AkunLawan = req.AkunLawan
		}
		if req.Keterangan != "" {
			data.Keterangan = req.Keterangan
		}

		if err := db.Save(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, data)
	}
}

// DeleteMasterAsetTetap - Delete master aset tetap
func DeleteMasterAsetTetap(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var data models.MasterAsetTetap
		if err := db.First(&data, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
			return
		}

		if err := db.Delete(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Data berhasil dihapus"})
	}
}
// AssetRegistrationItem represents pembelian item available for asset registration
type AssetRegistrationItem struct {
	PembelianID         uint    `json:"pembelianId"`
	NomorAPInvoice      string  `json:"nomorAPInvoice"`
	TanggalPembelian    string  `json:"tanggalPembelian"`
	DetailID            uint    `json:"detailId"`
	KodeItem            string  `json:"kodeItem"`
	NamaItem            string  `json:"namaItem"`
	Qty                 float64 `json:"qty"`
	Price               float64 `json:"price"`
	TotalPrice          float64 `json:"totalPrice"`
	SudahDiregister     bool    `json:"sudahDiregister"`
	KodePemasok         string  `json:"kodePemasok"`
	NamaPemasok         string  `json:"namaPemasok"`
}

// GetPembelianItemsForAssetRegistration - Get pembelian items that can be registered as assets
func GetPembelianItemsForAssetRegistration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pembelians []models.Pembelian
		
		// Get all pembelian with details and supplier preloaded
		if err := db.Preload("Details").Preload("Supplier").Find(&pembelians).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var items []AssetRegistrationItem

		for _, pembelian := range pembelians {
			for _, detail := range pembelian.Details {
				// Check if this item is marked as aset tetap in master_barang_jasa
				var barangJasa models.MasterBarangJasa
				if err := db.Where("kode = ?", detail.KodeItem).First(&barangJasa).Error; err != nil {
					continue // Skip if item not found
				}

				// Only include items marked as aset tetap
				if barangJasa.IsAsetTetap {
					// Check if already registered
					var existingAsset models.MasterAsetTetap
					isRegistered := db.Where("nomor_transaksi_pembelian = ? AND kode_pembelian = ?", 
						pembelian.NomorAPInvoice, detail.KodeItem).First(&existingAsset).Error == nil

					var kodePemasok, namaPemasok string
					if pembelian.Supplier != nil {
						kodePemasok = pembelian.Supplier.Kode
						namaPemasok = pembelian.Supplier.Nama
					}

					items = append(items, AssetRegistrationItem{
						PembelianID:      pembelian.ID,
						NomorAPInvoice:   pembelian.NomorAPInvoice,
						TanggalPembelian: pembelian.Tanggal.Format("2006-01-02"),
						DetailID:         detail.ID,
						KodeItem:         detail.KodeItem,
						NamaItem:         detail.NamaItem,
						Qty:              detail.Qty,
						Price:            detail.Price,
						TotalPrice:       detail.Amount,
						SudahDiregister:  isRegistered,
						KodePemasok:      kodePemasok,
						NamaPemasok:      namaPemasok,
					})
				}
			}
		}

			c.JSON(http.StatusOK, items)
	}
}

// GetDraftAssets - Get all assets with Draft status
func GetDraftAssets(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var assets []models.MasterAsetTetap
		if err := db.Where("status_posting = ?", "Draft").Order("kode_aset ASC").Find(&assets).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, assets)
	}
}

// PostAssetsToGL - Post selected assets to General Ledger
func PostAssetsToGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			AssetIDs []uint `json:"assetIds" binding:"required"`
		}
		
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start transaction
		tx := db.Begin()
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
			return
		}

		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var postedAssets []models.MasterAsetTetap
		
		for _, assetID := range request.AssetIDs {
			var asset models.MasterAsetTetap
			if err := tx.First(&asset, assetID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Asset ID %d not found", assetID)})
				return
			}

			// Verify status is Draft
			if asset.StatusPosting != "Draft" {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Asset %s is not in Draft status", asset.KodeAset)})
				return
			}

			// Determine kredit account
			var kreditAccount string
			var kreditDeskripsi string

			if asset.KodePembelian != "" {
				// Asset from purchase - get persediaan account
				var barangJasa models.MasterBarangJasa
				if err := tx.Where("kode = ?", asset.KodePembelian).First(&barangJasa).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Item %s not found", asset.KodePembelian)})
					return
				}
				kreditAccount = barangJasa.AkunPersediaan
				kreditDeskripsi = fmt.Sprintf("Posting Aset Tetap - %s (Transfer dari Persediaan)", asset.NamaAset)
			} else {
				// Direct input - use AkunLawan
				if asset.AkunLawan == "" {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Asset %s missing AkunLawan for posting", asset.KodeAset)})
					return
				}
				kreditAccount = asset.AkunLawan
				kreditDeskripsi = fmt.Sprintf("Posting Aset Tetap - %s", asset.NamaAset)
			}

			// Validate accounts exist
			if asset.AkunAsetTetap == "" || kreditAccount == "" {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Missing GL accounts for asset %s", asset.KodeAset)})
				return
			}

			// Generate nomor transaksi
			nomorTransaksi := fmt.Sprintf("POSTING-ASET-%s-%d", asset.KodeAset, time.Now().Unix())
			tanggalPosting := time.Now()

			// Create GL entry - Debit: Aset Tetap
			glDebit := models.GL{
				Tanggal:        tanggalPosting,
				AkunTransaksi:  asset.AkunAsetTetap,
				Deskripsi:      fmt.Sprintf("Posting Aset Tetap - %s", asset.NamaAset),
				Debit:          asset.HargaPerolehan,
				Kredit:         0,
				NomorTransaksi: nomorTransaksi,
			}
			if err := tx.Create(&glDebit).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create GL debit: %v", err)})
				return
			}

			// Create GL entry - Kredit: Persediaan or AkunLawan
			glKredit := models.GL{
				Tanggal:        tanggalPosting,
				AkunTransaksi:  kreditAccount,
				Deskripsi:      kreditDeskripsi,
				Debit:          0,
				Kredit:         asset.HargaPerolehan,
				NomorTransaksi: nomorTransaksi,
			}
			if err := tx.Create(&glKredit).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create GL kredit: %v", err)})
				return
			}

			// Update asset status to Posted
			asset.StatusPosting = "Posted"
			if err := tx.Save(&asset).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update asset status: %v", err)})
				return
			}

			postedAssets = append(postedAssets, asset)
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Successfully posted %d assets to GL", len(postedAssets)),
			"assets":  postedAssets,
		})
	}
}
// AssetDepreciationData represents data for calculating depreciation
type AssetDepreciationData struct {
	ID                      uint    `json:"id"`
	Periode                 string  `json:"periode"`
	KodeAset                string  `json:"kodeAset"`
	NamaAset                string  `json:"namaAset"`
	KategoriAset            string  `json:"kategoriAset"`
	TanggalPerolehan        string  `json:"tanggalPerolehan"`
	TanggalMulaiPenyusutan  string  `json:"tanggalMulaiPenyusutan"`
	HargaPerolehan          float64 `json:"hargaPerolehan"`
	NilaiResidu             float64 `json:"nilaiResidu"`
	UmurEkonomis            int     `json:"umurEkonomis"`
	MetodePenyusutan        string  `json:"metodePenyusutan"`
	AkunAsetTetap           string  `json:"akunAsetTetap"`
	AkunAkumulasiPenyusutan string  `json:"akunAkumulasiPenyusutan"`
	AkunBebanPenyusutan     string  `json:"akunBebanPenyusutan"`
	AkumulasiPenyusutan     float64 `json:"akumulasiPenyusutan"`
	NilaiBuku               float64 `json:"nilaiBuku"`
	PenyusutanBulanan       float64 `json:"penyusutanBulanan"`
	SudahDisusutkan         bool    `json:"sudahDisusutkan"`
}

// GetAssetsForDepreciation - Get assets eligible for depreciation calculation
func GetAssetsForDepreciation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tanggalMulai := c.Query("tanggalMulai")
		tanggalAkhir := c.Query("tanggalAkhir")
		
		if tanggalMulai == "" || tanggalAkhir == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tanggalMulai dan tanggalAkhir parameter required (format: YYYY-MM-DD)"})
			return
		}

startDate, err := time.Parse("2006-01-02", tanggalMulai)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tanggalMulai format, use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", tanggalAkhir)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tanggalAkhir format, use YYYY-MM-DD"})
		return
	}

	// Calculate number of months in the date range
	monthsDiff := (endDate.Year()-startDate.Year())*12 + int(endDate.Month()-startDate.Month()) + 1
	if monthsDiff < 1 {
		monthsDiff = 1
	}

	var assets []models.MasterAsetTetap
	if err := db.Where("status_posting = ?", "Posted").Order("kode_aset ASC").Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

		var result []AssetDepreciationData

		for _, asset := range assets {
			// Use TanggalPerolehan if TanggalMulaiPenyusutan is not set
			tanggalMulaiPenyusutan := asset.TanggalMulaiPenyusutan
			if tanggalMulaiPenyusutan.IsZero() {
				tanggalMulaiPenyusutan = asset.TanggalPerolehan
			}

			// Skip if tanggalMulaiPenyusutan is still zero
			if tanggalMulaiPenyusutan.IsZero() {
				continue
			}

			// Check if asset depreciation start date is before or equal to end date
			if endDate.Before(tanggalMulaiPenyusutan) {
				continue
			}

		// Generate one row for each month in the range
		currentMonth := time.Date(startDate.Year(), startDate.Month(), 1, 0, 0, 0, 0, time.UTC)
		endMonth := time.Date(endDate.Year(), endDate.Month(), 1, 0, 0, 0, 0, time.UTC)

		for currentMonth.Before(endMonth) || currentMonth.Equal(endMonth) {
			// Skip months before depreciation start date
			if currentMonth.Before(time.Date(tanggalMulaiPenyusutan.Year(), tanggalMulaiPenyusutan.Month(), 1, 0, 0, 0, 0, time.UTC)) {
				currentMonth = currentMonth.AddDate(0, 1, 0)
				continue
			}

		// Check if depreciation period exceeds economic life
		startDepreciationMonth := time.Date(tanggalMulaiPenyusutan.Year(), tanggalMulaiPenyusutan.Month(), 1, 0, 0, 0, 0, time.UTC)
		monthsElapsed := (currentMonth.Year()-startDepreciationMonth.Year())*12 + int(currentMonth.Month()-startDepreciationMonth.Month()) + 1
		
		if monthsElapsed > asset.UmurEkonomis {
			currentMonth = currentMonth.AddDate(0, 1, 0)
			continue
		}

	periode := currentMonth.Format("2006-01")

	// Get accumulated depreciation up to this month
	var totalAkumulasi float64
	db.Model(&models.HistoriPenyusutan{}).
		Where("kode_aset = ? AND status_posting = ? AND periode < ?", asset.KodeAset, "Posted", periode).
		Select("COALESCE(SUM(nilai_penyusutan), 0)").
		Scan(&totalAkumulasi)

	// Check if this month is already posted
	var count int64
	db.Model(&models.HistoriPenyusutan{}).
		Where("kode_aset = ? AND periode = ?", asset.KodeAset, periode).
		Count(&count)

	var penyusutanBulanan float64
	if asset.MetodePenyusutan == "Garis Lurus" {
		if asset.UmurEkonomis > 0 {
			penyusutanBulanan = (asset.HargaPerolehan - asset.NilaiResidu) / float64(asset.UmurEkonomis)
		}
	} else if asset.MetodePenyusutan == "Saldo Menurun" {
		nilaiBuku := asset.HargaPerolehan - totalAkumulasi
		if nilaiBuku > asset.NilaiResidu && asset.UmurEkonomis > 0 {
			penyusutanBulanan = nilaiBuku / float64(asset.UmurEkonomis)
		}
	}

	nilaiBuku := asset.HargaPerolehan - totalAkumulasi
	if nilaiBuku-penyusutanBulanan < asset.NilaiResidu {
		penyusutanBulanan = nilaiBuku - asset.NilaiResidu
	}

	if penyusutanBulanan <= 0 {
		currentMonth = currentMonth.AddDate(0, 1, 0)
		continue
	}

	// Format tanggalMulaiPenyusutan for display
	tanggalMulaiPenyusutanStr := ""
	if !tanggalMulaiPenyusutan.IsZero() {
		tanggalMulaiPenyusutanStr = tanggalMulaiPenyusutan.Format("2006-01-02")
	}

	result = append(result, AssetDepreciationData{
		ID:                      asset.ID,
		Periode:                 periode,
		KodeAset:                asset.KodeAset,
		NamaAset:                asset.NamaAset,
		KategoriAset:            asset.KategoriAset,
		TanggalPerolehan:        asset.TanggalPerolehan.Format("2006-01-02"),
		TanggalMulaiPenyusutan:  tanggalMulaiPenyusutanStr,
		HargaPerolehan:          asset.HargaPerolehan,
		NilaiResidu:             asset.NilaiResidu,
		UmurEkonomis:            asset.UmurEkonomis,
		MetodePenyusutan:        asset.MetodePenyusutan,
		AkunAsetTetap:           asset.AkunAsetTetap,
		AkunAkumulasiPenyusutan: asset.AkunAkumulasiPenyusutan,
		AkunBebanPenyusutan:     asset.AkunBebanPenyusutan,
		AkumulasiPenyusutan:     totalAkumulasi,
		NilaiBuku:               nilaiBuku,
		PenyusutanBulanan:       penyusutanBulanan,
		SudahDisusutkan:         count > 0,
	})

	currentMonth = currentMonth.AddDate(0, 1, 0)}
}

c.JSON(http.StatusOK, result)
}
}
// PostDepreciationToGL - Calculate and post depreciation to GL
func PostDepreciationToGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type AssetPeriode struct {
			ID      uint   `json:"id"`
			Periode string `json:"periode"`
		}
		var request struct {
			Assets []AssetPeriode `json:"assets" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tx := db.Begin()
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
			return
		}

		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var postedDepreciations []models.HistoriPenyusutan

		for _, assetData := range request.Assets {
			periodeDate, err := time.Parse("2006-01", assetData.Periode)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid periode format for asset ID %d. Use YYYY-MM", assetData.ID)})
				return
			}
			tanggalPenyusutan := time.Date(periodeDate.Year(), periodeDate.Month()+1, 0, 0, 0, 0, 0, time.UTC)

		var asset models.MasterAsetTetap
		if err := tx.First(&asset, assetData.ID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Asset ID %d not found", assetData.ID)})
			return
		}

		var existingCount int64
		tx.Model(&models.HistoriPenyusutan{}).
			Where("kode_aset = ? AND periode = ?", asset.KodeAset, assetData.Periode).
			Count(&existingCount)

		if existingCount > 0 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Asset %s already has depreciation posted for period %s", asset.KodeAset, assetData.Periode)})
			return
		}
		var totalAkumulasi float64
		tx.Model(&models.HistoriPenyusutan{}).
			Where("kode_aset = ? AND status_posting = ? AND periode < ?", asset.KodeAset, "Posted", assetData.Periode).
				Scan(&totalAkumulasi)

			var penyusutanBulanan float64
			if asset.MetodePenyusutan == "Garis Lurus" {
				if asset.UmurEkonomis > 0 {
					penyusutanBulanan = (asset.HargaPerolehan - asset.NilaiResidu) / float64(asset.UmurEkonomis)
				}
			} else if asset.MetodePenyusutan == "Saldo Menurun" {
				nilaiBuku := asset.HargaPerolehan - totalAkumulasi
				if nilaiBuku > asset.NilaiResidu && asset.UmurEkonomis > 0 {
					penyusutanBulanan = nilaiBuku / float64(asset.UmurEkonomis)
				}
			}

			nilaiBuku := asset.HargaPerolehan - totalAkumulasi
			if nilaiBuku-penyusutanBulanan < asset.NilaiResidu {
				penyusutanBulanan = nilaiBuku - asset.NilaiResidu
			}

			if penyusutanBulanan <= 0 {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Asset %s has no remaining depreciation", asset.KodeAset)})
				return
			}

		nomorTransaksi := fmt.Sprintf("DEP-%s-%s-%d", asset.KodeAset, assetData.Periode, time.Now().Unix())

		glDebit := models.GL{
			Tanggal:        tanggalPenyusutan,
			AkunTransaksi:  asset.AkunBebanPenyusutan,
			Deskripsi:      fmt.Sprintf("Penyusutan %s - %s", asset.NamaAset, assetData.Periode),
				Debit:          penyusutanBulanan,
				Kredit:         0,
				NomorTransaksi: nomorTransaksi,
			}
			if err := tx.Create(&glDebit).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create GL debit: %v", err)})
				return
			}

			glKredit := models.GL{
				Tanggal:        tanggalPenyusutan,
				AkunTransaksi:  asset.AkunAkumulasiPenyusutan,
			Deskripsi:      fmt.Sprintf("Akumulasi Penyusutan %s - %s", asset.NamaAset, assetData.Periode),
				Debit:          0,
				Kredit:         penyusutanBulanan,
				NomorTransaksi: nomorTransaksi,
			}
			if err := tx.Create(&glKredit).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create GL kredit: %v", err)})
				return
			}

			newAkumulasi := totalAkumulasi + penyusutanBulanan
			newNilaiBuku := asset.HargaPerolehan - newAkumulasi

			histori := models.HistoriPenyusutan{
				KodeAset:                asset.KodeAset,
				NamaAset:                asset.NamaAset,
			Periode:                 assetData.Periode,
			TanggalPenyusutan:       tanggalPenyusutan,
			NilaiPenyusutan:         penyusutanBulanan,
			AkumulasiPenyusutan:     newAkumulasi,
			NilaiBuku:               newNilaiBuku,
			AkunBebanPenyusutan:     asset.AkunBebanPenyusutan,
			AkunAkumulasiPenyusutan: asset.AkunAkumulasiPenyusutan,
			NomorTransaksi:          nomorTransaksi,
			StatusPosting:           "Posted",
			Keterangan:              fmt.Sprintf("Penyusutan periode %s menggunakan metode %s", assetData.Periode, asset.MetodePenyusutan),
			}

			if err := tx.Create(&histori).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create histori penyusutan: %v", err)})
				return
			}
			postedDepreciations = append(postedDepreciations, histori)
		}

		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Successfully posted depreciation for %d asset periods", len(postedDepreciations)),
		"depreciations": postedDepreciations,
	})
}
}

// JualAsetTetap - Handle asset disposal/sale
func JualAsetTetap(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		var req struct {
			TanggalPenjualan      string  `json:"tanggalPenjualan" binding:"required"`
			HargaJual             float64 `json:"hargaJual" binding:"required"`
			AkunKas               string  `json:"akunKas" binding:"required"`
			AkunLabaRugiPenjualan string  `json:"akunLabaRugiPenjualan" binding:"required"`
			KeteranganPenjualan   string  `json:"keteranganPenjualan"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tanggalPenjualan, err := time.Parse("2006-01-02", req.TanggalPenjualan)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid"})
			return
		}

		tx := db.Begin()

		// Get asset
		var asset models.MasterAsetTetap
		if err := tx.First(&asset, id).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Aset tidak ditemukan"})
			return
		}

		// Check if already disposed
		if asset.StatusPosting == "Disposed" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Aset sudah dijual sebelumnya"})
			return
		}

		// Hitung akumulasi penyusutan dari histori yang sudah Posted
		var totalAkumulasi float64
		tx.Model(&models.HistoriPenyusutan{}).
			Where("kode_aset = ? AND status_posting = ?", asset.KodeAset, "Posted").
			Select("COALESCE(SUM(nilai_penyusutan), 0)").
			Scan(&totalAkumulasi)

		nilaiBuku := asset.HargaPerolehan - totalAkumulasi
		if nilaiBuku < asset.NilaiResidu {
			nilaiBuku = asset.NilaiResidu
		}

		labaRugi := req.HargaJual - nilaiBuku

		// Generate nomor transaksi
		var count int64
		tx.Model(&models.GL{}).Where("DATE(tanggal) = ?", tanggalPenjualan.Format("2006-01-02")).Count(&count)
		nomorTransaksi := fmt.Sprintf("JUAL-ASET-%s-%d", tanggalPenjualan.Format("20060102"), count+1)

		// Posting ke GL
		// 1. Debit Kas (Harga Jual)
		gl1 := models.GL{
			Tanggal:        tanggalPenjualan,
			NomorTransaksi: nomorTransaksi,
			AkunTransaksi:  req.AkunKas,
			Debit:          req.HargaJual,
			Kredit:         0,
			Deskripsi:      fmt.Sprintf("Penjualan Aset %s - %s", asset.KodeAset, asset.NamaAset),
		}
		if err := tx.Create(&gl1).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal posting ke GL (Kas)"})
			return
		}

		// 2. Debit Akumulasi Penyusutan
		gl2 := models.GL{
			Tanggal:        tanggalPenjualan,
			NomorTransaksi: nomorTransaksi,
			AkunTransaksi:  asset.AkunAkumulasiPenyusutan,
			Debit:          totalAkumulasi,
			Kredit:         0,
			Deskripsi:      fmt.Sprintf("Penjualan Aset %s - Akumulasi Penyusutan", asset.KodeAset),
		}
		if err := tx.Create(&gl2).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal posting ke GL (Akumulasi)"})
			return
		}

		// 3. Kredit Aset Tetap (Harga Perolehan)
		gl3 := models.GL{
			Tanggal:        tanggalPenjualan,
			NomorTransaksi: nomorTransaksi,
			AkunTransaksi:  asset.AkunAsetTetap,
			Debit:          0,
			Kredit:         asset.HargaPerolehan,
			Deskripsi:      fmt.Sprintf("Penjualan Aset %s - Harga Perolehan", asset.KodeAset),
		}
		if err := tx.Create(&gl3).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal posting ke GL (Aset)"})
			return
		}

		// 4. Laba/Rugi Penjualan
		gl4 := models.GL{
			Tanggal:        tanggalPenjualan,
			NomorTransaksi: nomorTransaksi,
			AkunTransaksi:  req.AkunLabaRugiPenjualan,
			Debit:          0,
			Kredit:         0,
			Deskripsi:      fmt.Sprintf("Penjualan Aset %s - %s", asset.KodeAset, map[bool]string{true: "Laba", false: "Rugi"}[labaRugi >= 0]),
		}
		if labaRugi >= 0 {
			// Laba = Kredit
			gl4.Kredit = labaRugi
		} else {
			// Rugi = Debit
			gl4.Debit = -labaRugi
		}
		if err := tx.Create(&gl4).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal posting ke GL (Laba/Rugi)"})
			return
		}

		// Update asset status
		asset.StatusPosting = "Disposed"
		asset.TanggalPenjualan = &tanggalPenjualan
		asset.HargaJual = req.HargaJual
		asset.NilaiBukuSaatDijual = nilaiBuku
		asset.LabaRugiPenjualan = labaRugi
		asset.AkunKas = req.AkunKas
		asset.AkunLabaRugiPenjualan = req.AkunLabaRugiPenjualan
		asset.KeteranganPenjualan = req.KeteranganPenjualan

		if err := tx.Save(&asset).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status aset"})
			return
		}

		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal commit transaksi"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":           "Aset berhasil dijual dan diposting ke GL",
			"nomorTransaksi":    nomorTransaksi,
			"nilaiBuku":         nilaiBuku,
			"hargaJual":         req.HargaJual,
			"labaRugiPenjualan": labaRugi,
			"status":            map[bool]string{true: "Laba", false: "Rugi"}[labaRugi >= 0],
		})
	}
}

// GetAssetsForDepreciation - Get assets eligible for depreciation calculation
