package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"sort"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetLaporanLabaRugi returns Laporan Laba Rugi (Income Statement)
// GET /api/laporan/laba-rugi?start_date=2024-01-01&end_date=2024-12-31
func GetLaporanLabaRugi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		if startDate == "" || endDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "start_date dan end_date wajib diisi"})
			return
		}

		// Query Pendapatan (TipeAkun = '4') - Kredit - Debit
		var pendapatan []models.AkunSaldo
		db.Raw(`
			SELECT 
				mcc.kode AS kategori_kode,
				mcc.nama AS kategori_nama,
				mc.kode AS akun_kode,
				mc.nama AS akun_nama,
				COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) AS saldo
			FROM master_coa mc
			JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
			LEFT JOIN gl ON gl.akun_transaksi = mc.kode 
				AND gl.tanggal >= ? AND gl.tanggal <= ?
				AND gl.deleted_at IS NULL
			WHERE mcc.tipe_akun = '4'
			GROUP BY mcc.kode, mcc.nama, mc.kode, mc.nama
			HAVING COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) != 0
			ORDER BY mc.kode
		`, startDate, endDate).Scan(&pendapatan)

		// Query Beban (TipeAkun = '5') - Debit - Kredit
		var beban []models.AkunSaldo
		db.Raw(`
			SELECT 
				mcc.kode AS kategori_kode,
				mcc.nama AS kategori_nama,
				mc.kode AS akun_kode,
				mc.nama AS akun_nama,
				COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) AS saldo
			FROM master_coa mc
			JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
			LEFT JOIN gl ON gl.akun_transaksi = mc.kode 
				AND gl.tanggal >= ? AND gl.tanggal <= ?
				AND gl.deleted_at IS NULL
			WHERE mcc.tipe_akun = '5'
			GROUP BY mcc.kode, mcc.nama, mc.kode, mc.nama
			HAVING COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) != 0
			ORDER BY mc.kode
		`, startDate, endDate).Scan(&beban)

		// Group by kategori
		pendapatanGrouped := groupByKategori(pendapatan)
		bebanGrouped := groupByKategori(beban)

		totalPendapatan := sumSubtotals(pendapatanGrouped)
		totalBeban := sumSubtotals(bebanGrouped)
		labaBersih := totalPendapatan - totalBeban

		response := models.LabaRugiResponse{
			Periode:         startDate + " s/d " + endDate,
			Pendapatan:      pendapatanGrouped,
			TotalPendapatan: totalPendapatan,
			Beban:           bebanGrouped,
			TotalBeban:      totalBeban,
			LabaBersih:      labaBersih,
		}

		c.JSON(http.StatusOK, response)
	}
}

// Helper function untuk grouping akun berdasarkan kategori
func groupByKategori(items []models.AkunSaldo) []models.LaporanGroup {
	groups := make(map[string]*models.LaporanGroup)
	order := []string{}

	for _, item := range items {
		key := item.KategoriKode
		if _, exists := groups[key]; !exists {
			groups[key] = &models.LaporanGroup{
				Kode:     item.KategoriKode,
				Nama:     item.KategoriNama,
				Items:    []models.AkunSaldo{},
				Subtotal: 0,
			}
			order = append(order, key)
		}
		groups[key].Items = append(groups[key].Items, item)
		groups[key].Subtotal += item.Saldo
	}

	// Sort by kategori kode
	sort.Strings(order)

	result := []models.LaporanGroup{}
	for _, key := range order {
		result = append(result, *groups[key])
	}
	return result
}

// Helper function untuk menjumlahkan subtotal dari semua grup
func sumSubtotals(groups []models.LaporanGroup) float64 {
	total := 0.0
	for _, g := range groups {
		total += g.Subtotal
	}
	return total
}
