import React, { useRef, useState, useEffect } from "react";
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTheme } from "../../context/ThemeContext"; // tambahkan ini
import api from "../../utils/api"; // Pastikan path sesuai project kamu

// Nama bulan dan key untuk looping
const months = [
  { name: "Januari", key: "jan" },
  { name: "Februari", key: "feb" },
  { name: "Maret", key: "mar" },
  { name: "April", key: "apr" },
  { name: "Mei", key: "mei" },
  { name: "Juni", key: "jun" },
  { name: "Juli", key: "jul" },
  { name: "Agustus", key: "ags" },
  { name: "September", key: "sep" },
  { name: "Oktober", key: "okt" },
  { name: "November", key: "nov" },
  { name: "Desember", key: "des" },
];

// Generate years implementation (2023 to Current Year + 1)
const currentYear = new Date().getFullYear();
const years = [];
for (let y = 2023; y <= currentYear + 1; y++) {
  years.push(y);
}

// Format angka ribuan
function formatNumber(num) {
  if (!num || isNaN(num)) return "-";
  const n = Number(num);
  if (n < 0) {
    return `(${Math.abs(n).toLocaleString()})`;
  }
  return n.toLocaleString();
}

import ReportLayout from "../../components/ReportLayout";

export default function TrialBalance() {
  const { theme } = useTheme(); // gunakan theme

  // State untuk filter bulan dan tahun
  const [startMonth, setStartMonth] = useState(months[0].key);
  const [endMonth, setEndMonth] = useState(months[0].key);
  const [year, setYear] = useState(years[years.length - 1]);

  // State untuk data COA dari API
  const [coaData, setCoaData] = useState([]);
  const [error, setError] = useState("");

  // Ambil data master COA dari API saat mount
  useEffect(() => {
    setError("");
    api.get("/trial-balance", {
      params: {
        tahun: year,
        bulan_awal: months.findIndex(m => m.key === startMonth) + 1,
        bulan_akhir: months.findIndex(m => m.key === endMonth) + 1
      }
    })
      .then(res => {
        console.log("Trial Balance Data Loaded:", res.data.length, "accounts");
        setCoaData(res.data);
      })
      .catch(() => setError("Gagal mengambil data Trial Balance"));
  }, [year, startMonth, endMonth]);

  // Filter bulan yang dipilih
  const startIdx = months.findIndex(m => m.key === startMonth);
  const endIdx = months.findIndex(m => m.key === endMonth);
  const filteredMonths = startIdx <= endIdx ? months.slice(startIdx, endIdx + 1) : [];

  // State untuk lebar kolom (default: 180px untuk kolom pertama, 120px untuk lainnya)
  const [colWidths, setColWidths] = useState({
    akun: 180,
    saldo: 120,
    ...Object.fromEntries(months.flatMap(m => [
      [`${m.key}_debit`, 120],
      [`${m.key}_kredit`, 120],
      [`${m.key}_mutasi`, 120],
      [`${m.key}_balance`, 120],
    ]))
  });

  // Fungsi untuk drag resize kolom
  const resizingRef = useRef({ col: null, startX: 0, startWidth: 0 });

  const handleResizeMouseDown = (colKey, e) => {
    e.preventDefault();
    resizingRef.current = {
      col: colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey]
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", handleResizeMouseMove);
    window.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    const { col, startX, startWidth } = resizingRef.current;
    if (!col) return;
    const delta = e.clientX - startX;
    setColWidths(prev => ({
      ...prev,
      [col]: Math.max(60, startWidth + delta)
    }));
  };

  const handleResizeMouseUp = () => {
    resizingRef.current = { col: null, startX: 0, startWidth: 0 };
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", handleResizeMouseMove);
    window.removeEventListener("mouseup", handleResizeMouseUp);
  };

  // Ref untuk drag scroll (opsional, tapi native lebih stabil)
  const tableRef = useRef(null);

  // Sort data  > kode
  const sortedCoa = [...coaData].sort((a, b) => {
    return a.kode.localeCompare(b.kode);
  });

  return (
    <ReportLayout>
      <ReportLayout.Header>
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={2}
          sx={{
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
          }}
        >
          Neraca Saldo
        </Typography>
        {error && <Box color="error.main" mb={2}>{error}</Box>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Tahun</InputLabel>
              <Select
                value={year}
                label="Tahun"
                onChange={e => setYear(e.target.value)}
                sx={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                {years.map(y => (
                  <MenuItem key={y} value={y} sx={{ fontFamily: theme.fontFamily }}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Bulan Awal</InputLabel>
              <Select
                value={startMonth}
                label="Bulan Awal"
                onChange={e => setStartMonth(e.target.value)}
                sx={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                {months.map(month => (
                  <MenuItem key={month.key} value={month.key} sx={{ fontFamily: theme.fontFamily }}>{month.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Bulan Akhir</InputLabel>
              <Select
                value={endMonth}
                label="Bulan Akhir"
                onChange={e => setEndMonth(e.target.value)}
                sx={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                {months.map((month, idx) => (
                  <MenuItem
                    key={month.key}
                    value={month.key}
                    disabled={months.findIndex(m => m.key === month.key) < startIdx}
                    sx={{ fontFamily: theme.fontFamily }}
                  >
                    {month.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ReportLayout.Header>

      <ReportLayout.Content>
        <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
          <DataGrid
            rows={sortedCoa.map((coa, idx) => ({
              ...coa,
              id: coa.kode || `row-${idx}`,
              akun: `${coa.kode} - ${coa.nama}`
            }))}
            columns={[
              {
                field: 'akun',
                headerName: 'Akun',
                width: 250,
                pinned: 'left'
              },
              {
                field: 'saldoAwal',
                headerName: 'Saldo Awal',
                width: 140,
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (value) => formatNumber(value)
              },
              ...filteredMonths.flatMap(month => {
                const isCreditType = (params) => ["2", "3", "4"].includes(String(params.row.tipeAkun));
                return [
                  {
                    field: `${month.key}_debit`,
                    headerName: 'Debit',
                    width: 120,
                    align: 'right',
                    headerAlign: 'center',
                    valueFormatter: (value) => formatNumber(value)
                  },
                  {
                    field: `${month.key}_kredit`,
                    headerName: 'Kredit',
                    width: 120,
                    align: 'right',
                    headerAlign: 'center',
                    valueFormatter: (value) => formatNumber(value)
                  },
                  {
                    field: `${month.key}_mutasi`,
                    headerName: 'Mutasi',
                    width: 120,
                    align: 'right',
                    headerAlign: 'center',
                    valueGetter: (value, row) => {
                      const d = row[`${month.key}_debit`] || 0;
                      const k = row[`${month.key}_kredit`] || 0;
                      const isCredit = ["2", "3", "4"].includes(String(row.tipeAkun));
                      return isCredit ? (k - d) : (d - k);
                    },
                    valueFormatter: (value) => formatNumber(value)
                  },
                  {
                    field: `${month.key}_balance`,
                    headerName: 'Balance',
                    width: 130,
                    align: 'right',
                    headerAlign: 'center',
                    valueGetter: (value, row) => {
                      let totalMutasi = 0;
                      const currentMonthIdx = months.findIndex(m => m.key === month.key);
                      const isCredit = ["2", "3", "4"].includes(String(row.tipeAkun));

                      for (let i = startIdx; i <= currentMonthIdx; i++) {
                        const mKey = months[i].key;
                        const mDebit = row[`${mKey}_debit`] || 0;
                        const mKredit = row[`${mKey}_kredit`] || 0;
                        totalMutasi += isCredit ? (mKredit - mDebit) : (mDebit - mKredit);
                      }
                      return (row.saldoAwal || 0) + totalMutasi;
                    },
                    valueFormatter: (value) => formatNumber(value)
                  }
                ];
              })
            ]}
            columnGroupingModel={filteredMonths.map(month => ({
              groupId: month.key,
              headerName: month.name,
              headerAlign: 'center',
              children: [
                { field: `${month.key}_debit` },
                { field: `${month.key}_kredit` },
                { field: `${month.key}_mutasi` },
                { field: `${month.key}_balance` }
              ]
            }))}
            density="compact"
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            pageSizeOptions={[50, 100, 200]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
              pinnedColumns: {
                left: ['akun', 'saldoAwal']
              }
            }}
            sx={{
              background: theme.cardColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
              '& .MuiDataGrid-cell': {
                color: theme.tableFontColor || theme.fontColor,
                fontFamily: theme.tableFontFamily || theme.fontFamily,
                borderRight: '1px solid rgba(224, 224, 224, 1)',
              },
              '& .MuiDataGrid-columnHeader': {
                background: theme.tableHeaderColor,
                color: theme.tableFontColor,
                borderRight: '1px solid rgba(224, 224, 224, 1)',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-columnGroupHeader': {
                background: theme.tableHeaderColor,
                color: theme.tableFontColor,
                borderRight: '3px solid #1976d2',
              }
            }}
          />
        </Box>
      </ReportLayout.Content>
      <style>
        {`
          .MuiTableCell-root {
            transition: background 0.2s;
          }
        `}
      </style>
    </ReportLayout>
  );
}