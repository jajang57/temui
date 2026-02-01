package database

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ClientDBConfig mirrors the structure saved in DBConfig JSON
type ClientDBConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	DBName   string `json:"database"` // JSON uses "database" not "dbname"
}

var (
	clientDBs sync.Map // map[string]*gorm.DB (Cache connections)
)

// GetClientDB returns a cached DB connection or creates a new one
func GetClientDB(clientID string, configJSON string) (*gorm.DB, error) {
	// 1. Check Cache
	if db, ok := clientDBs.Load(clientID); ok {
		return db.(*gorm.DB), nil
	}

	// 2. Parse Config
	var conf ClientDBConfig
	if err := json.Unmarshal([]byte(configJSON), &conf); err != nil {
		return nil, fmt.Errorf("invalid db config: %v", err)
	}

	// Validate Config
	if conf.Host == "" || conf.User == "" || conf.DBName == "" {
		return nil, fmt.Errorf("incomplete db config")
	}
	if conf.Port == "" {
		conf.Port = "5432"
	}

	// 3. Connect
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		conf.Host, conf.User, conf.Password, conf.DBName, conf.Port)

	// Use default logger to avoid nil pointer panic
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// 4. Connection Pooling settings
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// 5. Store in Cache
	clientDBs.Store(clientID, db)
	fmt.Printf("✅ Opened new connection for Client %s (%s@%s)\n", clientID, conf.DBName, conf.Host)

	return db, nil
}

// ClearClientDB removes a connection from cache (e.g. after update config)
func ClearClientDB(clientID string) {
	if val, ok := clientDBs.LoadAndDelete(clientID); ok {
		db := val.(*gorm.DB)
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
		fmt.Printf("Connection closed/cleared for Client %s\n", clientID)
	}
}
