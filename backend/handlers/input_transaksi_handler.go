package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET generate nomor transaksi otomatis
func GetGenerateNoTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		// Ambil parameter dari query string
		kodeBankStr := c.Query("kodeBank")
		userIDStr := c.Query("userID")
		tanggalStr := c.Query("tanggal") // format YYYY-MM-DD

		if kodeBankStr == "" || userIDStr == "" || tanggalStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter kodeBank, userID, dan tanggal diperlukan"})
			return
		}

		// Parse tanggal
		tanggal, err := time.Parse("2006-01-02", tanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid (YYYY-MM-DD)"})
			return
		}

		// Format tanggal ke ddmmyy
		ddmmyy := tanggal.Format("020106")

		// Parse userID
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "UserID harus berupa angka"})
			return
		}

		// Format userID menjadi 2 digit dengan leading zero
		userIDFormatted := fmt.Sprintf("%02d", userID)
		pattern := fmt.Sprintf("%s/%s/%s-", kodeBankStr, ddmmyy, userIDFormatted)

		// Cari max nomor urut yang sudah ada (ambil 4 digit terakhir setelah '-')
		var maxUrut int64 = 0
		var results []struct{ NoTransaksi string }
		if err := db.Model(&models.InputTransaksi{}).
			Where("no_transaksi LIKE ?", pattern+"%").Select("no_transaksi").Find(&results).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		for _, r := range results {
			no := r.NoTransaksi
			if len(no) >= 5 {
				// Ambil 4 digit terakhir setelah '-'
				dashIdx := len(no) - 5
				if dashIdx >= 0 && no[dashIdx] == '-' {
					urutStr := no[dashIdx+1:]
					if urut, err := strconv.ParseInt(urutStr, 10, 64); err == nil {
						if urut > maxUrut {
							maxUrut = urut
						}
					}
				}
			}
		}

		nomorUrut := maxUrut + 1
		nomorUrutFormatted := fmt.Sprintf("%04d", nomorUrut)
		noTransaksi := fmt.Sprintf("%s/%s/%s-%s", kodeBankStr, ddmmyy, userIDFormatted, nomorUrutFormatted)
		c.JSON(http.StatusOK, gin.H{"noTransaksi": noTransaksi})
	}
}

// GET all input transaksi
func GetInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		coaAkunBank := c.Query("coaAkunBank")

		// ✅ ENHANCED: Debug logging
		fmt.Printf("========== DEBUG INPUT TRANSAKSI ==========\n")
		fmt.Printf("[DEBUG] Received parameter: '%s'\n", coaAkunBank)
		fmt.Printf("[DEBUG] Parameter length: %d\n", len(coaAkunBank))

		var transaksi []models.InputTransaksi

		query := db.Debug().Order("tanggal ASC, id ASC")
		if coaAkunBank != "" {
			fmt.Printf("[DEBUG] Adding WHERE clause: coa_akun_bank = '%s'\n", coaAkunBank)
			query = query.Where("coa_akun_bank = ?", coaAkunBank)
		} else {
			fmt.Printf("[DEBUG] No filter applied - returning all records\n")
		}

		if err := query.Find(&transaksi).Error; err != nil {
			fmt.Printf("[ERROR] Database query failed: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transaksi"})
			return
		}

		fmt.Printf("[DEBUG] Found %d records after filtering\n", len(transaksi))

		// ✅ ENHANCED: Debug each record's coa_akun_bank field
		for i, t := range transaksi {
			if i < 5 { // Log first 5 records
				fmt.Printf("[DEBUG] Record %d: ID=%d, CoaAkunBank='%s', NoTransaksi='%s'\n",
					i+1, t.ID, t.CoaAkunBank, t.NoTransaksi)
			}
		}

		fmt.Printf("==========================================\n")

		c.JSON(http.StatusOK, transaksi)
	}
}

// POST input transaksi
func PostInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		var input models.InputTransaksi
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// ✅ LOG AUDIT TRAIL
		LogAuditTrail(db, c, "input_transaksi", input.ID, "CREATE",
			fmt.Sprintf("Transaksi %s dibuat: Debit=%f, Kredit=%f", input.NoTransaksi, input.Debit, input.Kredit))

		// --- Tambahan: Simpan ke tabel GL ---
		// Ambil kategori COA dari AkunTransaksi
		var coa models.MasterCOA
		if err := db.Preload("MasterCategoryCOA").Where("kode = ?", input.AkunTransaksi).First(&coa).Error; err != nil {
			fmt.Printf("[ERROR] PostInputTransaksi: Gagal mengambil data COA untuk akun %s: %v\n", input.AkunTransaksi, err)
		} else {
			tipeAkun := coa.MasterCategoryCOA.TipeAkun
			fmt.Printf("[DEBUG] PostInputTransaksi: tipeAkun untuk akun %s adalah %s\n", input.AkunTransaksi, tipeAkun)

			nomorJurnal, err := GenerateNomorJurnal(db, input.Tanggal.Time)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate nomor jurnal"})
				return
			}

			if tipeAkun == "1" {

				var coaLawan models.MasterCOA
				isKasBank := false
				if err := db.Preload("MasterCategoryCOA").Where("kode = ?", input.AkunTransaksi).First(&coaLawan).Error; err == nil {
					isKasBank = coaLawan.MasterCategoryCOA.IsKasBank
				}

				if isKasBank {
					var transaksiLawan models.InputTransaksi
					// Cari transaksi lain yang nomor transaksinya sama dengan deskripsi transaksi ini
					if err := db.Where("no_transaksi = ?", input.Deskripsi).First(&transaksiLawan).Error; err == nil {
						// Jika ditemukan, artinya ini transaksi tukar lawan, JANGAN insert ke GL
						c.JSON(http.StatusOK, input)
						return
					}
				}

				fmt.Printf("[DEBUG] PostInputTransaksi: isKasBank untuk akun %s adalah %t  %s %s \n", input.AkunTransaksi, isKasBank, input.Deskripsi, input.NoTransaksi)

				// Transaksi normal: Akun Transaksi di Debit, COA Akun Bank di Kredit
				if input.Debit > 0 {
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Debit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl1).Error; err != nil {
						fmt.Printf("[ERROR] GL1 Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL1 ID: %d, NoTransaksi: %s\n", gl1.ID, gl1.NomorTransaksi)
					}
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Debit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl2).Error; err != nil {
						fmt.Printf("[ERROR] GL2 Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL2 ID: %d, NoTransaksi: %s\n", gl2.ID, gl2.NomorTransaksi)
					}
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
				// Transaksi tukar: COA Akun Bank di Debit, Akun Transaksi di Kredit
				if input.Kredit > 0 {

					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Kredit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl1).Error; err != nil {
						fmt.Printf("[ERROR] GL1 (Credit) Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL1 (Credit) ID: %d, NoTransaksi: %s\n", gl1.ID, gl1.NomorTransaksi)
					}
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Kredit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl2).Error; err != nil {
						fmt.Printf("[ERROR] GL2 (Credit) Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL2 (Credit) ID: %d, NoTransaksi: %s\n", gl2.ID, gl2.NomorTransaksi)
					}
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)

				}
			} else if tipeAkun == "2" || tipeAkun == "3" {
				// Untuk Liability (2) dan Equity (3):
				// Kredit > 0: Uang masuk ke Kas (Debit), bertambahnya Hutang/Modal (Kredit)
				if input.Kredit > 0 {
					// GL1: Kas DEBIT (uang masuk)
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Kredit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl1)
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					// GL2: Hutang/Modal KREDIT (bertambah)
					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Kredit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl2)
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
				if input.Debit > 0 {
					// Pembayaran hutang: Hutang DEBIT, Kas KREDIT
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Debit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl1)
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Debit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl2)
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
			} else if tipeAkun == "4" {
				// Untuk Pendapatan (TipeAkun 4):
				// Kredit > 0: Uang masuk → Kas DEBIT, Pendapatan KREDIT
				if input.Kredit > 0 {
					// GL1: Kas DEBIT (uang masuk)
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Kredit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl1)
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					// GL2: Pendapatan KREDIT (bertambah)
					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Kredit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl2)
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
				// Debit > 0: Retur penjualan → Pendapatan DEBIT, Kas KREDIT
				if input.Debit > 0 {
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Debit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl1)
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Debit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl2)
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
			} else if tipeAkun == "5" || tipeAkun == "6" || tipeAkun == "7" || tipeAkun == "8" {
				// Untuk tipe 5,6,7,8: Akun Transaksi di Debit, COA Akun Bank di Kredit
				if input.Debit > 0 {
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Debit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl1)
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Debit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					db.Create(&gl2)
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
				if input.Kredit > 0 {
					gl1 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.AkunTransaksi,
						Deskripsi:      input.Deskripsi,
						Debit:          input.Kredit,
						Kredit:         0,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl1).Error; err != nil {
						fmt.Printf("[ERROR] GL1 (Credit) Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL1 (Credit) ID: %d, NoTransaksi: %s\n", gl1.ID, gl1.NomorTransaksi)
					}
					syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

					gl2 := models.GL{
						Tanggal:        input.Tanggal.Time,
						COAAkunBank:    input.CoaAkunBank,
						AkunTransaksi:  input.CoaAkunBank,
						Deskripsi:      input.Deskripsi,
						Debit:          0,
						Kredit:         input.Kredit,
						NomorTransaksi: input.NoTransaksi,
						NomorJurnal:    nomorJurnal,
						ProjectNo:      input.ProjectNo,
						ProjectName:    input.ProjectName,
					}
					if err := db.Create(&gl2).Error; err != nil {
						fmt.Printf("[ERROR] GL2 (Credit) Creation Failed: %v\n", err)
					} else {
						fmt.Printf("[DEBUG] Created GL2 (Credit) ID: %d, NoTransaksi: %s\n", gl2.ID, gl2.NomorTransaksi)
					}
					syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
				}
			} else {
				fmt.Printf("[WARNING] PostInputTransaksi: Tipe akun %s tidak ditangani oleh logic GL generation\n", tipeAkun)
			}
		}

		c.JSON(http.StatusOK, input)
	}
}

// PUT (edit) input transaksi
func UpdateInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		id := c.Param("id")
		var input models.InputTransaksi
		if err := db.First(&input, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data not found"})
			return
		}

		// Store old data for audit
		oldData := input

		var req models.InputTransaksi
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Hapus GL lama
		var gls []models.GL
		db.Where("nomor_transaksi = ?", input.NoTransaksi).Find(&gls)
		for _, gl := range gls {
			syncGLSummary(db, gl.AkunTransaksi, gl.Tanggal, -gl.Debit, -gl.Kredit)
		}
		db.Unscoped().Where("nomor_transaksi = ?", input.NoTransaksi).Delete(&models.GL{})

		// Update input transaksi (jangan di-delete!)
		if err := db.Model(&input).Select("no_transaksi", "coa_akun_bank", "tanggal", "akun_transaksi", "deskripsi", "project_no", "project_name", "debit", "kredit").Updates(req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// ✅ LOG AUDIT TRAIL
		LogAuditTrail(db, c, "input_transaksi", input.ID, "UPDATE",
			GenerateChangeDescription("UPDATE", oldData, req))

		// Insert ulang ke GL sesuai data terbaru
		var updated models.InputTransaksi
		if err := db.First(&updated, id).Error; err == nil {
			var coa models.MasterCOA
			if err := db.Preload("MasterCategoryCOA").Where("kode = ?", updated.AkunTransaksi).First(&coa).Error; err != nil {
				fmt.Printf("[ERROR] UpdateInputTransaksi: Gagal mengambil data COA untuk akun %s: %v\n", updated.AkunTransaksi, err)
			} else {
				tipeAkun := coa.MasterCategoryCOA.TipeAkun

				nomorJurnal, err := GenerateNomorJurnal(db, updated.Tanggal.Time)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate nomor jurnal"})
					return
				}

				// Copy logic dari PostInputTransaksi
				if tipeAkun == "1" {
					var coaLawan models.MasterCOA
					isKasBank := false
					if err := db.Preload("MasterCategoryCOA").Where("kode = ?", updated.AkunTransaksi).First(&coaLawan).Error; err == nil {
						isKasBank = coaLawan.MasterCategoryCOA.IsKasBank
					}

					if isKasBank && updated.Deskripsi == updated.NoTransaksi {
						// Ini transaksi tukar lawan, JANGAN insert ke GL
						c.JSON(http.StatusOK, updated)
						return
					}

					if updated.Debit > 0 {
						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Debit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Debit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
					}
					if updated.Kredit > 0 {

						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Kredit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Kredit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)

					}
				} else if tipeAkun == "2" || tipeAkun == "3" || tipeAkun == "4" {
					if updated.Kredit > 0 {
						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Kredit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Kredit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
					}
					if updated.Debit > 0 {
						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Debit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Debit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
					}
				} else if tipeAkun == "5" || tipeAkun == "6" || tipeAkun == "7" || tipeAkun == "8" {
					if updated.Debit > 0 {
						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Debit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Debit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
					}
					if updated.Kredit > 0 {
						gl1 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.AkunTransaksi,
							Deskripsi:      updated.Deskripsi,
							Debit:          updated.Kredit,
							Kredit:         0,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl1)
						syncGLSummary(db, gl1.AkunTransaksi, gl1.Tanggal, gl1.Debit, gl1.Kredit)

						gl2 := models.GL{
							Tanggal:        updated.Tanggal.Time,
							COAAkunBank:    updated.CoaAkunBank,
							AkunTransaksi:  updated.CoaAkunBank,
							Deskripsi:      updated.Deskripsi,
							Debit:          0,
							Kredit:         updated.Kredit,
							NomorTransaksi: updated.NoTransaksi,
							NomorJurnal:    nomorJurnal,
							ProjectNo:      updated.ProjectNo,
							ProjectName:    updated.ProjectName}
						db.Create(&gl2)
						syncGLSummary(db, gl2.AkunTransaksi, gl2.Tanggal, gl2.Debit, gl2.Kredit)
					}
				} else {
					fmt.Printf("[WARNING] UpdateInputTransaksi: Tipe akun %s tidak ditangani oleh logic GL generation\n", tipeAkun)
				}
			}
		}
		c.JSON(http.StatusOK, input)
	}
}

// DELETE input transaksi
func DeleteInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		id := c.Param("id")
		var input models.InputTransaksi
		if err := db.First(&input, id).Error; err == nil {
			// ✅ LOG AUDIT TRAIL sebelum delete
			LogAuditTrail(db, c, "input_transaksi", input.ID, "DELETE",
				fmt.Sprintf("Transaksi %s dihapus: Debit=%f, Kredit=%f", input.NoTransaksi, input.Debit, input.Kredit))

			// Ambil semua GL terkait (termasuk yang sudah di-soft delete)
			var gls []models.GL
			db.Unscoped().Where("nomor_transaksi = ?", input.NoTransaksi).Find(&gls)
			// Kurangi summary sebelum hapus GL
			for _, gl := range gls {
				syncGLSummary(db, gl.AkunTransaksi, gl.Tanggal, -gl.Debit, -gl.Kredit)
			}
			// Hard delete GL
			db.Unscoped().Where("nomor_transaksi = ?", input.NoTransaksi).Delete(&models.GL{})
		}
		// Hard delete InputTransaksi
		if err := db.Unscoped().Delete(&models.InputTransaksi{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
	}
}

func syncGLSummary(db *gorm.DB, akun string, tanggal time.Time, debitDelta, kreditDelta float64) {
	tahun := tanggal.Year()
	bulan := int(tanggal.Month())
	var summary models.GLSummary
	err := db.Where("akun_transaksi = ? AND tahun = ? AND bulan = ?", akun, tahun, bulan).First(&summary).Error

	if err == nil {
		fmt.Printf("[DEBUG] syncGLSummary: Updating existing summary for Akun=%s, Tahun=%d, Bulan=%d\n", akun, tahun, bulan)
		fmt.Printf("[DEBUG] syncGLSummary: Found summary: %+v, Error: %v\n", summary, err)
		fmt.Printf("[DEBUG] syncGLSummary: Akun=%s, Tahun=%d, Bulan=%d, DebitDelta=%.2f, KreditDelta=%.2f\n", akun, tahun, bulan, debitDelta, kreditDelta)
		db.Model(&summary).Updates(map[string]interface{}{
			"total_debit":  summary.TotalDebit + debitDelta,
			"total_kredit": summary.TotalKredit + kreditDelta,
		})
	} else if err == gorm.ErrRecordNotFound {
		db.Create(&models.GLSummary{
			AkunTransaksi: akun,
			Tahun:         tahun,
			Bulan:         bulan,
			TotalDebit:    debitDelta,
			TotalKredit:   kreditDelta,
		})
	}
}
