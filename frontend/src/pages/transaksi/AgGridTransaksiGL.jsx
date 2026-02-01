import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // tambahkan ini
import api from "../../utils/api";
import { Box, Button, Typography } from "@mui/material";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import SimpleDropdownFilterButton from "./SimpleDropdownFilterButton";
import TanggalDropdownCustomButton from "./TanggalDropdownCustomButton";

export default function AgGridTransaksiGL() {
  const { theme } = useTheme(); // gunakan theme
  const [rowData, setRows] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [tanggalFilter, setTanggalFilter] = useState([]);
  const [akunFilter, setAkunFilter] = useState([]);
  const [deskripsiFilter, setDeskripsiFilter] = useState("");
  const [noTransaksiFilter, setNoTransaksiFilter] = useState("");
  const [projectNoFilter, setProjectNoFilter] = useState("");
  const [projectNameFilter, setProjectNameFilter] = useState("");
  const [nomorJurnalFilter, setNomorJurnalFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Ambil master COA
  useEffect(() => {
    api.get('/master-coa').then(res => {
      setMasterCoaList(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  // Ambil data GL
  useEffect(() => {
    api.get("/gl")
      .then((res) => {
        const mapped = (res.data || [])
          .filter(row => row && typeof row === "object")
          .map((row, idx) => {
            // Ambil tanggal dari field dan konversi ke Date
            const rawTanggal = row.tanggal || row.Tanggal || "";
            let tanggalDate = null;
            if (rawTanggal) {
              // Cek format dd-mm-yyyy manual
              const match = rawTanggal.match(/^([0-9]{2})-([0-9]{2})-([0-9]{4})$/);
              if (match) {
                // Format dd-mm-yyyy
                tanggalDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
              } else {
                tanggalDate = new Date(rawTanggal);
              }
            }
            return {
              id: String(idx + 1),
              tanggal: tanggalDate && !isNaN(tanggalDate.getTime()) ? tanggalDate : null,
              coaAkunBank: row.coaAkunBank || row.coa_akun_bank || "",
              akunTransaksi: row.akunTransaksi || row.akun_transaksi || "",
              deskripsi: row.deskripsi || "",
              debit: row.debit ?? "",
              kredit: row.kredit ?? "",
              balance: row.balance ?? "",
              nomorTransaksi: row.nomorTransaksi || row.no_transaksi || "",
              nomorJurnal: row.nomorJurnal || row.nomor_jurnal || "",
              projectNo: row.projectNo || row.project_no || "",
              projectName: row.projectName || row.project_name || "",
            };
          })
          // hanya ambil row dengan tanggal valid (bukan null)
          .sort((a, b) => {
            return a.nomorTransaksi.localeCompare(b.nomorTransaksi);
          })
          .filter(row => row.tanggal);

        setRows(mapped);

      })

      .catch(() => { });
  }, []);

  // Helper mapping kode ke nama COA
  const getAkunTransaksiDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  // Format tanggal dd/mm/yyyy
  const formatTanggal = (tgl) => {
    if (!tgl) return "";
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedTanggalFilter = tanggalFilter.map(tgl => {
    if (!tgl) return "";
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });

  // Filter data
  const filteredRows = rowData.filter(row => {
    if (formattedTanggalFilter.length && !formattedTanggalFilter.includes(formatTanggal(row.tanggal))) return false;
    if (akunFilter.length && !akunFilter.includes(row.akunTransaksi)) return false;
    if (deskripsiFilter && !row.deskripsi?.toLowerCase().includes(deskripsiFilter.toLowerCase())) return false;
    if (noTransaksiFilter && !row.nomorTransaksi?.toLowerCase().includes(noTransaksiFilter.toLowerCase())) return false;
    if (projectNoFilter && !row.projectNo?.toLowerCase().includes(projectNoFilter.toLowerCase())) return false;
    if (projectNameFilter && !row.projectName?.toLowerCase().includes(projectNameFilter.toLowerCase())) return false;
    if (nomorJurnalFilter && !row.nomorJurnal?.toLowerCase().includes(nomorJurnalFilter.toLowerCase())) return false;
    return true;
  });

  // Sorting logic
  const sortedRows = React.useMemo(() => {
    let sortableRows = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableRows.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle specific field types
        if (sortConfig.key === "tanggal") {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (sortConfig.key === "debit" || sortConfig.key === "kredit") {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else {
          aVal = String(aVal || "").toLowerCase();
          bVal = String(bVal || "").toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRows;
  }, [filteredRows, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const currentRowsFiltered = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null;
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return " ↕️";
    if (sortConfig.direction === "ascending") return " 🔼";
    return " 🔽";
  };

  // Export to Excel
  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(filteredRows.map(row => ({
      ...row,
      tanggal: formatTanggal(row.tanggal),
      akunTransaksi: getAkunTransaksiDisplay(row.akunTransaksi),
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "TransaksiGL");
    xlsx.writeFile(wb, "TransaksiGL.xlsx");
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  const handleResetFilter = () => {
    setTanggalFilter([]);
    setAkunFilter([]);
    setDeskripsiFilter("");
    setNoTransaksiFilter([]);
    setProjectNoFilter("");
    setProjectNameFilter("");
    setNomorJurnalFilter("");
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
  };

  return (
    <Box
      sx={{
        p: 2,
        background: theme.cardColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
          }}
        >
          General Ledger (GL)
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<FiPrinter />}
            sx={{
              background: theme.buttonSimpan,
              color: "#fff",
              fontFamily: theme.fontFamily,
              "&:hover": { background: theme.buttonEdit },
            }}
          >
            Print
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="contained"
            startIcon={<FaFileExcel />}
            sx={{
              background: theme.buttonEdit,
              color: "#fff",
              fontFamily: theme.fontFamily,
              "&:hover": { background: theme.buttonSimpan },
            }}
          >
            Excel
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <span style={{ fontSize: 14, color: theme.fontColor, fontFamily: theme.fontFamily }}>Filter Aktif:</span>
        {tanggalFilter.length > 0 && tanggalFilter.map(val => (
          <span key={val} className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {val} <span style={{ cursor: "pointer" }} onClick={() => setTanggalFilter(tanggalFilter.filter(t => t !== val))}>×</span>
          </span>
        ))}
        {akunFilter.length > 0 && akunFilter.map(val => {
          const label = masterCoaList.find(coa => String(coa.kode) === String(val));
          return (
            <span key={val} className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
              {label ? label.nama : val} <span style={{ cursor: "pointer" }} onClick={() => setAkunFilter(akunFilter.filter(a => a !== val))}>×</span>
            </span>
          );
        })}
        {deskripsiFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {deskripsiFilter} <span style={{ cursor: "pointer" }} onClick={() => setDeskripsiFilter("")}>×</span>
          </span>
        )}
        {noTransaksiFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {noTransaksiFilter} <span style={{ cursor: "pointer" }} onClick={() => setNoTransaksiFilter("")}>×</span>
          </span>
        )}
        {projectNoFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {projectNoFilter} <span style={{ cursor: "pointer" }} onClick={() => setProjectNoFilter("")}>×</span>
          </span>
        )}
        {projectNameFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {projectNameFilter} <span style={{ cursor: "pointer" }} onClick={() => setProjectNameFilter("")}>×</span>
          </span>
        )}
        {nomorJurnalFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {nomorJurnalFilter} <span style={{ cursor: "pointer" }} onClick={() => setNomorJurnalFilter("")}>×</span>
          </span>
        )}
        <Button
          variant="outlined"
          size="small"
          sx={{
            ml: 1,
            fontSize: 13,
            minWidth: 0,
            px: 1,
            py: 0.5,
            color: theme.fontColor,
            borderColor: theme.buttonEdit,
            fontFamily: theme.fontFamily,
          }}
          onClick={handleResetFilter}
        >
          RESET FILTER
        </Button>
      </Box>
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
              <th className="border px-2 py-1" style={{ minWidth: 60 }}>No</th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ position: 'relative', minWidth: 120 }}
                onClick={() => handleSort("tanggal")}
              >
                Tanggal {renderSortIcon("tanggal")}
                <span style={{ position: 'absolute', right: 4, top: 4 }} onClick={(e) => e.stopPropagation()}>
                  <TanggalDropdownCustomButton
                    rows={rowData}
                    value={tanggalFilter}
                    onChange={(v) => { setTanggalFilter(v); setCurrentPage(1); }}
                  />
                </span>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ position: 'relative', minWidth: 220 }}
                onClick={() => handleSort("akunTransaksi")}
              >
                Akun Transaksi {renderSortIcon("akunTransaksi")}
                <span style={{ position: 'absolute', right: 4, top: 4 }} onClick={(e) => e.stopPropagation()}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={
                      masterCoaList
                        .sort((a, b) => a.kode.localeCompare(b.kode))
                        .map(coa => ({
                          label: `(${coa.kode}) ${coa.nama}`,
                          value: coa.kode
                        }))
                    }
                    value={akunFilter}
                    onChange={(v) => { setAkunFilter(v); setCurrentPage(1); }}
                    placeholder="Cari Akun"
                    iconTitle="Filter Nama Akun"
                    dropdownStyle={{ minWidth: 400 }}
                  />
                </span>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 200 }}
                onClick={() => handleSort("deskripsi")}
              >
                Deskripsi {renderSortIcon("deskripsi")}
                <div>
                  <input
                    type="text"
                    value={deskripsiFilter}
                    onChange={e => { setDeskripsiFilter(e.target.value); setCurrentPage(1); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Deskripsi"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 120 }}
                onClick={() => handleSort("debit")}
              >
                Debit {renderSortIcon("debit")}
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 120 }}
                onClick={() => handleSort("kredit")}
              >
                Kredit {renderSortIcon("kredit")}
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 160 }}
                onClick={() => handleSort("nomorJurnal")}
              >
                Nomor Jurnal {renderSortIcon("nomorJurnal")}
                <div>
                  <input
                    type="text"
                    value={nomorJurnalFilter}
                    onChange={e => { setNomorJurnalFilter(e.target.value); setCurrentPage(1); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari No. Jurnal"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ position: 'relative', minWidth: 160 }}
                onClick={() => handleSort("nomorTransaksi")}
              >
                Nomor Transaksi {renderSortIcon("nomorTransaksi")}
                <div>
                  <input
                    type="text"
                    value={noTransaksiFilter}
                    onChange={e => { setNoTransaksiFilter(e.target.value); setCurrentPage(1); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari No. Transaksi"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 120 }}
                onClick={() => handleSort("projectNo")}
              >
                Project No {renderSortIcon("projectNo")}
                <div>
                  <input
                    type="text"
                    value={projectNoFilter}
                    onChange={e => { setProjectNoFilter(e.target.value); setCurrentPage(1); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Project No"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th
                className="border px-2 py-1 cursor-pointer hover:bg-black/5"
                style={{ minWidth: 160 }}
                onClick={() => handleSort("projectName")}
              >
                Project Name {renderSortIcon("projectName")}
                <div>
                  <input
                    type="text"
                    value={projectNameFilter}
                    onChange={e => { setProjectNameFilter(e.target.value); setCurrentPage(1); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Project Name"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRowsFiltered.length === 0 ? (
              <tr>
                <td colSpan={9} className="border px-2 py-4 text-center text-gray-400 italic">
                  Tidak ada data yang cocok dengan filter
                </td>
              </tr>
            ) : (
              currentRowsFiltered.map((row, idx) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-blue-50/50"
                  style={{ background: theme.tableBodyColor, color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}
                >
                  <td className="border px-2 py-1 text-center">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                  <td className="border px-2 py-1">{formatTanggal(row.tanggal)}</td>
                  <td className="border px-2 py-1">{getAkunTransaksiDisplay(row.akunTransaksi)}</td>
                  <td className="border px-2 py-1">{row.deskripsi}</td>
                  <td className="border px-2 py-1" style={{ textAlign: "right" }}>
                    {row.debit !== "" ? Number(row.debit).toLocaleString("id-ID", { minimumFractionDigits: 2 }) : ""}
                  </td>
                  <td className="border px-2 py-1" style={{ textAlign: "right" }}>
                    {row.kredit !== "" ? Number(row.kredit).toLocaleString("id-ID", { minimumFractionDigits: 2 }) : ""}
                  </td>
                  <td className="border px-2 py-1">{row.nomorJurnal}</td>
                  <td className="border px-2 py-1">{row.nomorTransaksi}</td>
                  <td className="border px-2 py-1">{row.projectNo}</td>
                  <td className="border px-2 py-1">{row.projectName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          background: "rgba(0,0,0,0.02)",
          borderRadius: 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: 13 }}>Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-1 py-0.5"
            style={{ background: theme.fieldColor, color: theme.fontColor }}
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span style={{ fontSize: 13 }}>rows per page</span>
          <span className="ml-4 text-xs text-gray-400">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length} records
          </span>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'}`}
            title="First Page"
          >⏮️</button>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'}`}
            title="Previous Page"
          >◀️</button>

          <Box sx={{ display: "flex", alignItems: "center", mx: 1 }}>
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
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-black/5'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </Box>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-2 py-1 rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'}`}
            title="Next Page"
          >▶️</button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-2 py-1 rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'}`}
            title="Last Page"
          >⏭️</button>
        </Box>
      </Box>
    </Box>
  );
}
