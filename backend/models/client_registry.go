package models

import (
	"time"
)

// ClientRegistry represents a client in the consultant's registry
type ClientRegistry struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	URL       string    `gorm:"not null" json:"url"`
	DBConfig  string    `gorm:"column:db_config;type:text" json:"dbConfig"` // JSON string of database config
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName specifies the table name for ClientRegistry
func (ClientRegistry) TableName() string {
	return "client_registry"
}
