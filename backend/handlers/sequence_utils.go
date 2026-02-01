package handlers

import (
	"fmt"
	"project-akuntansi-backend/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// GenerateNomorInvoice generates a unique sales invoice number with format INV/YYMMDD/XXXX
// Example: INV/260129/0001
func GenerateNomorInvoice(db *gorm.DB, tanggal time.Time) (string, error) {
	// Format: INV/YYMMDD/
	prefix := fmt.Sprintf("INV/%s/", tanggal.Format("060102"))

	var lastPenjualan models.Penjualan
	// Find the highest sequence number for this date prefix
	// Note: We use Unscoped to include soft-deleted records to avoid duplication if a record was deleted
	err := db.Unscoped().
		Where("nomor_invoice LIKE ?", prefix+"%").
		Order("nomor_invoice DESC").
		First(&lastPenjualan).Error

	sequence := 1
	if err == nil {
		// Extract sequence from "INV/YYMMDD/XXXX"
		parts := strings.Split(lastPenjualan.NomorInvoice, "/")
		if len(parts) == 3 {
			lastSeq, err := strconv.Atoi(parts[2])
			if err == nil {
				sequence = lastSeq + 1
			}
		}
	} else if err != gorm.ErrRecordNotFound {
		return "", err
	}

	return fmt.Sprintf("%s%04d", prefix, sequence), nil
}

// GenerateNomorAPInvoice generates a unique purchase invoice number with format APINV/YYMMDD/XXXX
// Example: APINV/260129/0001
func GenerateNomorAPInvoice(db *gorm.DB, tanggal time.Time) (string, error) {
	// Format: APINV/YYMMDD/
	prefix := fmt.Sprintf("APINV/%s/", tanggal.Format("060102"))

	var lastPembelian models.Pembelian
	// Find the highest sequence number for this date prefix
	err := db.Unscoped().
		Where("nomor_ap_invoice LIKE ?", prefix+"%").
		Order("nomor_ap_invoice DESC").
		First(&lastPembelian).Error

	sequence := 1
	if err == nil {
		// Extract sequence from "APINV/YYMMDD/XXXX"
		// Adjust split logic if needed, assuming format is consistent
		parts := strings.Split(lastPembelian.NomorAPInvoice, "/")
		if len(parts) == 3 {
			lastSeq, err := strconv.Atoi(parts[2])
			if err == nil {
				sequence = lastSeq + 1
			}
		}
	} else if err != gorm.ErrRecordNotFound {
		return "", err
	}

	return fmt.Sprintf("%s%04d", prefix, sequence), nil
}
