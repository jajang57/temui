import React, { useState, useEffect, useRef } from "react";
import {
    Box, Paper, Grid, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { AiFillFilePdf } from "react-icons/ai";
import { FaFileExcel } from "react-icons/fa";
import ReportLayout from "../../components/ReportLayout";

function formatRupiah(value) {
    if (!value || isNaN(value)) return "Rp 0";
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString("id-ID");
    return num < 0 ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function SectionHeader({ label, color = "#333" }) {
    return (
        <TableRow sx={{ backgroundColor: "#F3F6FF" }}>
            <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: 13, color, pl: 2, py: 1.2, borderBottom: "1px solid #e0e8f8" }}>
                {label}
            </TableCell>
        </TableRow>
    );
}

function ItemRow({ nama, nilai, idx }) {
    return (
        <TableRow sx={{ background: idx % 2 === 0 ? "#fff" : "#fafbff" }}>
            <TableCell sx={{ pl: 5, fontSize: 12, color: "#444", borderBottom: "1px solid #f0f0f0" }}>
                {nama}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: 12, color: "#444", borderBottom: "1px solid #f0f0f0", pr: 2 }}>
                {formatRupiah(nilai)}
            </TableCell>
        </TableRow>
    );
}

export default function PerubahanModal() {
    const { theme } = useTheme();
    const printRef = useRef(null);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = () => window.print();

    const handleExportPDF = () => {
        import("jspdf").then(({ default: jsPDF }) =>
            import("html2canvas").then(({ default: html2canvas }) =>
                html2canvas(printRef.current, { scale: 2 }).then((canvas) => {
                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                    const w = pdf.internal.pageSize.getWidth();
                    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, (canvas.height * w) / canvas.width);
                    pdf.save(`laporan-perubahan-modal-${startDate}-${endDate}.pdf`);
                })
            )
        );
    };

    const handleExportExcel = () => {
        if (!data) return;
        import("xlsx").then(({ default: XLSX }) => {
            const rows = [
                { Keterangan: "Modal Awal Periode", Jumlah: data.modal_awal },
                {},
                { Keterangan: "Penambahan:", Jumlah: "" },
                ...(data.penambahan || []).map(i => ({ Keterangan: `  ${i.nama}`, Jumlah: i.nilai })),
                {},
                { Keterangan: "Pengurangan:", Jumlah: "" },
                ...(data.pengurangan || []).map(i => ({ Keterangan: `  ${i.nama}`, Jumlah: i.nilai })),
                {},
                { Keterangan: "MODAL AKHIR PERIODE", Jumlah: data.modal_akhir },
            ];
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Perubahan Modal");
            XLSX.writeFile(wb, `laporan-perubahan-modal-${startDate}-${endDate}.xlsx`);
        });
    };

    return (
        <ReportLayout>
            {/* Filter Bar */}
            <ReportLayout.Header>
                <Paper elevation={2} sx={{ p: "12px 16px", mb: 2 }}>
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={6} sm={2}>
                            <TextField
                                type="date" label="Tanggal Mulai" value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                fullWidth size="small" InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <TextField
                                type="date" label="Tanggal Akhir" value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                fullWidth size="small" InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm="auto" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button variant="contained" onClick={fetchData} disabled={loading}
                                sx={{ background: "#1565C0", color: "#fff", textTransform: "none", minWidth: 110 }}>
                                {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Tampilkan"}
                            </Button>
                            <Button variant="outlined" onClick={handlePrint} disabled={!data}
                                startIcon={<FiPrinter size={14} />}
                                sx={{ textTransform: "none", borderColor: "#888", color: "#555" }}>
                                Print
                            </Button>
                            <Button variant="outlined" color="error" onClick={handleExportPDF} disabled={!data}
                                startIcon={<AiFillFilePdf size={14} />} sx={{ textTransform: "none" }}>
                                PDF
                            </Button>
                            <Button variant="outlined" color="success" onClick={handleExportExcel} disabled={!data}
                                startIcon={<FaFileExcel size={14} />} sx={{ textTransform: "none" }}>
                                Excel
                            </Button>
                        </Grid>
                    </Grid>
                    {error && <Box sx={{ color: "red", mt: 1, fontSize: 12 }}>{error}</Box>}
                </Paper>
            </ReportLayout.Header>

            <ReportLayout.Content>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                )}

                {data && !loading && (
                    <Box ref={printRef} sx={{ p: "0 24px 32px" }}>
                        {/* Title */}
                        <Box sx={{ textAlign: "center", pt: 3, pb: 2 }}>
                            <Box sx={{ fontSize: 20, fontWeight: 800, color: "#1565C0" }}>
                                Laporan Perubahan Modal
                            </Box>
                            <Box sx={{ fontSize: 12, color: "#555", mt: "4px" }}>
                                Periode: {formatDate(startDate)} s/d {formatDate(endDate)}
                            </Box>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#1565C0" }}>
                                        <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 12, py: 1.5, letterSpacing: "0.04em" }}>
                                            KETERANGAN
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, fontSize: 12, py: 1.5, letterSpacing: "0.04em", pr: 2 }}>
                                            JUMLAH
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Modal Awal */}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, pl: 2, py: 1.5, color: "#222" }}>
                                            Modal Awal Periode
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, pr: 2, py: 1.5, color: "#222" }}>
                                            {formatRupiah(data.modal_awal)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Penambahan */}
                                    <SectionHeader label="Penambahan:" color="#2E7D32" />
                                    {data.penambahan?.length > 0 ? (
                                        data.penambahan.map((item, idx) => (
                                            <ItemRow key={idx} nama={item.nama} nilai={item.nilai} idx={idx} />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ pl: 5, fontStyle: "italic", color: "#aaa", fontSize: 12 }}>
                                                Tidak ada penambahan
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Pengurangan */}
                                    <SectionHeader label="Pengurangan:" color="#C62828" />
                                    {data.pengurangan?.length > 0 ? (
                                        data.pengurangan.map((item, idx) => (
                                            <ItemRow key={idx} nama={item.nama} nilai={item.nilai} idx={idx} />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ pl: 5, fontStyle: "italic", color: "#aaa", fontSize: 12 }}>
                                                Tidak ada pengurangan
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Modal Akhir */}
                                    <TableRow sx={{ backgroundColor: "#E8F5E9", borderTop: "2px solid #2E7D32" }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 14, pl: 2, py: 2, color: "#1B5E20" }}>
                                            MODAL AKHIR PERIODE
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 14, pr: 2, py: 2, color: "#1B5E20" }}>
                                            {formatRupiah(data.modal_akhir)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {!data && !loading && (
                    <Box sx={{ textAlign: "center", color: "#aaa", py: 10, fontSize: 14 }}>
                        Klik Tampilkan untuk melihat laporan
                    </Box>
                )}
            </ReportLayout.Content>

            <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
        </ReportLayout>
    );
}
