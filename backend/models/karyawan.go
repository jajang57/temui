package models

import (
	"time"

	"gorm.io/gorm"
)

type MasterKaryawan struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	NIK              string         `json:"nik" gorm:"uniqueIndex;type:varchar(50)"`
	Nama             string         `json:"nama" gorm:"type:varchar(255)"`
	TempatLahir      string         `json:"tempatLahir" gorm:"type:varchar(100)"`
	TanggalLahir     *time.Time     `json:"tanggalLahir"`
	JenisKelamin     string         `json:"jenisKelamin" gorm:"type:varchar(20)"`
	StatusPernikahan string         `json:"statusPernikahan" gorm:"type:varchar(50)"`
	Alamat           string         `json:"alamat" gorm:"type:text"`
	Kota             string         `json:"kota" gorm:"type:varchar(100)"`
	KodePos          string         `json:"kodePos" gorm:"type:varchar(20)"`
	NoTelepon        string         `json:"noTelepon" gorm:"type:varchar(50)"`
	Email            string         `json:"email" gorm:"type:varchar(100)"`
	Departemen       string         `json:"departemen" gorm:"type:varchar(100)"`
	Jabatan          string         `json:"jabatan" gorm:"type:varchar(100)"`
	TanggalMasuk     *time.Time     `json:"tanggalMasuk"`
	StatusKaryawan   string         `json:"statusKaryawan" gorm:"type:varchar(50)"` // Aktif, Tidak Aktif, Cuti
	GajiPokok        float64        `json:"gajiPokok"`
	Tunjangan        float64        `json:"tunjangan"`
	NoRekening       string         `json:"noRekening" gorm:"type:varchar(50)"`
	NamaBank         string         `json:"namaBank" gorm:"type:varchar(100)"`
	NPWP             string         `json:"npwp" gorm:"type:varchar(50)"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

func (MasterKaryawan) TableName() string {
	return "master_karyawan"
}
