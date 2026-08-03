import React, { useState, useEffect, useRef } from "react";
import {
    Box, Paper, Grid, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Collapse, IconButton,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { AiFillFilePdf } from "react-icons/ai";
import { FaFileExcel } from "react-icons/fa";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
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

function ActivitySection({ title, data, theme, color }) {
    const [open, setOpen] = useState(true);
    return (
        <>
            <TableRow sx={{ backgroundColor: "#F3F6FF", cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <TableCell colSpan={2} sx={{ fontWeight: 700, color: color || "#333", fontSize: 13, pl: 2, py: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconButton size="small" sx={{ p: 0, mr: 0.5 }}>
                            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                        {title}
                    </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: color || "#333", fontSize: 13, pr: 2 }}>
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
                                        <TableRow key={idx} sx={{ background: idx % 2 === 0 ? "#fff" : "#fafbff" }}>
                                            <TableCell sx={{ pl: 7, fontSize: 12, color: "#444", borderBottom: "1px solid #f0f0f0", width: "70%" }}>
                                                {item.nama}
                                            </TableCell>
                                            <TableCell sx={{ width: "1%", p: 0, border: 0 }} />
                                            <TableCell align="right" sx={{ pr: 3, fontSize: 12, color: "#444", borderBottom: "1px solid #f0f0f0" }}>
                                                {formatRupiah(item.nilai)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} sx={{ pl: 7, fontStyle: "italic", color: "#aaa", fontSize: 12 }}>
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

export default function ArusKas() {
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
            const res = await api.get("/laporan/arus-kas", {
                params: { start_date: startDate, end_date: endDate },
            });
            setData(res.data);
        } catch (err) {
            setError("Gagal mengambil data Laporan Arus Kas");
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
                    pdf.save(`laporan-arus-kas-${startDate}-${endDate}.pdf`);
                })
            )
        );
    };

    const handleExportExcel = () => {
        if (!data) return;
        import("xlsx").then(({ default: XLSX }) => {
            const rows = [];
            const addSection = (title, section) => {
                rows.push({ Keterangan: title, Jumlah: "" });
                (section?.items || []).forEach(i => rows.push({ Keterangan: `  ${i.nama}`, Jumlah: i.nilai }));
                rows.push({ Keterangan: `Total ${title}`, Jumlah: section?.total || 0 });
                rows.push({});
            };
            addSection("ARUS KAS DARI AKTIVITAS OPERASI", data.operasi);
            addSection("ARUS KAS DARI AKTIVITAS INVESTASI", data.investasi);
            addSection("ARUS KAS DARI AKTIVITAS PENDANAAN", data.pendanaan);
            rows.push({ Keterangan: "KENAIKAN / (PENURUNAN) BERSIH KAS", Jumlah: data.kenaikan_bersih });
            rows.push({ Keterangan: "Saldo Kas Awal Periode", Jumlah: data.kas_awal });
            rows.push({ Keterangan: "SALDO KAS AKHIR PERIODE", Jumlah: data.kas_akhir });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Arus Kas");
            XLSX.writeFile(wb, `laporan-arus-kas-${startDate}-${endDate}.xlsx`);
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
                            <Box sx={{ fontSize: 20, fontWeight: 800, color: "#1565C0" }}>Laporan Arus Kas</Box>
                            <Box sx={{ fontSize: 12, color: "#888", mt: "2px" }}>
                                Metode Tidak Langsung (Indirect Method)
                            </Box>
                            <Box sx={{ fontSize: 12, color: "#555", mt: "2px" }}>
                                Periode: {formatDate(startDate)} s/d {formatDate(endDate)}
                            </Box>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#1565C0" }}>
                                        <TableCell colSpan={2} sx={{ color: "#fff", fontWeight: 700, fontSize: 12, py: 1.5, letterSpacing: "0.04em" }}>
                                            KETERANGAN
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, fontSize: 12, py: 1.5, letterSpacing: "0.04em", pr: 2 }}>
                                            JUMLAH
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <ActivitySection title="ARUS KAS DARI AKTIVITAS OPERASI" data={data.operasi} theme={theme} color="#1565C0" />
                                    <ActivitySection title="ARUS KAS DARI AKTIVITAS INVESTASI" data={data.investasi} theme={theme} color="#E65100" />
                                    <ActivitySection title="ARUS KAS DARI AKTIVITAS PENDANAAN" data={data.pendanaan} theme={theme} color="#2E7D32" />

                                    {/* Kenaikan Bersih */}
                                    <TableRow sx={{ backgroundColor: "#E3F2FD" }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: 13, pl: 2, py: 1.5, color: "#0D47A1" }}>
                                            KENAIKAN / (PENURUNAN) BERSIH KAS
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, pr: 2, color: "#0D47A1" }}>
                                            {formatRupiah(data.kenaikan_bersih)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Saldo Awal */}
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ fontSize: 12, pl: 4, py: 1.2, color: "#444", borderBottom: "1px solid #eee" }}>
                                            Saldo Kas Awal Periode
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: 12, pr: 2, py: 1.2, color: "#444", borderBottom: "1px solid #eee" }}>
                                            {formatRupiah(data.kas_awal)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Saldo Akhir */}
                                    <TableRow sx={{ backgroundColor: "#E8F5E9", borderTop: "2px solid #2E7D32" }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: 14, pl: 2, py: 2, color: "#1B5E20" }}>
                                            SALDO KAS AKHIR PERIODE
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 14, pr: 2, py: 2, color: "#1B5E20" }}>
                                            {formatRupiah(data.kas_akhir)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Validasi */}
                            <Box sx={{ p: "6px 16px", textAlign: "right", fontSize: 11, borderTop: "1px solid #eee" }}>
                                {Math.abs((data.kas_awal + data.kenaikan_bersih) - data.kas_akhir) < 1 ? (
                                    <span style={{ color: "#2E7D32" }}>✓ Balance OK</span>
                                ) : (
                                    <span style={{ color: "#C62828" }}>
                                        ⚠ Selisih: {((data.kas_awal + data.kenaikan_bersih) - data.kas_akhir).toLocaleString("id-ID")}
                                    </span>
                                )}
                            </Box>
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
