package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AssetSummaryItem struct {
	KodeAset      string  `json:"kodeAset"`
	NamaAset      string  `json:"namaAset"`
	SubLedger     string  `json:"subLedger"`
	Qty           float64 `json:"qty"`
	AssetCost     float64 `json:"assetCost"`
	AcmDeprAmount float64 `json:"acmDeprAmount"`
	Disposed      float64 `json:"disposed"`
	BookValue     float64 `json:"bookValue"`
}

type AssetSummarySubGroup struct {
	SubKategori    string             `json:"subKategori"`
	Assets         []AssetSummaryItem `json:"assets"`
	TotalQty       float64            `json:"totalQty"`
	TotalCost      float64            `json:"totalCost"`
	TotalDepr      float64            `json:"totalDepr"`
	TotalDisposed  float64            `json:"totalDisposed"`
	TotalBookValue float64            `json:"totalBookValue"`
}

type AssetSummaryGroup struct {
	Kategori       string                 `json:"kategori"`
	SubGroups      []AssetSummarySubGroup `json:"subGroups"`
	TotalQty       float64                `json:"totalQty"`
	TotalCost      float64                `json:"totalCost"`
	TotalDepr      float64                `json:"totalDepr"`
	TotalDisposed  float64                `json:"totalDisposed"`
	TotalBookValue float64                `json:"totalBookValue"`
}

type AssetSummaryTotal struct {
	Qty       float64 `json:"qty"`
	Cost      float64 `json:"cost"`
	Depr      float64 `json:"depr"`
	Disposed  float64 `json:"disposed"`
	BookValue float64 `json:"bookValue"`
}

type AssetSummaryResponse struct {
	Periode      string              `json:"periode"`
	FilterLabel  string              `json:"filterLabel"`
	Groups       []AssetSummaryGroup `json:"groups"`
	GrandTotal   AssetSummaryTotal   `json:"grandTotal"`
}

// GET /api/laporan/fix-asset-summary?periode=2026-06&min_book_value=0&show_disposed=false
func GetFixAssetSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		periode := c.Query("periode")             // format: YYYY-MM
		minBVStr := c.DefaultQuery("min_book_value", "0")
		showDisposed := c.Query("show_disposed") == "true"

		// Parse periode → end of month
		endDate := ""
		periodeLabel := "All Period"
		if periode != "" {
			parts := strings.Split(periode, "-")
			if len(parts) == 2 {
				year, _ := strconv.Atoi(parts[0])
				month, _ := strconv.Atoi(parts[1])
				lastDay := time.Date(year, time.Month(month+1), 0, 23, 59, 59, 0, time.UTC)
				endDate = lastDay.Format("2006-01-02 15:04:05")
				periodeLabel = lastDay.Format("January 2006")
			}
		}

		minBV, _ := strconv.ParseFloat(minBVStr, 64)

		// Ambil semua aset
		var assets []models.MasterAsetTetap
		q := db.Model(&models.MasterAsetTetap{})
		if !showDisposed {
			q = q.Where("status_posting != ?", "Disposed")
		}
		q.Order("kategori_aset ASC, kode_aset ASC").Find(&assets)

		// Bangun map per kategori
		type groupEntry struct {
			kategori string
			items    []models.MasterAsetTetap
		}
		groupMap := map[string][]models.MasterAsetTetap{}
		groupOrder := []string{}

		for _, a := range assets {
			cat := a.KategoriAset
			if cat == "" {
				cat = "Lainnya"
			}
			if _, ok := groupMap[cat]; !ok {
				groupOrder = append(groupOrder, cat)
			}
			groupMap[cat] = append(groupMap[cat], a)
		}

		// Hitung per aset
		groups := []AssetSummaryGroup{}
		grand := AssetSummaryTotal{}

		for _, cat := range groupOrder {
			asetList := groupMap[cat]
			items := []AssetSummaryItem{}
			var subQty, subCost, subDepr, subDisposed, subBV float64

			for _, a := range asetList {
				// Hitung akumulasi penyusutan
				var acmDepr float64
				dq := db.Model(&models.HistoriPenyusutan{}).
					Where("kode_aset = ? AND status_posting = ?", a.KodeAset, "Posted")
				if endDate != "" {
					dq = dq.Where("tanggal_penyusutan <= ?", endDate)
				}
				dq.Select("COALESCE(SUM(nilai_penyusutan), 0)").Scan(&acmDepr)

				bookValue := a.HargaPerolehan - acmDepr
				if bookValue < a.NilaiResidu {
					bookValue = a.NilaiResidu
				}

				disposed := 0.0
				if a.StatusPosting == "Disposed" {
					disposed = a.HargaJual
				}

				qty := float64(a.Qty)
				if qty <= 0 {
					qty = 1
				}

				// Filter book value
				if bookValue < minBV {
					continue
				}

				items = append(items, AssetSummaryItem{
					KodeAset:      a.KodeAset,
					NamaAset:      a.NamaAset,
					SubLedger:     "",
					Qty:           qty,
					AssetCost:     a.HargaPerolehan,
					AcmDeprAmount: acmDepr,
					Disposed:      disposed,
					BookValue:     bookValue,
				})

				subQty += qty
				subCost += a.HargaPerolehan
				subDepr += acmDepr
				subDisposed += disposed
				subBV += bookValue
			}

			if len(items) == 0 {
				continue
			}

			subGroup := AssetSummarySubGroup{
				SubKategori:    strings.ToUpper(cat),
				Assets:         items,
				TotalQty:       subQty,
				TotalCost:      subCost,
				TotalDepr:      subDepr,
				TotalDisposed:  subDisposed,
				TotalBookValue: subBV,
			}

			groups = append(groups, AssetSummaryGroup{
				Kategori:       cat,
				SubGroups:      []AssetSummarySubGroup{subGroup},
				TotalQty:       subQty,
				TotalCost:      subCost,
				TotalDepr:      subDepr,
				TotalDisposed:  subDisposed,
				TotalBookValue: subBV,
			})

			grand.Qty += subQty
			grand.Cost += subCost
			grand.Depr += subDepr
			grand.Disposed += subDisposed
			grand.BookValue += subBV
		}

		filterLabel := "Period " + periodeLabel + " | Book Value >= " + minBVStr
		if !showDisposed {
			filterLabel += " | Disposed Value = 0"
		}

		c.JSON(http.StatusOK, AssetSummaryResponse{
			Periode:     periodeLabel,
			FilterLabel: filterLabel,
			Groups:      groups,
			GrandTotal:  grand,
		})
	}
}
