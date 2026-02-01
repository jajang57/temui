import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Collapse,
    IconButton,
    Divider,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PrintIcon from "@mui/icons-material/Print";

// Format angka ke Rupiah
function formatRupiah(value) {
    if (!value || isNaN(value)) return "Rp 0";
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString("id-ID");
    if (num < 0) {
        return `(Rp ${formatted})`;
    }
    return `Rp ${formatted}`;
}

// Komponen untuk Section (Operasi, Investasi, Pendanaan)
function ActivitySection({ title, data, theme, color }) {
    const [open, setOpen] = useState(true);

    return (
        <>
            <TableRow
                sx={{
                    backgroundColor: theme.tableHeaderColor || "#f5f5f5",
                    cursor: "pointer",
                }}
                onClick={() => setOpen(!open)}
            >
                <TableCell
                    colSpan={2}
                    sx={{
                        fontWeight: "bold",
                        color: color || theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        pl: 2,
                        fontSize: 15,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="small" sx={{ mr: 1 }}>
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        {title}
                    </Box>
                </TableCell>
                <TableCell
                    align="right"
                    sx={{
                        fontWeight: "bold",
                        color: color || theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                    }}
                >
                    {formatRupiah(data?.total || 0)}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Table size="small">
                            <TableBody>
                                {data?.items?.length > 0 ? (
                                    data.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell
                                                sx={{
                                                    pl: 8,
                                                    width: "70%",
                                                    color: theme.tableFontColor,
                                                    fontFamily: theme.tableFontFamily,
                                                    background: theme.tableBodyColor,
                                                }}
                                            >
                                                {item.nama}
                                            </TableCell>
                                            <TableCell
                                                sx={{ width: "1%", p: 0, border: 0 }}
                                            ></TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    pr: 4,
                                                    color: theme.tableFontColor,
                                                    fontFamily: theme.tableFontFamily,
                                                    background: theme.tableBodyColor,
                                                }}
                                            >
                                                {formatRupiah(item.nilai)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} sx={{ pl: 8, fontStyle: "italic", color: "gray" }}>
                                            Tidak ada aktivitas
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

import ReportLayout from "../../components/ReportLayout";

export default function ArusKas() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    // Get current year dates
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/laporan/arus-kas", {
                params: { start_date: startDate, end_date: endDate },
            });
            setData(res.data);
        } catch (err) {
            setError("Gagal mengambil data Laporan Arus Kas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <ReportLayout>
            {/* Sticky Header - Hidden during print */}
            <div className="sticky top-[80px] z-40 bg-white border-b border-gray-200 shadow-sm no-print">
                <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: theme.fontFamily }}>
                            Laporan Arus Kas
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-x-4">
                            <p className="text-xs font-medium text-gray-500" style={{ fontFamily: theme.fontFamily }}>
                                Metode Tidak Langsung (Indirect Method)
                            </p>
                            {data && (
                                <p className="text-xs font-semibold text-gray-900" style={{ fontFamily: theme.fontFamily }}>
                                    Periode: <span>{data.periode}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <TextField
                                type="date"
                                label="Tanggal Mulai"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{
                                    width: 150,
                                    "& .MuiInputBase-root": {
                                        backgroundColor: theme.fieldColor,
                                        color: theme.fontColor,
                                        fontFamily: theme.fontFamily,
                                    },
                                }}
                            />
                            <TextField
                                type="date"
                                label="Tanggal Akhir"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{
                                    width: 150,
                                    "& .MuiInputBase-root": {
                                        backgroundColor: theme.fieldColor,
                                        color: theme.fontColor,
                                        fontFamily: theme.fontFamily,
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={fetchData}
                                disabled={loading}
                                sx={{
                                    bgcolor: "#1976d2",
                                    "&:hover": { bgcolor: "#1565c0" },
                                    height: 40,
                                    boxShadow: "none"
                                }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "Tampilkan"}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                                sx={{
                                    height: 40,
                                    color: "#333",
                                    borderColor: "#ddd",
                                    "&:hover": { borderColor: "#bbb", bgcolor: "#f5f5f5" }
                                }}
                            >
                                Cetak
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ReportLayout.Content>
                <div className="max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8">
                    {/* Header - Visible only in Print */}
                    <div className="text-center mb-8 border-b-2 border-gray-900 pb-4 print:block hidden">
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Arus Kas</h1>
                        <p className="text-sm text-gray-600">Metode Tidak Langsung (Indirect Method)</p>
                        {data && <p className="text-gray-600 mt-1 font-semibold">Periode: {data.periode}</p>}
                    </div>

                    {error && (
                        <Box sx={{ color: "error.main", mb: 2, textAlign: "center" }}>
                            {error}
                        </Box>
                    )}

                    {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {data && !loading && (
                        <TableContainer
                            component={Paper}
                            sx={{
                                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                                borderRadius: 2,
                                background: theme.cardColor,
                                width: "100%",
                                mx: "auto",
                                height: "auto", // Natural height
                                overflow: "visible", // Page level scroll
                            }}
                        >
                            <Table stickyHeader>
                                <TableHead sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                                    <TableRow sx={{ backgroundColor: theme.tableHeaderColor }}>
                                        <TableCell
                                            colSpan={2}
                                            sx={{
                                                fontWeight: "bold",
                                                color: theme.tableFontColor,
                                                fontFamily: theme.tableFontFamily,
                                                fontSize: 16,
                                                py: 2,
                                                background: theme.tableHeaderColor,
                                            }}
                                        >
                                            Keterangan
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: "bold",
                                                color: theme.tableFontColor,
                                                fontFamily: theme.tableFontFamily,
                                                fontSize: 16,
                                                background: theme.tableHeaderColor,
                                            }}
                                        >
                                            Jumlah
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* 1. AKTIVITAS OPERASI */}
                                    <ActivitySection
                                        title="ARUS KAS DARI AKTIVITAS OPERASI"
                                        data={data.operasi}
                                        theme={theme}
                                        color="#1565c0"
                                    />

                                    {/* 2. AKTIVITAS INVESTASI */}
                                    <ActivitySection
                                        title="ARUS KAS DARI AKTIVITAS INVESTASI"
                                        data={data.investasi}
                                        theme={theme}
                                        color="#ef6c00"
                                    />

                                    {/* 3. AKTIVITAS PENDANAAN */}
                                    <ActivitySection
                                        title="ARUS KAS DARI AKTIVITAS PENDANAAN"
                                        data={data.pendanaan}
                                        theme={theme}
                                        color="#2e7d32"
                                    />

                                    {/* SUMMARY ROW: KENAIKAN BERSIH */}
                                    <TableRow sx={{ backgroundColor: "#e0f7fa" }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, py: 2, fontSize: 16 }}>
                                            KENAIKAN / (PENURUNAN) BERSIH KAS
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, fontSize: 16 }}>
                                            {formatRupiah(data.kenaikan_bersih)}
                                        </TableCell>
                                    </TableRow>

                                    {/* KAS AWAL */}
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, pl: 4 }}>
                                            Saldo Kas Awal Periode
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily }}>
                                            {formatRupiah(data.kas_awal)}
                                        </TableCell>
                                    </TableRow>

                                    {/* KAS AKHIR */}
                                    <TableRow sx={{ backgroundColor: "#e8f5e9", borderTop: "2px solid #2e7d32" }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: "extra-bold", fontFamily: theme.tableFontFamily, pl: 4, fontSize: 18, color: "#1b5e20" }}>
                                            SALDO KAS AKHIR PERIODE
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "extra-bold", fontFamily: theme.tableFontFamily, fontSize: 18, color: "#1b5e20" }}>
                                            {formatRupiah(data.kas_akhir)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Validation Check */}
                            <Box sx={{ p: 2, textAlign: "right", fontStyle: "italic", fontSize: 12, color: "gray" }}>
                                {(Math.abs((data.kas_awal + data.kenaikan_bersih) - data.kas_akhir) < 1) ? (
                                    <span style={{ color: "green" }}>✓ Validasi Balance OK</span>
                                ) : (
                                    <span style={{ color: "red" }}>⚠ Warning: Kalkulasi Selisih {(data.kas_awal + data.kenaikan_bersih) - data.kas_akhir}</span>
                                )}
                            </Box>
                        </TableContainer>
                    )}
                </div>
            </ReportLayout.Content>

            {/* Print Styles */}
            <style>
                {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-header {
              margin-bottom: 20px;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
            </style>
        </ReportLayout>
    );
}
