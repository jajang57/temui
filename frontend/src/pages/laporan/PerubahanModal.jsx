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
    IconButton,
    Divider,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import PrintIcon from "@mui/icons-material/Print";

function formatRupiah(value) {
    if (!value || isNaN(value)) return "Rp 0";
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString("id-ID");
    if (num < 0) {
        return `(Rp ${formatted})`;
    }
    return `Rp ${formatted}`;
}

import ReportLayout from "../../components/ReportLayout";

export default function PerubahanModal() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/laporan/perubahan-modal", {
                params: { start_date: startDate, end_date: endDate },
            });
            setData(res.data);
        } catch (err) {
            setError("Gagal mengambil data Laporan Perubahan Modal");
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
                            Laporan Perubahan Modal
                        </h1>
                        {data && (
                            <p className="text-sm font-medium text-gray-500 mt-1" style={{ fontFamily: theme.fontFamily }}>
                                Periode: <span className="text-gray-900">{data.periode}</span>
                            </p>
                        )}
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
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Perubahan Modal</h1>
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
                                            sx={{
                                                fontWeight: "bold",
                                                color: theme.tableFontColor,
                                                fontFamily: theme.tableFontFamily,
                                                fontSize: 16,
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
                                    {/* MODAL AWAL */}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, pl: 2, background: theme.tableBodyColor, color: theme.tableFontColor }}>
                                            Modal Awal Periode
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, background: theme.tableBodyColor, color: theme.tableFontColor }}>
                                            {formatRupiah(data.modal_awal)}
                                        </TableCell>
                                    </TableRow>

                                    {/* PENAMBAHAN */}
                                    <TableRow sx={{ backgroundColor: theme.tableHeaderColor }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, pl: 2, color: "#2e7d32", background: theme.tableHeaderColor }}>
                                            Penambahan:
                                        </TableCell>
                                    </TableRow>
                                    {data.penambahan?.length > 0 ? (
                                        data.penambahan.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ pl: 4, fontFamily: theme.tableFontFamily, color: theme.tableFontColor, background: theme.tableBodyColor }}>
                                                    {item.nama}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: theme.tableFontFamily, color: theme.tableFontColor, background: theme.tableBodyColor }}>
                                                    {formatRupiah(item.nilai)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell sx={{ pl: 4, fontStyle: "italic", color: "gray", background: theme.tableBodyColor }}>Tidak ada penambahan</TableCell>
                                            <TableCell sx={{ background: theme.tableBodyColor }}></TableCell>
                                        </TableRow>
                                    )}

                                    {/* PENGURANGAN */}
                                    <TableRow sx={{ backgroundColor: theme.tableHeaderColor }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: "bold", fontFamily: theme.tableFontFamily, pl: 2, color: "#c62828", background: theme.tableHeaderColor }}>
                                            Pengurangan:
                                        </TableCell>
                                    </TableRow>
                                    {data.pengurangan?.length > 0 ? (
                                        data.pengurangan.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ pl: 4, fontFamily: theme.tableFontFamily, color: theme.tableFontColor, background: theme.tableBodyColor }}>
                                                    {item.nama}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: theme.tableFontFamily, color: theme.tableFontColor, background: theme.tableBodyColor }}>
                                                    {formatRupiah(item.nilai)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell sx={{ pl: 4, fontStyle: "italic", color: "gray", background: theme.tableBodyColor }}>Tidak ada pengurangan</TableCell>
                                            <TableCell sx={{ background: theme.tableBodyColor }}></TableCell>
                                        </TableRow>
                                    )}

                                    {/* MODAL AKHIR */}
                                    <TableRow sx={{ backgroundColor: "#e8f5e9", borderTop: "2px solid #2e7d32" }}>
                                        <TableCell sx={{ fontWeight: "extra-bold", fontFamily: theme.tableFontFamily, fontSize: 18, color: "#1b5e20", pl: 2 }}>
                                            MODAL AKHIR PERIODE
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "extra-bold", fontFamily: theme.tableFontFamily, fontSize: 18, color: "#1b5e20" }}>
                                            {formatRupiah(data.modal_akhir)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </div>
            </ReportLayout.Content>

            {/* Print Styles */}
            <style>
                {`
          @media print {
            .no-print { display: none !important; }
            .print-header { margin-bottom: 20px; }
          }
        `}
            </style>
        </ReportLayout>
    );
}
