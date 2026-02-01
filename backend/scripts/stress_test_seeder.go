package main

import (
	"fmt"
	"log"
	"math/rand"
	"project-akuntansi-backend/config"
	"project-akuntansi-backend/handlers"
	"project-akuntansi-backend/models"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// NEW: Ensure Schema is Up-to-Date
	fmt.Println("🔄 Migrating database schema...")
	if err := models.AutoMigrateClient(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("🚀 Starting Stress Test Seeder...")

	// 1. Clear existing transactional data
	fmt.Println("🗑️  Cleaning up existing data...")
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.GL{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.GLSummary{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.InputTransaksi{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.PenjualanDetail{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.Penjualan{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.PembelianDetail{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.Pembelian{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.AJE{})
	db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.HistoriPenyusutan{})

	// 2. Ensure Master Data exists
	var customer models.MasterPembeli
	if err := db.First(&customer).Error; err != nil {
		customer = models.MasterPembeli{Nama: "Customer Stress Test", Kode: "CUST-001"}
		db.Create(&customer)
	}

	var vendor models.MasterPemasok
	if err := db.First(&vendor).Error; err != nil {
		vendor = models.MasterPemasok{Nama: "Vendor Stress Test", Kode: "VEND-001"}
		db.Create(&vendor)
	}

	var gudang models.MasterGudang
	if err := db.First(&gudang).Error; err != nil {
		gudang = models.MasterGudang{Nama: "Gudang Stress Test", Kode: "G-001"}
		db.Create(&gudang)
	}

	var item models.MasterBarangJasa
	if err := db.First(&item).Error; err != nil {
		item = models.MasterBarangJasa{
			Nama:      "Item Stress Test",
			Kode:      "ITEM-001",
			HargaJual: 100000,
			HargaBeli: 80000,
		}
		db.Create(&item)
	}

	var coaBank models.MasterCOA
	if err := db.Where("nama LIKE ?", "%Kas%").First(&coaBank).Error; err != nil {
		fmt.Println("⚠️  No Bank/Cash account found. Please ensure Master COA is seeded.")
		return
	}

	var coaRevenue models.MasterCOA
	db.Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
		Where("master_category_coa.tipe_akun = '4'").First(&coaRevenue)

	var coaExpense models.MasterCOA
	db.Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
		Where("master_category_coa.tipe_akun = '5'").First(&coaExpense)

	// 3. Seed Input Transaksi (50,000)
	fmt.Println("📝 Seeding 50,000 Input Transaksi...")
	batchSize := 1000
	startDate := time.Now().AddDate(-1, 0, 0)

	for i := 0; i < 50000; i += batchSize {
		var batch []models.InputTransaksi
		var glBatch []models.GL
		for j := 0; j < batchSize; j++ {
			idx := i + j
			tgl := startDate.Add(time.Duration(idx) * 10 * time.Minute)
			amount := float64(10000 + rand.Intn(1000000))
			noTrans := fmt.Sprintf("TRX/%s/%05d", tgl.Format("060102"), idx)

			it := models.InputTransaksi{
				NoTransaksi:   noTrans,
				CoaAkunBank:   coaBank.Kode,
				Tanggal:       models.CustomDate{Time: tgl},
				AkunTransaksi: coaExpense.Kode,
				Deskripsi:     fmt.Sprintf("Stress Test Transaksi %d", idx),
				Debit:         amount,
				Kredit:        0,
			}
			batch = append(batch, it)

			// Generate Journal Number
			nomorJurnal := fmt.Sprintf("JV/%s/%05d", tgl.Format("060102"), idx)

			// GL entries
			glBatch = append(glBatch, models.GL{
				Tanggal:        tgl,
				COAAkunBank:    it.CoaAkunBank,
				AkunTransaksi:  it.AkunTransaksi,
				Deskripsi:      it.Deskripsi,
				Debit:          it.Debit,
				Kredit:         0,
				NomorTransaksi: it.NoTransaksi,
				NomorJurnal:    nomorJurnal,
			})
			glBatch = append(glBatch, models.GL{
				Tanggal:        tgl,
				COAAkunBank:    it.CoaAkunBank,
				AkunTransaksi:  it.CoaAkunBank,
				Deskripsi:      it.Deskripsi,
				Debit:          0,
				Kredit:         it.Debit,
				NomorTransaksi: it.NoTransaksi,
				NomorJurnal:    nomorJurnal,
			})
		}
		db.Create(&batch)
		db.Create(&glBatch)
		fmt.Printf("   ...Progress: %d/50000\n", i+batchSize)
	}

	// 4. Seed Penjualan (3,000)
	fmt.Println("💰 Seeding 3,000 Sales...")
	for i := 0; i < 3000; i++ {
		tgl := startDate.Add(time.Duration(i) * 3 * time.Hour)
		amount := float64(500000 + rand.Intn(5000000))
		noInv := fmt.Sprintf("INV/%s/%04d", tgl.Format("060102"), i)

		p := models.Penjualan{
			NomorInvoice: noInv,
			Tanggal:      tgl,
			Subtotal:     amount,
			Total:        amount,
			Status:       "posted",
			CustomerID:   customer.ID,
			GudangID:     gudang.ID,
		}
		db.Create(&p)

		// Create Detail
		db.Create(&models.PenjualanDetail{
			PenjualanID: p.ID,
			KodeItem:    item.Kode,
			NamaItem:    item.Nama,
			Qty:         1,
			Price:       amount,
			Amount:      amount,
			GudangID:    gudang.ID,
		})

		nj, _ := handlers.GenerateNomorJurnal(db, tgl)
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaBank.Kode, // Simple direct to cash for speed
			Deskripsi:      "Sales " + noInv,
			Debit:          amount,
			Kredit:         0,
			NomorTransaksi: noInv,
			NomorJurnal:    nj,
		})
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaRevenue.Kode,
			Deskripsi:      "Sales " + noInv,
			Debit:          0,
			Kredit:         amount,
			NomorTransaksi: noInv,
			NomorJurnal:    nj,
		})
	}

	// 5. Seed Pembelian (3,000)
	fmt.Println("🛒 Seeding 3,000 Purchases...")
	for i := 0; i < 3000; i++ {
		tgl := startDate.Add(time.Duration(i) * 3 * time.Hour)
		amount := float64(200000 + rand.Intn(2000000))
		noPur := fmt.Sprintf("PUR/%s/%04d", tgl.Format("060102"), i)

		p := models.Pembelian{
			NomorAPInvoice: noPur,
			Tanggal:        tgl,
			Subtotal:       amount,
			Total:          amount,
			Status:         "posted",
			SupplierID:     vendor.ID,
			GudangID:       gudang.ID,
		}
		db.Create(&p)

		// Create Detail
		db.Create(&models.PembelianDetail{
			PembelianID: p.ID,
			KodeItem:    item.Kode,
			NamaItem:    item.Nama,
			Qty:         1,
			Price:       amount,
			Amount:      amount,
			GudangId:    gudang.ID,
		})

		nj, _ := handlers.GenerateNomorJurnal(db, tgl)
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaExpense.Kode,
			Deskripsi:      "Purchase " + noPur,
			Debit:          amount,
			Kredit:         0,
			NomorTransaksi: noPur,
			NomorJurnal:    nj,
		})
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaBank.Kode,
			Deskripsi:      "Purchase " + noPur,
			Debit:          0,
			Kredit:         amount,
			NomorTransaksi: noPur,
			NomorJurnal:    nj,
		})
	}

	// 6. Seed AJE (50)
	fmt.Println("⚙️  Seeding 50 AJE...")
	for i := 0; i < 50; i++ {
		tgl := time.Now()
		noAJE := fmt.Sprintf("AJE-STRESS-%02d", i)
		nj, _ := handlers.GenerateNomorJurnal(db, tgl)

		db.Create(&models.AJE{
			NoBukti:   noAJE,
			Tanggal:   tgl.Format("2006-01-02"),
			KodeAkun:  coaExpense.Kode,
			Debit:     1000,
			Kredit:    0,
			Deskripsi: "Adjustment Stress Test",
			Posted:    true,
		})
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaExpense.Kode,
			Debit:          1000,
			Kredit:         0,
			NomorTransaksi: noAJE,
			NomorJurnal:    nj,
		})
	}

	// 7. Seed Asset Depreciation (20)
	fmt.Println("📉 Seeding 20 Asset Depreciation...")
	for i := 0; i < 20; i++ {
		tgl := time.Now()
		noDep := fmt.Sprintf("DEP-STRESS-%02d", i)
		nj, _ := handlers.GenerateNomorJurnal(db, tgl)

		db.Create(&models.HistoriPenyusutan{
			NomorTransaksi:    noDep,
			TanggalPenyusutan: tgl,
			NilaiPenyusutan:   5000,
			Periode:           tgl.Format("2006-01"),
		})
		db.Create(&models.GL{
			Tanggal:        tgl,
			AkunTransaksi:  coaExpense.Kode,
			Debit:          5000,
			Kredit:         0,
			NomorTransaksi: noDep,
			NomorJurnal:    nj,
		})
	}

	fmt.Println("✅ Stress Test Seeding Completed!")
}
