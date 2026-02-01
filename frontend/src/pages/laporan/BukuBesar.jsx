import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { AiFillFilePdf } from "react-icons/ai";
import { useTheme } from "../../context/ThemeContext";

import ReportLayout from "../../components/ReportLayout";

function formatNumber(num) {
  if (!num || isNaN(num)) return "-";
  const n = Number(num);
  if (n < 0) {
    return `(${Math.abs(n).toLocaleString()})`;
  }
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BukuBesar() {
  const { theme } = useTheme();
  const [coaList, setCoaList] = useState([]);
  const [selectedCoa, setSelectedCoa] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();
  const sortedCoaList = [...coaList].sort((a, b) => a.kode.localeCompare(b.kode));

  // Export ke PDF dengan jsPDF + autoTable
  const handleExportPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF('p', 'mm', 'a4');
    // Judul dan info filter (center)
    doc.setFontSize(16);
    doc.text("Laporan Buku Besar Utama", 105, 18, { align: 'center' });
    doc.setFontSize(11);
    let y = 26;
    const periodeText = `Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`;
    doc.text(periodeText, 105, y, { align: 'center' });

    const coaLabel = selectedCoa
      ? (sortedCoaList.find(c => c.kode === selectedCoa)?.nama ? `${selectedCoa} - ${sortedCoaList.find(c => c.kode === selectedCoa)?.nama}` : selectedCoa)
      : 'Semua Akun';
    doc.text(`Akun: ${coaLabel}`, 105, y + 7, { align: 'center' });

    // Data untuk tabel
    const tableData = [
      [
        'Tanggal',
        'Nomor Transaksi',
        'Deskripsi',
        'Debit',
        'Kredit',
        'Saldo',
      ],
      ...data.map(row => [
        formatDate(row.tanggal),
        row.nomorTransaksi,
        row.deskripsi,
        formatNumber(row.debit),
        formatNumber(row.kredit),
        formatNumber(row.saldo),
      ])
    ];

    // Baris saldo awal
    if (data.length > 0) {
      tableData.splice(1, 0, [
        'Saldo Awal', '', '',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0),
        '-',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)
      ]);
    }

    autoTable(doc, {
      startY: y + 14,
      head: [tableData[0]],
      body: tableData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 136, 229] },
      margin: { left: 8, right: 8 },
    });
    doc.save("BukuBesarUtama.pdf");
  };

  // Ambil daftar COA
  useEffect(() => {
    api.get("/master-coa").then(res => setCoaList(res.data || []));
  }, []);

  // Ambil data buku besar
  const fetchData = () => {
    setLoading(true);
    setError("");
    api.get("/buku-besar", {
      params: {
        coa: selectedCoa,
        tanggal_awal: startDate,
        tanggal_akhir: endDate,
      },
    })
      .then(res => setData(res.data || []))
      .catch(() => setError("Gagal mengambil data Buku Besar"))
      .finally(() => setLoading(false));
  };

  // Export ke Excel
  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    // Header dan data
    const wsData = [];
    // Judul (center merge)
    wsData.push(["Laporan Buku Besar Utama", '', '', '', '', '']);
    wsData.push([`Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`, '', '', '', '', '']);
    const coaLabel = selectedCoa
      ? (coaList.find(c => c.kode === selectedCoa)?.nama ? `${selectedCoa} - ${coaList.find(c => c.kode === selectedCoa)?.nama}` : selectedCoa)
      : 'Semua Akun';
    wsData.push([`Akun: ${coaLabel}`, '', '', '', '', '']);
    wsData.push([]);
    // Header tabel
    wsData.push(['Tanggal', 'Nomor Transaksi', 'Deskripsi', 'Debit', 'Kredit', 'Saldo']);
    // Baris saldo awal
    if (data.length > 0) {
      wsData.push([
        'Saldo Awal', '', '',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0),
        '-',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)
      ]);
    }
    // Data transaksi
    data.forEach(row => {
      wsData.push([
        formatDate(row.tanggal),
        row.nomorTransaksi,
        row.deskripsi,
        formatNumber(row.debit),
        formatNumber(row.kredit),
        formatNumber(row.saldo),
      ]);
    });
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    // Merge judul, periode, akun (A1:F1, A2:F2, A3:F3)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "BukuBesar");
    xlsx.writeFile(wb, "BukuBesarUtama.xlsx");
  };

  // Print PDF (print area saja)
  // Print PDF using standard browser print
  const handlePrint = () => {
    window.print();
  };

  // Tampilan Desktop UX: Scroll internal di tabel, bukan di halaman
  const tableContainerStyle = {
    height: "100%", // Controlled by ReportLayout.Content
    overflow: "auto",
    borderRadius: 8,
    boxShadow: 3,
    background: theme.cardColor,
    position: "relative",
  };

  // Helper styles for sticky columns
  const getStickyLeft = (offset, zIndex = 8) => ({
    position: "sticky",
    left: offset,
    zIndex: zIndex,
    background: theme.tableBodyColor, // Essential for non-transparency
    minWidth: offset === 0 ? 100 : offset === 100 ? 150 : 350,
    width: offset === 0 ? 100 : offset === 100 ? 150 : 350,
  });

  const getStickyRight = (offset, zIndex = 8) => ({
    position: "sticky",
    right: offset,
    zIndex: zIndex,
    background: theme.tableBodyColor,
    minWidth: 130,
    width: 130,
  });

  const getHeaderSticky = (offset, type, zIndex = 11) => ({
    position: "sticky",
    background: theme.tableHeaderColor,
    color: theme.tableFontColor,
    top: 0,
    [type]: offset,
    zIndex: zIndex,
    fontWeight: "bold",
    fontFamily: theme.tableFontFamily,
  });

  return (
    <ReportLayout>
      <ReportLayout.Header>
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2, background: theme.cardColor }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Pilih Akun COA</InputLabel>
                <Select
                  value={selectedCoa}
                  label="Pilih Akun COA"
                  onChange={e => setSelectedCoa(e.target.value)}
                  sx={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: theme.fontFamily }}>Semua Akun</MenuItem>
                  {sortedCoaList.map(coa => (
                    <MenuItem key={coa.kode} value={coa.kode} sx={{ fontFamily: theme.fontFamily }}>
                      {coa.kode} - {coa.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Tanggal Awal"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                sx={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
                inputProps={{
                  style: { color: theme.fontColor, fontFamily: theme.fontFamily }
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Tanggal Akhir"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                sx={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
                inputProps={{
                  style: { color: theme.fontColor, fontFamily: theme.fontFamily }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  height: 40,
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
                onClick={fetchData}
                disabled={loading}
              >
                Tampilkan
              </Button>
            </Grid>
            {/* Tombol export sejajar filter */}
            <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, mt: { xs: 2, md: 0 } }}>
              <Button
                onClick={handlePrint}
                variant="contained"
                startIcon={<FiPrinter />}
                sx={{
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Print Preview
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="contained"
                startIcon={<AiFillFilePdf />}
                sx={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Export PDF
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="contained"
                startIcon={<FaFileExcel />}
                sx={{
                  background: theme.buttonEdit,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </ReportLayout.Header>

      <Typography variant="h5" fontWeight="bold" mb={2} sx={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
        {(() => {
          if (!selectedCoa) return 'Buku Besar Utama';
          const coa = coaList.find(c => c.kode === selectedCoa);
          if (coa && coa.nama) return `Buku Besar Utama ${coa.nama}`;
          return `Buku Besar Utama ${selectedCoa}`;
        })()}
      </Typography>
      {error && <Box color="error.main" mb={2}>{error}</Box>}

      <ReportLayout.Content>
        <Box sx={{ height: 'calc(100vh - 280px)', width: '100%', mb: 2 }}>
          <DataGrid
            rows={[
              ...(data.length > 0 ? [{
                id: 'saldo-awal',
                tanggal: '',
                nomorTransaksi: 'SALDO AWAL',
                deskripsi: 'Saldo awal periode',
                debit: data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0,
                kredit: 0,
                saldo: data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0,
                isSummary: true
              }] : []),
              ...data.map((row, index) => ({
                ...row,
                id: row.id || `${row.tanggal}-${row.nomorTransaksi}-${index}`
              }))
            ]}
            columns={[
              {
                field: 'tanggal',
                headerName: 'Tanggal',
                width: 120,
                valueFormatter: (value) => value ? formatDate(value) : ''
              },
              { field: 'nomorTransaksi', headerName: 'Nomor Transaksi', width: 150 },
              { field: 'deskripsi', headerName: 'Deskripsi', flex: 1, minWidth: 250 },
              {
                field: 'debit',
                headerName: 'Debit',
                width: 140,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (value) => formatNumber(value)
              },
              {
                field: 'kredit',
                headerName: 'Kredit',
                width: 140,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (value) => formatNumber(value)
              },
              {
                field: 'saldo',
                headerName: 'Saldo',
                width: 150,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (value) => formatNumber(value)
              },
            ]}
            density="compact"
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            loading={loading}
            pageSizeOptions={[50, 100, 200]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
              pinnedColumns: {
                left: ['tanggal', 'nomorTransaksi', 'deskripsi'],
                right: ['debit', 'kredit', 'saldo'],
              },
            }}
            sx={{
              background: theme.cardColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
              '& .MuiDataGrid-cell': {
                color: theme.tableFontColor || theme.fontColor,
                fontFamily: theme.tableFontFamily || theme.fontFamily,
              },
              '& .MuiDataGrid-columnHeaders': {
                background: theme.tableHeaderColor,
                color: theme.tableFontColor,
              },
              '& .MuiDataGrid-footerContainer': {
                background: theme.cardColor,
                color: theme.fontColor,
              },
            }}
          />
        </Box>

        {/* Hidden area for print preview - Matches PDF style */}
        <div className="print-only-area">
          <div className="print-header">
            <h1 style={{ textAlign: "center", fontSize: "16pt", margin: "0 0 4px 0" }}>Laporan Buku Besar Utama</h1>
            <p style={{ textAlign: "center", fontSize: "11pt", margin: "0 0 4px 0" }}>
              Periode: {startDate ? formatDate(startDate) : '-'} s/d {endDate ? formatDate(endDate) : '-'}
            </p>
            <p style={{ textAlign: "center", fontSize: "11pt", margin: "0 0 20px 0" }}>
              Akun: {selectedCoa ? (sortedCoaList.find(c => c.kode === selectedCoa)?.nama ? `${selectedCoa} - ${sortedCoaList.find(c => c.kode === selectedCoa)?.nama}` : selectedCoa) : 'Semua Akun'}
            </p>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Tanggal</th>
                <th style={{ width: "15%" }}>Nomor Transaksi</th>
                <th>Deskripsi</th>
                <th style={{ width: "15%" }} className="text-right">Debit</th>
                <th style={{ width: "15%" }} className="text-right">Kredit</th>
                <th style={{ width: "15%" }} className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 && (
                <tr className="initial-balance-row">
                  <td></td>
                  <td></td>
                  <td className="font-bold">SALDO AWAL</td>
                  <td className="text-right">{formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)}</td>
                  <td className="text-right">-</td>
                  <td className="text-right">{formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)}</td>
                </tr>
              )}
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td>{formatDate(row.tanggal)}</td>
                  <td>{row.nomorTransaksi}</td>
                  <td>{row.deskripsi}</td>
                  <td className="text-right">{formatNumber(row.debit)}</td>
                  <td className="text-right">{formatNumber(row.kredit)}</td>
                  <td className="text-right">{formatNumber(row.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature Block for Print */}
          <div className="print-footer-signature">
            <div className="signature-grid">
              <div className="signature-col">
                <p>Disetujui Oleh,</p>
                <div className="signature-line"></div>
                <p className="signature-name">Direktur Utama</p>
              </div>
              <div className="signature-col">
                <p>Dipersiapkan Oleh,</p>
                <div className="signature-line"></div>
                <p className="signature-name">Bagian Keuangan</p>
              </div>
            </div>
          </div>
        </div>
      </ReportLayout.Content>

      <style>{`
        /* Global Hide for Print */
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
            background: white !important;
          }
          .print-only-area, .print-only-area * {
            visibility: visible;
          }
          .print-only-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            color: black !important;
            background: white !important;
            font-family: "Times New Roman", serif !important;
          }
          .no-print, .MuiPaper-root, .MuiButton-root, .MuiGrid-root, .MuiTypography-root, .MuiDataGrid-root, .layout-navbar-area {
            display: none !important;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th {
            background-color: #1e88e5 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            padding: 10px 8px;
            font-size: 10.5pt;
            text-align: left;
            border: 1px solid #1565c0;
          }
          .print-table td {
            padding: 8px 6px;
            font-size: 10pt;
            border: 1px solid #dee2e6;
          }
          .text-right {
            text-align: right !important;
          }
          .font-bold {
            font-weight: bold;
          }
          .initial-balance-row td {
            background-color: #f8fafc !important;
            font-weight: bold;
          }

          .print-footer-signature {
            margin-top: 50px;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
            gap: 50px;
          }
          .signature-line {
            border-bottom: 1px solid black;
            width: 70%;
            margin: 60px auto 5px auto;
          }
          .signature-name {
            font-weight: bold;
            text-transform: uppercase;
          }
        }

        /* Web View Hide */
        .print-only-area {
          display: none;
        }
      `}</style>
    </ReportLayout>
  );
}
