import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import ActiveFiltersBar from "./ActiveFiltersBar";
import TanggalDropdownCustom from "./TanggalDropdownCustom";
import TanggalDropdownCustomButton from "./TanggalDropdownCustomButton";
import SimpleDropdownFilterButton from "./SimpleDropdownFilterButton";
import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { RemoveRedEye as ViewIcon } from '@mui/icons-material';
import JournalPreviewModal from '../../components/JournalPreviewModal';

export default function AJE() {
  const { theme } = useTheme(); // gunakan theme
  const [rows, setRows] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [akunFilter, setAkunFilter] = useState([]); // filter multi-select nama akun
  const [tanggalFilter, setTanggalFilter] = useState([]); // filter multi-select tanggal
  const [noBuktiFilter, setNoBuktiFilter] = useState([]); // filter multi-select no bukti
  const [deskripsiFilter, setDeskripsiFilter] = useState(""); // filter text deskripsi
  const [statusPostingFilter, setStatusPostingFilter] = useState([]); // ['posted', 'unposted']
  const [projectList, setProjectList] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [form, setForm] = useState({
    tanggal: "",
    noBukti: "",
    namaAkun: "",
    kodeAkun: "",
    deskripsi: "",
    debit: "",
    kredit: "",
    saved: false,
    posted: false,
    projectNo: "",
    projectName: ""
  });

  // Journal Preview State
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalNomorTransaksi, setJournalNomorTransaksi] = useState("");
  // Load daftar COA non kasbank untuk dropdown Nama Akun
  useEffect(() => {
    async function fetchCOA() {
      try {
        const res = await api.get("/aje/coa-akun-aje");
        setCoaList(res.data || []);
      } catch {
        setCoaList([]);
      }
    }
    fetchCOA();
  }, []);
  // Load data dari backend saat komponen mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/aje");
        // Tandai baris hasil fetch sebagai saved
        setRows(
          sortRowsByTanggalNoBukti(
            (res.data || []).map(row => ({
              ...row,
              saved: true,
              posted: !!row.posted,
              tempId: `saved-${row.id}`
            }))
          )
        );
      } catch (err) {
        setRows([]);
      }
    }
    fetchData();
  }, []);
  // Ambil user id login dari localStorage (atau context jika sudah ada AuthContext)
  // Pastikan backend menerima id numerik (misal: "4" untuk user id 4)
  const user = JSON.parse(localStorage.getItem("user"));
  let userId = user?.id;
  if (!userId) userId = 1; // fallback default jika belum login
  // Format userId jadi 2 digit string (misal: 4 -> '04', 12 -> '12')
  userId = userId.toString().padStart(2, '0');

  // Fungsi untuk generate nomor bukti otomatis
  async function generateNoBukti(tanggal) {
    if (!tanggal) return "";
    try {
      const res = await api.get(`/aje/generate-no-bukti?tanggal=${tanggal}&user=${userId}`);
      return res.data.noBukti || "";
    } catch {
      return "";
    }
  }

  // Tambah baris baru di bawah baris yang dipilih, atau di akhir jika tidak ada baris dipilih
  const addRow = async (idx = null) => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA').slice(0, 10);
    console.log("todayStr addRow:", todayStr); // <-- Tambahkan ini

    const noBukti = await generateNoBukti(todayStr);
    const newRow = {
      tanggal: todayStr,
      noBukti,
      namaAkun: "",
      kodeAkun: "",
      deskripsi: "",
      debit: "",
      kredit: "",
      projectNo: "",
      projectName: "",
      saved: false,
      posted: false,
      tempId: `new-${Date.now()}-${Math.random()}`
    };
    let insertIdx = idx;
    if (insertIdx === null) {
      insertIdx = rows.length - 1;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (!rows[i?.posted]) {
          insertIdx = i;
          break;
        }
      }
    }
    const newRows = [...rows];
    newRows.splice(insertIdx + 1, 0, newRow);
    setRows(newRows);
  };

  // Perbaiki handleChange agar selalu set saved: false
  const handleChange = async (idx, e) => {
    const { name, value } = e.target;
    if (name === "tanggal") {
      const noBukti = await generateNoBukti(value);
      setRows(rows.map((row, i) =>
        i === idx ? { ...row, tanggal: value, noBukti, saved: false } : row
      ));
    } else if (name === "namaAkun") {
      const selected = coaList.find(coa => coa.nama === value);
      setRows(rows.map((row, i) =>
        i === idx ? { ...row, namaAkun: value, kodeAkun: selected ? selected.kode : "", saved: false } : row
      ));
    } else {
      setRows(rows.map((row, i) => i === idx ? { ...row, [name]: value, saved: false } : row));
    }
  };

  // Simpan baris ke backend
  const handleSave = async (idx) => {
    const row = rows[idx];
    // Wajib pilih nama akun
    if (!row.namaAkun || row.namaAkun.trim() === "") {
      alert("Nama akun wajib dipilih!");
      return;
    }
    if (!row.deskripsi || row.deskripsi.trim() === "") {
      alert("Deskripsi wajib diisi!");
      return;
    }
    // Hitung summary debit dan kredit untuk semua baris dengan noBukti yang sama
    const groupNoBukti = row.noBukti;
    const groupedRows = rows.filter(r => r.noBukti === groupNoBukti);
    const totalDebit = groupedRows.reduce((sum, r) => sum + (parseFloat(r.debit) || 0), 0);
    const totalKredit = groupedRows.reduce((sum, r) => sum + (parseFloat(r.kredit) || 0), 0);
    if (totalDebit !== totalKredit) {
      alert(`Total debit (${totalDebit}) dan kredit (${totalKredit}) untuk nomor bukti ${groupNoBukti} tidak balance!`);
      return;
    }
    // Ambil semua baris dengan noBukti yang sama dan belum saved
    const unsavedRows = rows
      .map((r, i) => ({ ...r, idx: i }))
      .filter(r => r.noBukti === groupNoBukti && !r.saved);

    // === Tambahkan ini sebelum pengecekan duplikat ===
    const allSaved = groupedRows.every(r => r.saved);

    // === Perbaikan di sini ===
    if (!allSaved) {
      try {
        const cekRes = await api.get(`/aje/cek-no-bukti?noBukti=${encodeURIComponent(groupNoBukti)}`);
        if (cekRes.data && cekRes.data.exists) {
          // Jika backend mengembalikan array ids:
          const foundIds = cekRes.data.ids || (cekRes.data.id ? [cekRes.data.id] : []);
          // Cek apakah id baris yang sedang diedit (atau id baris unsaved) ada di foundIds
          const isEditingOwn = unsavedRows.every(r => foundIds.includes(r.id));
          if (!isEditingOwn) {
            alert(`Nomor transaksi ${groupNoBukti} sudah pernah dibuat!`);
            return;
          }
        }
      } catch (e) {
        // Jika error selain 404, tetap lanjut (anggap tidak ada)
      }
    }
    // Siapkan data untuk dikirim
    const dataArr = unsavedRows.map(r => {
      // JANGAN hilangkan id jika ada!
      return {
        ...r,
        debit: r.debit === "" ? 0 : parseFloat(r.debit),
        kredit: r.kredit === "" ? 0 : parseFloat(r.kredit),
        kodeAkun: r.kodeAkun || (coaList.find(coa => coa.nama === r.namaAkun)?.kode || "")
      };
    });
    try {
      // Simpan dan dapatkan hasil id dari backend
      const res = await api.post("/aje", dataArr);
      let savedIds = [];
      if (Array.isArray(res.data)) {
        // Jika backend mengembalikan array objek dengan id
        if (typeof res.data[0] === "object" && res.data[0].id) {
          savedIds = res.data.map(d => d.id);
        } else {
          // Jika array id saja
          savedIds = res.data;
        }
      }
      setRows(rows.map((r, i) => {
        if (r.noBukti === groupNoBukti && !r.saved) {
          // Update id jika dapat dari backend
          const newId = savedIds.shift();
          return { ...r, saved: true, id: newId };
        }
        return r;
      }));
      alert("Berhasil disimpan!");
    } catch (err) {
      alert("Gagal simpan: " + (err?.response?.data?.error || err.message));
    }
  };

  // Hapus baris dari backend (dan dari tabel)
  const handleDelete = async (idx) => {
    const row = rows[idx];
    const groupNoBukti = row.noBukti;
    const rowsToDelete = rows.filter(r => r.noBukti === groupNoBukti);

    // Jika semua baris belum saved, hapus dari state saja
    if (rowsToDelete.every(r => !r.saved)) {
      setRows(rows.filter(r => r.noBukti !== groupNoBukti));
      return;
    }
    // Jika ada yang sudah saved, hapus di backend lalu di state
    if (rowsToDelete.some(r => r.posted)) {
      alert("Data sudah diposting, tidak bisa dihapus!");
      return;
    }
    try {
      // Hapus semua id baris dengan noBukti yang sama di backend
      const idsToDelete = rowsToDelete.filter(r => r.saved).map(r => r.id);
      if (idsToDelete.length > 0) {
        await api.post("/aje/delete", { ids: idsToDelete });
      }
      setRows(rows.filter(r => r.noBukti !== groupNoBukti));
      alert("Berhasil dihapus!");
    } catch (err) {
      alert("Gagal hapus: " + (err?.response?.data?.error || err.message));
    }
  };

  // Posting baris (set posted = true untuk semua baris dengan noBukti yang sama)
  const handlePosting = async (idx) => {
    const row = rows[idx];
    // Cek ke backend apakah nomor transaksi sudah ada di tabel GL (pakai endpoint cek-no-bukti)
    try {
      const cekGL = await api.get(`/gl/cek-no-bukti?noBukti=${encodeURIComponent(row.noBukti)}`);
      if (cekGL.data && cekGL.data.exists) {
        alert(`Nomor transaksi ${row.noBukti} sudah ada di tabel GL, tidak dapat diposting!`);
        return;
      }
    } catch (e) {
      // Jika error selain 404, lanjut
    }
    try {
      await api.post("/aje/posting", { id: row.id });
      const updatedRows = rows.map((r) =>
        r.noBukti === row.noBukti ? { ...r, posted: true } : r
      );
      setRows(sortRowsByTanggalNoBukti(updatedRows)); // <-- urutkan setelah posting
      alert("Berhasil posting!");
    } catch (err) {
      alert("Gagal posting: " + (err?.response?.data?.error || err.message));
    }
  };

  // Unposting baris (set posted = false untuk semua baris dengan noBukti yang sama)
  const handleUnposting = async (idx) => {
    const row = rows[idx];
    try {
      await api.post("/aje/unposting", { id: row.id });
      setRows(rows.map((r) =>
        r.noBukti === row.noBukti ? { ...r, posted: false } : r
      ));
      alert("Berhasil unposting!");
    } catch (err) {
      alert("Gagal unposting: " + (err?.response?.data?.error || err.message));
    }
  };

  const removeRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Ambil daftar unik
  const tanggalOptions = Array.from(new Set(rows.map(row => row.tanggal))).sort();
  const noBuktiOptions = Array.from(new Set(rows.map(row => row.noBukti))).sort();
  const deskripsiOptions = Array.from(new Set(rows.map(row => row.deskripsi))).sort();
  // Filter rows sesuai semua filter
  let filteredRows = rows;
  if (akunFilter.length > 0) {
    filteredRows = filteredRows.filter(row => akunFilter.includes(row.namaAkun));
  }
  if (tanggalFilter.length > 0) {
    filteredRows = filteredRows.filter(row => tanggalFilter.includes(row.tanggal));
  }
  if (noBuktiFilter.length > 0) {
    filteredRows = filteredRows.filter(row => noBuktiFilter.includes(row.noBukti));
  }
  if (deskripsiFilter && deskripsiFilter.trim() !== "") {
    filteredRows = filteredRows.filter(row => row.deskripsi && row.deskripsi.toLowerCase().includes(deskripsiFilter.toLowerCase()));
  }
  if (statusPostingFilter.length > 0) {
    filteredRows = filteredRows.filter(row => {
      if (statusPostingFilter.includes("posted") && row.posted) return true;
      if (statusPostingFilter.includes("unposted") && !row.posted) return true;
      return false;
    });
  }

  // Logic Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      key = null;
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Logic Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRowsFiltered = sortedRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  function formatTanggal(tgl) {
    if (!tgl) return "";
    const [year, month, day] = tgl.split("-");
    return `${day}/${month}/${year}`;
  }
  const handleClone = async (idx) => {
    const row = rows[idx];
    const groupNoBukti = row.noBukti;
    const rowsToClone = rows.filter(r => r.noBukti === groupNoBukti);

    // Tanggal hari ini
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA').slice(0, 10);
    console.log("todayStr handleClone:", todayStr); // <-- Tambahkan ini

    // Generate nomor bukti baru
    const newNoBukti = await generateNoBukti(todayStr);

    // Clone semua baris dengan noBukti yang sama
    const clonedRows = rowsToClone.map(r => ({
      ...r,
      id: undefined, // atau cukup hapus field id
      tanggal: todayStr,
      noBukti: newNoBukti,
      saved: false,
      posted: false,
      tempId: `clone-${Date.now()}-${Math.random()}`
    }));

    setRows([...rows, ...clonedRows]);
  };

  // Ambil data project
  useEffect(() => {
    api.get("/master-project")
      .then(res => setProjectList(res.data.data || []))
      .catch(() => setProjectList([]));
  }, []);

  // Fungsi render option
  const renderProjectOptions = () => {
    if (!Array.isArray(projectList)) return null;
    return projectList.map(project => (
      <option key={project.ID || project.id} value={project.kode_project}>
        {project.kode_project} - {project.nama_project}
      </option>
    ));
  };

  return (
    <div
      style={{
        background: theme.cardColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}
      >
        Jurnal Penyesuaian (AJE)
      </h2>
      <ActiveFiltersBar
        tanggalFilter={tanggalFilter}
        noBuktiFilter={noBuktiFilter}
        akunFilter={akunFilter}
        deskripsiFilter={deskripsiFilter}
        statusPostingFilter={statusPostingFilter}
        onRemove={(chip) => {
          if (chip.type === "tanggal") setTanggalFilter(tanggalFilter.filter(t => t !== chip.value));
          if (chip.type === "noBukti") setNoBuktiFilter(noBuktiFilter.filter(nb => nb !== chip.value));
          if (chip.type === "akun") setAkunFilter(akunFilter.filter(a => a !== chip.value));
          if (chip.type === "deskripsi") setDeskripsiFilter("");
          if (chip.type === "status") setStatusPostingFilter(statusPostingFilter.filter(s => s !== chip.value));
        }}
        onReset={() => {
          setTanggalFilter([]);
          setNoBuktiFilter([]);
          setAkunFilter([]);
          setDeskripsiFilter("");
          setStatusPostingFilter([]);
        }}
      />
      <div style={{ overflowX: "auto" }}>
        <table
          className="min-w-full border text-sm"
          style={{
            fontFamily: theme.tableFontFamily,
            background: theme.cardColor,
            color: theme.tableFontColor,
          }}
        >
          <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
            <tr>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 150 }}>
                <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleSort("tanggal")}>
                  Tanggal {sortConfig.key === "tanggal" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                </div>
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <TanggalDropdownCustomButton rows={rows} value={tanggalFilter} onChange={setTanggalFilter} />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 150 }}>
                <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleSort("noBukti")}>
                  No. Bukti {sortConfig.key === "noBukti" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                </div>
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={noBuktiOptions.map(nb => ({ label: nb, value: nb }))}
                    value={noBuktiFilter}
                    onChange={setNoBuktiFilter}
                    placeholder="Cari No. Bukti"
                    iconTitle="Filter No. Bukti"
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 220 }}>
                <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleSort("namaAkun")}>
                  Nama Akun {sortConfig.key === "namaAkun" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                </div>
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={
                      [...coaList]
                        .sort((a, b) => a.kode.localeCompare(b.kode))
                        .map(coa => ({
                          label: `(${coa.kode}) ${coa.nama}`,
                          value: coa.nama
                        }))
                    }
                    value={akunFilter}
                    onChange={setAkunFilter}
                    placeholder="Cari Akun"
                    iconTitle="Filter Nama Akun"
                    dropdownStyle={{ minWidth: 300 }} // Tambahkan ini jika komponen mendukung
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative' }}>
                <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleSort("deskripsi")}>
                  Deskripsi {sortConfig.key === "deskripsi" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                </div>
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="text"
                    value={deskripsiFilter}
                    onChange={setDeskripsiFilter}
                    placeholder="Cari Deskripsi"
                    iconTitle="Filter Deskripsi"
                  />
                </span>
              </th>
              <th className="border px-2 py-1">Debit</th>
              <th className="border px-2 py-1">Kredit</th>
              <th className="border px-2 py-1" style={{ minWidth: 120 }}>Project No</th>
              <th className="border px-2 py-1" style={{ minWidth: 180 }}>Project Name</th>
              <th className="border px-2 py-1" style={{ position: 'relative' }}>
                <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleSort("posted")}>
                  Aksi {sortConfig.key === "posted" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                </div>
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="status"
                    options={[
                      { label: 'Sudah Posting', value: 'posted' },
                      { label: 'Belum Posting', value: 'unposted' },
                    ]}
                    value={statusPostingFilter}
                    onChange={setStatusPostingFilter}
                    iconTitle="Filter Status Posting"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRowsFiltered.map((row) => {
              const realIdx = rows.findIndex(r => r.tempId === row.tempId);
              return (
                <tr
                  key={row.tempId}
                  className="transition-colors hover:bg-blue-50/50"
                  style={{
                    background: row.posted ? theme.tableHeaderColor : theme.tableBodyColor,
                    color: theme.tableFontColor,
                    fontFamily: theme.tableFontFamily,
                  }}
                >
                  <td className="border px-2 py-1" style={{ minWidth: 150 }}>
                    {row.posted ? (
                      formatTanggal(row.tanggal)
                    ) : (
                      <DatePicker
                        selected={
                          row.tanggal
                            ? parse(row.tanggal, "yyyy-MM-dd", new Date())
                            : null
                        }
                        onChange={date => {
                          const iso = date ? format(date, "yyyy-MM-dd") : "";
                          handleChange(realIdx, { target: { name: "tanggal", value: iso } });
                        }}
                        dateFormat="dd/MM/yyyy"
                        customInput={
                          <input
                            className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                            readOnly={row.posted}
                            disabled={row.posted}
                            placeholder="dd/mm/yyyy"
                            style={{
                              background: theme.fieldColor,
                              color: theme.fontColor,
                              fontFamily: theme.fontFamily,
                            }}
                          />
                        }
                        disabled={row.posted}
                      />
                    )}
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      name="noBukti"
                      value={row.noBukti}
                      onChange={e => handleChange(realIdx, e)}
                      className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400 text-center font-semibold text-blue-700 bg-blue-50"
                      readOnly={row.posted}
                      disabled={row.posted}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      name="namaAkun"
                      value={row.namaAkun}
                      onChange={e => handleChange(realIdx, e)}
                      className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      disabled={row.posted}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      <option value="">Pilih Akun</option>
                      {coaList.map(coa => (
                        <option key={coa.id} value={coa.nama} data-kode={coa.kode}>
                          ({coa.kode}) {coa.nama}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      name="deskripsi"
                      value={row.deskripsi}
                      onChange={e => handleChange(realIdx, e)}
                      className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      readOnly={row.posted}
                      disabled={row.posted}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      name="debit"
                      value={row._editingDebit === undefined ? (row.debit === "" ? "" : Number(row.debit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : row._editingDebit}
                      onChange={e => {
                        let raw = e.target.value.replace(/[^0-9.,]/g, "");
                        raw = raw.replace(/,/g, ".");
                        setRows(rows.map((r) =>
                          r.tempId === row.tempId ? { ...r, _editingDebit: e.target.value, debit: raw, saved: false } : r
                        ));
                      }}
                      onBlur={() => {
                        setRows(rows.map((r) => {
                          if (r.tempId === row.tempId) {
                            const { _editingDebit, ...rest } = r;
                            return { ...rest };
                          }
                          return r;
                        }));
                      }}
                      onFocus={() => {
                        setRows(rows.map((r) => r.tempId === row.tempId ? { ...r, _editingDebit: r.debit } : r));
                      }}
                      className="border rounded px-2 py-1 text-right w-full focus:outline-none focus:ring-1 focus:ring-green-400"
                      readOnly={row.posted}
                      disabled={row.posted || (row.kredit && row.kredit !== "" && parseFloat(row.kredit) !== 0)}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      name="kredit"
                      value={row._editingKredit === undefined ? (row.kredit === "" ? "" : Number(row.kredit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : row._editingKredit}
                      onChange={e => {
                        let raw = e.target.value.replace(/[^0-9.,]/g, "");
                        raw = raw.replace(/,/g, ".");
                        setRows(rows.map((r) => r.tempId === row.tempId ? { ...r, _editingKredit: e.target.value, kredit: raw, saved: false } : r));
                      }}
                      onBlur={() => {
                        setRows(rows.map((r) => {
                          if (r.tempId === row.tempId) {
                            const { _editingKredit, ...rest } = r;
                            return { ...rest };
                          }
                          return r;
                        }));
                      }}
                      onFocus={() => {
                        setRows(rows.map((r) => r.tempId === row.tempId ? { ...r, _editingKredit: r.kredit } : r));
                      }}
                      className="border rounded px-2 py-1 text-right w-full focus:outline-none focus:ring-1 focus:ring-red-400"
                      readOnly={row.posted}
                      disabled={row.posted || (row.debit && row.debit !== "" && parseFloat(row.debit) !== 0)}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      name="projectNo"
                      value={row.projectNo || ""}
                      onChange={e => {
                        const value = e.target.value;
                        const selected = projectList.find(p => p.kode_project === value);
                        handleChange(realIdx, { target: { name: "projectNo", value } });
                        setRows(rows.map((r) =>
                          r.tempId === row.tempId
                            ? { ...r, projectNo: value, projectName: selected ? selected.nama_project : "" }
                            : r
                        ));
                      }}
                      className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      disabled={row.posted}
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      <option value="">Pilih Project</option>
                      {renderProjectOptions()}
                    </select>
                  </td>
                  <td className="border px-2 py-1 text-xs text-gray-500 italic">
                    {row.projectName || "Nama project otomatis"}
                  </td>
                  <td className="border px-2 py-1 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {!row.saved ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSave(realIdx)}
                            className="p-1.5 rounded-full hover:bg-green-100 transition-colors"
                            title="Simpan"
                            style={{
                              color: theme.buttonSimpan,
                            }}
                          >💾</button>
                          <button
                            type="button"
                            onClick={() => handleDelete(realIdx)}
                            className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                            title="Hapus"
                            style={{
                              color: theme.buttonHapus,
                            }}
                          >🗑️</button>
                          <button
                            type="button"
                            onClick={() => handleClone(realIdx)}
                            className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            title="Clone"
                            style={{
                              color: theme.buttonEdit,
                            }}
                          >📋</button>
                        </>
                      ) : (
                        <>
                          {!row.posted ? (
                            <button
                              type="button"
                              onClick={() => handlePosting(realIdx)}
                              className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                              title="Posting"
                              style={{
                                color: theme.buttonEdit,
                              }}
                            >📤</button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnposting(realIdx)}
                              className="p-1.5 rounded-full hover:bg-orange-100 transition-colors"
                              title="Unposting"
                              style={{
                                color: theme.buttonRefresh,
                              }}
                            >↩️</button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(realIdx)}
                            className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                            title="Hapus"
                            style={{
                              color: theme.buttonHapus,
                            }}
                          >🗑️</button>
                          <button
                            type="button"
                            onClick={() => handleClone(realIdx)}
                            className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            title="Clone"
                            style={{
                              color: theme.buttonEdit,
                            }}
                          >📋</button>
                        </>
                      )}
                      {row.posted && (
                        <button
                          type="button"
                          onClick={() => {
                            setJournalNomorTransaksi(row.noBukti);
                            setShowJournalModal(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                          title="Lihat Jurnal"
                          style={{
                            color: theme.buttonEdit || "#4f46e5",
                          }}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => addRow()}
            className="px-6 py-2.5 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            style={{
              background: theme.buttonSimpan,
              color: "#fff",
              fontFamily: theme.fontFamily,
            }}
          >
            <span className="text-xl">+</span> Tambah Baris
          </button>
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <span>Tampilkan</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[5, 10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>baris</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-4 text-sm font-medium text-gray-600">
            Halaman <span className="text-blue-600 font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages || 1}</span>
            <span className="ml-2 text-gray-400">({sortedRows.length} total data)</span>
          </span>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md border transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`}
              title="Awal"
            >
              ⏮️
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md border transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`}
              title="Sebelumnya"
            >
              ◀️
            </button>

            <div className="flex items-center gap-1 px-2">
              {/* Simple page numbers around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-8 h-8 rounded-md border text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-110' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-md border transition-colors ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`}
              title="Berikutnya"
            >
              ▶️
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-md border transition-colors ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`}
              title="Akhir"
            >
              ⏭️
            </button>
          </nav>

        </div>
      </div>

      <JournalPreviewModal
        open={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        nomorTransaksi={journalNomorTransaksi}
        title="Jurnal Penyesuaian (AJE)"
      />
    </div>
  );
}

function sortRowsByTanggalNoBukti(rows) {
  return [...rows].sort((a, b) => {
    // Bandingkan tanggal (format yyyy-MM-dd)
    if (a.tanggal < b.tanggal) return -1;
    if (a.tanggal > b.tanggal) return 1;
    // Jika tanggal sama, bandingkan noBukti
    if (a.noBukti < b.noBukti) return -1;
    if (a.noBukti > b.noBukti) return 1;
    return 0;
  });
}