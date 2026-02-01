package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Error khusus validasi akun GL agar frontend bisa munculkan popup yang tepat
type GLAccountError struct {
	Code    string
	Field   string
	Message string
}

func (e *GLAccountError) Error() string { return e.Message }

func NewGLAccountError(field, code, msg string) *GLAccountError {
	return &GLAccountError{Code: code, Field: field, Message: msg}
}

// Helper respon + rollback untuk GL error
func respondGLValidationError(c *gin.Context, tx *gorm.DB, err error) {
	if tx != nil {
		_ = tx.Rollback().Error
	}
	if ge, ok := err.(*GLAccountError); ok {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"success": false,
			"code":    ge.Code,
			"field":   ge.Field,
			"message": ge.Message,
		})
		return
	}
	c.JSON(http.StatusBadRequest, gin.H{
		"success": false,
		"message": err.Error(),
	})
}

type PembelianHandler struct {
	DB *gorm.DB
}

func NewPembelianHandler(db *gorm.DB) *PembelianHandler {
	return &PembelianHandler{DB: db}
}

// CurrencyAccountsap struct untuk mapping account pemasok
type CurrencyAccountsap struct {
	PayableAccount  string // Hutang Usaha
	DiscountAccount string // Diskon Beli
	FreightAccount  string // Biaya Lain-lain
	StampAccount    string // Biaya Materai
}

// CreatePembelian - Create AP Invoice (header + detail + GL)
func (h *PembelianHandler) CreatePembelian(c *gin.Context) {
	var req models.Pembelian
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[pembelian] JSON bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[pembelian] CreatePembelian request: %+v", req)

	// Parse tanggal dari string jika ada
	if req.TanggalStr != "" {
		tgl, err := time.Parse("2006-01-02", req.TanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal salah"})
			return
		}
		req.Tanggal = tgl
	}

	if req.DeliveryDateStr != "" {
		delivery, err := time.Parse("2006-01-02", req.DeliveryDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format delivery date salah"})
			return
		}
		req.DeliveryDate = delivery
	}

	// Validation: ensure required fields
	// Allow empty/AUTO for auto-generation
	if req.NomorAPInvoice == "" {
		req.NomorAPInvoice = "AUTO"
	}

	if req.SupplierID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok harus dipilih"})
		return
	}
	if len(req.Details) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Detail barang harus diisi"})
		return
	}

	// Validate pemasok exists
	var pemasok models.MasterPemasok
	if err := h.DB.First(&pemasok, req.SupplierID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok tidak ditemukan"})
		return
	}

	// Check duplicate jika bukan AUTO
	if req.NomorAPInvoice != "AUTO" {
		var existing models.Pembelian
		if err := h.DB.Where("nomor_ap_invoice = ?", req.NomorAPInvoice).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor AP Invoice sudah ada"})
			return
		}
	}

	// START TRANSACTION
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during transaction: %v", r)
		}
	}()

	// Generate Nomor AP Invoice jika AUTO
	if req.NomorAPInvoice == "AUTO" {
		newAPInvoice, err := GenerateNomorAPInvoice(tx, req.Tanggal)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate nomor AP invoice", "details": err.Error()})
			return
		}
		req.NomorAPInvoice = newAPInvoice
	}

	// Hitung subtotal & totals dari details
	var subtotal float64
	var totalTaxAmount1, totalTaxAmount2, totalTaxAmount3 float64

	for i := range req.Details {
		detail := &req.Details[i]
		subtotal += detail.Qty * detail.Price
		totalTaxAmount1 += detail.TaxAmount1
		totalTaxAmount2 += detail.TaxAmount2
		totalTaxAmount3 += detail.TaxAmount3
	}

	req.Subtotal = subtotal
	req.TaxAmount1 = totalTaxAmount1
	req.TaxAmount2 = totalTaxAmount2
	req.TaxAmount3 = totalTaxAmount3
	req.PPNMasukan = totalTaxAmount1 // Assume tax1 is PPN Masukan
	req.Total = subtotal + totalTaxAmount1 + totalTaxAmount2 + totalTaxAmount3 + req.Freight + req.Stamp

	// Insert header
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to create header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan AP Invoice"})
		return
	}

	log.Printf("[pembelian] AP Invoice header created with ID: %d", req.ID)

	// Generate dan insert GL entries
	glLines, err := GenerateAPInvoiceGLLines(tx, req)
	if err != nil {
		// Jika error validasi akun GL -> 422 agar frontend popup
		if _, ok := err.(*GLAccountError); ok {
			respondGLValidationError(c, tx, err)
			return
		}
		tx.Rollback()
		log.Printf("[pembelian] failed to generate GL lines: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal generate GL: %v", err)})
		return
	}

	if len(glLines) > 0 {
		if err := tx.Create(&glLines).Error; err != nil {
			tx.Rollback()
			log.Printf("[pembelian] failed to create GL lines: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan GL entries"})
			return
		}
		log.Printf("[pembelian] Created %d GL entries", len(glLines))
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan transaksi"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully created: %s", req.NomorAPInvoice)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "AP Invoice berhasil disimpan",
		"data":    req,
	})
}

// GetAllPembelian - Get All AP Invoices (paginated, searchable, sortable)
func (h *PembelianHandler) GetAllPembelian(c *gin.Context) {
	// Parse pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "id")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// Adjust page/limit defaults
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	var results []struct {
		models.Pembelian
		SupplierNama string `json:"supplierNama"`
	}
	var total int64

	// Build query with JOIN
	query := h.DB.Table("pembelians").
		Select("pembelians.*, master_pemasoks.nama as supplier_nama").
		Joins("LEFT JOIN master_pemasoks ON pembelians.supplier_id = master_pemasoks.id")

	// Global Search (AP Invoice OR Supplier Name OR Status)
	if search != "" {
		searchLike := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(pembelians.nomor_ap_invoice) LIKE ? OR LOWER(master_pemasoks.nama) LIKE ? OR LOWER(pembelians.status) LIKE ?", searchLike, searchLike, searchLike)
	}

	// Specific Filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	supplierID := c.Query("supplier_id")

	if startDate != "" && endDate != "" {
		query = query.Where("pembelians.tanggal BETWEEN ? AND ?", startDate, endDate)
	}
	if supplierID != "" {
		query = query.Where("pembelians.supplier_id = ?", supplierID)
	}

	// Dynamic Sorting
	switch sortBy {
	case "nomorAPInvoice":
		sortBy = "pembelians.nomor_ap_invoice"
	case "tanggal":
		sortBy = "pembelians.tanggal"
	case "supplierNama":
		sortBy = "master_pemasoks.nama"
	case "total":
		sortBy = "pembelians.total"
	case "status":
		sortBy = "pembelians.status"
	default:
		sortBy = "pembelians.id"
	}
	if sortOrder != "asc" {
		sortOrder = "desc"
	}

	// Apply Sorting
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Count total before pagination
	query.Count(&total)

	// Fetch data with pagination
	if err := query.Limit(limit).Offset(offset).Scan(&results).Error; err != nil {
		log.Printf("[pembelian] failed to fetch AP invoices: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data AP Invoice"})
		return
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	// Format response matches struct
	var data []gin.H
	for _, r := range results {
		data = append(data, gin.H{
			"id":             r.ID,
			"nomorapinvoice": r.NomorAPInvoice,
			"tanggal":        r.Tanggal.Format("2006-01-02"),
			"supplierId":     r.SupplierID,
			"supplierNama":   r.SupplierNama, // From JOIN
			"total":          r.Total,
			"status":         r.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": gin.H{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	})
}

// GetPembelianByID - Get AP Invoice by ID
func (h *PembelianHandler) GetPembelianByID(c *gin.Context) {
	id := c.Param("id")
	var pembelian models.Pembelian

	if err := h.DB.Preload("Details").First(&pembelian, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelian,
	})
}

// UpdatePembelian - Delete All Then Recreate
func (h *PembelianHandler) UpdatePembelian(c *gin.Context) {
	id := c.Param("id")
	log.Printf("[pembelian] UpdatePembelian request for ID=%s", id)

	var req models.Pembelian
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[pembelian] JSON bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing pembelian for reference
	var existing models.Pembelian
	if err := h.DB.First(&existing, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found for update: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	// Validate pemasok exists
	var pemasok models.MasterPemasok
	if err := h.DB.First(&pemasok, req.SupplierID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok tidak ditemukan"})
		return
	}

	// Parse tanggal dari string jika ada
	if req.TanggalStr != "" {
		tgl, err := time.Parse("2006-01-02", req.TanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal salah"})
			return
		}
		req.Tanggal = tgl
	}

	if req.DeliveryDateStr != "" {
		delivery, err := time.Parse("2006-01-02", req.DeliveryDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format delivery date salah"})
			return
		}
		req.DeliveryDate = delivery
	}

	// Validation: ensure required fields
	if len(req.Details) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Detail barang harus diisi"})
		return
	}

	// Normalisasi field JSON agar tidak mengirim '' ke kolom JSON
	if strings.TrimSpace(req.NomorRefSupplier) == "" {
		// jika kolom json -> gunakan "null"; jika kolom text, biarkan ""
		req.NomorRefSupplier = "null"
	}
	if strings.TrimSpace(req.Notes) == "" {
		req.Notes = "null" // atau "{}" jika skema Anda mengharapkan object
	}

	// ✅ START TRANSACTION - DELETE ALL THEN RECREATE
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during transaction: %v", r)
		}
	}()

	log.Printf("[pembelian] STEP 1: Deleting existing GL entries (hard delete)...")
	// 1. Delete existing GL entries
	// Perbaikan kolom: gunakan nomor_transaksi sesuai models.GL
	if err := tx.Unscoped().
		Where("nomor_transaksi = ?", existing.NomorAPInvoice).
		Delete(&models.GL{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete GL entries: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus GL entries"})
		return
	}

	log.Printf("[pembelian] STEP 2: Deleting existing details (hard delete)...")
	// 2. Delete existing details
	if err := tx.Unscoped().
		Where("pembelian_id = ?", id).
		Delete(&models.PembelianDetail{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus detail"})
		return
	}

	log.Printf("[pembelian] STEP 3: Deleting existing header (hard delete)...")
	// 3. Delete existing header
	if err := tx.Unscoped().Delete(&existing).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus header"})
		return
	}

	// 4. Set ID untuk recreate dengan ID yang sama
	idUint, _ := strconv.ParseUint(id, 10, 32)
	req.ID = uint(idUint)

	// Hitung subtotal & totals dari details baru
	var subtotal float64
	var totalTaxAmount1, totalTaxAmount2, totalTaxAmount3 float64

	for i := range req.Details {
		detail := &req.Details[i]
		detail.PembelianID = req.ID // Set foreign key
		subtotal += detail.Qty * detail.Price
		totalTaxAmount1 += detail.TaxAmount1
		totalTaxAmount2 += detail.TaxAmount2
		totalTaxAmount3 += detail.TaxAmount3
	}

	req.Subtotal = subtotal
	req.TaxAmount1 = totalTaxAmount1
	req.TaxAmount2 = totalTaxAmount2
	req.TaxAmount3 = totalTaxAmount3
	req.PPNMasukan = totalTaxAmount1
	req.Total = subtotal + totalTaxAmount1 + totalTaxAmount2 + totalTaxAmount3 + req.Freight + req.Stamp

	log.Printf("[pembelian] STEP 5: Insert header baru dengan ID yang sama...")
	// 5. Insert header baru dengan ID yang sama
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to recreate header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan ulang header"})
		return
	}

	// Opsional: sinkronkan sequence agar insert berikutnya aman (PostgreSQL)
	_ = tx.Exec(`SELECT setval(pg_get_serial_sequence('pembelians','id'), (SELECT COALESCE(MAX(id),0) FROM pembelians))`).Error

	log.Printf("[pembelian] STEP 6: Generate dan insert GL entries baru...")
	// 6. Generate dan insert GL entries baru
	glLines, err := GenerateAPInvoiceGLLines(tx, req)
	if err != nil {
		if _, ok := err.(*GLAccountError); ok {
			respondGLValidationError(c, tx, err)
			return
		}
		tx.Rollback()
		log.Printf("[pembelian] failed to generate GL lines: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal generate GL: %v", err)})
		return
	}

	if len(glLines) > 0 {
		if err := tx.Create(&glLines).Error; err != nil {
			tx.Rollback()
			log.Printf("[pembelian] failed to create GL lines: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan GL entries"})
			return
		}
		log.Printf("[pembelian] Created %d GL entries", len(glLines))
	}

	log.Printf("[pembelian] STEP 7: Commit transaction...")
	// 7. Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan transaksi"})
		return
	}

	log.Printf("[pembelian] STEP 8: Return fresh data untuk frontend sync...")
	// 8. Return fresh data untuk frontend sync
	var freshData models.Pembelian
	if err := h.DB.Preload("Details").First(&freshData, req.ID).Error; err != nil {
		log.Printf("[pembelian] failed to fetch fresh data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data terbaru"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully updated: %s", req.NomorAPInvoice)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AP Invoice berhasil diupdate",
		"data":    freshData,
	})
}

// DeletePembelian - Delete AP Invoice
func (h *PembelianHandler) DeletePembelian(c *gin.Context) {
	id := c.Param("id")

	// Get existing pembelian for GL cleanup
	var existing models.Pembelian
	if err := h.DB.First(&existing, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found for delete: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	// START TRANSACTION
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during delete transaction: %v", r)
		}
	}()

	// Delete GL entries
	if err := tx.Where("nomor_transaksi = ?", existing.NomorAPInvoice).Delete(&models.GL{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete GL entries: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus GL entries"})
		return
	}

	// Delete details
	if err := tx.Where("pembelian_id = ?", id).Delete(&models.PembelianDetail{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus detail"})
		return
	}

	// Delete header
	if err := tx.Delete(&existing).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus header"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit delete transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus transaksi"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully deleted: %s", existing.NomorAPInvoice)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AP Invoice berhasil dihapus",
	})
}

// GetPembelianByNomor - Get AP Invoice by nomor
func (h *PembelianHandler) GetPembelianByNomor(c *gin.Context) {
	nomor := c.Param("nomor")
	var pembelian models.Pembelian

	if err := h.DB.Preload("Details").Where("nomor_ap_invoice = ?", nomor).First(&pembelian).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found by nomor: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelian,
	})
}

// UpdatePembelianStatus - Update only status
func (h *PembelianHandler) UpdatePembelianStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&models.Pembelian{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		log.Printf("[pembelian] failed to update status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status berhasil diupdate",
	})
}

// GetPembelianReport - Generate report data
func (h *PembelianHandler) GetPembelianReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	supplierID := c.Query("supplier_id")

	query := h.DB.Preload("Details")

	if startDate != "" && endDate != "" {
		query = query.Where("tanggal BETWEEN ? AND ?", startDate, endDate)
	}

	if supplierID != "" {
		query = query.Where("supplier_id = ?", supplierID)
	}

	var pembelians []models.Pembelian
	if err := query.Find(&pembelians).Error; err != nil {
		log.Printf("[pembelian] failed to generate report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelians,
	})
}

// GetNextAPInvoiceNumber - Generate next AP Invoice number
func (h *PembelianHandler) GetNextAPInvoiceNumber(c *gin.Context) {
	today := time.Now()
	year := today.Format("2006")
	month := today.Format("01")
	day := today.Format("02")

	prefix := fmt.Sprintf("APINV-%s%s%s-", year, month, day)

	var lastPembelian models.Pembelian
	if err := h.DB.Where("nomor_ap_invoice LIKE ?", prefix+"%").
		Order("nomor_ap_invoice DESC").
		First(&lastPembelian).Error; err != nil {
		// No previous invoice, start with 001
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	// Extract sequence number and increment
	parts := strings.Split(lastPembelian.NomorAPInvoice, "-")
	if len(parts) != 3 {
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	lastSeq, err := strconv.Atoi(parts[2])
	if err != nil {
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	nextSeq := lastSeq + 1
	nextNumber := fmt.Sprintf("%s%03d", prefix, nextSeq)

	c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
}

// getAccountsForSupplier - Get currency accounts for pemasok
func getAccountsForSupplier(db *gorm.DB, supplierID uint) (CurrencyAccountsap, error) {
	var resp CurrencyAccountsap

	var pemasok models.MasterPemasok
	if err := db.First(&pemasok, supplierID).Error; err != nil {
		return resp, fmt.Errorf("pemasok not found: %w", err)
	}
	if pemasok.MataUang == "" {
		return resp, NewGLAccountError(
			"currency",
			"GL_SUPPLIER_CURRENCY_NOT_SET",
			"Mata uang pemasok belum diset. Silakan set mata uang pemasok terlebih dahulu.",
		)
	}

	var mu models.MasterMataUang
	if err := db.Where("id = ?", pemasok.MataUang).First(&mu).Error; err != nil {
		return resp, NewGLAccountError(
			"currency",
			"GL_CURRENCY_NOT_FOUND",
			fmt.Sprintf("Master mata uang '%s' tidak ditemukan", pemasok.MataUang),
		)
	}

	resp.PayableAccount = mu.HutangUsaha
	resp.DiscountAccount = mu.DiskonBeli
	resp.FreightAccount = mu.BiayaLainLain
	resp.StampAccount = mu.BiayaMaterai

	return resp, nil
}

func getPurchaseAccountByItem(db *gorm.DB, kodeItem string) (string, error) {
	var mb models.MasterBarangJasa
	if err := db.Where("kode = ?", kodeItem).First(&mb).Error; err != nil {
		return "", NewGLAccountError(
			"item",
			"GL_ITEM_NOT_FOUND",
			fmt.Sprintf("Item '%s' tidak ditemukan", kodeItem),
		)
	}
	if strings.TrimSpace(mb.AkunPembelian) == "" {
		return "", NewGLAccountError(
			"purchase_account",
			"GL_PURCHASE_ACCOUNT_NOT_FOUND",
			fmt.Sprintf("Akun pembelian untuk item '%s' belum diset", kodeItem),
		)
	}
	return mb.AkunPembelian, nil
}

// parseDppFormula - Parse DPP formula
func parseDppFormula(s string) float64 {
	if s == "" {
		return 1.0
	}
	s = strings.TrimSpace(s)

	if strings.Contains(s, "/") {
		parts := strings.Split(s, "/")
		if len(parts) == 2 {
			num, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
			den, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
			if err1 == nil && err2 == nil && den != 0 {
				return num / den
			}
		}
	}

	if strings.ToLower(s) == "inclusive" {
		return 1.0 // Will be calculated as 100/(100+rate) in calling code
	}

	// Try to parse as simple number
	if val, err := strconv.ParseFloat(s, 64); err == nil {
		return val
	}

	return 1.0
}

// GenerateAPInvoiceGLLines - Generate GL lines for AP Invoice
func GenerateAPInvoiceGLLines(db *gorm.DB, pembelian models.Pembelian) ([]models.GL, error) {
	var glLines []models.GL

	nomorJurnal, err := GenerateNomorJurnal(db, pembelian.Tanggal)
	if err != nil {
		return nil, fmt.Errorf("failed to generate nomor jurnal: %w", err)
	}

	log.Printf("[pembelian] GenerateAPInvoiceGLLines for %s", pembelian.NomorAPInvoice)

	// Get pemasok currency accounts
	currAccounts, err := getAccountsForSupplier(db, pembelian.SupplierID)
	if err != nil {
		return nil, err
	}

	// PRE-FLIGHT VALIDATION akun wajib
	if strings.TrimSpace(currAccounts.PayableAccount) == "" {
		return nil, NewGLAccountError(
			"payable_account",
			"GL_PAYABLE_ACCOUNT_NOT_FOUND",
			"Akun Hutang Usaha (AP) belum diset pada master mata uang pemasok",
		)
	}

	// Cek akun pembelian per item
	for _, d := range pembelian.Details {
		if strings.TrimSpace(d.KodeItem) == "" {
			return nil, NewGLAccountError(
				"item",
				"GL_ITEM_CODE_EMPTY",
				"Terdapat detail dengan Kode Item kosong",
			)
		}
		if _, err := getPurchaseAccountByItem(db, d.KodeItem); err != nil {
			return nil, err // sudah GLAccountError
		}
	}

	// Hitung agregat
	purchasesByAccount := make(map[string]float64)
	var totalDiscount float64

	for _, detail := range pembelian.Details {
		acc, err := getPurchaseAccountByItem(db, detail.KodeItem)
		if err != nil {
			return nil, err
		}
		purchasesByAccount[acc] += detail.Dpp
		totalDiscount += detail.DiscAmount
	}

	// Pajak
	taxByAccount := make(map[string]float64)
	var totalPPH float64

	for _, detail := range pembelian.Details {
		if len(detail.Tax) == 0 {
			continue
		}
		for _, taxCode := range detail.Tax {
			var pajak models.MasterPajak
			if err := db.Where("code = ?", taxCode).First(&pajak).Error; err != nil {
				return nil, NewGLAccountError(
					"tax",
					"GL_TAX_NOT_FOUND",
					fmt.Sprintf("Pajak '%s' tidak ditemukan", taxCode),
				)
			}
			dppFactor := parseDppFormula(pajak.DPPFormula)
			baseForTax := dppFactor * (detail.Qty*detail.Price - detail.DiscAmount)
			taxAmount := baseForTax * pajak.RatePercent / 100
			if taxAmount <= 0 {
				continue
			}

			if strings.Contains(strings.ToLower(pajak.TaxType), "pph") {
				// PPH -> akun wajib ada untuk CREDIT
				if strings.TrimSpace(pajak.PurchaseTaxAccount) == "" {
					return nil, NewGLAccountError(
						"pph_account",
						"GL_PPH_ACCOUNT_NOT_FOUND",
						fmt.Sprintf("Akun PPh untuk pajak '%s' belum diset", taxCode),
					)
				}
				totalPPH += taxAmount
			} else {
				// PPN Masukan / non-PPH -> akun wajib ada untuk DEBIT
				if strings.TrimSpace(pajak.PurchaseTaxAccount) == "" {
					return nil, NewGLAccountError(
						"tax_account",
						"GL_TAX_ACCOUNT_NOT_FOUND",
						fmt.Sprintf("Akun pajak pembelian untuk pajak '%s' belum diset", taxCode),
					)
				}
				taxByAccount[pajak.PurchaseTaxAccount] += taxAmount
			}
		}
	}

	// Freight / Materai wajib akun jika nilai > 0
	if pembelian.Freight > 0 && strings.TrimSpace(currAccounts.FreightAccount) == "" {
		return nil, NewGLAccountError(
			"freight_account",
			"GL_FREIGHT_ACCOUNT_NOT_FOUND",
			"Akun Biaya Lain-lain (Freight) belum diset pada master mata uang",
		)
	}
	if pembelian.Stamp > 0 && strings.TrimSpace(currAccounts.StampAccount) == "" {
		return nil, NewGLAccountError(
			"stamp_account",
			"GL_STAMP_ACCOUNT_NOT_FOUND",
			"Akun Biaya Materai belum diset pada master mata uang",
		)
	}
	if totalDiscount > 0 && strings.TrimSpace(currAccounts.DiscountAccount) == "" {
		return nil, NewGLAccountError(
			"discount_account",
			"GL_PURCHASE_DISCOUNT_ACCOUNT_NOT_FOUND",
			"Akun Diskon Pembelian belum diset pada master mata uang",
		)
	}

	// Build GL lines (pakai tanggal transaksi)
	txDate := pembelian.Tanggal

	// 1. DEBIT: Pembelian per akun
	for account, amount := range purchasesByAccount {
		if amount <= 0 {
			continue
		}
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  account,
			Deskripsi:      fmt.Sprintf("Pembelian - %s", pembelian.NomorAPInvoice),
			Debit:          amount,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 2. DEBIT: PPN Masukan / pajak non-PPH
	for account, amount := range taxByAccount {
		if amount <= 0 {
			continue
		}
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  account,
			Deskripsi:      fmt.Sprintf("PPN Masukan - %s", pembelian.NomorAPInvoice),
			Debit:          amount,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 3. DEBIT: Freight
	if pembelian.Freight > 0 {
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  currAccounts.FreightAccount,
			Deskripsi:      fmt.Sprintf("Freight - %s", pembelian.NomorAPInvoice),
			Debit:          pembelian.Freight,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 4. DEBIT: Materai
	if pembelian.Stamp > 0 {
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  currAccounts.StampAccount,
			Deskripsi:      fmt.Sprintf("Materai - %s", pembelian.NomorAPInvoice),
			Debit:          pembelian.Stamp,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 5. CREDIT: Diskon
	if totalDiscount > 0 {
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  currAccounts.DiscountAccount,
			Deskripsi:      fmt.Sprintf("Diskon Pembelian - %s", pembelian.NomorAPInvoice),
			Debit:          0,
			Kredit:         totalDiscount,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 6. CREDIT: PPH
	if totalPPH > 0 {
		// akun PPH sudah divalidasi saat hitung pajak (pakai yang pertama ditemukan)
		var pphAccount string
		for _, detail := range pembelian.Details {
			for _, taxCode := range detail.Tax {
				var pajak models.MasterPajak
				if err := db.Where("code = ?", taxCode).First(&pajak).Error; err == nil {
					if strings.Contains(strings.ToLower(pajak.TaxType), "pph") &&
						strings.TrimSpace(pajak.PurchaseTaxAccount) != "" {
						pphAccount = pajak.PurchaseTaxAccount
						break
					}
				}
			}
			if pphAccount != "" {
				break
			}
		}
		if pphAccount == "" {
			return nil, NewGLAccountError(
				"pph_account",
				"GL_PPH_ACCOUNT_NOT_FOUND",
				"Akun PPh belum diset",
			)
		}
		glLines = append(glLines, models.GL{
			Tanggal:        txDate,
			AkunTransaksi:  pphAccount,
			Deskripsi:      fmt.Sprintf("PPH - %s", pembelian.NomorAPInvoice),
			Debit:          0,
			Kredit:         totalPPH,
			NomorTransaksi: pembelian.NomorAPInvoice,
			NomorJurnal:    nomorJurnal,
			ContactID:      pembelian.SupplierID,
			ContactType:    "supplier",
		})
	}

	// 7. CREDIT: Hutang Usaha (AP)
	totalPurchases := 0.0
	for _, amount := range purchasesByAccount {
		totalPurchases += amount
	}
	totalTaxInput := 0.0
	for _, amount := range taxByAccount {
		totalTaxInput += amount
	}
	apAmount := totalPurchases + totalTaxInput + pembelian.Freight + pembelian.Stamp - totalDiscount - totalPPH
	if apAmount <= 0 {
		return nil, fmt.Errorf("nilai AP tidak valid")
	}
	glLines = append(glLines, models.GL{
		Tanggal:        txDate,
		AkunTransaksi:  currAccounts.PayableAccount,
		NomorTransaksi: pembelian.NomorAPInvoice,
		Debit:          0,
		Kredit:         apAmount,
		NomorJurnal:    nomorJurnal,
		Deskripsi:      fmt.Sprintf("Hutang Usaha - %s", pembelian.NomorAPInvoice),
		ContactID:      pembelian.SupplierID,
		ContactType:    "supplier",
	})

	log.Printf("[pembelian] Generated %d GL lines for %s", len(glLines), pembelian.NomorAPInvoice)
	return glLines, nil
}
