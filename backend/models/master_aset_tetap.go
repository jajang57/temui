package models

import "time"

type MasterAsetTetap struct {
	ID                      uint      `json:"id" gorm:"primaryKey"`
	KodeAset                string    `json:"kodeAset" gorm:"unique;not null"`
	NamaAset                string    `json:"namaAset" gorm:"not null"`
	KategoriAset            string    `json:"kategoriAset"` // Kendaraan, Bangunan, Peralatan, dll
	TanggalPerolehan        time.Time `json:"tanggalPerolehan"`
	HargaPerolehan          float64   `json:"hargaPerolehan" gorm:"type:decimal(18,2)"`
	UmurEkonomis            int       `json:"umurEkonomis"` // dalam bulan
	NilaiResidu             float64   `json:"nilaiResidu" gorm:"type:decimal(18,2)"`
	MetodePenyusutan        string    `json:"metodePenyusutan"` // "Garis Lurus", "Saldo Menurun"
	StatusPosting           string    `json:"statusPosting" gorm:"default:'Draft'"` // Draft, Posted, Disposed
	KodePembelian           string    `json:"kodePembelian"` // Link ke pembelian (optional)
	NomorTransaksiPembelian string    `json:"nomorTransaksiPembelian"` // Nomor transaksi pembelian
	TanggalMulaiPenyusutan  time.Time `json:"tanggalMulaiPenyusutan"`
	AkunAsetTetap           string    `json:"akunAsetTetap"` // Kode COA
	AkunAkumulasiPenyusutan string    `json:"akunAkumulasiPenyusutan"` // Kode COA
	AkunBebanPenyusutan     string    `json:"akunBebanPenyusutan"` // Kode COA
	AkunLawan               string    `json:"akunLawan"` // Akun kredit untuk posting (persediaan/kas/hutang)
	Keterangan              string    `json:"keterangan" gorm:"type:text"`
	Aktif                   bool      `json:"aktif" gorm:"default:true"`
	
	// Data Penjualan/Disposal Aset
	TanggalPenjualan        *time.Time `json:"tanggalPenjualan"` // Tanggal aset dijual
	HargaJual               float64    `json:"hargaJual" gorm:"type:decimal(18,2)"` // Harga jual aset
	NilaiBukuSaatDijual     float64    `json:"nilaiBukuSaatDijual" gorm:"type:decimal(18,2)"` // Nilai buku saat dijual
	LabaRugiPenjualan       float64    `json:"labaRugiPenjualan" gorm:"type:decimal(18,2)"` // Laba (+) / Rugi (-)
	AkunKas                 string     `json:"akunKas"` // Akun kas/bank untuk penerimaan
	AkunLabaRugiPenjualan   string     `json:"akunLabaRugiPenjualan"` // Akun laba/rugi penjualan aset
	KeteranganPenjualan     string     `json:"keteranganPenjualan" gorm:"type:text"`
	
	CreatedAt               time.Time `json:"createdAt"`
	UpdatedAt               time.Time `json:"updatedAt"`
}
