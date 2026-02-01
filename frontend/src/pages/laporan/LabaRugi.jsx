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
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

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

// Komponen untuk grup dengan collapse
function GroupSection({ group, theme }) {
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
            color: theme.tableFontColor,
            fontFamily: theme.tableFontFamily,
            pl: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            {group.nama}
          </Box>
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: "bold",
            color: theme.tableFontColor,
            fontFamily: theme.tableFontFamily,
          }}
        >
          {formatRupiah(group.subtotal)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableBody>
                {group.items?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{
                        pl: 6,
                        color: theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        background: theme.tableBodyColor,
                      }}
                    >
                      {item.akunKode}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        background: theme.tableBodyColor,
                      }}
                    >
                      {item.akunNama}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        background: theme.tableBodyColor,
                      }}
                    >
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

import ReportLayout from "../../components/ReportLayout";

export default function LabaRugi() {
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
      const res = await api.get("/laporan/laba-rugi", {
        params: { start_date: startDate, end_date: endDate },
      });
      setData(res.data);
    } catch (err) {
      setError("Gagal mengambil data Laporan Laba Rugi");
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
              Laporan Laba Rugi
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
            <h1 className="text-2xl font-bold text-gray-900">Laporan Laba Rugi</h1>
            {data && <p className="text-gray-600 mt-1">Periode: {data.periode}</p>}
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
                width: '100%',
                mx: "auto",
                height: "auto",
                overflow: "visible",
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
                        width: "15%",
                        background: theme.tableHeaderColor,
                      }}
                    >
                      Kode
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        width: "55%",
                        background: theme.tableHeaderColor,
                      }}
                    >
                      Nama Akun
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        color: theme.tableFontColor,
                        fontFamily: theme.tableFontFamily,
                        width: "30%",
                        background: theme.tableHeaderColor,
                      }}
                    >
                      Jumlah
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* PENDAPATAN */}
                  <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                    <TableCell
                      colSpan={3}
                      sx={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: "#1565c0",
                        fontFamily: theme.tableFontFamily,
                      }}
                    >
                      PENDAPATAN
                    </TableCell>
                  </TableRow>
                  {data.pendapatan?.map((group, idx) => (
                    <GroupSection key={idx} group={group} theme={theme} />
                  ))}
                  <TableRow sx={{ backgroundColor: "#bbdefb" }}>
                    <TableCell
                      colSpan={2}
                      sx={{
                        fontWeight: "bold",
                        fontFamily: theme.tableFontFamily,
                        color: "#0d47a1",
                      }}
                    >
                      TOTAL PENDAPATAN
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: theme.tableFontFamily,
                        color: "#0d47a1",
                      }}
                    >
                      {formatRupiah(data.totalPendapatan)}
                    </TableCell>
                  </TableRow>

                  {/* BEBAN */}
                  <TableRow sx={{ backgroundColor: "#ffebee" }}>
                    <TableCell
                      colSpan={3}
                      sx={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: "#c62828",
                        fontFamily: theme.tableFontFamily,
                        pt: 3,
                      }}
                    >
                      BEBAN
                    </TableCell>
                  </TableRow>
                  {data.beban?.map((group, idx) => (
                    <GroupSection key={idx} group={group} theme={theme} />
                  ))}
                  <TableRow sx={{ backgroundColor: "#ffcdd2" }}>
                    <TableCell
                      colSpan={2}
                      sx={{
                        fontWeight: "bold",
                        fontFamily: theme.tableFontFamily,
                        color: "#b71c1c",
                      }}
                    >
                      TOTAL BEBAN
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: theme.tableFontFamily,
                        color: "#b71c1c",
                      }}
                    >
                      {formatRupiah(data.totalBeban)}
                    </TableCell>
                  </TableRow>

                  {/* LABA/RUGI BERSIH */}
                  <TableRow
                    sx={{
                      backgroundColor: data.labaBersih >= 0 ? "#c8e6c9" : "#ffcdd2",
                    }}
                  >
                    <TableCell
                      colSpan={2}
                      sx={{
                        fontWeight: "bold",
                        fontSize: 18,
                        fontFamily: theme.tableFontFamily,
                        color: data.labaBersih >= 0 ? "#2e7d32" : "#c62828",
                        pt: 2,
                        pb: 2,
                      }}
                    >
                      {data.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        fontSize: 18,
                        fontFamily: theme.tableFontFamily,
                        color: data.labaBersih >= 0 ? "#2e7d32" : "#c62828",
                        pt: 2,
                        pb: 2,
                      }}
                    >
                      {formatRupiah(data.labaBersih)}
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
