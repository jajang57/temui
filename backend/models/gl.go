package models

import (
	"time"

	"gorm.io/gorm"
)

type GL struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Tanggal        time.Time      `json:"tanggal"`
	COAAkunBank    string         `json:"coaAkunBank"`
	AkunTransaksi  string         `json:"akunTransaksi"`
	Deskripsi      string         `json:"deskripsi"`
	Debit          float64        `json:"debit"`
	Kredit         float64        `json:"kredit"`
	NomorTransaksi string         `json:"nomorTransaksi"`
	NomorJurnal    string         `json:"nomorJurnal"`
	ProjectNo      string         `json:"projectNo"`
	ProjectName    string         `json:"projectName"`
	ContactID      uint           `json:"contactID"`
	ContactType    string         `json:"contactType"` // "customer", "supplier", etc.
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (GL) TableName() string {
	return "gl"
}
