package models

import (
	"database/sql/driver"
	"fmt"
	"time"
)

// CustomDate untuk handle format YYYY-MM-DD
type CustomDate struct {
	time.Time
}

// UnmarshalJSON untuk parsing JSON dengan format YYYY-MM-DD
func (cd *CustomDate) UnmarshalJSON(b []byte) error {
	s := string(b)
	// Remove quotes
	s = s[1 : len(s)-1]
	
	// Try parsing as YYYY-MM-DD first
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		// If fails, try RFC3339 format
		t, err = time.Parse(time.RFC3339, s)
		if err != nil {
			return err
		}
	}
	cd.Time = t
	return nil
}

// MarshalJSON untuk output JSON
func (cd CustomDate) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf(`"%s"`, cd.Time.Format("2006-01-02T15:04:05Z07:00"))), nil
}

// Value untuk save ke database
func (cd CustomDate) Value() (driver.Value, error) {
	return cd.Time, nil
}

// Scan untuk read dari database
func (cd *CustomDate) Scan(value interface{}) error {
	if value == nil {
		cd.Time = time.Time{}
		return nil
	}
	if t, ok := value.(time.Time); ok {
		cd.Time = t
		return nil
	}
	return fmt.Errorf("cannot scan %T into CustomDate", value)
}

type InputTransaksi struct {
	ID            uint       `json:"id"`
	NoTransaksi   string     `json:"noTransaksi"`
	CoaAkunBank   string     `json:"coaAkunBank"`
	Tanggal       CustomDate `json:"tanggal"`
	AkunTransaksi string     `json:"akunTransaksi"`
	Deskripsi     string     `json:"deskripsi"`
	ProjectNo     string     `json:"projectNo"`
	ProjectName   string     `json:"projectName"`
	Debit         float64    `json:"debit"`
	Kredit        float64    `json:"kredit"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
