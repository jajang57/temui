package handlers

import (
	"fmt"
	"math"
	"net/http"
	"project-akuntansi-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FixAssetHistoryRow struct {
	Tanggal        string  `json:"tanggal"`
	Keterangan     string  `json:"keterangan"`
	NomorTransaksi string  `json:"nomorTransaksi"`
	Source         string  `json:"source"` // "fixasset" | "jv"
	Qty            float64 `json:"qty"`
	AssetCost      float64 `json:"assetCost"`
	DeprAmount     float64 `json:"deprAmount"`
	NilaiBuku      float64 `json:"nilaiBuku"`
}

type FixAssetHistoryResponse struct {
	Aset         models.MasterAsetTetap `json:"aset"`
	AkunNamaAset string                 `json:"akunNamaAset"`
	AkunNamaAkum string                 `json:"akunNamaAkum"`
	AkunNamaDepr string                 `json:"akunNamaDepr"`
	History      []FixAssetHistoryRow   `json:"history"`
	TotalQty     float64                `json:"totalQty"`
	TotalCost    float64                `json:"totalCost"`
	TotalDepr    float64                `json:"totalDepr"`
	Age          string                 `json:"age"`
}

// GET /api/laporan/fix-asset-history?kode_aset=LPTP001&start_date=2026-01-01&end_date=2026-06-30
func GetFixAssetHistory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		kodeAset := c.Query("kode_aset")
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		if kodeAset == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "kode_aset wajib diisi"})
			return
		}

		// 1. Ambil data master aset
		var aset models.MasterAsetTetap
		if err := db.Where("kode_aset = ?", kodeAset).First(&aset).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Aset tidak ditemukan"})
			return
		}

		// 2. Ambil nama akun COA
		getNamaCOA := func(kode string) string {
			if kode == "" {
				return "-"
			}
			var coa models.MasterCOA
			db.Where("kode = ?", kode).First(&coa)
			return coa.Nama
		}
		akunNamaAset := getNamaCOA(aset.AkunAsetTetap)
		akunNamaAkum := getNamaCOA(aset.AkunAkumulasiPenyusutan)
		akunNamaDepr := getNamaCOA(aset.AkunBebanPenyusutan)

		// 3. Hitung umur aset
		age := ""
		if !aset.TanggalPerolehan.IsZero() {
			now := time.Now()
			years := now.Year() - aset.TanggalPerolehan.Year()
			months := int(now.Month()) - int(aset.TanggalPerolehan.Month())
			days := now.Day() - aset.TanggalPerolehan.Day()
			if days < 0 {
				months--
				days += 30
			}
			if months < 0 {
				years--
				months += 12
			}
			if months < 0 {
				months = 0
			}
			age = formatAgeStr(years*12+months, days)
		}

		// 4. Build history rows
		history := []FixAssetHistoryRow{}

		// Row pertama: posting aset (fixasset)
		tanggalPerolehan := ""
		if !aset.TanggalPerolehan.IsZero() {
			tanggalPerolehan = aset.TanggalPerolehan.Format("2006-01-02")
		}

		// Sertakan row fixasset jika dalam range tanggal (atau tidak ada filter)
		includeAcq := true
		if startDate != "" && tanggalPerolehan != "" && tanggalPerolehan < startDate {
			includeAcq = false
		}
		if endDate != "" && tanggalPerolehan != "" && tanggalPerolehan > endDate+" 23:59:59" {
			includeAcq = false
		}

		qty := float64(aset.Qty)
		if qty <= 0 {
			qty = 1
		}

		if includeAcq && tanggalPerolehan != "" {
			history = append(history, FixAssetHistoryRow{
				Tanggal:        tanggalPerolehan,
				Keterangan:     aset.NamaAset,
				NomorTransaksi: aset.KodeAset,
				Source:         "fixasset",
				Qty:            qty,
				AssetCost:      aset.HargaPerolehan,
				DeprAmount:     0,
				NilaiBuku:      aset.HargaPerolehan,
			})
		}

		// 5. Ambil histori penyusutan
		var historiList []models.HistoriPenyusutan
		histQ := db.Where("kode_aset = ? AND status_posting = ?", kodeAset, "Posted")
		if startDate != "" {
			histQ = histQ.Where("tanggal_penyusutan >= ?", startDate)
		}
		if endDate != "" {
			histQ = histQ.Where("tanggal_penyusutan <= ?", endDate+" 23:59:59")
		}
		histQ.Order("tanggal_penyusutan ASC").Find(&historiList)

		for _, h := range historiList {
			tgl := ""
			if !h.TanggalPenyusutan.IsZero() {
				tgl = h.TanggalPenyusutan.Format("2006-01-02")
			}
			ket := h.Keterangan
			if ket == "" {
				ket = "Depr " + h.Periode + " FA " + kodeAset
			}
			history = append(history, FixAssetHistoryRow{
				Tanggal:        tgl,
				Keterangan:     ket,
				NomorTransaksi: h.NomorTransaksi,
				Source:         "jv",
				Qty:            0,
				AssetCost:      0,
				DeprAmount:     h.NilaiPenyusutan,
				NilaiBuku:      h.NilaiBuku,
			})
		}

		// 6. Hitung totals
		totalQty := 0.0
		totalCost := 0.0
		totalDepr := 0.0
		for _, row := range history {
			totalQty += row.Qty
			totalCost += row.AssetCost
			totalDepr += row.DeprAmount
		}

		c.JSON(http.StatusOK, FixAssetHistoryResponse{
			Aset:         aset,
			AkunNamaAset: akunNamaAset,
			AkunNamaAkum: akunNamaAkum,
			AkunNamaDepr: akunNamaDepr,
			History:      history,
			TotalQty:     math.Round(totalQty*100) / 100,
			TotalCost:    math.Round(totalCost*100) / 100,
			TotalDepr:    math.Round(totalDepr*100) / 100,
			Age:          age,
		})
	}
}

func formatAgeStr(totalMonths, days int) string {
	years := totalMonths / 12
	months := totalMonths % 12
	if years > 0 && months > 0 {
		return fmt.Sprintf("%d (Year) %d (Month)", years, months)
	} else if years > 0 {
		return fmt.Sprintf("%d (Year) 0 (Month)", years)
	}
	return fmt.Sprintf("0 (Year) %d (Month)", months)
}
