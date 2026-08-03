import React, { useRef, useEffect, useState } from "react";
import {
  Box, Paper, Grid, TextField, Button, CircularProgress, MenuItem, Divider,
} from "@mui/material";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { AiFillFilePdf } from "react-icons/ai";
import { FaFileExcel } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ReportLayout from "../../components/ReportLayout";

/* ── helpers ───────────────────────────────────────────── */
function fmt(num, fallback = "-") {
  if (num === undefined || num === null || isNaN(num)) return fallback;
  const n = Number(num);
  if (n === 0) return fallback;
  const s = Math.abs(n).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
}

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
}

function getMetodeRate(metode, umurBulan) {
  if (!metode) return "-";
  if (metode === "Garis Lurus" || metode === "Straight Line") {
    const rate = umurBulan > 0 ? ((12 / umurBulan) * 100).toFixed(2) : "0.00";
    return `Straight Line (${rate} %)`;
  }
  return metode;
}

function getEstimatedLive(umurBulan) {
  if (!umurBulan) return "-";
  return `${Math.floor(umurBulan / 12)} (Year) ${umurBulan % 12} (Month)`;
}

/* ── sub-components ─────────────────────────────────────── */
function InfoField({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: "4px", fontSize: 12 }}>
      <Box sx={{ color: "#666", minWidth: 130, flexShrink: 0 }}>{label}</Box>
      <Box sx={{ color: "#222", fontWeight: 500 }}>
        : {value || "-"}
      </Box>
    </Box>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function LaporanFixAsset() {
  const { theme } = useTheme();
  const printRef = useRef(null);

  const [asetList, setAsetList] = useState([]);
  const [selectedAset, setSelectedAset] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/master-aset-tetap").then((res) => setAsetList(res.data || []));
  }, []);

  const fetchData = async () => {
    if (!selectedAset) { setError("Pilih aset terlebih dahulu"); return; }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ kode_aset: selectedAset });
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const res = await api.get(`/laporan/fix-asset-history?${params}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    import("jspdf").then(({ default: jsPDF }) =>
      import("html2canvas").then(({ default: html2canvas }) =>
        html2canvas(printRef.current, { scale: 2 }).then((canvas) => {
          const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
          const imgData = canvas.toDataURL("image/png");
          const w = pdf.internal.pageSize.getWidth();
          pdf.addImage(imgData, "PNG", 0, 0, w, (canvas.height * w) / canvas.width);
          pdf.save(`fix-asset-history-${selectedAset}.pdf`);
        })
      )
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    import("xlsx").then(({ default: XLSX }) => {
      const ws = XLSX.utils.json_to_sheet(
        data.history.map((r) => ({
          Date: fmtDate(r.tanggal),
          Note: r.keterangan,
          Transno: r.nomorTransaksi,
          Source: r.source,
          Qty: r.qty,
          "Asset Cost": r.assetCost || 0,
          "Depr Amount": r.deprAmount || 0,
          "Book Value": r.nilaiBuku || 0,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fix Asset History");
      XLSX.writeFile(wb, `fix-asset-history-${selectedAset}.xlsx`);
    });
  };

  const aset = data?.aset;
  const lastRow = data?.history?.length ? data.history[data.history.length - 1] : null;

  return (
    <ReportLayout>
      {/* ── Filter Bar ── */}
      <ReportLayout.Header>
        <Paper elevation={2} sx={{ p: "12px 16px", mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                select label="Pilih Aset" value={selectedAset}
                onChange={(e) => setSelectedAset(e.target.value)}
                fullWidth size="small"
              >
                <MenuItem value="">-- Pilih Aset --</MenuItem>
                {asetList.map((a) => (
                  <MenuItem key={a.kodeAset} value={a.kodeAset}>
                    {a.kodeAset} — {a.namaAset}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField type="date" label="Tanggal Mulai" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField type="date" label="Tanggal Akhir" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }} />
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
                startIcon={<AiFillFilePdf size={14} />}
                sx={{ textTransform: "none" }}>
                PDF
              </Button>
              <Button variant="outlined" color="success" onClick={handleExportExcel} disabled={!data}
                startIcon={<FaFileExcel size={14} />}
                sx={{ textTransform: "none" }}>
                Excel
              </Button>
            </Grid>
          </Grid>
          {error && <Box sx={{ color: "red", mt: 1, fontSize: 12 }}>{error}</Box>}
        </Paper>
      </ReportLayout.Header>

      {/* ── Report Content ── */}
      <ReportLayout.Content>
        {!data && !loading && (
          <Box sx={{ textAlign: "center", color: "#aaa", py: 10, fontSize: 14 }}>
            Pilih aset dan klik Tampilkan untuk melihat laporan
          </Box>
        )}

        {data && (
          <Box ref={printRef} sx={{ p: "0 24px 24px" }}>
            {/* Title */}
            <Box sx={{ textAlign: "center", pt: 3, pb: 2 }}>
              <Box sx={{ fontSize: 22, fontWeight: 800, color: "#1565C0", letterSpacing: "0.03em" }}>
                Fix Asset History
              </Box>
              <Box sx={{ fontSize: 12, color: "#777", mt: "2px" }}>
                Period {startDate ? fmtDate(startDate) : "-"} — {endDate ? fmtDate(endDate) : "-"}
                &nbsp;|&nbsp; Asset Name : <strong>{aset?.namaAset}</strong>
              </Box>
            </Box>

            {/* Asset Info Card */}
            <Paper
              variant="outlined"
              sx={{ mb: 3, p: "12px 16px", background: "#F8FAFF", borderColor: "#c5d8f5", borderRadius: 2 }}
            >
              <Grid container spacing={0}>
                {/* Left column */}
                <Grid item xs={12} sm={4} sx={{ pr: 2 }}>
                  <InfoField label="Fix Asset No" value={<strong>{aset?.kodeAset}</strong>} />
                  <InfoField label="Asset Name" value={`${aset?.namaAset} (Tangible)`} />
                  <InfoField label="Asset Type" value={aset?.kategoriAset} />
                  <InfoField label="Departemen" value="" />
                </Grid>

                {/* Middle column */}
                <Grid item xs={12} sm={4} sx={{ borderLeft: "1px solid #dce8fb", px: 2 }}>
                  <InfoField label="Usage Date" value={fmtDate(aset?.tanggalPerolehan)} />
                  <InfoField label="Age" value={data.age} />
                  <InfoField label="Method (Rate)" value={getMetodeRate(aset?.metodePenyusutan, aset?.umurEkonomis)} />
                  <InfoField label="Estimated Live" value={getEstimatedLive(aset?.umurEkonomis)} />
                </Grid>

                {/* Right column */}
                <Grid item xs={12} sm={4} sx={{ borderLeft: "1px solid #dce8fb", pl: 2 }}>
                  <InfoField label="Asset Account" value={data.akunNamaAset} />
                  <InfoField label="Accum Depr Acc" value={data.akunNamaAkum} />
                  <InfoField label="Depr Expense Acc" value={data.akunNamaDepr} />
                  <InfoField
                    label="Salvage Value"
                    value={aset?.nilaiResidu ? fmt(aset.nilaiResidu) : "-"}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Data Table */}
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <colgroup>
                  <col style={{ width: 100 }} />
                  <col />
                  <col style={{ width: 210 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 160 }} />
                  <col style={{ width: 140 }} />
                </colgroup>
                <thead>
                  <tr>
                    {[
                      ["DATE", "left"],
                      ["NOTE", "left"],
                      ["TRANSNO", "left"],
                      ["SOURCE", "center"],
                      ["QTY", "right"],
                      ["ASSET COST", "right"],
                      ["DEPRECIATION AMOUNT", "right"],
                      ["BOOK VALUE", "right"],
                    ].map(([label, align], i) => (
                      <th key={i} style={{
                        padding: "9px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        backgroundColor: "#1565C0",
                        textAlign: align,
                        letterSpacing: "0.04em",
                        borderRight: i < 7 ? "1px solid #1976D2" : "none",
                        whiteSpace: "nowrap",
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((row, i) => {
                    const bg = i % 2 === 0 ? "#fff" : "#f7f9fd";
                    const isFirst = row.source === "fixasset";
                    const td = (align = "left", extra = {}) => ({
                      padding: "7px 10px",
                      fontSize: 12,
                      color: "#222",
                      borderBottom: "1px solid #e8e8e8",
                      textAlign: align,
                      background: bg,
                      ...extra,
                    });
                    return (
                      <tr key={i}>
                        <td style={td("left", { fontWeight: isFirst ? 600 : 400 })}>{fmtDate(row.tanggal)}</td>
                        <td style={td("left")}>{row.keterangan}</td>
                        <td style={td("left", { color: "#1565C0", fontSize: 11 })}>{row.nomorTransaksi}</td>
                        <td style={td("center")}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isFirst ? "#e3f0ff" : "#f0f0f0",
                            color: isFirst ? "#1565C0" : "#555",
                          }}>
                            {row.source}
                          </span>
                        </td>
                        <td style={td("right")}>
                          {Number(row.qty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={td("right")}>{row.assetCost ? fmt(row.assetCost) : "-"}</td>
                        <td style={td("right", { color: row.deprAmount ? "#C62828" : "#222" })}>
                          {row.deprAmount ? fmt(row.deprAmount) : "-"}
                        </td>
                        <td style={td("right", { fontWeight: 600 })}>
                          {row.nilaiBuku ? fmt(row.nilaiBuku) : "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  <tr>
                    <td colSpan={4} style={{
                      padding: "10px 10px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1565C0",
                      backgroundColor: "#EDF4FF",
                      borderTop: "2px solid #1565C0",
                      textAlign: "center",
                    }}>
                      Total {aset?.namaAset}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, backgroundColor: "#EDF4FF", borderTop: "2px solid #1565C0" }}>
                      {Number(data.totalQty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, backgroundColor: "#EDF4FF", borderTop: "2px solid #1565C0" }}>
                      {fmt(data.totalCost)}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#C62828", backgroundColor: "#EDF4FF", borderTop: "2px solid #1565C0" }}>
                      {fmt(data.totalDepr)}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, backgroundColor: "#EDF4FF", borderTop: "2px solid #1565C0" }}>
                      {lastRow?.nilaiBuku ? fmt(lastRow.nilaiBuku) : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>
        )}
      </ReportLayout.Content>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </ReportLayout>
  );
}
