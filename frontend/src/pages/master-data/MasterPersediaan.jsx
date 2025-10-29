import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import api from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";

const fmtNum = (n) => Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
const toDateStr = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
};
const extractErr = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "Terjadi kesalahan";

export default function MasterPersediaan() {
  const { theme } = useTheme();

  const today = useMemo(() => new Date(), []);
  const first = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

  const [tab, setTab] = useState("summary"); // summary | mutasi
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dateFrom, setDateFrom] = useState(toDateStr(first));
  const [dateTo, setDateTo] = useState(toDateStr(today));
  const [itemOptions, setItemOptions] = useState([]);
  const [gudangOptions, setGudangOptions] = useState([]);
  const [item, setItem] = useState(null);
  const [gudang, setGudang] = useState(null);

  const [summaryRows, setSummaryRows] = useState([]);
  const [mutasiRows, setMutasiRows] = useState([]);

  // filters for grid
  const [filterModel, setFilterModel] = useState({ items: [] });

  // load combos
  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, gudangRes] = await Promise.all([
          api.get("/master-barang-jasa", { params: { aktif: true } }),
          api.get("/master-gudang", { params: { aktif: true } }),
        ]);
        setItemOptions((itemsRes.data?.data || itemsRes.data || []).map(x => ({ value: x.kode, label: `${x.kode} - ${x.nama}` })));
        setGudangOptions((gudangRes.data?.data || gudangRes.data || []).map(x => ({ value: x.id, label: x.nama || `Gudang ${x.id}` })));
      } catch (e) {
        setError(extractErr(e));
      }
    };
    load();
  }, []);

  const params = {
    itemCode: item?.value,
    gudangId: gudang?.value,
    startDate: dateFrom,
    endDate: dateTo,
  };

  // Map id→label untuk gudang
  const gudangMap = useMemo(() => {
    const m = new Map();
    (gudangOptions || []).forEach(o => m.set(String(o.value), o.label));
    return m;
  }, [gudangOptions]);

  const mapGudangName = (gid, gname) => {
    if (gname && String(gname).trim() !== "") return gname;
    if (gid == null) return "";
    return gudangMap.get(String(gid)) || "";
  };

  const fetchSummary = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/persediaan/summary", { params });
      const arr = Array.isArray(res.data?.data ?? res.data) ? (res.data?.data ?? res.data) : [];

      const rows = arr.map((r, i) => {
        const gid = r.gudangId ?? r.GudangID ?? r.gudang_id ?? r.gudangID ?? null;
        const gname = r.gudangName ?? r.GudangName ?? r.gudang ?? r.gudang_name ?? "";
        return {
          id: `${i+1}`,
          itemCode: r.itemCode,
          itemName: r.itemName || (itemOptions.find(o => o.value === r.itemCode)?.label?.split(" - ")?.slice(1).join(" - ") || ""),
          gudangId: gid,
          gudangName: mapGudangName(gid, gname),
          ...r,
        };
      });
      setSummaryRows(rows);
    } catch (e) { setError(extractErr(e)); }
    finally { setLoading(false); }
  };

  const fetchMutasi = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/persediaan/mutasi", { params });
      const arr = Array.isArray(res.data?.data ?? res.data) ? (res.data?.data ?? res.data) : [];
      const rows = arr.map((r, i) => {
        const gid = r.gudangId ?? r.GudangID ?? r.gudang_id ?? r.gudangID ?? null;
        const gname = r.gudangName ?? r.GudangName ?? r.gudang ?? r.gudang_name ?? "";
        return {
          id: `${i+1}`,
          gudangId: gid,
          gudangName: mapGudangName(gid, gname),
          ...r,
        };
      });
      setMutasiRows(rows);
    } catch (e) { setError(extractErr(e)); }
    finally { setLoading(false); }
  };

  // Jika options gudang baru ter-load, isi nama yang kosong
  useEffect(() => {
    if (!gudangOptions?.length) return;
    setSummaryRows(prev => prev.map(r => ({ ...r, gudangName: r.gudangName || mapGudangName(r.gudangId, "") })));
    setMutasiRows(prev => prev.map(r => ({ ...r, gudangName: r.gudangName || mapGudangName(r.gudangId, "") })));
  }, [gudangOptions]);

  const handleSearch = () => {
    if (tab === "summary") fetchSummary(); else fetchMutasi();
  };

  const handleExportExcel = async () => {
    const rows = tab === "summary" ? summaryRows : mutasiRows;
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, tab === "summary" ? "Summary" : "Mutasi");
    xlsx.writeFile(wb, `MasterPersediaan_${tab}.xlsx`);
  };

  const handlePrint = () => window.print();
  const resetFilter = () => setFilterModel({ items: [] });

  // helper aman untuk membaca tipe baris pada callback colSpan/renderCell
  const rowType = (p) => (p && p.row ? p.row.type : undefined);
  const isGHeader = (p) => rowType(p) === "gheader";
  const isIHeader = (p) => rowType(p) === "iheader";
  const isITotal  = (p) => rowType(p) === "itotal";
  const isAnyHdr  = (p) => isGHeader(p) || isIHeader(p);

  // columns
  const summaryColumns = [
    {
      field: "no",
      headerName: "No",
      width: 70,
      renderCell: (p) => (rowType(p) ? "" : (p?.value ?? "")),
      sortable: false,
      filterable: false,
      colSpan: (p) => (isGHeader(p) ? 0 : 1),
    },
    {
      field: "itemCode",
      headerName: "Kode",
      width: 120,
      renderCell: (p) => (rowType(p) ? "" : p?.value),
      colSpan: (p) => (isGHeader(p) ? 0 : 1),
    },
    {
      field: "itemName",
      headerName: "Nama",
      width: 220,
      renderCell: (p) => {
        if (isGHeader(p)) return p?.row?.gudangName || "";
        if (rowType(p) === "gtotal") return "";
        return p?.value;
      },
      colSpan: (p) => (isGHeader(p) ? 3 : 1),
    },
    {
      field: "gudangName",
      headerName: "Gudang",
      width: 160,
      renderCell: (p) => {
        if (isGHeader(p)) return "";
        if (rowType(p) === "gtotal") return "Total";
        return p?.value;
      },
    },
    { field: "saldoAwalQty",   headerName: "Saldo Awal (Qty)",   width: 150, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "saldoAwalNilai", headerName: "Saldo Awal (Nilai)", width: 170, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "qtyMasuk",       headerName: "Masuk",              width: 120, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "qtyKeluar",      headerName: "Keluar",             width: 120, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "qtyPenyesuaian", headerName: "Penyesuaian",        width: 140, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "saldoAkhirQty",  headerName: "Saldo Akhir (Qty)",  width: 160, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
    { field: "nilaiAkhir",     headerName: "Nilai Akhir",        width: 140, type: "number",
      renderCell: (p) => (isGHeader(p) ? "" : fmtNum(p?.value)) },
  ];

  const mutasiDateBetweenOperator = {
    label: 'Between',
    value: 'isBetween',
    getApplyFilterFn: (filterItem) => {
      const [start, end] = filterItem?.value || [];
      const toISODate = (d) => d instanceof Date && !isNaN(d)
        ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10)
        : null;
      const startStr = toISODate(start);
      const endStr = toISODate(end);
      if (!startStr && !endStr) return null;
      return ({ value }) => {
        if (!value) return false;
        const dt = typeof value === "string" ? new Date(value) : value;
        if (!(dt instanceof Date) || isNaN(dt)) return false;
        const rowStr = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())).toISOString().slice(0,10);
        if (startStr && endStr) return rowStr >= startStr && rowStr <= endStr;
        if (startStr) return rowStr >= startStr;
        if (endStr) return rowStr <= endStr;
        return true;
      };
    },
    InputComponent: (props) => {
      const { item, applyValue } = props;
      const [start, end] = item.value || [];
      return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <DatePicker
            selected={start || null}
            onChange={(date) => applyValue({ ...item, value: [date, end || null] })}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            isClearable
            customInput={<input style={{ width: 120 }} />}
          />
          <span style={{ margin: '0 4px' }}>s/d</span>
          <DatePicker
            selected={end || null}
            onChange={(date) => applyValue({ ...item, value: [start || null, date] })}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            isClearable
            customInput={<input style={{ width: 120 }} />}
          />
        </div>
      );
    },
  };

  // Kolom Mutasi: pakai saldoQtyLocal jika ada
  const mutasiColumns = [
    {
      field: "id",
      headerName: "No",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        if (isGHeader(p)) return p?.row?.gudangName || "";
        if (isIHeader(p)) return p?.row?.itemLabel || "";
        if (isITotal(p))  return "";
        return p?.value;
      },
      colSpan: (p) => (isAnyHdr(p) ? 4 : isITotal(p) ? 0 : 1),
    },
    {
      field: "tanggal",
      headerName: "Tanggal",
      width: 120,
      type: "date",
      renderCell: (p) => {
        if (isAnyHdr(p) || isITotal(p)) return "";
        if (!p?.value) return "-";
        const d = new Date(p.value);
        if (isNaN(d)) return String(p.value);
        return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
      },
      valueFormatter: (p) => {
        const v = p?.value;
        if (!v) return "";
        const d = new Date(v);
        if (isNaN(d)) return String(v);
        return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
      },
      colSpan: (p) => (rowType(p) ? 0 : 1),
      filterOperators: [mutasiDateBetweenOperator],
    },
    { field: "sumber", headerName: "Sumber", width: 130,
      renderCell: (p) => (rowType(p) ? "" : p?.value),
      colSpan: (p) => (rowType(p) ? 0 : 1),
    },
    { field: "nomor", headerName: "Nomor", width: 180,
      renderCell: (p) => (rowType(p) ? "" : p?.value),
      colSpan: (p) => (rowType(p) ? 0 : 1),
    },
    { field: "gudangName", headerName: "Gudang", width: 160,
      renderCell: (p) => (rowType(p) ? "" : p?.value),
      colSpan: (p) => (isAnyHdr(p) ? 0 : 1),
    },
    { field: "qtyMasuk",  headerName: "Qty Masuk", width: 120, type: "number",
      renderCell: (p) => (isAnyHdr(p) ? "" : fmtNum(p?.value)) },
    { field: "qtyKeluar", headerName: "Qty Keluar", width: 120, type: "number",
      renderCell: (p) => (isAnyHdr(p) ? "" : fmtNum(p?.value)) },
    { field: "harga",     headerName: "Harga",     width: 120, type: "number",
      renderCell: (p) => (isAnyHdr(p) ? "" : fmtNum(p?.value)) },
    { field: "saldoQty",  headerName: "Saldo Qty",  width: 120, type: "number",
      renderCell: (p) => (isAnyHdr(p) ? "" : fmtNum(p?.row?.saldoQtyLocal ?? p?.value)) },
    { field: "saldoNilai", headerName: "Saldo Nilai", width: 140, type: "number",
      renderCell: (p) => (isAnyHdr(p) ? "" : fmtNum(p?.value)) },
    { field: "keterangan", headerName: "Keterangan", width: 260,
      renderCell: (p) => (rowType(p) ? (p?.row?.keterangan || "") : (p?.value || "")) },
  ];

  // ---------- GROUPED VIEW (Summary) ----------
  const summaryDisplayRows = useMemo(() => {
    if (!Array.isArray(summaryRows) || summaryRows.length === 0) return [];
    // group by gudang
    const groups = new Map(); // key -> { gname, gid, rows:[], totals:{} }
    const numFields = ["saldoAwalQty","saldoAwalNilai","qtyMasuk","qtyKeluar","qtyPenyesuaian","saldoAkhirQty","nilaiAkhir"];
    for (const r of summaryRows) {
      const gid = r.gudangId ?? r.GudangID ?? r.gudang_id ?? "";
      const gname = r.gudangName || "";
      const key = `${gid}|${gname}`;
      if (!groups.has(key)) {
        groups.set(key, { gname, gid, rows: [], totals: Object.fromEntries(numFields.map(f => [f, 0])) });
      }
      const g = groups.get(key);
      g.rows.push(r);
      for (const f of numFields) g.totals[f] += Number(r[f] || 0);
    }

    // Susun output: Header Gudang -> detail dengan nomor reset -> Total
    const out = [];
    for (const [key, g] of groups) {
      // Header Gudang (tanpa angka)
      out.push({
        id: `g-${key}`,
        type: "gheader",
        no: "",
        itemCode: "",
        itemName: "",
        gudangName: `Gudang: ${g.gname || g.gid}`,
        // header tidak menampilkan angka
        saldoAwalQty: "",
        saldoAwalNilai: "",
        qtyMasuk: "",
        qtyKeluar: "",
        qtyPenyesuaian: "",
        saldoAkhirQty: "",
        nilaiAkhir: "",
      });

      // Detail dengan nomor urut ulang per gudang
      let no = 1;
      for (const r of g.rows) {
        out.push({
          ...r,
          id: r.id || `d-${key}-${r.itemCode}-${no}`,
          type: "",
          no,
        });
        no += 1;
      }

      // Baris Total per Gudang (angka dijumlahkan)
      out.push({
        id: `gt-${key}`,
        type: "gtotal",
        no: "",
        itemCode: "",
        itemName: "Total",
        gudangName: "",
        ...g.totals,
      });
    }
    return out;
  }, [summaryRows]);

  // ---------- GROUPED VIEW (Mutasi) ----------
  const mutasiDisplayRows = useMemo(() => {
    if (!Array.isArray(mutasiRows) || mutasiRows.length === 0) return [];
    const byGudang = new Map();
    for (const r of mutasiRows) {
      const gid = r.gudangId ?? r.GudangID ?? r.gudang_id ?? "";
      const gname = r.gudangName || "";
      const gkey = `${gid}|${gname}`;
      if (!byGudang.has(gkey)) byGudang.set(gkey, new Map());
      const byItem = byGudang.get(gkey);
      const ikey = `${r.itemCode || ""}|${r.itemName || ""}`;
      if (!byItem.has(ikey)) byItem.set(ikey, []);
      byItem.get(ikey).push(r);
    }

    const out = [];
    for (const [gkey, byItem] of byGudang) {
      const [gid, gname] = gkey.split("|");

      // Header Gudang
      out.push({
        id: `g-${gkey}`,
        type: "gheader",
        gudangName: `Gudang: ${gname || gid}`,
        keterangan: `Ringkasan Gudang`,
      });

      // per item
      for (const [ikey, list] of byItem) {
        const [icode, iname] = ikey.split("|");
        // urutkan tanggal
        list.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));

        // hitung ulang running saldo per item
        let runningQty = 0;
        let sumIn = 0, sumOut = 0;

        out.push({
          id: `i-${gkey}-${ikey}`,
          type: "iheader",
          itemLabel: `${iname || icode || "-"}`,
        });

        let i = 1;
        for (const r of list) {
          const masuk = Number(r.qtyMasuk || 0);
          const keluar = Number(r.qtyKeluar || 0);
          sumIn += masuk;
          sumOut += keluar;
          runningQty += masuk - keluar;

          out.push({
            ...r,
            id: r.id || `${gkey}-${icode}-${r.tanggal}-${i++}`,
            saldoQtyLocal: runningQty, // gunakan saldo lokal per item
          });
        }

        // total per item (pakai runningQty terakhir)
        out.push({
          id: `t-${gkey}-${ikey}`,
          type: "itotal",
          qtyMasuk: sumIn,
          qtyKeluar: sumOut,
          saldoQty: runningQty,      // ditampilkan via renderer kolom
          saldoNilai: list.at(-1)?.saldoNilai ?? 0, // biarkan nilai dari API
        });
      }
    }
    return out;
  }, [mutasiRows]);

  // Gaya baris header group
  const rowClass = (params) => {
    const t = params.row?.type;
    if (t === "gheader") return "row-gheader";
    if (t === "iheader") return "row-iheader";
    if (t === "gtotal" || t === "itotal") return "row-gtotal";
    return "";
  };

  const rows = tab === "summary" ? summaryDisplayRows : mutasiDisplayRows;
  const columns = tab === "summary" ? summaryColumns : mutasiColumns;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Master Persediaan</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handlePrint} variant="contained" color="primary" startIcon={<FiPrinter />}>PRINT</Button>
          <Button onClick={handleExportExcel} variant="contained" color="success" startIcon={<FaFileExcel />}>EXCEL</Button>
        </Box>
      </Box>

      {/* Toolbar filter atas (periode, item, gudang, tombol Go/Reset) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "140px 140px 1fr 1fr auto auto" }, gap: 1, mb: 1 }}>
        <div>
          <label className="form-label">Dari</label>
          <input type="date" className="form-control" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Sampai</label>
          <input type="date" className="form-control" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Barang</label>
          <Select options={itemOptions} value={item} onChange={setItem} isClearable placeholder="Pilih barang..." />
        </div>
        <div>
          <label className="form-label">Gudang</label>
          <Select options={gudangOptions} value={gudang} onChange={setGudang} isClearable placeholder="Pilih gudang..." />
        </div>
        <Button onClick={handleSearch} variant="contained" color="success" disabled={loading}>{loading?"Memuat...":"Go"}</Button>
        <Button onClick={resetFilter} variant="outlined" color="inherit">Reset Filter</Button>
      </Box>

      {/* Tab switch */}
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <Button variant={tab==="summary"?"contained":"outlined"} onClick={()=>setTab("summary")}>Summary</Button>
        <Button variant={tab==="mutasi"?"contained":"outlined"} onClick={()=>setTab("mutasi")}>Mutasi</Button>
      </Box>

      {error && <div className="alert alert-danger" style={{ marginBottom: 8 }}>{error}</div>}

      <div style={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowClassName={rowClass}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbarQuickFilter }}
          slotProps={{ toolbar: { quickFilterProps: { debounceMs: 400 }, showQuickFilter: true } }}
          sx={{
            background: "var(--card-bg, #fff)",
            borderRadius: 2,
            boxShadow: 2,
            "& .MuiDataGrid-columnHeaders": { background: "#e0e7ff" },
            "& .row-gheader .MuiDataGrid-cell": { fontWeight: 700, background: "#f3f4f6" },
            "& .row-iheader .MuiDataGrid-cell": { fontWeight: 600, background: "#fafafa" },
            "& .row-gtotal .MuiDataGrid-cell": { fontWeight: 800, borderTop: "2px solid #ddd", background: "#fdfdfd" },
          }}
          pagination={false}
          hideFooterPagination
        />
      </div>
    </Box>
  );
}