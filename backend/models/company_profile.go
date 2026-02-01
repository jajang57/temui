package models

import (
	"time"

	"gorm.io/gorm"
)

type CompanyProfile struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Nama      string         `json:"nama" gorm:"type:varchar(255)"`
	Alamat    string         `json:"alamat" gorm:"type:text"`
	NoTelepon string         `json:"noTelepon" gorm:"type:varchar(50)"`
	Email     string         `json:"email" gorm:"type:varchar(100)"`
	Website   string         `json:"website" gorm:"type:varchar(100)"`
	NPWP      string         `json:"npwp" gorm:"type:varchar(50)"`
	LogoPath  string         `json:"logoPath" gorm:"type:varchar(255)"` // Path to uploaded logo
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

func (CompanyProfile) TableName() string {
	return "company_profiles"
}
