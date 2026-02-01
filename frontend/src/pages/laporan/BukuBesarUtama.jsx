import React, { useEffect, useState, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
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

export default function BukuBesarPembantu() {
    const { theme } = useTheme();
    const [contactType, setContactType] = useState("customer"); // "customer" or "supplier"
    const [contactList, setContactList] = useState([]);
    const [selectedContact, setSelectedContact] = useState("");
    const [coaList, setCoaList] = useState([]);
    const [selectedCoa, setSelectedCoa] = useState("");

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 8) + '01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Ambil daftar COA
    useEffect(() => {
        api.get("/master-coa").then(res => {
            const sorted = (res.data || []).sort((a, b) => a.kode.localeCompare(b.kode));
            setCoaList(sorted);
        });
    }, []);

    // Ambil daftar Contact (Pemasok/Pembeli)
    useEffect(() => {
        const endpoint = contactType === "customer" ? "/master-pembeli" : "/pemasok";
        api.get(endpoint).then(res => {
            setContactList(res.data || []);
            setSelectedContact(""); // Reset saat ganti tipe
        });
    }, [contactType]);

    const fetchData = () => {
        if (!selectedContact) {
            setError("Silakan pilih sub-ledger (Pelanggan/Pemasok) terlebih dahulu.");
            return;
        }
        setLoading(true);
        setError("");
        api.get("/buku-besar", {
            params: {
                coa: selectedCoa,
                contact_id: selectedContact,
                contact_type: contactType,
                tanggal_awal: startDate,
                tanggal_akhir: endDate,
            },
        })
            .then(res => setData(res.data || []))
            .catch(() => setError("Gagal mengambil data Buku Besar Pembantu"))
            .finally(() => setLoading(false));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = async () => {
        const jsPDF = (await import("jspdf")).default;
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text("Laporan Buku Besar Pembantu", 105, 18, { align: 'center' });
        doc.setFontSize(11);

        const periodeText = `Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`;
        doc.text(periodeText, 105, 26, { align: 'center' });

        const contactLabel = selectedContact ? (contactList.find(c => c.id === selectedContact)?.nama || selectedContact) : '-';
        doc.text(`${contactType === 'customer' ? 'Pelanggan' : 'Pemasok'}: ${contactLabel}`, 105, 33, { align: 'center' });

        const tableData = [
            ['Tanggal', 'Nomor Transaksi', 'Deskripsi', 'Debit', 'Kredit', 'Saldo'],
            ...data.map(row => [
                formatDate(row.tanggal),
                row.nomorTransaksi,
                row.deskripsi,
                formatNumber(row.debit),
                formatNumber(row.kredit),
                formatNumber(row.saldo),
            ])
        ];

        if (data.length > 0) {
            tableData.splice(1, 0, [
                'SALDO AWAL', '', '',
                formatNumber(data[0]?.saldo_awal ?? 0),
                '-',
                formatNumber(data[0]?.saldo_awal ?? 0)
            ]);
        }

        autoTable(doc, {
            startY: 40,
            head: [tableData[0]],
            body: tableData.slice(1),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [30, 136, 229] },
            margin: { left: 10, right: 10 },
        });
        doc.save("BukuBesarPembantu.pdf");
    };

    return (
        <ReportLayout>
            <ReportLayout.Header>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2, background: theme.cardColor }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
                                <InputLabel sx={{ color: theme.fontColor }}>Tipe</InputLabel>
                                <Select
                                    value={contactType || "customer"}
                                    label="Tipe"
                                    onChange={e => setContactType(e.target.value)}
                                    sx={{ background: theme.fieldColor, color: theme.fontColor }}
                                >
                                    <MenuItem value="customer">Piutang (Pelanggan)</MenuItem>
                                    <MenuItem value="supplier">Hutang (Pemasok)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                                <InputLabel sx={{ color: theme.fontColor }}>Pilih {contactType === 'customer' ? 'Pelanggan' : 'Pemasok'}</InputLabel>
                                <Select
                                    value={selectedContact || ""}
                                    label={`Pilih ${contactType === 'customer' ? 'Pelanggan' : 'Pemasok'}`}
                                    onChange={e => setSelectedContact(e.target.value)}
                                    sx={{ background: theme.fieldColor, color: theme.fontColor }}
                                >
                                    <MenuItem value=""><em>-- Pilih --</em></MenuItem>
                                    {contactList.map(c => (
                                        <MenuItem key={c.id || c.ID} value={c.id || c.ID}>{c.nama}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                                <InputLabel sx={{ color: theme.fontColor }}>Filter Akun (Opsional)</InputLabel>
                                <Select
                                    value={selectedCoa || ""}
                                    label="Filter Akun (Opsional)"
                                    onChange={e => setSelectedCoa(e.target.value)}
                                    sx={{ background: theme.fieldColor, color: theme.fontColor }}
                                >
                                    <MenuItem value="">Semua Akun Rekanan</MenuItem>
                                    {coaList.map(coa => (
                                        <MenuItem key={coa.kode} value={coa.kode}>{coa.kode} - {coa.nama}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <TextField
                                label="Mulai"
                                type="date"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                sx={{ background: theme.fieldColor }}
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <TextField
                                label="Sampai"
                                type="date"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                sx={{ background: theme.fieldColor }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ ml: 'auto' }}>
                            <Button
                                variant="contained"
                                onClick={fetchData}
                                disabled={loading}
                                sx={{ height: 40, width: '100%', background: theme.buttonSimpan }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Tampilkan"}
                            </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button onClick={handlePrint} variant="outlined" startIcon={<FiPrinter />}>Print</Button>
                            <Button onClick={handleExportPDF} variant="outlined" color="error" startIcon={<AiFillFilePdf />}>PDF</Button>
                        </Grid>
                    </Grid>
                </Paper>
            </ReportLayout.Header>

            <ReportLayout.Content>
                <Box sx={{ height: 'calc(100vh - 280px)', width: '100%', mb: 2 }}>
                    <DataGrid
                        rows={[
                            ...(data.length > 0 ? [{
                                id: 'saldo-awal',
                                tanggal: '',
                                nomorTransaksi: 'SALDO AWAL',
                                deskripsi: 'Saldo awal periode',
                                debit: data[0]?.saldo_awal ?? 0,
                                kredit: 0,
                                saldo: data[0]?.saldo_awal ?? 0,
                                isSummary: true
                            }] : []),
                            ...data.map((row, index) => ({
                                ...row,
                                id: row.id || `${row.tanggal}-${row.nomorTransaksi}-${index}`
                            }))
                        ]}
                        columns={[
                            { field: 'tanggal', headerName: 'Tanggal', width: 120, valueFormatter: (value) => value ? formatDate(value) : '' },
                            { field: 'nomorTransaksi', headerName: 'Nomor', width: 150 },
                            { field: 'deskripsi', headerName: 'Deskripsi', flex: 1 },
                            { field: 'debit', headerName: 'Debit', width: 140, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatNumber(value) },
                            { field: 'kredit', headerName: 'Kredit', width: 140, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatNumber(value) },
                            { field: 'saldo', headerName: 'Saldo', width: 150, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatNumber(value) },
                        ]}
                        density="compact"
                        loading={loading}
                        sx={{
                            background: theme.cardColor,
                            color: theme.fontColor,
                            '& .MuiDataGrid-columnHeaders': { background: theme.tableHeaderColor },
                        }}
                    />
                </Box>

                {/* Print Template - Audit Style */}
                <div className="print-only-area">
                    <div className="print-header">
                        <h1 style={{ textAlign: "center", fontSize: "16pt", margin: "0 0 4px 0" }}>Laporan Buku Besar Pembantu</h1>
                        <p style={{ textAlign: "center", fontSize: "11pt", margin: "0 0 4px 0" }}>
                            Periode: {startDate ? formatDate(startDate) : '-'} s/d {endDate ? formatDate(endDate) : '-'}
                        </p>
                        <p style={{ textAlign: "center", fontSize: "11pt", margin: "0 0 20px 0" }}>
                            {contactType === 'customer' ? 'Pelanggan' : 'Pemasok'}: {selectedContact ? (contactList.find(c => c.id === selectedContact)?.nama || selectedContact) : '-'}
                            {selectedCoa ? ` | Akun: ${selectedCoa}` : ''}
                        </p>
                    </div>

                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ width: "12%" }}>Tanggal</th>
                                <th style={{ width: "15%" }}>Nomor</th>
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
                                    <td style={{ fontWeight: "bold" }}>SALDO AWAL</td>
                                    <td className="text-right">{formatNumber(data[0]?.saldo_awal ?? 0)}</td>
                                    <td className="text-right">-</td>
                                    <td className="text-right">{formatNumber(data[0]?.saldo_awal ?? 0)}</td>
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
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden; }
          .print-only-area, .print-only-area * { visibility: visible; }
          .print-only-area {
            position: absolute; left: 0; top: 0; width: 100%;
            display: block !important;
            font-family: "Times New Roman", serif !important;
          }
          .no-print { display: none !important; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .print-table th {
            background-color: #1e88e5 !important; color: white !important;
            padding: 10px 8px; font-size: 10.5pt; text-align: left;
            border: 1px solid #1565c0;
            -webkit-print-color-adjust: exact;
          }
          .print-table td { padding: 8px 6px; font-size: 10pt; border: 1px solid #dee2e6; }
          .text-right { text-align: right !important; }
          .print-footer-signature { margin-top: 50px; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr; text-align: center; gap: 50px; }
          .signature-line { border-bottom: 1px solid black; width: 70%; margin: 60px auto 5px auto; }
          .signature-name { font-weight: bold; text-transform: uppercase; }
        }
        .print-only-area { display: none; }
      `}</style>
        </ReportLayout>
    );
}
