package models

import (
	"time"

	"gorm.io/gorm"
)

type HistoriPenyusutan struct {
	ID                      uint           `json:"id" gorm:"primaryKey"`
	KodeAset                string         `json:"kodeAset" gorm:"not null"`
	NamaAset                string         `json:"namaAset"`
	Periode                 string         `json:"periode" gorm:"not null"` // Format: YYYY-MM
	TanggalPenyusutan       time.Time      `json:"tanggalPenyusutan"`
	NilaiPenyusutan         float64        `json:"nilaiPenyusutan" gorm:"type:decimal(18,2)"`
	AkumulasiPenyusutan     float64        `json:"akumulasiPenyusutan" gorm:"type:decimal(18,2)"`
	NilaiBuku               float64        `json:"nilaiBuku" gorm:"type:decimal(18,2)"` // Harga Perolehan - Akumulasi Penyusutan
	AkunBebanPenyusutan     string         `json:"akunBebanPenyusutan"`
	AkunAkumulasiPenyusutan string         `json:"akunAkumulasiPenyusutan"`
	NomorTransaksi          string         `json:"nomorTransaksi"`
	StatusPosting           string         `json:"statusPosting" gorm:"default:'Draft'"` // Draft, Posted
	Keterangan              string         `json:"keterangan" gorm:"type:text"`
	CreatedAt               time.Time      `json:"createdAt"`
	UpdatedAt               time.Time      `json:"updatedAt"`
	DeletedAt               gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

func (HistoriPenyusutan) TableName() string {
	return "histori_penyusutan"
}
