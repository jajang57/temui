package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// Helper function to log audit trail
func LogAuditTrail(db *gorm.DB, c *gin.Context, tableName string, recordID uint, action string, changes string) {
	// Get user info from context
	userID, _ := c.Get("userID")
	username, _ := c.Get("username")

	audit := models.AuditTrail{
		TableName: tableName,
		RecordID:  recordID,
		Action:    action,
		UserID:    userID.(uint),
		Username:  username.(string),
		Changes:   changes,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}

	db.Create(&audit)
}

// GET /input-transaksi/:id/audit - Get audit trail for a transaction
func GetInputTransaksiAudit(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		if idStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID transaksi diperlukan"})
			return
		}

		var auditLogs []models.AuditTrail
		err := db.Where("table_name = ? AND record_id = ?", "input_transaksi", idStr).
			Order("created_at DESC").
			Find(&auditLogs).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Format response
		type AuditResponse struct {
			Action    string `json:"action"`
			User      string `json:"user"`
			Timestamp string `json:"timestamp"`
			Changes   string `json:"changes"`
		}

		var response []AuditResponse
		for _, log := range auditLogs {
			response = append(response, AuditResponse{
				Action:    log.Action,
				User:      log.Username,
				Timestamp: log.CreatedAt.Format("2006-01-02 15:04:05"),
				Changes:   log.Changes,
			})
		}

		c.JSON(http.StatusOK, response)
	}
}

// Helper to generate change description
func GenerateChangeDescription(action string, oldData, newData interface{}) string {
	switch action {
	case "CREATE":
		return "Transaksi dibuat"
	case "DELETE":
		return "Transaksi dihapus"
	case "UPDATE":
		oldJSON, _ := json.Marshal(oldData)
		newJSON, _ := json.Marshal(newData)
		return fmt.Sprintf("Data diubah dari %s menjadi %s", string(oldJSON), string(newJSON))
	default:
		return "Perubahan tidak diketahui"
	}
}

// GET /bulk-import-template - Download template Excel untuk bulk import
func DownloadBulkImportTemplate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a new Excel file
		f := excelize.NewFile()
		defer func() {
			if err := f.Close(); err != nil {
				fmt.Println(err)
			}
		}()

		// Create a new sheet
		sheetName := "Template"
		index, err := f.NewSheet(sheetName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Set active sheet
		f.SetActiveSheet(index)

		// Delete default sheet
		f.DeleteSheet("Sheet1")

		// Set header style
		headerStyle, err := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{
				Bold:  true,
				Size:  12,
				Color: "FFFFFF",
			},
			Fill: excelize.Fill{
				Type:    "pattern",
				Color:   []string{"4472C4"},
				Pattern: 1,
			},
			Alignment: &excelize.Alignment{
				Horizontal: "center",
				Vertical:   "center",
			},
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Set headers
		headers := []string{"Tanggal", "Akun Transaksi", "Debit", "Kredit", "Deskripsi", "Project No"}
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue(sheetName, cell, header)
			f.SetCellStyle(sheetName, cell, cell, headerStyle)
		}

		// Set column widths
		f.SetColWidth(sheetName, "A", "A", 15) // Tanggal
		f.SetColWidth(sheetName, "B", "B", 20) // Akun Transaksi
		f.SetColWidth(sheetName, "C", "C", 15) // Debit
		f.SetColWidth(sheetName, "D", "D", 15) // Kredit
		f.SetColWidth(sheetName, "E", "E", 35) // Deskripsi
		f.SetColWidth(sheetName, "F", "F", 15) // Project No

		// Add example data (optional)
		exampleData := [][]interface{}{
			{"2025-01-01", "1111", 1000000, 0, "Contoh Penerimaan Kas", "PRJ001"},
			{"2025-01-02", "5111", 0, 500000, "Contoh Beban Gaji", ""},
			{"2025-01-03", "1112", 750000, 0, "Contoh Penjualan", "PRJ002"},
		}

		// Example data style
		exampleStyle, _ := f.NewStyle(&excelize.Style{
			Fill: excelize.Fill{
				Type:    "pattern",
				Color:   []string{"E7E6E6"},
				Pattern: 1,
			},
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
			},
		})

		for rowIdx, row := range exampleData {
			for colIdx, value := range row {
				cell := fmt.Sprintf("%c%d", 'A'+colIdx, rowIdx+2)
				f.SetCellValue(sheetName, cell, value)
				f.SetCellStyle(sheetName, cell, cell, exampleStyle)
			}
		}

		// Add instruction sheet
		instructionSheet := "Petunjuk"
		f.NewSheet(instructionSheet)
		f.SetCellValue(instructionSheet, "A1", "PETUNJUK PENGGUNAAN TEMPLATE BULK IMPORT")
		f.SetCellValue(instructionSheet, "A3", "1. Kolom wajib diisi:")
		f.SetCellValue(instructionSheet, "A4", "   - Tanggal: Format YYYY-MM-DD (contoh: 2025-01-01)")
		f.SetCellValue(instructionSheet, "A5", "   - Akun Transaksi: Kode COA (contoh: 1111, 5111)")
		f.SetCellValue(instructionSheet, "A6", "   - Debit atau Kredit: Angka tanpa pemisah ribuan (salah satu harus diisi)")
		f.SetCellValue(instructionSheet, "A7", "   - Deskripsi: Keterangan transaksi")
		f.SetCellValue(instructionSheet, "A9", "2. Kolom opsional:")
		f.SetCellValue(instructionSheet, "A10", "   - Project No: Kode project (jika ada)")
		f.SetCellValue(instructionSheet, "A12", "3. Tips:")
		f.SetCellValue(instructionSheet, "A13", "   - Hapus baris contoh sebelum mengisi data Anda")
		f.SetCellValue(instructionSheet, "A14", "   - Pastikan format tanggal benar")
		f.SetCellValue(instructionSheet, "A15", "   - Kode akun harus sesuai dengan Master COA")
		f.SetCellValue(instructionSheet, "A16", "   - Hanya isi Debit ATAU Kredit, tidak boleh keduanya")

		// Set instruction style
		titleStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{
				Bold: true,
				Size: 14,
			},
		})
		f.SetCellStyle(instructionSheet, "A1", "A1", titleStyle)

		// Set response headers
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename=template-bulk-import.xlsx")
		c.Header("Content-Transfer-Encoding", "binary")

		// Write file to response
		if err := f.Write(c.Writer); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
}
