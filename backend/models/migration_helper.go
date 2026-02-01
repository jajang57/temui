package models

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// AutoMigrateClient runs all migrations and seeds for a client database
func AutoMigrateClient(db *gorm.DB) error {
	// 1. Auto Migrate Tables
	err := db.AutoMigrate(
		&MasterGudang{},
		&AJE{},
		&UserThemeSetting{},
		&MasterCOA{},
		&MasterCategoryCOA{},
		&InputTransaksi{},
		&User{},
		&MasterProject{},
		&GL{},
		&GLSummary{},
		&MasterKelompokItem{},
		&MasterKategori{},
		&MasterBarangJasa{},
		&Penjualan{},
		&PenjualanDetail{},
		&MasterGudangGroup{},
		&MasterDepartement{},
		&MasterPembeli{},
		&MasterPemasok{},
		&MasterMataUang{},
		&MasterPajak{},
		&Pembelian{},
		&PembelianDetail{},
		&MasterAsetTetap{},
		&HistoriPenyusutan{},
		&AuditTrail{},
		&Adjustment{},
		&CompanyProfile{},
		&MasterKaryawan{},
	)
	if err != nil {
		return err
	}

	// 2. Run Seeds / Data Fixes
	migrateKodeCategory(db)
	seedCashflowMappings(db)
	populateGLContactInfo(db)

	return nil
}

func populateGLContactInfo(db *gorm.DB) {
	// Populate for Sales (Penjualan)
	db.Exec(`UPDATE gl 
	         SET contact_id = penjualan.customer_id, contact_type = 'customer' 
	         FROM penjualan 
	         WHERE gl.nomor_transaksi = penjualan.nomor_invoice 
	         AND (gl.contact_id = 0 OR gl.contact_id IS NULL)`)

	// Populate for Purchases (Pembelian)
	db.Exec(`UPDATE gl 
	         SET contact_id = pembelians.supplier_id, contact_type = 'supplier' 
	         FROM pembelians 
	         WHERE gl.nomor_transaksi = pembelians.nomor_ap_invoice 
	         AND (gl.contact_id = 0 OR gl.contact_id IS NULL)`)
}

func migrateKodeCategory(db *gorm.DB) {
	var categories []MasterCategoryCOA
	// Check table exists to prevent error during first run if migrate failed
	if !db.Migrator().HasTable(&MasterCategoryCOA{}) {
		return
	}
	db.Where("kode = '' OR kode IS NULL").Find(&categories)

	if len(categories) > 0 {
		fmt.Printf("Migrating %d categories without kode\n", len(categories))

		for i, cat := range categories {
			var kode string
			switch cat.TipeAkun {
			case "Asset":
				kode = fmt.Sprintf("AST%03d", i+1)
			case "Kewajiban":
				kode = fmt.Sprintf("LIA%03d", i+1)
			case "Modal":
				kode = fmt.Sprintf("EQT%03d", i+1)
			case "Pendapatan":
				kode = fmt.Sprintf("REV%03d", i+1)
			case "Beban":
				kode = fmt.Sprintf("EXP%03d", i+1)
			default:
				kode = fmt.Sprintf("GEN%03d", i+1)
			}

			db.Model(&cat).Update("kode", kode)
		}
		fmt.Println("Migration (Kode Category) completed!")
	}
}

func seedCashflowMappings(db *gorm.DB) {
	if !db.Migrator().HasTable(&MasterCOA{}) {
		return
	}

	var coas []MasterCOA
	// Ambil COA yang belum punya mapping dan preload kategorinya
	if err := db.Preload("MasterCategoryCOA").Where("cashflow_activity = '' OR cashflow_activity IS NULL").Find(&coas).Error; err != nil {
		fmt.Println("Error fetching COA for seeding:", err)
		return
	}

	if len(coas) == 0 {
		return
	}

	fmt.Printf("Seeding cashflow mapping for %d accounts...\n", len(coas))
	count := 0

	for _, akun := range coas {
		nama := strings.ToLower(akun.Nama)
		tipe := akun.MasterCategoryCOA.TipeAkun
		var activity string

		// Logic Heuristik
		if tipe == "1" { // Aset
			if strings.Contains(nama, "tetap") || strings.Contains(nama, "bangunan") ||
				strings.Contains(nama, "kendaraan") || strings.Contains(nama, "tanah") ||
				strings.Contains(nama, "akumulasi") || strings.Contains(nama, "investasi") {
				activity = "investing"
			} else {
				activity = "operating"
			}
		} else if tipe == "2" { // Kewajiban
			if strings.Contains(nama, "jangka panjang") || strings.Contains(nama, "bank") || strings.Contains(nama, "investor") {
				activity = "financing"
			} else {
				activity = "operating"
			}
		} else if tipe == "3" { // Modal
			if !strings.Contains(nama, "laba") { // Skip Laba Ditahan/Berjalan (biasanya auto calculated)
				activity = "financing"
			}
		}

		if activity != "" {
			db.Model(&akun).Update("cashflow_activity", activity)
			count++
		}
	}
	fmt.Printf("Seeded %d accounts with cashflow mapping.\n", count)
}
