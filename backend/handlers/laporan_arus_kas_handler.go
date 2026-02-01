package handlers

import (
	"math"
	"net/http"
	"project-akuntansi-backend/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ArusKasItem struct {
	Nama  string  `json:"nama"`
	Nilai float64 `json:"nilai"`
}

type ArusKasSection struct {
	Items []ArusKasItem `json:"items"`
	Total float64       `json:"total"`
}

type ArusKasResponse struct {
	Periode        string         `json:"periode"`
	Operasi        ArusKasSection `json:"operasi"`
	Investasi      ArusKasSection `json:"investasi"`
	Pendanaan      ArusKasSection `json:"pendanaan"`
	KenaikanBersih float64        `json:"kenaikan_bersih"`
	KasAwal        float64        `json:"kas_awal"`
	KasAkhir       float64        `json:"kas_akhir"`
}

// GetLaporanArusKas menangani permintaan laporan arus kas metode tidak langsung
func GetLaporanArusKas(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		startDateStr := c.Query("start_date")
		endDateStr := c.Query("end_date")

		if startDateStr == "" || endDateStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "start_date dan end_date wajib diisi"})
			return
		}

		// Parse dates
		startDate, _ := time.Parse("2006-01-02", startDateStr)
		// endDate, _ := time.Parse("2006-01-02", endDateStr)

		// 1. Hitung Laba Bersih (Revenue - Expense)
		// Ini adalah titik awal Arus Kas Operasi
		labaBersih := hitungLabaBersih(db, startDateStr, endDateStr)

		operasiItems := []ArusKasItem{
			{Nama: "Laba Bersih", Nilai: labaBersih},
		}

		// 2. Penyesuaian Non-Kas (Penyusutan & Amortisasi)
		// Cari beban yang namanya mengandung "Penyusun" atau "Amortisasi"
		bebanNonKas := hitungBebanNonKas(db, startDateStr, endDateStr)
		if bebanNonKas > 0 {
			operasiItems = append(operasiItems, ArusKasItem{Nama: "Penyesuaian: Penyusutan & Amortisasi", Nilai: bebanNonKas})
		}

		// 3. Perubahan Modal Kerja (Delta Aset Lancar & Liabilitas Lancar)
		// Logic:
		// Aset Lancar: Kenaikan = Arus Kas Keluar (-), Penurunan = Arus Kas Masuk (+)
		// Liabilitas: Kenaikan = Arus Kas Masuk (+), Penurunan = Arus Kas Keluar (-)

		// Ambil semua akun neraca (1, 2, 3)
		var akunNeraca []models.MasterCOA
		db.Preload("MasterCategoryCOA").Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
			Where("master_category_coa.tipe_akun IN ?", []string{"1", "2", "3"}).
			Find(&akunNeraca)

		var totalOperasi, totalInvestasi, totalPendanaan float64
		investasiItems := []ArusKasItem{}
		pendanaanItems := []ArusKasItem{}

		// Map untuk menyimpan delta per kategori agar lebih rapi
		perubahanModalKerja := make(map[string]float64)

		for _, akun := range akunNeraca {
			// Skip Kas & Bank (karena ini yang kita cari perubahannya)
			if akun.MasterCategoryCOA.IsKasBank {
				continue
			}

			// Hitung Saldo Awal (sebelum startDate)
			saldoAwal := getSaldoAkun(db, akun.Kode, akun.MasterCategoryCOA.TipeAkun, "1000-01-01", startDate.AddDate(0, 0, -1).Format("2006-01-02"))

			// Hitung Saldo Akhir (sampai endDate)
			saldoAkhir := getSaldoAkun(db, akun.Kode, akun.MasterCategoryCOA.TipeAkun, "1000-01-01", endDateStr)

			delta := saldoAkhir - saldoAwal

			// Jika tidak ada perubahan, skip
			if math.Abs(delta) < 0.01 {
				continue
			}

			namaAkun := strings.ToLower(akun.Nama)
			tipe := akun.MasterCategoryCOA.TipeAkun

			// --- 1. CEK MAPPING MANUAL (OVERRIDE) ---
			// Jika akun memiliki mapping aktivitas arus kas, gunakan mapping tersebut
			// mengabaikan heuristik nama akun.
			if akun.CashflowActivity != "" {
				var arus float64

				// Tentukan arah arus kas (Inflow/Outflow check)
				// Jika direction diset manual:
				if akun.CashflowDirection == "in" {
					arus = delta // Kenaikan = Masuk (+)
				} else if akun.CashflowDirection == "out" {
					arus = -delta // Kenaikan = Keluar (-)
				} else {
					// Default logic akuntansi:
					// Aset (1) Naik = Keluar (-), Turun = Masuk (+)
					// Liabilitas (2) & Ekuitas (3) Naik = Masuk (+), Turun = Keluar (-)
					if tipe == "1" {
						arus = -delta
					} else {
						arus = delta
					}
				}

				switch akun.CashflowActivity {
				case "operating":
					perubahanModalKerja[akun.Nama] = arus
				case "investing":
					investasiItems = append(investasiItems, ArusKasItem{Nama: "Perubahan " + akun.Nama, Nilai: arus})
				case "financing":
					pendanaanItems = append(pendanaanItems, ArusKasItem{Nama: "Perubahan " + akun.Nama, Nilai: arus})
				}
				continue // Skip heuristic logic di bawah
			}

			// --- 2. HEURISTIK LOGIC (FALLBACK) ---

			// ASET (Tipe 1)
			if tipe == "1" {
				isAsetTetap := strings.Contains(namaAkun, "tetap") || strings.Contains(namaAkun, "bangunan") ||
					strings.Contains(namaAkun, "kendaraan") || strings.Contains(namaAkun, "tanah") ||
					strings.Contains(namaAkun, "akumulasi") || strings.Contains(namaAkun, "investasi")

				if isAsetTetap {
					// AKTIVITAS INVESTASI
					// Kenaikan Aset = Kas Keluar (-)
					arusKas := -delta
					investasiItems = append(investasiItems, ArusKasItem{Nama: "Perubahan " + akun.Nama, Nilai: arusKas})
				} else {
					// AKTIVITAS OPERASI (Modal Kerja)
					// Kenaikan Aset Lancar = Kas Keluar (-)
					// akumulasi penyusutan sebenarnya aset kontra, tapi kita simplifikasi di sini
					// Jika akun akumulasi penyusutan masuk sini, dia akan nambah saldo kredit (negatif di aset),
					// jadi delta negatif -> arus kas positif. Ini cocok (add back depreciation).
					// Tapi kita sudah add back depreciation via expense di atas. Double count?
					// Akun akumulasi biasanya Tipe 1 tapi saldo normal Kredit.
					// Mari kita anggap Penyusutan sudah dihandle di expense non-kas.
					// Jadi kita skip akun Accumulasi di sini agar tidak double counting?
					// IDEALNYA: Add back expense, dan JANGAN hitung perubahan akun Akumulasi Penyusutan.

					if !strings.Contains(namaAkun, "akumulasi") {
						arusKas := -delta
						perubahanModalKerja[akun.Nama] = arusKas
					}
				}
			}

			// LIABILITAS (Tipe 2)
			if tipe == "2" {
				isJangkaPanjang := strings.Contains(namaAkun, "jangka panjang") || strings.Contains(namaAkun, "bank") || strings.Contains(namaAkun, "investor")

				if isJangkaPanjang {
					// AKTIVITAS PENDANAAN
					// Kenaikan Hutang = Kas Masuk (+)
					arusKas := delta
					pendanaanItems = append(pendanaanItems, ArusKasItem{Nama: "Perubahan " + akun.Nama, Nilai: arusKas})
				} else {
					// AKTIVITAS OPERASI (Modal Kerja - Hutang Lancar)
					// Kenaikan Hutang = Kas Masuk (+)
					arusKas := delta
					perubahanModalKerja[akun.Nama] = arusKas
				}
			}

			// EKUITAS (Tipe 3)
			if tipe == "3" {
				// Skip Laba Ditahan / Laba Tahun Berjalan karena sudah direpresentasikan oleh Laba Bersih di atas
				if strings.Contains(namaAkun, "laba") {
					continue
				}

				// AKTIVITAS PENDANAAN (Modal Saham, Prive)
				// Kenaikan Ekuitas = Kas Masuk (+)
				// Prive biasanya saldo debit (mengurangi ekuitas). Kenaikan Prive (makin debit) = Ekuitas turun = Delta Negatif.
				// Delta Negatif di Ekuitas = Kas Keluar. Cocok.
				arusKas := delta
				pendanaanItems = append(pendanaanItems, ArusKasItem{Nama: "Perubahan " + akun.Nama, Nilai: arusKas})
			}
		}

		// Masukkan Perubahan Modal Kerja ke Operasi Items
		for nama, nilai := range perubahanModalKerja {
			operasiItems = append(operasiItems, ArusKasItem{Nama: "Perubahan " + nama, Nilai: nilai})
		}

		// Hitung Total per Section
		for _, item := range operasiItems {
			totalOperasi += item.Nilai
		}
		for _, item := range investasiItems {
			totalInvestasi += item.Nilai
		}
		for _, item := range pendanaanItems {
			totalPendanaan += item.Nilai
		}

		// 4. Hitung Kas Awal & Akhir
		kasAwal := getTotalKas(db, "1000-01-01", startDate.AddDate(0, 0, -1).Format("2006-01-02"))
		kasAkhir := getTotalKas(db, "1000-01-01", endDateStr)

		response := ArusKasResponse{
			Periode:        startDateStr + " s/d " + endDateStr,
			Operasi:        ArusKasSection{Items: operasiItems, Total: totalOperasi},
			Investasi:      ArusKasSection{Items: investasiItems, Total: totalInvestasi},
			Pendanaan:      ArusKasSection{Items: pendanaanItems, Total: totalPendanaan},
			KenaikanBersih: totalOperasi + totalInvestasi + totalPendanaan,
			KasAwal:        kasAwal,
			KasAkhir:       kasAkhir,
		}

		c.JSON(http.StatusOK, response)
	}
}

// Helper: Hitung Laba Bersih
func hitungLabaBersih(db *gorm.DB, start, end string) float64 {
	var totalPendapatan, totalBeban float64

	// Pendapatan (Tipe 4) - Kredit - Debit
	db.Raw(`SELECT COALESCE(SUM(gl.kredit), 0) - COALESCE(SUM(gl.debit), 0) 
			FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
			WHERE mcc.tipe_akun = '4' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, start, end).Scan(&totalPendapatan)

	// Beban (Tipe 5) - Debit - Kredit
	db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0)
			FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
			WHERE mcc.tipe_akun = '5' AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, start, end).Scan(&totalBeban)

	return totalPendapatan - totalBeban
}

// Helper: Hitung Beban Non-Kas (Penyusutan)
func hitungBebanNonKas(db *gorm.DB, start, end string) float64 {
	var total float64
	db.Raw(`SELECT COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.kredit), 0)
			FROM master_coa mc JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id JOIN gl ON gl.akun_transaksi = mc.kode
			WHERE mcc.tipe_akun = '5' 
			AND (LOWER(mc.nama) LIKE '%penyusutan%' OR LOWER(mc.nama) LIKE '%amortisasi%')
			AND gl.tanggal >= ? AND gl.tanggal <= ? AND gl.deleted_at IS NULL`, start, end).Scan(&total)
	return total
}

// Helper: Get Saldo Akun Specific Date
func getSaldoAkun(db *gorm.DB, kodeAkun string, tipeAkun string, start, end string) float64 {
	var debit, kredit float64
	db.Raw(`SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0) FROM gl 
			WHERE akun_transaksi = ? AND tanggal >= ? AND tanggal <= ? AND deleted_at IS NULL`, kodeAkun, start, end).Row().Scan(&debit, &kredit)

	switch tipeAkun {
	case "1", "5": // Saldo Normal Debit
		return debit - kredit
	case "2", "3", "4": // Saldo Normal Kredit
		return kredit - debit
	default:
		return debit - kredit
	}
}

// Helper: Get Total Kas
func getTotalKas(db *gorm.DB, start, end string) float64 {
	var total float64
	// Ambil semua akun Kas/Bank
	var akunKas []string
	db.Raw(`SELECT mc.kode FROM master_coa mc 
			JOIN master_category_coa mcc ON mc.master_category_coa_id = mcc.id
			WHERE mcc.is_kas_bank = true`).Scan(&akunKas)

	if len(akunKas) == 0 {
		return 0
	}

	for _, kode := range akunKas {
		// Kas adalah Aset (Tipe 1), Saldo Normal Debit
		saldo := getSaldoAkun(db, kode, "1", start, end)
		total += saldo
	}
	return total
}
