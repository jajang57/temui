import React, { useRef, useState } from "react";
import {
  Box, Paper, Grid, TextField, Button, CircularProgress, Checkbox, FormControlLabel,
} from "@mui/material";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { AiFillFilePdf } from "react-icons/ai";
import { FaFileExcel } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ReportLayout from "../../components/ReportLayout";

function fmt(num) {
  if (num === undefined || num === null || isNaN(num)) return "-";
  const n = Number(num);
  if (n === 0) return "-";
  const s = Math.abs(n).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
}

const TH = ({ children, align = "left", width, style = {} }) => (
  <th style={{
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    backgroundColor: "#1565C0",
    textAlign: align,
    whiteSpace: "nowrap",
    borderRight: "1px solid #1976D2",
    letterSpacing: "0.04em",
    width: width || undefined,
    ...style,
  }}>
    {children}
  </th>
);

const TD = ({ children, align = "left", style = {}, bold = false, colSpan }) => (
  <td colSpan={colSpan} style={{
    padding: "6px 10px",
    fontSize: 12,
    textAlign: align,
    fontWeight: bold ? 700 : 400,
    borderBottom: "1px solid #eee",
    ...style,
  }}>
    {children}
  </td>
);

export default function LaporanFixAssetSummary() {
  const { theme } = useTheme();
  const printRef = useRef(null);

  const [periode, setPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [minBookValue, setMinBookValue] = useState("0");
  const [showDisposed, setShowDisposed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        periode,
        min_book_value: minBookValue,
        show_disposed: showDisposed ? "true" : "false",
      });
      const res = await api.get(`/laporan/fix-asset-summary?${params}`);
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
          const w = pdf.internal.pageSize.getWidth();
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, (canvas.height * w) / canvas.width);
          pdf.save(`fix-asset-summary-${periode}.pdf`);
        })
      )
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    import("xlsx").then(({ default: XLSX }) => {
      const rows = [];
      data.groups.forEach((g) => {
        rows.push({ "Aset Name": g.kategori, "Sub Ledger": "", Qty: "", "Asset Cost": "", "Acm Depr": "", Disposed: "", "Book Value": "" });
        g.subGroups.forEach((sg) => {
          rows.push({ "Aset Name": `  ${sg.subKategori}`, "Sub Ledger": "", Qty: "", "Asset Cost": "", "Acm Depr": "", Disposed: "", "Book Value": "" });
          sg.assets.forEach((a) => {
            rows.push({
              "Aset Name": `    ${a.kodeAset} - ${a.namaAset}`,
              "Sub Ledger": a.subLedger,
              Qty: a.qty,
              "Asset Cost": a.assetCost,
              "Acm Depr": a.acmDeprAmount,
              Disposed: a.disposed,
              "Book Value": a.bookValue,
            });
          });
          rows.push({ "Aset Name": `Sub Total ${sg.subKategori}`, "Sub Ledger": "", Qty: sg.totalQty, "Asset Cost": sg.totalCost, "Acm Depr": sg.totalDepr, Disposed: sg.totalDisposed, "Book Value": sg.totalBookValue });
        });
        rows.push({ "Aset Name": `Total ${g.kategori}`, "Sub Ledger": "", Qty: g.totalQty, "Asset Cost": g.totalCost, "Acm Depr": g.totalDepr, Disposed: g.totalDisposed, "Book Value": g.totalBookValue });
      });
      rows.push({ "Aset Name": "GRAND TOTAL", "Sub Ledger": "", Qty: data.grandTotal.qty, "Asset Cost": data.grandTotal.cost, "Acm Depr": data.grandTotal.depr, Disposed: data.grandTotal.disposed, "Book Value": data.grandTotal.bookValue });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fix Asset Summary");
      XLSX.writeFile(wb, `fix-asset-summary-${periode}.xlsx`);
    });
  };

  const rowBg = (i) => (i % 2 === 0 ? "#fff" : "#f7f9fd");

  return (
    <ReportLayout>
      {/* Filter Bar */}
      <ReportLayout.Header>
        <Paper elevation={2} sx={{ p: "12px 16px", mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={2}>
              <TextField
                type="month" label="Periode" value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                type="number" label="Min. Book Value" value={minBookValue}
                onChange={(e) => setMinBookValue(e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControlLabel
                control={<Checkbox checked={showDisposed} onChange={(e) => setShowDisposed(e.target.checked)} size="small" />}
                label={<span style={{ fontSize: 13 }}>Tampilkan Disposed</span>}
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

      <ReportLayout.Content>
        {!data && !loading && (
          <Box sx={{ textAlign: "center", color: "#aaa", py: 10, fontSize: 14 }}>
            Pilih periode dan klik Tampilkan untuk melihat laporan
          </Box>
        )}

        {data && (
          <Box ref={printRef} sx={{ p: "0 24px 24px" }}>
            {/* Title */}
            <Box sx={{ pt: 3, pb: 1 }}>
              <Box sx={{ fontSize: 22, fontWeight: 800, color: "#1565C0" }}>Fix Asset Summary</Box>
              <Box sx={{ fontSize: 11, color: "#888", mt: "2px" }}>Filter : {data.filterLabel}</Box>
            </Box>

            {/* Table */}
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <colgroup>
                  <col />{/* Aset Name */}
                  <col style={{ width: 130 }} />{/* Sub Ledger */}
                  <col style={{ width: 70 }} />{/* Qty */}
                  <col style={{ width: 150 }} />{/* Asset Cost */}
                  <col style={{ width: 160 }} />{/* Acm Depr Amount */}
                  <col style={{ width: 110 }} />{/* Disposed */}
                  <col style={{ width: 140 }} />{/* Book Value */}
                </colgroup>
                <thead>
                  <tr>
                    <TH>Aset Name</TH>
                    <TH align="left">Sub Ledger</TH>
                    <TH align="right">Qty</TH>
                    <TH align="right">Asset Cost</TH>
                    <TH align="right">Acm Depr Amount</TH>
                    <TH align="right">Disposed</TH>
                    <TH align="right" style={{ borderRight: "none" }}>Book Value</TH>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((group, gi) => (
                    <React.Fragment key={gi}>
                      {/* Spacer between groups */}
                      {gi > 0 && (
                        <tr><td colSpan={7} style={{ padding: "4px 0", background: "#f0f4fa" }} /></tr>
                      )}

                      {/* Category Header */}
                      <tr>
                        <td colSpan={7} style={{
                          padding: "7px 10px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1565C0",
                          background: "#EEF4FF",
                          borderBottom: "1px solid #c5d8f5",
                        }}>
                          {group.kategori}
                        </td>
                      </tr>

                      {group.subGroups.map((sg, sgi) => (
                        <React.Fragment key={sgi}>
                          {/* Sub-category header */}
                          <tr>
                            <td colSpan={7} style={{
                              padding: "5px 10px 5px 22px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#333",
                              background: "#F8FAFF",
                              borderBottom: "1px solid #e5edf8",
                            }}>
                              {sg.subKategori}
                            </td>
                          </tr>

                          {/* Asset rows */}
                          {sg.assets.map((asset, ai) => (
                            <tr key={ai} style={{ background: rowBg(ai) }}>
                              <TD style={{ paddingLeft: 32 }}>
                                <span style={{ color: "#1565C0", fontWeight: 600, marginRight: 4 }}>{asset.kodeAset}</span>
                                - {asset.namaAset}
                              </TD>
                              <TD>{asset.subLedger || ""}</TD>
                              <TD align="right">
                                {Number(asset.qty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                              </TD>
                              <TD align="right">{fmt(asset.assetCost)}</TD>
                              <TD align="right" style={{ color: asset.acmDeprAmount > 0 ? "#C62828" : undefined }}>
                                {fmt(asset.acmDeprAmount)}
                              </TD>
                              <TD align="right">{fmt(asset.disposed)}</TD>
                              <TD align="right" bold>{fmt(asset.bookValue)}</TD>
                            </tr>
                          ))}

                          {/* Sub Total */}
                          <tr style={{ background: "#F0F4FA" }}>
                            <td colSpan={2} style={{
                              padding: "7px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              textAlign: "right",
                              color: "#333",
                              borderTop: "1px solid #d0ddf5",
                              borderBottom: "1px solid #d0ddf5",
                            }}>
                              Sub Total {sg.subKategori}
                            </td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, borderTop: "1px solid #d0ddf5", borderBottom: "1px solid #d0ddf5" }}>
                              {Number(sg.totalQty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, borderTop: "1px solid #d0ddf5", borderBottom: "1px solid #d0ddf5" }}>
                              {fmt(sg.totalCost)}
                            </td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#C62828", borderTop: "1px solid #d0ddf5", borderBottom: "1px solid #d0ddf5" }}>
                              {fmt(sg.totalDepr)}
                            </td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, borderTop: "1px solid #d0ddf5", borderBottom: "1px solid #d0ddf5" }}>
                              {fmt(sg.totalDisposed)}
                            </td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, borderTop: "1px solid #d0ddf5", borderBottom: "1px solid #d0ddf5" }}>
                              {fmt(sg.totalBookValue)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}

                      {/* Group Total */}
                      <tr style={{ background: "#E3EEFF" }}>
                        <td colSpan={2} style={{
                          padding: "8px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "right",
                          color: "#1565C0",
                          borderTop: "2px solid #1565C0",
                          borderBottom: "2px solid #1565C0",
                        }}>
                          Total {group.kategori}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1565C0", borderTop: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}>
                          {Number(group.totalQty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1565C0", borderTop: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}>
                          {fmt(group.totalCost)}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#C62828", borderTop: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}>
                          {fmt(group.totalDepr)}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1565C0", borderTop: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}>
                          {fmt(group.totalDisposed)}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1565C0", borderTop: "2px solid #1565C0", borderBottom: "2px solid #1565C0" }}>
                          {fmt(group.totalBookValue)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* Grand Total */}
                  {data.groups.length > 0 && (
                    <>
                      <tr><td colSpan={7} style={{ padding: "6px 0" }} /></tr>
                      <tr style={{ background: "#1565C0" }}>
                        <td colSpan={2} style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "right" }}>
                          GRAND TOTAL
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                          {Number(data.grandTotal.qty).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                          {fmt(data.grandTotal.cost)}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#FFD54F" }}>
                          {fmt(data.grandTotal.depr)}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                          {fmt(data.grandTotal.disposed)}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                          {fmt(data.grandTotal.bookValue)}
                        </td>
                      </tr>
                    </>
                  )}
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
