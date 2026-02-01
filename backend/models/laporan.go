package models

// Struktur untuk item akun dalam laporan
type AkunSaldo struct {
	KategoriKode string  `json:"kategoriKode"`
	KategoriNama string  `json:"kategoriNama"`
	AkunKode     string  `json:"akunKode"`
	AkunNama     string  `json:"akunNama"`
	Saldo        float64 `json:"saldo"`
}

// Struktur untuk grup kategori dalam laporan
type LaporanGroup struct {
	Kode     string      `json:"kode"`
	Nama     string      `json:"nama"`
	Items    []AkunSaldo `json:"items"`
	Subtotal float64     `json:"subtotal"`
}

// Response untuk Laporan Laba Rugi
type LabaRugiResponse struct {
	Periode         string         `json:"periode"`
	Pendapatan      []LaporanGroup `json:"pendapatan"`
	TotalPendapatan float64        `json:"totalPendapatan"`
	Beban           []LaporanGroup `json:"beban"`
	TotalBeban      float64        `json:"totalBeban"`
	LabaBersih      float64        `json:"labaBersih"`
}

// Response untuk Neraca
type NeracaResponse struct {
	Tanggal         string         `json:"tanggal"`
	Aset            []LaporanGroup `json:"aset"`
	TotalAset       float64        `json:"totalAset"`
	Liabilitas      []LaporanGroup `json:"liabilitas"`
	TotalLiabilitas float64        `json:"totalLiabilitas"`
	Ekuitas         []LaporanGroup `json:"ekuitas"`
	LabaDitahan     float64        `json:"labaDitahan"`
	TotalEkuitas    float64        `json:"totalEkuitas"`
	TotalPasiva     float64        `json:"totalPasiva"`
	IsBalance       bool           `json:"isBalance"`
}

// Model untuk data komparatif
type AkunSaldoKomparatif struct {
	KategoriKode string             `json:"kategoriKode"`
	KategoriNama string             `json:"kategoriNama"`
	AkunKode     string             `json:"akunKode"`
	AkunNama     string             `json:"akunNama"`
	Saldos       map[string]float64 `json:"saldos"` // "2023": 1000
}

type LaporanGroupKomparatif struct {
	Kode      string                `json:"kode"`
	Nama      string                `json:"nama"`
	Items     []AkunSaldoKomparatif `json:"items"`
	Subtotals map[string]float64    `json:"subtotals"`
}

type NeracaKomparatifResponse struct {
	Years           []string                 `json:"years"`
	Aset            []LaporanGroupKomparatif `json:"aset"`
	TotalAsets      map[string]float64       `json:"totalAsets"`
	Liabilitas      []LaporanGroupKomparatif `json:"liabilitas"`
	TotalLiabilitas map[string]float64       `json:"totalLiabilitas"`
	Ekuitas         []LaporanGroupKomparatif `json:"ekuitas"`
	LabaDitahan     map[string]float64       `json:"labaDitahan"`
	TotalEkuitas    map[string]float64       `json:"totalEkuitas"`
	TotalPasivas    map[string]float64       `json:"totalPasivas"`
}
