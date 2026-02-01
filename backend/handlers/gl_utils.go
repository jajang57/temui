package handlers

import (
	"fmt"
	"project-akuntansi-backend/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// GenerateNomorJurnal generates a unique journal number with format JV/YYMMDD/XXXXX
func GenerateNomorJurnal(db *gorm.DB, tanggal time.Time) (string, error) {
	// Format: JV/YYMMDD/
	prefix := fmt.Sprintf("JV/%s/", tanggal.Format("060102"))

	var lastGL models.GL
	// Find the highest sequence number for today
	err := db.Unscoped().
		Where("nomor_jurnal LIKE ?", prefix+"%").
		Order("nomor_jurnal DESC").
		First(&lastGL).Error

	sequence := 1
	if err == nil {
		// Extract sequence from "JV/YYMMDD/XXXXX"
		parts := strings.Split(lastGL.NomorJurnal, "/")
		if len(parts) == 3 {
			lastSeq, err := strconv.Atoi(parts[2])
			if err == nil {
				sequence = lastSeq + 1
			}
		}
	} else if err != gorm.ErrRecordNotFound {
		return "", err
	}

	return fmt.Sprintf("%s%05d", prefix, sequence), nil
}
