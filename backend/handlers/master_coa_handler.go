package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/master-coa
func GetMasterCOA(fallbackDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB) // Dynamic DB from Middleware
		var coas []models.MasterCOA
		// Gunakan Preload agar relasi masterCategoryCOA ikut diambil
		if err := db.Preload("MasterCategoryCOA").Find(&coas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, coas)
	}
}

// Struct untuk request body yang mencakup field tambahan (tidak disimpan di tabel master_coa tapi untuk trigger jurnal)
type MasterCOARequest struct {
	models.MasterCOA
	TanggalSaldoAwal  string `json:"tanggalSaldoAwal"`
	ContraAccountKode string `json:"contraAccountKode"`
}

// Helper untuk membuat jurnal saldo awal
func createOpeningBalanceJournal(db *gorm.DB, coa models.MasterCOA, tanggal string, contraKode string) error {
	// Jika saldo awal 0 atau tidak ada tanggal/contra, skip
	if coa.SaldoAwal == 0 || tanggal == "" || contraKode == "" {
		return nil // No action needed
	}

	// Hapus jurnal saldo awal lama jika ada (berdasarkan nomor transaksi unik)
	// Format Nomor Transaksi: OPBAL/[KODE_AKUN]
	trxNo := fmt.Sprintf("OPBAL/%s", coa.Kode)
	if err := db.Where("nomor_transaksi = ?", trxNo).Delete(&models.GL{}).Error; err != nil {
		return err
	}

	// Ambil Tipe Akun untuk menentukan Debit/Kredit
	var category models.MasterCategoryCOA
	if err := db.First(&category, coa.MasterCategoryCOAID).Error; err != nil {
		return err
	}

	// Tentukan Normal Balance
	// 1=Asset, 5=HPP, 6=Beban, 8=Beban Lain -> Normal Debit
	// 2=Kewajiban, 3=Modal, 4=Pendapatan, 7=Pendapatan Lain -> Normal Kredit
	isNormalDebit := category.TipeAkun == "1" || category.TipeAkun == "5" || category.TipeAkun == "6" || category.TipeAkun == "8"

	var debetAccount, creditAccount string
	var amount float64 = coa.SaldoAwal

	// Jika saldo awal negatif, balik logika (jarang terjadi tapi mungkin)
	if amount < 0 {
		isNormalDebit = !isNormalDebit
		amount = -amount
	}

	if isNormalDebit {
		// Saldo Normal Debit: Debit Akun Ini, Kredit Penyeimbang
		debetAccount = coa.Kode
		creditAccount = contraKode
	} else {
		// Saldo Normal Kredit: Kredit Akun Ini, Debit Penyeimbang
		debetAccount = contraKode
		creditAccount = coa.Kode
	}

	// Buat Jurnal Debit
	glDebit := models.GL{
		Tanggal:        parseDateString(tanggal), // Updated function name
		NomorTransaksi: trxNo,
		AkunTransaksi:  debetAccount,
		Deskripsi:      fmt.Sprintf("Saldo Awal - %s", coa.Nama),
		Debit:          amount,
		Kredit:         0,
	}

	// Buat Jurnal Kredit
	glCredit := models.GL{
		Tanggal:        parseDateString(tanggal), // Updated function name
		NomorTransaksi: trxNo,
		AkunTransaksi:  creditAccount,
		Deskripsi:      fmt.Sprintf("Saldo Awal - %s (Contra)", coa.Nama),
		Debit:          0,
		Kredit:         amount,
	}

	// Simpan via Transaction
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&glDebit).Error; err != nil {
			return err
		}
		if err := tx.Create(&glCredit).Error; err != nil {
			return err
		}
		return nil
	})
}

// Simple date parser helper
func parseDateString(dateStr string) time.Time {
	t, _ := time.Parse("2006-01-02", dateStr)
	return t
}

// POST /api/master-coa
func PostMasterCOA(fallbackDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB) // Dynamic DB from Middleware

		var req MasterCOARequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		coa := req.MasterCOA // Extract embedded model

		// Validasi kode tidak boleh kosong
		if coa.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode
		var existing models.MasterCOA
		if err := db.Where("kode = ?", coa.Kode).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		if err := db.Where("nama = ?", coa.Nama).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nama sudah digunakan"})
			return
		}

		// Gunakan Transaction agar aman
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&coa).Error; err != nil {
				return err
			}
			// Trigger Jurnal Saldo Awal
			if req.TanggalSaldoAwal != "" && req.ContraAccountKode != "" {
				if err := createOpeningBalanceJournal(tx, coa, req.TanggalSaldoAwal, req.ContraAccountKode); err != nil {
					return err
				}
			}
			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, coa)
	}
}

// PUT /api/master-coa/:id
func UpdateMasterCOA(fallbackDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB) // Dynamic DB from Middleware
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		var req MasterCOARequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input := req.MasterCOA

		var coa models.MasterCOA
		if err := db.First(&coa, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "COA not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		// Cek apakah COA sudah digunakan di input transaksi
		var transaksiCount int64
		if err := db.Model(&models.InputTransaksi{}).Where("coa_akun_bank = ? OR akun_transaksi = ?", coa.Kode, coa.Kode).Count(&transaksiCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if transaksiCount > 0 {
			// Jika sudah digunakan, validasi perubahan kritikal
			// NOTE: Kita bolehlah update saldo awal asalkan jurnalnya juga diupdate, tapi warning ini ada di kode lama
			// Saya perbolehkan update saldo awal jika user memaksa via form baru ini
			if input.Kode != coa.Kode || input.Nama != coa.Nama || input.MasterCategoryCOAID != coa.MasterCategoryCOAID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Kode, Nama, dan Kategori tidak dapat diubah karena akun sudah digunakan transaksi."})
				return
			}
		}

		// Validasi kode tidak boleh kosong
		if input.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode
		var existing models.MasterCOA
		if err := db.Where("kode = ? AND id != ?", input.Kode, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Update Data
		err := db.Transaction(func(tx *gorm.DB) error {
			coa.Kode = input.Kode
			coa.Nama = input.Nama
			coa.MasterCategoryCOAID = input.MasterCategoryCOAID
			coa.SaldoAwal = input.SaldoAwal
			coa.CashflowActivity = input.CashflowActivity
			coa.CashflowDirection = input.CashflowDirection

			if err := tx.Save(&coa).Error; err != nil {
				return err
			}

			// Update Jurnal Saldo Awal jika ada parameter baru
			if req.TanggalSaldoAwal != "" && req.ContraAccountKode != "" {
				if err := createOpeningBalanceJournal(tx, coa, req.TanggalSaldoAwal, req.ContraAccountKode); err != nil {
					return err
				}
			}
			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, coa)
	}
}

// DELETE /api/master-coa/:id
func DeleteMasterCOA(fallbackDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB) // Dynamic DB from Middleware
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		// Cek apakah record ada
		var coa models.MasterCOA
		if err := db.First(&coa, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "COA not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		// Cek apakah COA sudah digunakan di input transaksi (berdasarkan kode COA)
		var transaksiCount int64
		if err := db.Model(&models.InputTransaksi{}).Where("coa_akun_bank = ? OR akun_transaksi = ?", coa.Kode, coa.Kode).Count(&transaksiCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if transaksiCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "COA tidak dapat dihapus karena sudah digunakan di transaksi"})
			return
		}

		// Hapus juga jurnal saldo awal jika ada
		trxNo := fmt.Sprintf("OPBAL/%s", coa.Kode)
		if err := db.Where("nomor_transaksi = ?", trxNo).Delete(&models.GL{}).Error; err != nil {
			fmt.Printf("Warning: Failed to delete opening balance journal: %v\n", err)
			// Not blocking delete
		}

		if err := db.Delete(&models.MasterCOA{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "COA deleted successfully"})
	}
}

// GET /api/coa-kas-bank
func GetCOAKasBank(fallbackDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB) // Dynamic DB from Middleware
		var coas []models.MasterCOA
		// Preload relasi dan filter kategori yang isKasBank = true
		if err := db.Preload("MasterCategoryCOA").
			Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
			Where("master_category_coa.is_kas_bank = ?", true).
			Find(&coas).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, coas)
	}
}
