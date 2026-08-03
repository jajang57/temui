package handlers

import (
	"fmt"
	"math"
	"net/http"
	"project-akuntansi-backend/models"
	"sort"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetNeraca returns Neraca / Laporan Posisi Keuangan (Balance Sheet)
// GET /api/laporan/neraca?end_date=2024-12-31
func GetNeraca(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		endDate := c.Query("end_date")

		if endDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "end_date wajib diisi"})
			return
		}

		res, err := calculateNeracaInternal(db, endDate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, res)
	}
}

// GetNeracaKomparatif returns multi-year comparative Neraca
// GET /api/laporan/neraca-komparatif?start_year=2019&end_year=2023
func GetNeracaKomparatif(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		startYearStr := c.Query("start_year")
		endYearStr := c.Query("end_year")

		if startYearStr == "" || endYearStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "start_year dan end_year wajib diisi"})
			return
		}

		var startYear, endYear int
		_, _ = fmt.Sscanf(startYearStr, "%d", &startYear)
		_, _ = fmt.Sscanf(endYearStr, "%d", &endYear)

		if startYear == 0 || endYear == 0 || startYear > endYear {
			c.JSON(http.StatusBadRequest, gin.H{"error": "rentang tahun tidak valid"})
			return
		}

		years := []string{}
		for y := startYear; y <= endYear; y++ {
			years = append(years, fmt.Sprintf("%d", y))
		}

		resp := models.NeracaKomparatifResponse{
			Years:           years,
			TotalAsets:      make(map[string]float64),
			TotalLiabilitas: make(map[string]float64),
			LabaDitahan:     make(map[string]float64),
			TotalEkuitas:    make(map[string]float64),
			TotalPasivas:    make(map[string]float64),
		}

		// Temporary storage to merge accounts
		allAset := make(map[string]*models.AkunSaldoKomparatif)
		allLiab := make(map[string]*models.AkunSaldoKomparatif)
		allEkui := make(map[string]*models.AkunSaldoKomparatif)

		for _, year := range years {
			endDate := year + "-12-31" // Standard end of year
			res, _ := calculateNeracaInternal(db, endDate)

			resp.TotalAsets[year] = res.TotalAset
			resp.TotalLiabilitas[year] = res.TotalLiabilitas
			resp.LabaDitahan[year] = res.LabaDitahan
			resp.TotalEkuitas[year] = res.TotalEkuitas
			resp.TotalPasivas[year] = res.TotalPasiva

			mergeToKomparatif(allAset, res.Aset, year)
			mergeToKomparatif(allLiab, res.Liabilitas, year)
			mergeToKomparatif(allEkui, res.Ekuitas, year)
		}

		resp.Aset = groupKomparatif(allAset)
		resp.Liabilitas = groupKomparatif(allLiab)
		resp.Ekuitas = groupKomparatif(allEkui)

		c.JSON(http.StatusOK, resp)
	}
}

func calculateNeracaInternal(db *gorm.DB, endDate string) (models.NeracaResponse, error) {
	endDateEOD := endDate + " 23:59:59"
	// Query Aset (TipeAkun = '1') - Saldo Normal Debit
	var aset []models.AkunSaldo
	db.Raw(`
		SELECT 
			mcc.kode AS kategori_kode,
			mcc.nama AS kategori_nama,
			mc.kode AS akun_kode,
			mc.nama AS akun_nama,
			mc.saldo_awal + COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) AS saldo
		FROM master_coa mc
		JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
		LEFT JOIN gl ON gl.akun_transaksi = mc.kode
			AND gl.tanggal <= ?
			AND gl.deleted_at IS NULL
		WHERE mcc.tipe_akun = '1'
		GROUP BY mcc.kode, mcc.nama, mc.kode, mc.nama, mc.saldo_awal
		HAVING mc.saldo_awal + COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) != 0
		ORDER BY mc.kode
	`, endDateEOD).Scan(&aset)

	// Query Liabilitas (TipeAkun = '2') - Saldo Normal Kredit
	var liabilitas []models.AkunSaldo
	db.Raw(`
		SELECT
			mcc.kode AS kategori_kode,
			mcc.nama AS kategori_nama,
			mc.kode AS akun_kode,
			mc.nama AS akun_nama,
			mc.saldo_awal + COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) AS saldo
		FROM master_coa mc
		JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
		LEFT JOIN gl ON gl.akun_transaksi = mc.kode
			AND gl.tanggal <= ?
			AND gl.deleted_at IS NULL
		WHERE mcc.tipe_akun = '2'
		GROUP BY mcc.kode, mcc.nama, mc.kode, mc.nama, mc.saldo_awal
		HAVING mc.saldo_awal + COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) != 0
		ORDER BY mc.kode
	`, endDateEOD).Scan(&liabilitas)

	// Query Ekuitas (TipeAkun = '3') - Saldo Normal Kredit
	var ekuitas []models.AkunSaldo
	db.Raw(`
		SELECT
			mcc.kode AS kategori_kode,
			mcc.nama AS kategori_nama,
			mc.kode AS akun_kode,
			mc.nama AS akun_nama,
			mc.saldo_awal + COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) AS saldo
		FROM master_coa mc
		JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
		LEFT JOIN gl ON gl.akun_transaksi = mc.kode
			AND gl.tanggal <= ?
			AND gl.deleted_at IS NULL
		WHERE mcc.tipe_akun = '3'
		GROUP BY mcc.kode, mcc.nama, mc.kode, mc.nama, mc.saldo_awal
		HAVING mc.saldo_awal + COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) != 0
		ORDER BY mc.kode
	`, endDateEOD).Scan(&ekuitas)

	// Hitung Laba Bersih periode berjalan
	var labaBersih float64
	db.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN mcc.tipe_akun = '4' THEN gl.kredit - gl.debit ELSE 0 END), 0) -
			COALESCE(SUM(CASE WHEN mcc.tipe_akun = '5' THEN gl.debit - gl.kredit ELSE 0 END), 0) AS laba_bersih
		FROM gl
		JOIN master_coa mc ON gl.akun_transaksi = mc.kode
		JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
		WHERE gl.tanggal <= ? AND gl.deleted_at IS NULL
			AND mcc.tipe_akun IN ('4', '5')
	`, endDateEOD).Scan(&labaBersih)

	asetGrouped := groupByKategori(aset)
	liabilitasGrouped := groupByKategori(liabilitas)
	ekuitasGrouped := groupByKategori(ekuitas)

	totalAset := sumSubtotals(asetGrouped)
	totalLiabilitas := sumSubtotals(liabilitasGrouped)
	totalEkuitas := sumSubtotals(ekuitasGrouped) + labaBersih
	totalPasiva := totalLiabilitas + totalEkuitas
	isBalance := math.Abs(totalAset-totalPasiva) < 0.01

	return models.NeracaResponse{
		Tanggal:         endDate,
		Aset:            asetGrouped,
		TotalAset:       totalAset,
		Liabilitas:      liabilitasGrouped,
		TotalLiabilitas: totalLiabilitas,
		Ekuitas:         ekuitasGrouped,
		LabaDitahan:     labaBersih,
		TotalEkuitas:    totalEkuitas,
		TotalPasiva:     totalPasiva,
		IsBalance:       isBalance,
	}, nil
}

func mergeToKomparatif(target map[string]*models.AkunSaldoKomparatif, source []models.LaporanGroup, year string) {
	for _, group := range source {
		for _, item := range group.Items {
			key := item.AkunKode
			if _, exists := target[key]; !exists {
				target[key] = &models.AkunSaldoKomparatif{
					KategoriKode: item.KategoriKode,
					KategoriNama: item.KategoriNama,
					AkunKode:     item.AkunKode,
					AkunNama:     item.AkunNama,
					Saldos:       make(map[string]float64),
				}
			}
			target[key].Saldos[year] = item.Saldo
		}
	}
}

func groupKomparatif(source map[string]*models.AkunSaldoKomparatif) []models.LaporanGroupKomparatif {
	categoryMap := make(map[string]*models.LaporanGroupKomparatif)
	keys := []string{}

	for _, item := range source {
		catKey := item.KategoriKode
		if _, exists := categoryMap[catKey]; !exists {
			categoryMap[catKey] = &models.LaporanGroupKomparatif{
				Kode:      item.KategoriKode,
				Nama:      item.KategoriNama,
				Items:     []models.AkunSaldoKomparatif{},
				Subtotals: make(map[string]float64),
			}
			keys = append(keys, catKey)
		}
		categoryMap[catKey].Items = append(categoryMap[catKey].Items, *item)
		for year, saldo := range item.Saldos {
			categoryMap[catKey].Subtotals[year] += saldo
		}
	}

	sort.Strings(keys)
	result := []models.LaporanGroupKomparatif{}
	for _, k := range keys {
		// Sort items within group
		sort.Slice(categoryMap[k].Items, func(i, j int) bool {
			return categoryMap[k].Items[i].AkunKode < categoryMap[k].Items[j].AkunKode
		})
		result = append(result, *categoryMap[k])
	}
	return result
}
