package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PerubahanModalItem struct {
	Nama  string  `json:"nama"`
	Nilai float64 `json:"nilai"`
}

type PerubahanModalResponse struct {
	Periode     string               `json:"periode"`
	ModalAwal   float64              `json:"modal_awal"`
	Penambahan  []PerubahanModalItem `json:"penambahan"`  // Laba Bersih, Setoran Modal
	Pengurangan []PerubahanModalItem `json:"pengurangan"` // Rugi Bersih, Prive
	ModalAkhir  float64              `json:"modal_akhir"`
}

// GetLaporanPerubahanModal handles report for Statement of Changes in Equity
func GetLaporanPerubahanModal(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		if startDate == "" || endDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "start_date dan end_date wajib diisi"})
			return
		}

		// 1. Hitung Modal Awal (Saldo akun Ekuitas sampai H-1 StartDate)
		// Ekuitas: Tipe 3.
		// Modal Awal = (Modal Saham + Laba Ditahan) per H-1.
		// Laba Tahun Berjalan biasanya belum di-close ke Laba Ditahan jika sistem realtime,
		// jadi kita harus hitung Laba Akumulasi dari awal masa sampai H-1.

		// Simplifikasi: Ambil semua akun Tipe 3 per H-1.
		// Prive (Debit) akan mengurangi Modal Awal jika ada saldo lalu.

		// Query saldo awal semua akun Tipe 3
		var modalAwal float64
		var akunEkuitas []models.MasterCOA
		db.Preload("MasterCategoryCOA").Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
			Where("master_category_coa.tipe_akun = '3'").
			Find(&akunEkuitas)

		// Tanggal H-1
		// Kita butuh fungsi helper getSaldo lagi... tapi private.
		// Reuse logic query manual saja biar aman.

		for _, akun := range akunEkuitas {
			// Skip akun Prive untuk Modal Awal? Tidak, Prive tahun lalu mengurangi modal awal.
			// Tapi Prive tahun berjalan masuk Pengurangan.
			// Asumsi: Prive ditutup akhir tahun.

			// Hitung saldo per H-1 (kumulatif)
			var debit, kredit float64
			db.Raw(`SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0) FROM gl 
					WHERE akun_transaksi = ? AND tanggal < ? AND deleted_at IS NULL`, akun.Kode, startDate).Row().Scan(&debit, &kredit)

			saldo := kredit - debit // Normal Kredit
			modalAwal += saldo
		}

		// Hitung Laba Bersih Periode Berjalan
		labaBersih := hitungLabaBersihModal(db, startDate, endDate)

		var penambahan []PerubahanModalItem
		var pengurangan []PerubahanModalItem

		if labaBersih >= 0 {
			penambahan = append(penambahan, PerubahanModalItem{Nama: "Laba Bersih Periode Berjalan", Nilai: labaBersih})
		} else {
			pengurangan = append(pengurangan, PerubahanModalItem{Nama: "Rugi Bersih Periode Berjalan", Nilai: -labaBersih})
		}

		// Cari Mutasi Modal & Prive Periode Ini
		// Mutasi akun Tipe 3 antara StartDate s/d EndDate
		for _, akun := range akunEkuitas {
			// Jika saldo akun ini berubah, masukkan ke penambahan/pengurangan
			var debit, kredit float64
			db.Raw(`SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0) FROM gl 
					WHERE akun_transaksi = ? AND tanggal >= ? AND tanggal <= ? AND deleted_at IS NULL`, akun.Kode, startDate, endDate).Row().Scan(&debit, &kredit)

			delta := kredit - debit // Kenaikan Modal

			if delta == 0 {
				continue
			}

			nama := strings.ToLower(akun.Nama)

			// Jika Prive (biasanya saldo debit, jadi delta negatif)
			if strings.Contains(nama, "prive") || strings.Contains(nama, "drawings") || delta < 0 {
				// Pengurangan
				pengurangan = append(pengurangan, PerubahanModalItem{Nama: akun.Nama, Nilai: -delta})
			} else {
				// Penambahan (Setoran Modal)
				penambahan = append(penambahan, PerubahanModalItem{Nama: akun.Nama, Nilai: delta})
			}
		}

		// Kalkulasi Modal Akhir
		totalPenambahan := 0.0
		for _, p := range penambahan {
			totalPenambahan += p.Nilai
		}

		totalPengurangan := 0.0
		for _, p := range pengurangan {
			totalPengurangan += p.Nilai
		}

		modalAkhir := modalAwal + totalPenambahan - totalPengurangan

		response := PerubahanModalResponse{
			Periode:     startDate + " s/d " + endDate,
			ModalAwal:   modalAwal,
			Penambahan:  penambahan,
			Pengurangan: pengurangan,
			ModalAkhir:  modalAkhir,
		}

		c.JSON(http.StatusOK, response)
	}
}

// Helper khusus untuk file ini (avoid name collision)
func hitungLabaBersihModal(db *gorm.DB, start, end string) float64 {
	var totalPendapatan, totalBeban float64

	// Pendapatan (Tipe 4)
	db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
			FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
			WHERE mcc.tipe_akun = '4' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, start, end).Scan(&totalPendapatan)

	// Beban (Tipe 5)
	db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0)
			FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
			WHERE mcc.tipe_akun = '5' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, start, end).Scan(&totalBeban)

	return totalPendapatan - totalBeban
}
