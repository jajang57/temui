package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InventoryHandler struct {
	DB *gorm.DB
}

func NewInventoryHandler(db *gorm.DB) *InventoryHandler { return &InventoryHandler{DB: db} }

// ========== DTO ==========

type invSummaryRow struct {
	ItemCode       string  `json:"itemCode"`
	ItemName       string  `json:"itemName"`
	GudangID       uint    `json:"gudangId"`
	GudangName     string  `json:"gudangName"`
	SaldoAwalQty   float64 `json:"saldoAwalQty"`
	SaldoAwalNilai float64 `json:"saldoAwalNilai"`
	QtyMasuk       float64 `json:"qtyMasuk"`
	QtyKeluar      float64 `json:"qtyKeluar"`
	QtyPenyesuaian float64 `json:"qtyPenyesuaian"`
	SaldoAkhirQty  float64 `json:"saldoAkhirQty"`
	NilaiAkhir     float64 `json:"nilaiAkhir"`
}

type invEvent struct {
	Tanggal   time.Time
	Sumber    string
	Nomor     string
	ItemCode  string
	ItemName  string
	GudangID  uint
	Gudang    string
	QtyMasuk  float64
	QtyKeluar float64
	Harga     float64 // price (jual/beli)
	DPP       float64 // nilai pembelian untuk perhitungan rata-rata
}

type invMutasiRow struct {
	Tanggal        time.Time `json:"tanggal"`
	Sumber         string    `json:"sumber"`
	Nomor          string    `json:"nomor"`
	ItemCode       string    `json:"itemCode"`
	ItemName       string    `json:"itemName"`
	GudangID       uint      `json:"gudangId"`
	GudangName     string    `json:"gudangName"`
	QtyMasuk       float64   `json:"qtyMasuk"`
	QtyKeluar      float64   `json:"qtyKeluar"`
	Harga          float64   `json:"harga"`
	SaldoQty       float64   `json:"saldoQty"`
	SaldoNilai     float64   `json:"saldoNilai"`
	Keterangan     string    `json:"keterangan"`
	SaldoAwalQty   float64   `json:"saldoAwalQty,omitempty"`   // Opening balance qty (for item header)
	SaldoAwalNilai float64   `json:"saldoAwalNilai,omitempty"` // Opening balance value (for item header)
}

// ========== Helpers ==========

// helper parse
func parseDate(c *gin.Context, key string, def time.Time) time.Time {
	v := c.Query(key)
	if v == "" {
		return def
	}
	t, err := time.Parse("2006-01-02", v)
	if err != nil {
		return def
	}
	return t
}
func parseUint(c *gin.Context, key string) (uint, bool) {
	v := c.Query(key)
	if v == "" {
		return 0, false
	}
	n, err := strconv.ParseUint(v, 10, 32)
	if err != nil {
		return 0, false
	}
	return uint(n), true
}

// Ambil event masuk/keluar dengan nama tabel dari model (anti mismatch)
func (h *InventoryHandler) fetchEventsBetween(itemCode string, gudangID *uint, start, end *time.Time) ([]invEvent, error) {
	var evs []invEvent

	pbHdr := (models.Pembelian{}).TableName()
	pbDet := (models.PembelianDetail{}).TableName()
	pjHdr := (models.Penjualan{}).TableName()
	pjDet := (models.PenjualanDetail{}).TableName()
	mgTbl := (models.MasterGudang{}).TableName()
	mbTbl := (models.MasterBarangJasa{}).TableName()

	dateCond := ""
	args := []interface{}{}
	if start != nil && end != nil {
		dateCond = " AND h.tanggal BETWEEN ? AND ?"
		args = append(args, *start, *end)
	} else if start != nil {
		dateCond = " AND h.tanggal >= ?"
		args = append(args, *start)
	} else if end != nil {
		dateCond = " AND h.tanggal <= ?"
		args = append(args, *end)
	}

	itemCond := ""
	if itemCode != "" {
		itemCond = " AND d.kode_item = ?"
		args = append(args, itemCode)
	}
	gudangCond := ""
	if gudangID != nil {
		gudangCond = " AND d.gudang_id = ?"
		args = append(args, *gudangID)
	}

	// Pembelian (masuk) + join gudang & barang
	qIn := fmt.Sprintf(`
        SELECT h.tanggal,
               'Pembelian' AS sumber,
               h.nomor_ap_invoice AS nomor,
               d.kode_item AS item_code,
               COALESCE(d.nama_item, mb.nama, '') AS item_name,
               d.gudang_id,
               COALESCE(g.nama, '') AS gudang,           -- was: gudang_name
               d.qty AS qty_masuk,
               0 AS qty_keluar,
               d.price AS harga,
               d.dpp AS dpp
        FROM %s d
        JOIN %s h ON h.id = d.pembelian_id
        LEFT JOIN %s g  ON g.id  = d.gudang_id
        LEFT JOIN %s mb ON mb.kode = d.kode_item
        WHERE h.deleted_at IS NULL%s%s%s
    `, pbDet, pbHdr, mgTbl, mbTbl, dateCond, itemCond, gudangCond)

	qOut := fmt.Sprintf(`
        SELECT h.tanggal,
               'Penjualan' AS sumber,
               h.nomor_invoice AS nomor,
               d.kode_item AS item_code,
               COALESCE(d.nama_item, mb.nama, '') AS item_name,
               d.gudang_id,
               COALESCE(g.nama, '') AS gudang,           -- was: gudang_name
               0 AS qty_masuk,
               d.qty AS qty_keluar,
               d.price AS harga,
               0 AS dpp
        FROM %s d
        JOIN %s h ON h.id = d.penjualan_id
        LEFT JOIN %s g  ON g.id  = d.gudang_id
        LEFT JOIN %s mb ON mb.kode = d.kode_item
        WHERE h.deleted_at IS NULL%s%s%s
    `, pjDet, pjHdr, mgTbl, mbTbl, dateCond, itemCond, gudangCond)
	var inRows []invEvent
	if err := h.DB.Raw(qIn, args...).Scan(&inRows).Error; err != nil {
		return nil, err
	}
	evs = append(evs, inRows...)

	// Penjualan (keluar) + join gudang & barang
	var outRows []invEvent
	if err := h.DB.Raw(qOut, args...).Scan(&outRows).Error; err != nil {
		return nil, err
	}
	evs = append(evs, outRows...)

	// Sortir: masuk dulu lalu keluar di tanggal sama
	sort.Slice(evs, func(i, j int) bool {
		if evs[i].Tanggal.Equal(evs[j].Tanggal) {
			if evs[i].Sumber == evs[j].Sumber {
				return evs[i].Nomor < evs[j].Nomor
			}
			if evs[i].Sumber == "Pembelian" && evs[j].Sumber == "Penjualan" {
				return true
			}
			if evs[i].Sumber == "Penjualan" && evs[j].Sumber == "Pembelian" {
				return false
			}
			return evs[i].Sumber < evs[j].Sumber
		}
		return evs[i].Tanggal.Before(evs[j].Tanggal)
	})
	return evs, nil
}

// Moving average sederhana
func runMovingAverage(beginQty, beginCost float64, events []invEvent) (rows []invMutasiRow, endQty, endCost float64) {
	qty, cost := beginQty, beginCost
	avg := func() float64 {
		if qty <= 0 {
			return 0
		}
		return cost / qty
	}
	for _, e := range events {
		if e.QtyMasuk > 0 {
			qty += e.QtyMasuk
			cost += e.DPP
		} else if e.QtyKeluar > 0 {
			outCost := avg() * e.QtyKeluar
			if outCost > cost {
				outCost = cost
			}
			qty -= e.QtyKeluar
			cost -= outCost
			if qty < 0 {
				qty = 0
			}
			if cost < 0 {
				cost = 0
			}
		}
		rows = append(rows, invMutasiRow{
			Tanggal:    e.Tanggal,
			Sumber:     e.Sumber,
			Nomor:      e.Nomor,
			ItemCode:   e.ItemCode,
			ItemName:   e.ItemName,
			GudangID:   e.GudangID,
			GudangName: e.Gudang,
			QtyMasuk:   e.QtyMasuk,
			QtyKeluar:  e.QtyKeluar,
			Harga:      e.Harga,
			SaldoQty:   qty,
			SaldoNilai: cost,
			Keterangan: "",
		})
	}
	return rows, qty, cost
}

// ========== Handlers ==========

// GET /persediaan/summary?itemCode=&gudangId=&startDate=&endDate=
func (h *InventoryHandler) GetInventorySummary(c *gin.Context) {
	itemCode := c.Query("itemCode")
	gid, okG := parseUint(c, "gudangId")
	var gidPtr *uint
	if okG {
		gidPtr = &gid
	}
	now := time.Now()
	start := parseDate(c, "startDate", time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC))
	end := parseDate(c, "endDate", now)

	// saldo awal s.d. H-1
	before := start.AddDate(0, 0, -1)
	evBefore, err := h.fetchEventsBetween(itemCode, gidPtr, nil, &before)
	if err != nil {
		log.Printf("[persediaan] fetchEventsBefore error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil saldo awal"})
		return
	}
	type key struct {
		item   string
		gudang uint
	}
	groupBeginQty := map[key]float64{}
	groupBeginCost := map[key]float64{}
	groupMap := map[key][]invEvent{}
	for _, e := range evBefore {
		k := key{item: e.ItemCode, gudang: e.GudangID}
		groupMap[k] = append(groupMap[k], e)
	}
	for k, list := range groupMap {
		_, q, cost := runMovingAverage(0, 0, list)
		groupBeginQty[k] = q
		groupBeginCost[k] = cost
	}

	// periode
	evPeriod, err := h.fetchEventsBetween(itemCode, gidPtr, &start, &end)
	if err != nil {
		log.Printf("[persediaan] fetchEventsPeriod error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil mutasi periode"})
		return
	}
	groupIn := map[key]float64{}
	groupOut := map[key]float64{}
	groupPer := map[key][]invEvent{}
	for _, e := range evPeriod {
		k := key{item: e.ItemCode, gudang: e.GudangID}
		groupPer[k] = append(groupPer[k], e)
		if e.QtyMasuk > 0 {
			groupIn[k] += e.QtyMasuk
		} else if e.QtyKeluar > 0 {
			groupOut[k] += e.QtyKeluar
		}
	}

	// Gabungkan semua keys dari opening balance dan periode
	allKeys := make(map[key]bool)
	for k := range groupBeginQty {
		allKeys[k] = true
	}
	for k := range groupPer {
		allKeys[k] = true
	}

	var results []invSummaryRow
	for k := range allKeys {
		beginQty := groupBeginQty[k]
		beginCost := groupBeginCost[k]

		list := groupPer[k]
		_, endQty, endCost := runMovingAverage(beginQty, beginCost, list)

		itemName := ""
		gudangName := ""
		if len(list) > 0 {
			itemName = list[0].ItemName
			gudangName = list[0].Gudang
		} else if len(groupMap[k]) > 0 {
			// Ambil dari opening balance jika tidak ada di periode
			itemName = groupMap[k][0].ItemName
			gudangName = groupMap[k][0].Gudang
		}

		results = append(results, invSummaryRow{
			ItemCode:       k.item,
			ItemName:       itemName,
			GudangID:       k.gudang,
			GudangName:     gudangName,
			SaldoAwalQty:   beginQty,
			SaldoAwalNilai: beginCost,
			QtyMasuk:       groupIn[k],
			QtyKeluar:      groupOut[k],
			QtyPenyesuaian: 0,
			SaldoAkhirQty:  endQty,
			NilaiAkhir:     endCost,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": results})
}

// GET /persediaan/mutasi?itemCode=&gudangId=&startDate=&endDate=
func (h *InventoryHandler) GetInventoryMutasi(c *gin.Context) {
	itemCode := c.Query("itemCode")
	gid, okG := parseUint(c, "gudangId")
	var gidPtr *uint
	if okG {
		gidPtr = &gid
	}
	now := time.Now()
	start := parseDate(c, "startDate", time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC))
	end := parseDate(c, "endDate", now)

	before := start.AddDate(0, 0, -1)
	evBefore, err := h.fetchEventsBetween(itemCode, gidPtr, nil, &before)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil saldo awal"})
		return
	}

	// Group opening balance per item+gudang
	type key struct {
		item   string
		gudang uint
	}
	groupBeginQty := map[key]float64{}
	groupBeginCost := map[key]float64{}
	groupMapBefore := map[key][]invEvent{}
	for _, e := range evBefore {
		k := key{item: e.ItemCode, gudang: e.GudangID}
		groupMapBefore[k] = append(groupMapBefore[k], e)
	}
	for k, list := range groupMapBefore {
		_, q, cost := runMovingAverage(0, 0, list)
		groupBeginQty[k] = q
		groupBeginCost[k] = cost
	}

	evPeriod, err := h.fetchEventsBetween(itemCode, gidPtr, &start, &end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil mutasi"})
		return
	}

	// Group period events per item+gudang
	groupPer := map[key][]invEvent{}
	for _, e := range evPeriod {
		k := key{item: e.ItemCode, gudang: e.GudangID}
		groupPer[k] = append(groupPer[k], e)
	}

	// Merge keys: include all items with opening balance OR period transactions
	allKeys := make(map[key]bool)
	for k := range groupBeginQty {
		allKeys[k] = true
	}
	for k := range groupPer {
		allKeys[k] = true
	}

	// Calculate each group with proper opening balance
	var allRows []invMutasiRow
	for k := range allKeys {
		beginQty := groupBeginQty[k]
		beginCost := groupBeginCost[k]
		list := groupPer[k] // might be empty if only opening balance exists

		// Get item/gudang name
		itemName := ""
		gudangName := ""
		if len(list) > 0 {
			itemName = list[0].ItemName
			gudangName = list[0].Gudang
		} else if len(groupMapBefore[k]) > 0 {
			itemName = groupMapBefore[k][0].ItemName
			gudangName = groupMapBefore[k][0].Gudang
		}

		// Generate rows with opening balance info attached to first row
		rows, _, _ := runMovingAverage(beginQty, beginCost, list)

		// Attach opening balance to first row (or create one if no transactions)
		if len(rows) > 0 {
			rows[0].SaldoAwalQty = beginQty
			rows[0].SaldoAwalNilai = beginCost
		} else if beginQty > 0 || beginCost > 0 {
			// No transactions in period but has opening balance - create a marker row
			rows = append(rows, invMutasiRow{
				Tanggal:        start,
				Sumber:         "",
				Nomor:          "",
				ItemCode:       k.item,
				ItemName:       itemName,
				GudangID:       k.gudang,
				GudangName:     gudangName,
				QtyMasuk:       0,
				QtyKeluar:      0,
				Harga:          0,
				SaldoQty:       beginQty,
				SaldoNilai:     beginCost,
				Keterangan:     "",
				SaldoAwalQty:   beginQty,
				SaldoAwalNilai: beginCost,
			})
		}

		allRows = append(allRows, rows...)
	}

	// Sort all rows by date
	sort.Slice(allRows, func(i, j int) bool {
		if allRows[i].Tanggal.Equal(allRows[j].Tanggal) {
			if allRows[i].Sumber == allRows[j].Sumber {
				return allRows[i].Nomor < allRows[j].Nomor
			}
			if allRows[i].Sumber == "Saldo Awal" {
				return true
			}
			if allRows[j].Sumber == "Saldo Awal" {
				return false
			}
			if allRows[i].Sumber == "Pembelian" && allRows[j].Sumber == "Penjualan" {
				return true
			}
			if allRows[i].Sumber == "Penjualan" && allRows[j].Sumber == "Pembelian" {
				return false
			}
			return allRows[i].Sumber < allRows[j].Sumber
		}
		return allRows[i].Tanggal.Before(allRows[j].Tanggal)
	})

	c.JSON(http.StatusOK, gin.H{"data": allRows})
}
