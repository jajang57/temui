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
    Divider,
    Collapse,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import api from "../../utils/api";
import ReportLayout from "../../components/ReportLayout";
import { Printer, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

/**
 * Professional Balance Sheet / Neraca Report
 * Designed for audit-style readability and print-friendliness.
 * Synced with Arus Kas design concept (tabular & collapsible).
 */

// Utility to format numbers to Indonesian Rupiah style
const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return num < 0 ? `(${formatted})` : formatted;
};

// Collapsible group component for Neraca
function NeracaGroup({ group, theme, showSubtotal = true, indentLevel = 0 }) {
    const [open, setOpen] = useState(true);

    return (
        <React.Fragment>
            <TableRow
                sx={{
                    backgroundColor: theme.tableHeaderColor || "#f5f5f5",
                    cursor: "pointer",
                    "@media print": {
                        backgroundColor: "transparent !important",
                        cursor: "default",
                    }
                }}
                className={indentLevel === 0 ? "section-header" : ""}
                onClick={() => setOpen(!open)}
            >
                <TableCell
                    colSpan={showSubtotal ? 1 : 2}
                    sx={{
                        fontWeight: "bold",
                        pl: indentLevel === 0 ? 2 : 2 + (indentLevel * 4), // Increased indentation
                        fontFamily: theme.tableFontFamily,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="small" sx={{ mr: 1 }} className="no-print">
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        <span className="uppercase text-[13px] tracking-wide print:text-[10.5pt] print:font-bold">{group.nama}</span>
                    </Box>
                </TableCell>
                {showSubtotal && (
                    <TableCell align="right" className="amount" sx={{ fontWeight: "bold", fontFamily: 'IBM Plex Mono', fontSize: 13, "@media print": { fontSize: "10.5pt", borderTop: "1px solid black !important" } }}>
                        {formatCurrency(group.subtotal)}
                    </TableCell>
                )}
            </TableRow>
            <TableRow sx={{ "@media print": { display: "table-row" } }}>
                <TableCell colSpan={2} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit={false} sx={{ "@media print": { display: 'block' } }}>
                        <Table size="small">
                            <TableBody>
                                {group.items && group.items.length > 0 ? (
                                    group.items.map((item, iIdx) => (
                                        <TableRow key={iIdx}>
                                            <TableCell sx={{ pl: indentLevel === 0 ? 8 : 12, width: "70%", fontFamily: theme.tableFontFamily, color: "#444", "@media print": { color: "black", pl: indentLevel === 0 ? 6 : 10, fontSize: "10pt" } }}>
                                                {item.akunNama}
                                            </TableCell>
                                            <TableCell align="right" className="amount" sx={{ width: "30%", fontFamily: 'IBM Plex Mono', fontWeight: 500, color: "#444", "@media print": { color: "black", fontSize: "10pt" } }}>
                                                {formatCurrency(item.saldo)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="no-print">
                                        <TableCell colSpan={2} sx={{ pl: 8, fontStyle: "italic", color: "gray" }}>
                                            Tidak ada item
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

function NeracaGroupKomparatif({ group, years, theme, indentLevel = 0 }) {
    const [open, setOpen] = useState(true);

    return (
        <React.Fragment>
            <TableRow
                sx={{
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f1f5f9" },
                    "@media print": { backgroundColor: "transparent !important", cursor: "default" }
                }}
                className={indentLevel === 0 ? "section-header" : ""}
                onClick={() => setOpen(!open)}
            >
                <TableCell
                    sx={{
                        fontWeight: "bold",
                        pl: indentLevel === 0 ? 2 : 2 + (indentLevel * 4), // Increased indentation
                        fontFamily: theme.tableFontFamily,
                        width: "350px",
                        minWidth: "350px",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "#f8fafc",
                        zIndex: 2,
                        borderRight: "2px solid #e2e8f0",
                        "@media print": { backgroundColor: "transparent !important", borderRight: "none !important" }
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="small" sx={{ mr: 1 }} className="no-print">
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        <span className="uppercase text-[12px] tracking-wide font-bold text-slate-700 print:text-[10.5pt] print:font-bold print:text-black">{group.nama}</span>
                    </Box>
                </TableCell>
                {years.map(year => (
                    <TableCell
                        key={year}
                        align="right"
                        className="amount"
                        sx={{
                            fontWeight: 800,
                            fontFamily: 'IBM Plex Mono',
                            fontSize: 13,
                            color: "#0f172a",
                            width: "180px",
                            minWidth: "180px",
                            "@media print": { fontSize: "10.5pt", borderTop: "1px solid black !important", color: "black !important" }
                        }}
                    >
                        {formatCurrency(group.subtotals[year])}
                    </TableCell>
                ))}
            </TableRow>
            <TableRow sx={{ "@media print": { display: "table-row" } }}>
                <TableCell colSpan={years.length + 1} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit={false} sx={{ "@media print": { display: 'block' } }}>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                            <TableBody>
                                {group.items && group.items.length > 0 ? (
                                    group.items.map((item, iIdx) => (
                                        <TableRow key={iIdx} sx={{ "&:hover": { backgroundColor: "#fbfcfd" } }}>
                                            <TableCell
                                                sx={{
                                                    pl: indentLevel === 0 ? 8 : 12,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    fontFamily: theme.tableFontFamily,
                                                    color: "#475569",
                                                    position: "sticky",
                                                    left: 0,
                                                    backgroundColor: "white",
                                                    zIndex: 1,
                                                    borderRight: "2px solid #e2e8f0",
                                                    "@media print": { color: "black", pl: indentLevel === 0 ? 6 : 10, backgroundColor: "transparent !important", borderRight: "none !important", fontSize: "10pt" }
                                                }}
                                            >
                                                {item.akunNama}
                                            </TableCell>
                                            {years.map(year => (
                                                <TableCell
                                                    key={year}
                                                    align="right"
                                                    className="amount"
                                                    sx={{
                                                        width: "180px",
                                                        minWidth: "180px",
                                                        fontFamily: 'IBM Plex Mono',
                                                        fontWeight: 500,
                                                        color: "#1e293b",
                                                        "@media print": { color: "black", fontSize: "10pt" }
                                                    }}
                                                >
                                                    {formatCurrency(item.saldos[year])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="no-print">
                                        <TableCell colSpan={years.length + 1} sx={{ pl: 8, fontStyle: "italic", color: "gray" }}>
                                            Tidak ada item
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

export default function Neraca() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);
    const [komparatifData, setKomparatifData] = useState(null);
    const [neracaMode, setNeracaMode] = useState("standar");
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [startYear, setStartYear] = useState(new Date().getFullYear() - 2);
    const [endYear, setEndYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            if (neracaMode === "standar") {
                const res = await api.get("/laporan/neraca", {
                    params: { end_date: endDate },
                });
                setData(res.data);
                setKomparatifData(null);
            } else {
                const res = await api.get("/laporan/neraca-komparatif", {
                    params: { start_year: startYear, end_year: endYear },
                });
                setKomparatifData(res.data);
                setData(null);
            }
        } catch (err) {
            setError("Gagal mengambil data Neraca. Silakan hubungi administrator.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [neracaMode]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <ReportLayout>
            {/* Filter Toolbar - Hidden in Print */}
            <div className="sticky top-[80px] z-40 bg-white border-b border-gray-200 shadow-sm no-print">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: theme.fontFamily }}>
                            NERACA {neracaMode === "komparatif" ? "KOMPARATIF" : ""}
                        </h1>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">
                            {neracaMode === "standar" ? `Per Tanggal: ${endDate}` : `Analisis Tahunan: ${startYear} - ${endYear}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mode Laporan</label>
                            <TextField
                                select
                                size="small"
                                value={neracaMode}
                                onChange={(e) => setNeracaMode(e.target.value)}
                                sx={{
                                    minWidth: 200,
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "6px",

                                    "& .MuiOutlinedInput-root": {
                                        boxShadow: "none",
                                    },

                                    "& .MuiOutlinedInput-root.Mui-focused": {
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                <MenuItem value="standar" sx={{ fontSize: 13 }}>Neraca Standar (Resmi)</MenuItem>
                                <MenuItem value="komparatif" sx={{ fontSize: 13 }}>Neraca Per Tahun (Analisis)</MenuItem>
                            </TextField>
                        </div>

                        {neracaMode === "standar" ? (
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Per Tanggal</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border border-slate-200 rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 w-40 transition-all"
                                    />
                                    <button onClick={fetchData} disabled={loading} className="p-2 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rentang Tahun</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={startYear}
                                        onChange={(e) => setStartYear(e.target.value)}
                                        className="border border-slate-200 rounded px-3 py-1.5 text-sm w-24 outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-mono"
                                    />
                                    <span className="text-gray-400 font-bold px-1">/</span>
                                    <input
                                        type="number"
                                        value={endYear}
                                        onChange={(e) => setEndYear(e.target.value)}
                                        className="border border-slate-200 rounded px-3 py-1.5 text-sm w-24 outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-mono"
                                    />
                                    <button onClick={fetchData} disabled={loading} className="p-2 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="h-10 w-px bg-gray-200 mx-2"></div>
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2 rounded text-sm font-bold shadow-md active:scale-95 transition-all">
                            <Printer className="w-4 h-4" /> Cetak PDF
                        </button>
                    </div>
                </div>
            </div>

            <ReportLayout.Content>
                <div className="max-w-7xl mx-auto w-full p-4 md:p-8 print:p-0">
                    <div className="print-container">

                        {/* 1. STANDAR MODE RENDER */}
                        {neracaMode === "standar" && data && !loading && (
                            <>
                                {/* Audit Header */}
                                <div className="hidden print:flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-10">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Neraca</h1>
                                        <p className="text-xl font-bold text-slate-700 mt-1">LAPORAN POSISI KEUANGAN</p>
                                        <div className="text-xs text-slate-500 mt-4 space-y-1">
                                            <p className="font-bold text-slate-800 uppercase">NAMA PERUSAHAAN</p>
                                            <p>Alamat Kantor Pusat, Indonesia</p>
                                            <p>NPWP: 00.000.000.0-000.000</p>
                                        </div>
                                    </div>
                                    <div className="w-72 border-2 border-slate-900 bg-white">
                                        <div className="grid grid-cols-2">
                                            <div className="bg-slate-900 text-white text-[10px] font-bold p-2 uppercase border-r border-b border-slate-900">Per Tanggal</div>
                                            <div className="p-2 text-sm border-b border-slate-900 text-right font-bold">{data.tanggal}</div>
                                            <div className="bg-slate-900 text-white text-[10px] font-bold p-2 uppercase border-r border-slate-900">Mata Uang</div>
                                            <div className="p-2 text-sm text-right font-bold tracking-wider">IDR (Rupiah)</div>
                                        </div>
                                    </div>
                                </div>

                                <TableContainer component={Paper} elevation={0} sx={{ overflow: "visible", background: "transparent" }}>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow sx={{ backgroundColor: "#f1f5f9", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{ fontWeight: 900, fontSize: 14, py: 1.5, borderBottom: "1.5pt solid black !important", "@media print": { fontSize: "12pt !important", borderBottom: "1.5pt solid black !important", pt: 1 } }}>ASET</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontWeight: 900, fontSize: 14, fontFamily: 'IBM Plex Mono', borderBottom: "1.5pt solid black !important", "@media print": { fontSize: "12pt !important" } }}>{formatCurrency(data.totalAset)}</TableCell>
                                            </TableRow>
                                            {data.aset.map((g, i) => <NeracaGroup key={i} group={g} theme={theme} />)}
                                            <TableRow className="no-print" sx={{ backgroundColor: "#f8fafc", borderTop: "1pt solid black" }}>
                                                <TableCell sx={{ fontWeight: "bold", pl: 2, textTransform: "uppercase" }}>TOTAL ASET</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontWeight: "bold", fontFamily: 'IBM Plex Mono' }}>{formatCurrency(data.totalAset)}</TableCell>
                                            </TableRow>

                                            <TableRow border={0} sx={{ height: 40 }}><TableCell colSpan={2} sx={{ border: 0 }}></TableCell></TableRow>

                                            <TableRow sx={{ backgroundColor: "#fffbeb", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{ fontWeight: 900, fontSize: 14, py: 1.5, borderBottom: "1.2pt solid black !important", "@media print": { fontSize: "12pt !important", pt: 3 } }}>LIABILITAS</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontWeight: 900, fontSize: 14, fontFamily: 'IBM Plex Mono', borderBottom: "1.2pt solid black !important", "@media print": { fontSize: "12pt !important" } }}>{formatCurrency(data.totalLiabilitas)}</TableCell>
                                            </TableRow>
                                            {data.liabilitas.map((g, i) => <NeracaGroup key={i} group={g} theme={theme} />)}

                                            <TableRow border={0} sx={{ height: 20 }}><TableCell colSpan={2} sx={{ border: 0 }}></TableCell></TableRow>

                                            <TableRow sx={{ backgroundColor: "#f0fdf4", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{ fontWeight: 900, fontSize: 14, py: 1.5, borderBottom: "1.2pt solid black !important", "@media print": { fontSize: "12pt !important", pt: 3 } }}>EKUITAS</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontWeight: 900, fontSize: 14, fontFamily: 'IBM Plex Mono', borderBottom: "1.2pt solid black !important", "@media print": { fontSize: "12pt !important" } }}>{formatCurrency(data.totalEkuitas)}</TableCell>
                                            </TableRow>
                                            {data.ekuitas.map((g, i) => <NeracaGroup key={i} group={g} theme={theme} showSubtotal={false} />)}
                                            <TableRow>
                                                <TableCell sx={{ pl: 8, fontStyle: "italic", "@media print": { pl: 6, fontSize: "10pt" } }}>Laba Berjalan (Laba Ditahan)</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontFamily: 'IBM Plex Mono', fontWeight: 500, "@media print": { fontSize: "10pt" } }}>{formatCurrency(data.labaDitahan)}</TableCell>
                                            </TableRow>
                                            <TableRow className="no-print" sx={{ borderTop: "1pt solid black" }}>
                                                <TableCell sx={{ fontWeight: "bold", pl: 2, textTransform: "uppercase" }}>TOTAL EKUITAS</TableCell>
                                                <TableCell align="right" className="amount" sx={{ fontWeight: "bold", fontFamily: 'IBM Plex Mono' }}>{formatCurrency(data.totalEkuitas)}</TableCell>
                                            </TableRow>

                                            <TableRow sx={{ backgroundColor: "#0f172a", borderTop: "2pt solid black", "@media print": { backgroundColor: "transparent !important", borderTop: "2pt solid black !important" } }}>
                                                <TableCell className="border-b-double-audit" sx={{ fontWeight: 900, color: "white", fontSize: 15, "@media print": { color: "black !important", fontSize: "12pt !important" } }}>TOTAL LIABILITAS & EKUITAS</TableCell>
                                                <TableCell align="right" className="amount border-b-double-audit" sx={{ fontWeight: 900, color: "white", fontSize: 15, fontFamily: 'IBM Plex Mono', "@media print": { color: "black !important", fontSize: "12pt !important" } }}>{formatCurrency(data.totalPasiva)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}

                        {/* 2. KOMPARATIF MODE RENDER */}
                        {neracaMode === "komparatif" && komparatifData && !loading && (
                            <>
                                <div className="hidden print:block mb-10 text-center">
                                    <h1 className="text-2xl font-bold uppercase">Analisis Neraca Per Tahun</h1>
                                    <p className="text-lg font-bold text-slate-700">Periode: {startYear} - {endYear}</p>
                                    <div className="w-24 h-1 bg-slate-900 mx-auto mt-2"></div>
                                </div>

                                <TableContainer component={Paper} elevation={0} sx={{ overflow: "auto", background: "transparent" }}>
                                    <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "#0f172a" }}>
                                                <TableCell sx={{
                                                    fontWeight: "bold",
                                                    color: "white",
                                                    background: "#0f172a",
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    position: "sticky",
                                                    left: 0,
                                                    zIndex: 30, // Higher than body sections
                                                    borderRight: "2px solid #1e293b"
                                                }}>KETERANGAN</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" sx={{
                                                        fontWeight: "bold",
                                                        color: "white",
                                                        background: "#0f172a",
                                                        width: "180px",
                                                        minWidth: "180px",
                                                        fontSize: 14,
                                                        borderBottom: "1px solid #1e293b"
                                                    }}>{y}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {/* ASET */}
                                            <TableRow sx={{ backgroundColor: "#f1f5f9", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{
                                                    fontWeight: 900,
                                                    position: "sticky",
                                                    left: 0,
                                                    background: "#f1f5f9",
                                                    zIndex: 10,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    borderRight: "2px solid #cbd5e1",
                                                    "@media print": { backgroundColor: "transparent !important", borderRight: "none !important", borderBottom: "1.5pt solid black !important", pt: 1 }
                                                }}>ASET</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" className="amount" sx={{ fontWeight: 900, fontFamily: 'IBM Plex Mono', width: "180px", minWidth: "180px", "@media print": { borderBottom: "1.5pt solid black !important" } }}>{formatCurrency(komparatifData.totalAsets[y])}</TableCell>
                                                ))}
                                            </TableRow>
                                            {komparatifData.aset.map((g, i) => <NeracaGroupKomparatif key={i} group={g} years={komparatifData.years} theme={theme} />)}

                                            <TableRow border={0} sx={{ height: 20 }}><TableCell colSpan={komparatifData.years.length + 1} border={0}></TableCell></TableRow>

                                            {/* LIABILITAS */}
                                            <TableRow sx={{ backgroundColor: "#f1f5f9", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{
                                                    fontWeight: 900,
                                                    position: "sticky",
                                                    left: 0,
                                                    background: "#f1f5f9",
                                                    zIndex: 10,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    borderRight: "2px solid #fed7aa",
                                                    "@media print": { backgroundColor: "transparent !important", borderRight: "none !important", borderBottom: "1.2pt solid black !important", pt: 3 }
                                                }}>LIABILITAS</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" className="amount" sx={{ fontWeight: 900, fontFamily: 'IBM Plex Mono', width: "180px", minWidth: "180px", "@media print": { borderBottom: "1.2pt solid black !important" } }}>{formatCurrency(komparatifData.totalLiabilitas[y])}</TableCell>
                                                ))}
                                            </TableRow>
                                            {komparatifData.liabilitas.map((g, i) => <NeracaGroupKomparatif key={i} group={g} years={komparatifData.years} theme={theme} />)}

                                            <TableRow border={0} sx={{ height: 20 }}><TableCell colSpan={komparatifData.years.length + 1} border={0}></TableCell></TableRow>

                                            {/* EKUITAS */}
                                            <TableRow sx={{ backgroundColor: "#f1f5f9", "@media print": { backgroundColor: "transparent !important" } }}>
                                                <TableCell className="section-header" sx={{
                                                    fontWeight: 900,
                                                    position: "sticky",
                                                    left: 0,
                                                    background: "#f1f5f9",
                                                    zIndex: 10,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    borderRight: "2px solid #f1f5f9",
                                                    "@media print": { backgroundColor: "transparent !important", borderRight: "none !important", borderBottom: "1.2pt solid black !important", pt: 3 }
                                                }}>EKUITAS</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" className="amount" sx={{ fontWeight: 900, fontFamily: 'IBM Plex Mono', width: "180px", minWidth: "180px", "@media print": { borderBottom: "1.2pt solid black !important" } }}>{formatCurrency(komparatifData.totalEkuitas[y])}</TableCell>
                                                ))}
                                            </TableRow>
                                            {komparatifData.ekuitas.map((g, i) => <NeracaGroupKomparatif key={i} group={g} years={komparatifData.years} theme={theme} />)}
                                            <TableRow>
                                                <TableCell sx={{
                                                    pl: 8,
                                                    position: "sticky",
                                                    left: 0,
                                                    background: "white",
                                                    zIndex: 5,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    borderRight: "2px solid #f1f5f9"
                                                }}>Laba/Rugi Berjalan</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" sx={{ fontFamily: 'IBM Plex Mono', width: "180px", minWidth: "180px" }}>{formatCurrency(komparatifData.labaDitahan[y])}</TableCell>
                                                ))}
                                            </TableRow>

                                            <TableRow sx={{ backgroundColor: "#1e293b", "@media print": { backgroundColor: "transparent !important", borderTop: "2pt solid black !important" } }}>
                                                <TableCell className="border-b-double-audit" sx={{
                                                    fontWeight: 900,
                                                    color: "white",
                                                    position: "sticky",
                                                    left: 0,
                                                    background: "#f1f5f9",
                                                    zIndex: 10,
                                                    width: "350px",
                                                    minWidth: "350px",
                                                    borderRight: "2px solid #1e293b",
                                                    "@media print": { color: "black !important", background: "transparent !important", borderRight: "none !important", fontSize: "12pt !important" }
                                                }}>TOTAL LIABILITAS & EKUITAS</TableCell>
                                                {komparatifData.years.map(y => (
                                                    <TableCell key={y} align="right" className="amount border-b-double-audit" sx={{ fontWeight: 900, color: "white", fontFamily: 'IBM Plex Mono', width: "180px", minWidth: "180px", "@media print": { color: "black !important", fontSize: "12pt !important" } }}>{formatCurrency(komparatifData.totalPasivas[y])}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}

                        {/* Signature Block */}
                        <div className="hidden print:grid grid-cols-2 gap-16 mt-20 px-12 text-center text-xs">
                            <div>
                                <p className="font-bold mb-24 uppercase tracking-widest">Disetujui Oleh,</p>
                                <div className="border-b border-slate-900 w-56 mx-auto mb-2"></div>
                                <p className="font-bold">Direktur Utama</p>
                            </div>
                            <div>
                                <p className="font-bold mb-24 uppercase tracking-widest">Dipersiapkan Oleh,</p>
                                <div className="border-b border-slate-900 w-56 mx-auto mb-2"></div>
                                <p className="font-bold">Bagian Keuangan</p>
                            </div>
                        </div>

                    </div>
                </div>
            </ReportLayout.Content>

            <style>{`
                @media print {
                    @page {
                        size: ${neracaMode === "komparatif" ? "A4 landscape" : "A4 portrait"};
                        margin: 15mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: "Times New Roman", serif !important;
                        color: black !important;
                    }
                    .print-container {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Standardizing text for audit-style */
                    * {
                        background-color: transparent !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    h1, h2, h3, p, span, div, td, th {
                        color: black !important;
                        font-family: inherit !important;
                    }
                    
                    /* Table Overrides for Audit Style */
                    .MuiTable-root {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        table-layout: fixed !important;
                    }
                    .MuiTableCell-root {
                        border: none !important; /* Remove all default borders */
                        padding: 2px 4px !important;
                        font-size: 10.5pt !important;
                        line-height: 1.35 !important;
                        color: black !important;
                    }
                    
                    /* Vertical Lines elimination */
                    .MuiTableCell-root[style*="position: sticky"] {
                        border-right: none !important;
                    }

                    /* Hierarchy and Alignment */
                    .amount {
                        font-variant-numeric: tabular-nums !important;
                        text-align: right !important;
                    }
                    
                    /* Total Lines */
                    .border-t-audit {
                        border-top: 1px solid black !important;
                    }
                    .border-b-double-audit {
                        border-bottom: 3px double black !important;
                        /* fallback for some browsers */
                        border-bottom-style: double !important;
                        border-bottom-width: 3px !important;
                    }
                    
                    .section-header {
                        font-weight: bold !important;
                        text-transform: uppercase !important;
                        padding-top: 12px !important;
                    }
                    
                    .MuiCollapse-wrapper {
                        display: block !important;
                        height: auto !important;
                        visibility: visible !important;
                    }
                }
                .font-mono { font-family: 'IBM Plex Mono', monospace !important; }
            `}</style>
        </ReportLayout>
    );
}
