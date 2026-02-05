package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetTrialBalance(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		tahunStr := c.Query("tahun")
		bulanAwalStr := c.Query("bulan_awal")
		bulanAkhirStr := c.Query("bulan_akhir")
		tahun, _ := strconv.Atoi(tahunStr)
		bulanAwal, _ := strconv.Atoi(bulanAwalStr)
		bulanAkhir, _ := strconv.Atoi(bulanAkhirStr)

		var coas []models.MasterCOA
		db.Preload("MasterCategoryCOA").Find(&coas)

		// Aggregate GL data in one go to avoid N+1 problem
		type GLSum struct {
			AkunTransaksi string
			Bulan         int
			Debit         float64
			Kredit        float64
		}
		var glSums []GLSum
		db.Raw(`
			SELECT akun_transaksi, EXTRACT(MONTH FROM tanggal) as bulan, SUM(debit) as debit, SUM(kredit) as kredit
			FROM gl
			WHERE EXTRACT(YEAR FROM tanggal) = ?
			AND deleted_at IS NULL
			GROUP BY akun_transaksi, bulan
		`, tahun).Scan(&glSums)

		// Saldo Awal Aggregation (before bulanAwal of that year)
		type SaldoAwalSum struct {
			AkunTransaksi string
			Debit         float64
			Kredit        float64
		}
		var saSums []SaldoAwalSum
		db.Raw(`
			SELECT akun_transaksi, SUM(debit) as debit, SUM(kredit) as kredit
			FROM gl
			WHERE (EXTRACT(YEAR FROM tanggal) < ? OR (EXTRACT(YEAR FROM tanggal) = ? AND EXTRACT(MONTH FROM tanggal) < ?))
			AND deleted_at IS NULL
			GROUP BY akun_transaksi
		`, tahun, tahun, bulanAwal).Scan(&saSums)

		// Map strings to results for fast lookup
		glMap := make(map[string]map[int]GLSum)
		for _, s := range glSums {
			if glMap[s.AkunTransaksi] == nil {
				glMap[s.AkunTransaksi] = make(map[int]GLSum)
			}
			glMap[s.AkunTransaksi][s.Bulan] = s
		}

		saMap := make(map[string]SaldoAwalSum)
		for _, s := range saSums {
			saMap[s.AkunTransaksi] = s
		}

		type TrialBalanceRow struct {
			Kode      string  `json:"kode"`
			Nama      string  `json:"nama"`
			SaldoAwal float64 `json:"saldoAwal"`
			Kategori  string  `json:"kategori"`
			TipeAkun  string  `json:"tipeAkun"`
			JanDebit  float64 `json:"jan_debit"`
			JanKredit float64 `json:"jan_kredit"`
			FebDebit  float64 `json:"feb_debit"`
			FebKredit float64 `json:"feb_kredit"`
			MarDebit  float64 `json:"mar_debit"`
			MarKredit float64 `json:"mar_kredit"`
			AprDebit  float64 `json:"apr_debit"`
			AprKredit float64 `json:"apr_kredit"`
			MeiDebit  float64 `json:"mei_debit"`
			MeiKredit float64 `json:"mei_kredit"`
			JunDebit  float64 `json:"jun_debit"`
			JunKredit float64 `json:"jun_kredit"`
			JulDebit  float64 `json:"jul_debit"`
			JulKredit float64 `json:"jul_kredit"`
			AgsDebit  float64 `json:"ags_debit"`
			AgsKredit float64 `json:"ags_kredit"`
			SepDebit  float64 `json:"sep_debit"`
			SepKredit float64 `json:"sep_kredit"`
			OktDebit  float64 `json:"okt_debit"`
			OktKredit float64 `json:"okt_kredit"`
			NovDebit  float64 `json:"nov_debit"`
			NovKredit float64 `json:"nov_kredit"`
			DesDebit  float64 `json:"des_debit"`
			DesKredit float64 `json:"des_kredit"`
		}

		monthNameMap := map[int]string{
			1: "jan", 2: "feb", 3: "mar", 4: "apr", 5: "mei", 6: "jun",
			7: "jul", 8: "ags", 9: "sep", 10: "okt", 11: "nov", 12: "des",
		}

		var result []TrialBalanceRow
		for _, coa := range coas {
			row := TrialBalanceRow{
				Kode: coa.Kode, Nama: coa.Nama, SaldoAwal: coa.SaldoAwal,
				Kategori: coa.MasterCategoryCOA.Nama, TipeAkun: coa.MasterCategoryCOA.TipeAkun,
			}

			// Add Saldo Awal from GL
			sa := saMap[coa.Kode]
			if coa.MasterCategoryCOA.TipeAkun == "2" || coa.MasterCategoryCOA.TipeAkun == "3" || coa.MasterCategoryCOA.TipeAkun == "4" {
				row.SaldoAwal += (sa.Kredit - sa.Debit)
			} else {
				row.SaldoAwal += (sa.Debit - sa.Kredit)
			}

			// Fill months
			for m := bulanAwal; m <= bulanAkhir; m++ {
				sum := glMap[coa.Kode][m]
				switch monthNameMap[m] {
				case "jan":
					row.JanDebit, row.JanKredit = sum.Debit, sum.Kredit
				case "feb":
					row.FebDebit, row.FebKredit = sum.Debit, sum.Kredit
				case "mar":
					row.MarDebit, row.MarKredit = sum.Debit, sum.Kredit
				case "apr":
					row.AprDebit, row.AprKredit = sum.Debit, sum.Kredit
				case "mei":
					row.MeiDebit, row.MeiKredit = sum.Debit, sum.Kredit
				case "jun":
					row.JunDebit, row.JunKredit = sum.Debit, sum.Kredit
				case "jul":
					row.JulDebit, row.JulKredit = sum.Debit, sum.Kredit
				case "ags":
					row.AgsDebit, row.AgsKredit = sum.Debit, sum.Kredit
				case "sep":
					row.SepDebit, row.SepKredit = sum.Debit, sum.Kredit
				case "okt":
					row.OktDebit, row.OktKredit = sum.Debit, sum.Kredit
				case "nov":
					row.NovDebit, row.NovKredit = sum.Debit, sum.Kredit
				case "des":
					row.DesDebit, row.DesKredit = sum.Debit, sum.Kredit
				}
			}
			result = append(result, row)
		}

		c.JSON(http.StatusOK, result)
	}
}
