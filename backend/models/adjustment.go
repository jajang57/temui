package models

import (
	"time"

	"gorm.io/gorm"
)

type Adjustment struct {
	ID              uint             `json:"id" gorm:"primaryKey"`
	Tanggal         time.Time        `json:"tanggal"`
	NoBukti         string           `json:"noBukti" gorm:"uniqueIndex;type:varchar(50)"`
	GudangID        uint             `json:"gudangId"`
	Gudang          MasterGudang     `json:"gudang" gorm:"foreignKey:GudangID"`
	ItemID          string           `json:"itemCode" gorm:"type:varchar(50)"` // Linked to MasterBarangJasa.Kode
	Item            MasterBarangJasa `json:"item" gorm:"foreignKey:ItemID;references:Kode"`
	QtySystem       float64          `json:"qtySystem"`
	QtyActual       float64          `json:"qtyActual"`
	QtyDiff         float64          `json:"qtyDiff"`
	Alasan          string           `json:"alasan" gorm:"type:text"`
	ContraAccountID *uint            `json:"contraAccountId"`
	ContraAccount   *MasterCOA       `json:"contraAccount" gorm:"foreignKey:ContraAccountID"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `json:"deleted_at" gorm:"index"`
}

func (Adjustment) TableName() string {
	return "inventory_adjustments"
}
