package models

import (
	"time"

	"gorm.io/gorm"
)

type AuditTrail struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	TableName     string         `gorm:"type:varchar(100)" json:"tableName"`
	RecordID      uint           `json:"recordId"`
	Action        string         `gorm:"type:varchar(20)" json:"action"` // CREATE, UPDATE, DELETE
	UserID        uint           `json:"userId"`
	Username      string         `gorm:"type:varchar(100)" json:"username"`
	Changes       string         `gorm:"type:text" json:"changes"`
	IPAddress     string         `gorm:"type:varchar(50)" json:"ipAddress"`
	UserAgent     string         `gorm:"type:text" json:"userAgent"`
	CreatedAt     time.Time      `json:"timestamp"`
	UpdatedAt     time.Time      `json:"-"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
