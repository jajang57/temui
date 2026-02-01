package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardKPI struct {
	Revenue          float64 `json:"revenue"`
	Expense          float64 `json:"expense"`
	NetIncome        float64 `json:"net_income"`
	CashBalance      float64 `json:"cash_balance"`
	TotalAssets      float64 `json:"total_assets"`
	TotalLiabilities float64 `json:"total_liabilities"`
	TotalEquity      float64 `json:"total_equity"`
}

type MonthlyTrend struct {
	Month     string  `json:"month"` // Jan, Feb, etc
	Revenue   float64 `json:"revenue"`
	Expense   float64 `json:"expense"`
	NetIncome float64 `json:"net_income"`
}

type CompositionItem struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

func GetDashboardSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		year := c.Query("year")
		if year == "" {
			year = fmt.Sprintf("%d", time.Now().Year())
		}

		startDate := fmt.Sprintf("%s-01-01", year)
		endDate := fmt.Sprintf("%s-12-31", year)

		// 1. KPI & Trend Data (Revenue vs Expense) via Loop
		trends := make([]MonthlyTrend, 12)
		var totalRev, totalExp float64

		for i := 1; i <= 12; i++ {
			s := fmt.Sprintf("%s-%02d-01", year, i)
			// End date logic
			t, _ := time.Parse("2006-01-02", s)
			e := t.AddDate(0, 1, -1).Format("2006-01-02")

			// Helper: Hitung Pendapatan
			var rev float64
			db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
					FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
					WHERE mcc.tipe_akun = '4' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, s, e).Scan(&rev)

			// Helper: Hitung Beban
			var exp float64
			db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) 
					FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
					WHERE mcc.tipe_akun = '5' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, s, e).Scan(&exp)

			trends[i-1] = MonthlyTrend{
				Month:     t.Format("Jan"),
				Revenue:   rev,
				Expense:   exp,
				NetIncome: rev - exp,
			}
			totalRev += rev
			totalExp += exp
		}

		// 2. Asset & Liability (Neraca Summary - As of End Date)
		var totalAsset, totalLiab float64
		// Asset (1)
		db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) 
				FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
				WHERE mcc.tipe_akun = '1' AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, endDate).Scan(&totalAsset)
		// Liab (2)
		db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
				FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
				WHERE mcc.tipe_akun = '2' AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, endDate).Scan(&totalLiab)
		// Equity (3)
		var equityRaw, totalEquity float64
		db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
				FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
				WHERE mcc.tipe_akun = '3' AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, endDate).Scan(&equityRaw)

		// All time Net Income to add to Equity (Retained Earnings logic approx)
		var allTimeRev, allTimeExp float64
		db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
				FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
				WHERE mcc.tipe_akun = '4' AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, endDate).Scan(&allTimeRev)
		db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) 
				FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
				WHERE mcc.tipe_akun = '5' AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, endDate).Scan(&allTimeExp)

		totalEquity = equityRaw + (allTimeRev - allTimeExp)

		// 3. Cash Balance
		var cashBalance float64
		db.Raw(`
			SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0)
			FROM gl 
			JOIN master_coa mc ON gl.akun_transaksi = mc.kode 
			JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
			WHERE mcc.is_kas_bank = true AND gl.tanggal <= ? AND gl.deleted_at IS NULL
		`, endDate).Scan(&cashBalance)

		// 4. Cashflow Summary
		var accounts []models.MasterCOA
		db.Preload("MasterCategoryCOA").Find(&accounts)

		var op, inv, fin float64
		currentNI := totalRev - totalExp
		op += currentNI

		var nonCash float64
		db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0) 
				FROM gl JOIN master_coa mc ON gl.akun_transaksi = mc.kode 
				JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id 
				WHERE mcc.tipe_akun = '5' 
				AND (LOWER(mc.nama) LIKE '%penyusutan%' OR LOWER(mc.nama) LIKE '%amortisasi%')
				AND gl.tanggal >= ? AND gl.tanggal <= ?`, startDate, endDate).Scan(&nonCash)
		op += nonCash

		for _, akun := range accounts {
			if akun.MasterCategoryCOA.IsKasBank {
				continue
			}
			if akun.MasterCategoryCOA.TipeAkun == "4" || akun.MasterCategoryCOA.TipeAkun == "5" {
				continue
			}

			// Get Delta
			var salStart, salEnd float64
			prevDate, _ := time.Parse("2006-01-02", startDate)
			prevDateStr := prevDate.AddDate(0, 0, -1).Format("2006-01-02")

			salStart = getSaldo(db, akun, "1000-01-01", prevDateStr)
			salEnd = getSaldo(db, akun, "1000-01-01", endDate)

			delta := salEnd - salStart
			if delta == 0 {
				continue
			}

			activity := akun.CashflowActivity
			if activity == "" {
				nome := strings.ToLower(akun.Nama)
				tipe := akun.MasterCategoryCOA.TipeAkun
				if tipe == "1" {
					if isInvest(nome) {
						activity = "investing"
					} else {
						activity = "operating"
					}
				} else if tipe == "2" {
					if isFinance(nome) {
						activity = "financing"
					} else {
						activity = "operating"
					}
				} else if tipe == "3" {
					if !isLaba(nome) {
						activity = "financing"
					}
				}
			}

			var val float64
			if akun.CashflowDirection == "in" {
				val = delta
			} else if akun.CashflowDirection == "out" {
				val = -delta
			} else {
				if akun.MasterCategoryCOA.TipeAkun == "1" {
					val = -delta
				} else {
					val = delta
				}
			}

			if activity == "operating" {
				op += val
			}
			if activity == "investing" {
				inv += val
			}
			if activity == "financing" {
				fin += val
			}
		}

		// Composition Assets
		var assetComp []CompositionItem
		db.Raw(`
			SELECT mcc.nama as name, SUM(gl.debit - gl.kredit) as value
			FROM gl 
			JOIN master_coa mc ON gl.akun_transaksi = mc.kode 
			JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
			WHERE mcc.tipe_akun = '1' AND gl.tanggal <= ? AND gl.deleted_at IS NULL
			GROUP BY mcc.nama
			HAVING SUM(gl.debit - gl.kredit) > 0
			ORDER BY value DESC
		`, endDate).Scan(&assetComp)

		c.JSON(http.StatusOK, gin.H{
			"kpi": DashboardKPI{
				Revenue:          totalRev,
				Expense:          totalExp,
				NetIncome:        totalRev - totalExp,
				CashBalance:      cashBalance,
				TotalAssets:      totalAsset,
				TotalLiabilities: totalLiab,
				TotalEquity:      totalEquity,
			},
			"trend": trends,
			"cashflow": []gin.H{
				{"name": "Operasi", "value": op},
				{"name": "Investasi", "value": inv},
				{"name": "Pendanaan", "value": fin},
			},
			"composition": assetComp,
		})
	}
}

func getSaldo(db *gorm.DB, akun models.MasterCOA, start, end string) float64 {
	var d, k float64
	db.Raw(`SELECT COALESCE(SUM(debit),0), COALESCE(SUM(kredit),0) FROM gl WHERE akun_transaksi = ? AND tanggal >= ? AND tanggal <= ? AND deleted_at IS NULL`, akun.Kode, start, end).Row().Scan(&d, &k)

	tipe := akun.MasterCategoryCOA.TipeAkun
	if tipe == "1" || tipe == "5" {
		return d - k
	}
	return k - d
}

func isInvest(name string) bool {
	return containsAny(name, []string{"tetap", "bangunan", "tanah", "kendaraan", "investasi", "akumulasi"})
}
func isFinance(name string) bool {
	return containsAny(name, []string{"bank", "jangka panjang", "investor"})
}
func isLaba(name string) bool { return containsAny(name, []string{"laba", "profit"}) }
func containsAny(s string, subs []string) bool {
	s = strings.ToLower(s)
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}
