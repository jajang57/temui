import React, { useState, useEffect } from "react";
import {
  Box, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { FiPrinter } from "react-icons/fi";
import { AiFillFilePdf } from "react-icons/ai";
import { FaFileExcel } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ReportLayout from "../../components/ReportLayout";
import api from "../../utils/api";

function formatRupiah(value) {
  if (value === undefined || value === null || isNaN(value)) return "Rp 0";
  const num = Number(value);
  const formatted = Math.abs(num).toLocaleString("id-ID");
  return num < 0 ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

function formatDate(dateStr) {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function GroupSection({ group, theme }) {
  const [open, setOpen] = useState(true);

  const headerBg = theme.tableHeaderColor || "#f0f0f0";
  const bodyBg   = theme.tableBodyColor   || "#fff";
  const altBg    = theme.tableAltRowColor || "#f9f9f9";
  const fontColor = theme.tableFontColor  || "#222";
  const fontFamily = theme.tableFontFamily;

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{ background: headerBg, cursor: "pointer", "&:hover": { opacity: 0.85 } }}
      >
        <TableCell sx={{ color: fontColor, fontFamily, fontWeight: 600, py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
            {group.kode}
          </Box>
        </TableCell>
        <TableCell sx={{ color: fontColor, fontFamily, fontWeight: 600, py: 1 }}>{group.nama}</TableCell>
        <TableCell align="right" sx={{ color: fontColor, fontFamily, fontWeight: 600, py: 1 }}>
          {formatRupiah(group.subtotal)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableBody>
                {group.items?.map((item, idx) => (
                  <TableRow key={idx} sx={{ background: idx % 2 === 0 ? bodyBg : altBg }}>
                    <TableCell sx={{ pl: 5, color: fontColor, fontFamily, py: 0.75, width: "15%" }}>
                      {item.akunKode}
                    </TableCell>
                    <TableCell sx={{ color: fontColor, fontFamily, py: 0.75 }}>
                      {item.akunNama}
                    </TableCell>
                    <TableCell align="right" sx={{ color: fontColor, fontFamily, py: 0.75, pr: 2 }}>
                      {formatRupiah(item.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function LabaRugi() {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate]     = useState(`${currentYear}-12-31`);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/laporan/laba-rugi", {
        params: { start_date: startDate, end_date: endDate },
      });
      setData(res.data);
    } catch {
      setError("Gagal mengambil data Laporan Laba Rugi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text("Laporan Laba Rugi", 105, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`, 105, 23, { align: 'center' });

    const body = [];
    body.push([{ content: 'PENDAPATAN', colSpan: 3, styles: { fillColor: [227, 242, 253], textColor: [21, 101, 192], fontStyle: 'bold' } }]);
    data?.pendapatan?.forEach(g => {
      body.push([{ content: g.kode, styles: { fontStyle: 'bold' } }, { content: g.nama, styles: { fontStyle: 'bold' } }, { content: formatRupiah(g.subtotal), styles: { halign: 'right', fontStyle: 'bold' } }]);
      g.items?.forEach(item => body.push([{ content: '  ' + item.akunKode }, item.akunNama, { content: formatRupiah(item.saldo), styles: { halign: 'right' } }]));
    });
    body.push([{ content: 'TOTAL PENDAPATAN', colSpan: 2, styles: { fillColor: [187, 222, 251], textColor: [13, 71, 161], fontStyle: 'bold' } }, { content: formatRupiah(data?.totalPendapatan), styles: { halign: 'right', fillColor: [187, 222, 251], textColor: [13, 71, 161], fontStyle: 'bold' } }]);
    body.push([{ content: 'BEBAN', colSpan: 3, styles: { fillColor: [255, 235, 238], textColor: [198, 40, 40], fontStyle: 'bold' } }]);
    data?.beban?.forEach(g => {
      body.push([{ content: g.kode, styles: { fontStyle: 'bold' } }, { content: g.nama, styles: { fontStyle: 'bold' } }, { content: formatRupiah(g.subtotal), styles: { halign: 'right', fontStyle: 'bold' } }]);
      g.items?.forEach(item => body.push([{ content: '  ' + item.akunKode }, item.akunNama, { content: formatRupiah(item.saldo), styles: { halign: 'right' } }]));
    });
    body.push([{ content: 'TOTAL BEBAN', colSpan: 2, styles: { fillColor: [255, 205, 210], textColor: [183, 28, 28], fontStyle: 'bold' } }, { content: formatRupiah(data?.totalBeban), styles: { halign: 'right', fillColor: [255, 205, 210], textColor: [183, 28, 28], fontStyle: 'bold' } }]);
    const lbColor = data?.labaBersih >= 0 ? [200, 230, 201] : [255, 205, 210];
    const lbTextColor = data?.labaBersih >= 0 ? [46, 125, 50] : [198, 40, 40];
    body.push([{ content: data?.labaBersih >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH', colSpan: 2, styles: { fillColor: lbColor, textColor: lbTextColor, fontStyle: 'bold', fontSize: 11 } }, { content: formatRupiah(data?.labaBersih), styles: { halign: 'right', fillColor: lbColor, textColor: lbTextColor, fontStyle: 'bold', fontSize: 11 } }]);

    autoTable(doc, {
      startY: 28,
      head: [['Kode', 'Nama Akun', 'Jumlah']],
      body,
      headStyles: { fillColor: [30, 136, 229], fontSize: 9 },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 30 }, 2: { halign: 'right', cellWidth: 45 } },
      margin: { left: 12, right: 12 },
    });
    doc.save("LabaRugi.pdf");
  };

  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    const wsData = [
      ["Laporan Laba Rugi", "", ""],
      [`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`, "", ""],
      [],
      ["Kode", "Nama Akun", "Jumlah"],
      ["PENDAPATAN", "", ""],
    ];
    data?.pendapatan?.forEach(g => {
      wsData.push([g.kode, g.nama, g.subtotal]);
      g.items?.forEach(item => wsData.push(["  " + item.akunKode, item.akunNama, item.saldo]));
    });
    wsData.push(["TOTAL PENDAPATAN", "", data?.totalPendapatan]);
    wsData.push([]);
    wsData.push(["BEBAN", "", ""]);
    data?.beban?.forEach(g => {
      wsData.push([g.kode, g.nama, g.subtotal]);
      g.items?.forEach(item => wsData.push(["  " + item.akunKode, item.akunNama, item.saldo]));
    });
    wsData.push(["TOTAL BEBAN", "", data?.totalBeban]);
    wsData.push([]);
    wsData.push([data?.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH", "", data?.labaBersih]);
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "LabaRugi");
    xlsx.writeFile(wb, "LabaRugi.xlsx");
  };

  const thCell = { fontWeight: "bold", color: theme.tableFontColor, fontFamily: theme.tableFontFamily, background: theme.tableHeaderColor, py: 1.25 };

  return (
    <ReportLayout>
      <ReportLayout.Header>
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2, background: theme.cardColor }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField label="Tanggal Mulai" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={startDate} onChange={e => setStartDate(e.target.value)}
                sx={{ background: theme.fieldColor }}
                inputProps={{ style: { color: theme.fontColor, fontFamily: theme.fontFamily } }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Tanggal Akhir" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={endDate} onChange={e => setEndDate(e.target.value)}
                sx={{ background: theme.fieldColor }}
                inputProps={{ style: { color: theme.fontColor, fontFamily: theme.fontFamily } }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" fullWidth
                sx={{ height: 40, background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
                onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Tampilkan"}
              </Button>
            </Grid>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
              <Button onClick={handlePrint} variant="contained" startIcon={<FiPrinter />}
                sx={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}>
                Print
              </Button>
              <Button onClick={handleExportPDF} variant="contained" startIcon={<AiFillFilePdf />}
                sx={{ background: theme.buttonHapus, color: "#fff", fontFamily: theme.fontFamily }}>
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} variant="contained" startIcon={<FaFileExcel />}
                sx={{ background: theme.buttonEdit || "#2e7d32", color: "#fff", fontFamily: theme.fontFamily }}>
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </ReportLayout.Header>

      {error && <Box sx={{ px: 3, py: 1, color: "error.main", fontFamily: theme.fontFamily }}>{error}</Box>}

      <ReportLayout.Content>
        <Box sx={{ maxWidth: 900, mx: "auto", width: "100%", p: { xs: 2, md: 3 } }}>

          {/* Report title (visible in screen + print) */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box sx={{ fontWeight: 700, fontSize: 20, color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Laporan Laba Rugi
            </Box>
            {data && (
              <Box sx={{ fontSize: 13, color: theme.fontColor, opacity: 0.65, mt: 0.5, fontFamily: theme.fontFamily }}>
                Periode: {formatDate(startDate)} s/d {formatDate(endDate)}
              </Box>
            )}
          </Box>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {data && !loading && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2, background: theme.cardColor, overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...thCell, width: "15%" }}>Kode</TableCell>
                    <TableCell sx={thCell}>Nama Akun</TableCell>
                    <TableCell align="right" sx={{ ...thCell, width: "25%", pr: 2 }}>Jumlah</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>

                  {/* ── PENDAPATAN ── */}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ background: "#e3f2fd", color: "#1565c0", fontWeight: 700, fontSize: 13, fontFamily: theme.tableFontFamily, py: 1, letterSpacing: 0.5 }}>
                      PENDAPATAN
                    </TableCell>
                  </TableRow>
                  {data.pendapatan?.map((group, idx) => (
                    <GroupSection key={idx} group={group} theme={theme} />
                  ))}
                  <TableRow sx={{ background: "#bbdefb" }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700, color: "#0d47a1", fontFamily: theme.tableFontFamily, py: 1.25 }}>
                      TOTAL PENDAPATAN
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#0d47a1", fontFamily: theme.tableFontFamily, py: 1.25, pr: 2 }}>
                      {formatRupiah(data.totalPendapatan)}
                    </TableCell>
                  </TableRow>

                  {/* spacer */}
                  <TableRow><TableCell colSpan={3} sx={{ height: 8, border: 0, background: theme.cardColor }} /></TableRow>

                  {/* ── BEBAN ── */}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ background: "#ffebee", color: "#c62828", fontWeight: 700, fontSize: 13, fontFamily: theme.tableFontFamily, py: 1, letterSpacing: 0.5 }}>
                      BEBAN
                    </TableCell>
                  </TableRow>
                  {data.beban?.map((group, idx) => (
                    <GroupSection key={idx} group={group} theme={theme} />
                  ))}
                  <TableRow sx={{ background: "#ffcdd2" }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700, color: "#b71c1c", fontFamily: theme.tableFontFamily, py: 1.25 }}>
                      TOTAL BEBAN
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#b71c1c", fontFamily: theme.tableFontFamily, py: 1.25, pr: 2 }}>
                      {formatRupiah(data.totalBeban)}
                    </TableCell>
                  </TableRow>

                  {/* spacer */}
                  <TableRow><TableCell colSpan={3} sx={{ height: 8, border: 0, background: theme.cardColor }} /></TableRow>

                  {/* ── LABA / RUGI BERSIH ── */}
                  <TableRow sx={{ background: data.labaBersih >= 0 ? "#c8e6c9" : "#ffcdd2" }}>
                    <TableCell colSpan={2} sx={{
                      fontWeight: 700, fontSize: 15, fontFamily: theme.tableFontFamily, py: 1.5,
                      color: data.labaBersih >= 0 ? "#2e7d32" : "#c62828",
                    }}>
                      {data.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}
                    </TableCell>
                    <TableCell align="right" sx={{
                      fontWeight: 700, fontSize: 15, fontFamily: theme.tableFontFamily, py: 1.5, pr: 2,
                      color: data.labaBersih >= 0 ? "#2e7d32" : "#c62828",
                    }}>
                      {formatRupiah(data.labaBersih)}
                    </TableCell>
                  </TableRow>

                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Print area */}
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
          }
        `}</style>
      </ReportLayout.Content>
    </ReportLayout>
  );
}
