package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BukuBesarRequest struct {
	COA          string `form:"coa"`
	TanggalAwal  string `form:"tanggal_awal"`
	TanggalAkhir string `form:"tanggal_akhir"`
	ContactID    uint   `form:"contact_id"`
	ContactType  string `form:"contact_type"`
}

type BukuBesarResponse struct {
	Tanggal        string  `json:"tanggal"`
	NomorTransaksi string  `json:"nomorTransaksi"`
	Deskripsi      string  `json:"deskripsi"`
	Debit          float64 `json:"debit"`
	Kredit         float64 `json:"kredit"`
	Saldo          float64 `json:"saldo"`
	SaldoAwal      float64 `json:"saldo_awal"`
}

// Handler Buku Besar

func GetBukuBesar(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		var req BukuBesarRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params"})
			return
		}

		// Debug: log parameter request
		fmt.Println("[BUKU BESAR] PARAMS:", req)

		// Parse multi-COA (comma-separated)
		var coaFilter []string
		if req.COA != "" {
			for _, v := range strings.Split(req.COA, ",") {
				v = strings.TrimSpace(v)
				if v != "" {
					coaFilter = append(coaFilter, v)
				}
			}
		}

		// Query COA dari tabel GL
		var bukuBesar []models.GL
		query := db
		if len(coaFilter) == 1 {
			query = query.Where("akun_transaksi = ?", coaFilter[0])
		} else if len(coaFilter) > 1 {
			query = query.Where("akun_transaksi IN ?", coaFilter)
		}
		if req.ContactID != 0 {
			query = query.Where("contact_id = ?", req.ContactID)
		}
		if req.ContactType != "" {
			query = query.Where("contact_type = ?", req.ContactType)
		}
		query = query.Where("tanggal >= ? AND tanggal <= ?", req.TanggalAwal, req.TanggalAkhir+" 23:59:59").Order("tanggal, nomor_transaksi, id").Find(&bukuBesar)

		// Debug: log hasil query
		fmt.Printf("[BUKU BESAR] Jumlah transaksi: %d\n", len(bukuBesar))
		if len(bukuBesar) > 0 {
			fmt.Printf("[BUKU BESAR] Data pertama: %+v\n", bukuBesar[0])
		}

		// Hitung saldo awal:
		// OB = master_coa.saldo_awal + SUM(GL.debit - GL.kredit WHERE tanggal < tanggal_awal)

		// 1. Ambil saldo_awal dari master_coa
		var masterSaldoAwal float64
		if len(coaFilter) == 1 {
			var coa models.MasterCOA
			if err := db.Where("kode = ?", coaFilter[0]).First(&coa).Error; err == nil {
				masterSaldoAwal = coa.SaldoAwal
			}
		} else if len(coaFilter) > 1 {
			db.Model(&models.MasterCOA{}).
				Where("kode IN ?", coaFilter).
				Select("COALESCE(SUM(saldo_awal), 0)").
				Row().Scan(&masterSaldoAwal)
		}

		// 2. Hitung net GL sebelum periode
		var glNetSebelumPeriode float64
		querySaldo := db.Model(&models.GL{})
		if len(coaFilter) == 1 {
			querySaldo = querySaldo.Where("akun_transaksi = ?", coaFilter[0])
		} else if len(coaFilter) > 1 {
			querySaldo = querySaldo.Where("akun_transaksi IN ?", coaFilter)
		}
		if req.ContactID != 0 {
			querySaldo = querySaldo.Where("contact_id = ?", req.ContactID)
		}
		if req.ContactType != "" {
			querySaldo = querySaldo.Where("contact_type = ?", req.ContactType)
		}
		querySaldo.Where("tanggal < ?", req.TanggalAwal).
			Select("COALESCE(SUM(debit - kredit), 0)").
			Row().Scan(&glNetSebelumPeriode)

		saldoAwal := masterSaldoAwal + glNetSebelumPeriode

		// Debug: log saldo awal
		fmt.Printf("[BUKU BESAR] Saldo Awal: %f\n", saldoAwal)

		// Build response
		var result []BukuBesarResponse
		currSaldo := saldoAwal
		for _, row := range bukuBesar {
			currSaldo += row.Debit - row.Kredit
			result = append(result, BukuBesarResponse{
				Tanggal:        row.Tanggal.Format("2006-01-02"),
				NomorTransaksi: row.NomorTransaksi,
				Deskripsi:      row.Deskripsi,
				Debit:          row.Debit,
				Kredit:         row.Kredit,
				Saldo:          currSaldo,
				SaldoAwal:      saldoAwal,
			})
		}

		// Jika tidak ada transaksi, tetap kirim saldo awal
		if len(result) == 0 {
			result = append(result, BukuBesarResponse{
				Tanggal:   "",
				SaldoAwal: saldoAwal,
			})
		}

		c.JSON(http.StatusOK, result)
	}
}
