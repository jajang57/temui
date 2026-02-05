import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext"; // tambahkan ini
import api from "../../utils/api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { RemoveRedEye as ViewIcon } from '@mui/icons-material';
import { ArrowUp, ArrowDown, Filter, X, Search as SearchIcon, RotateCcw } from 'lucide-react';
import JournalPreviewModal from '../../components/JournalPreviewModal';

function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function InputTransaksiTable({
  selectedCOA,
  refresh,
  shouldJumpToLatest,
  latestTransaksiData,
  onJumpCompleted,
  onRowDoubleClick
}) {
  const { theme } = useTheme(); // gunakan theme

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [localRefresh, setLocalRefresh] = useState(false);

  // Journal Preview State
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalNomorTransaksi, setJournalNomorTransaksi] = useState("");

  // ✅ SORT & FILTER STATE
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);

  const itemsPerPage = 10;

  // State changes
  useEffect(() => {
    // Data state updated
  }, [data, selectedCOA]);

  // ✅ FETCH: COA list
  useEffect(() => {
    api.get("/coa-kas-bank")
      .then(res => {
        setCoaList(res.data || []);
      })
      .catch(err => {
        setCoaList([]);
      });
  }, []);

  // ✅ FETCH: Master COA list
  useEffect(() => {
    api.get("/master-coa")
      .then(res => {
        setMasterCoaList(res.data || []);
      })
      .catch(err => {
        setMasterCoaList([]);
      });
  }, []);

  // ✅ FETCH: Project list
  useEffect(() => {
    api.get("/master-project")
      .then(res => {
        setProjectList(res.data.data || []);
      })
      .catch(err => {
        setProjectList([]);
      });
  }, []);

  // selectedCOA changes
  useEffect(() => {
    // selectedCOA updated
  }, [selectedCOA]);

  // ✅ FIXED: Single useEffect untuk fetch transaksi data
  useEffect(() => {
    //

    if (!selectedCOA) {
      //
      setData([]);
      return;
    }

    const fetchWithDelay = setTimeout(() => {
      fetchTransaksiData();
    }, 300);

    const fetchTransaksiData = async () => {
      try {
        let queryParam = selectedCOA;
        if (coaList.length > 0) {
          const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
          if (coaById) {
            queryParam = coaById.kode;
          }
        } else {
          try {
            const coaRes = await api.get("/coa-kas-bank");
            const tempCoaList = coaRes.data || [];
            const coaById = tempCoaList.find(coa => String(coa.id) === String(selectedCOA));
            if (coaById) {
              queryParam = coaById.kode;
            }
          } catch (err) {
            //
          }
        }
        const res = await api.get(`/input-transaksi?coaAkunBank=${queryParam}`);
        if (Array.isArray(res.data)) {
          setData(res.data);
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else {
          setData([]);
        }
      } catch (err) {
        setData([]);
      }
    };

    return () => clearTimeout(fetchWithDelay);
  }, [selectedCOA, refresh, localRefresh, coaList.length]); // ✅ ADD: coaList.length dependency

  // ✅ TRIGGER: Local refresh when coaList loads
  useEffect(() => {
    if (selectedCOA && coaList.length > 0 && data.length === 0) {

      const timeoutId = setTimeout(() => {
        setLocalRefresh(prev => !prev);
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [coaList.length, selectedCOA]);

  // ✅ HELPER: Get current query param
  const getCurrentQueryParam = () => {
    if (!selectedCOA) return null;

    if (coaList.length > 0) {
      const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
      return coaById ? coaById.kode : selectedCOA;
    }

    return selectedCOA;
  };

  // ✅ HELPER: Get selected COA name for header
  const getSelectedCoaName = () => {
    if (!selectedCOA) return '';

    if (coaList.length > 0) {
      const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
      if (coaById) {
        return `${coaById.kode} - ${coaById.nama}`;
      }
    }

    const queryParam = getCurrentQueryParam();
    if (queryParam && masterCoaList.length > 0) {
      const found = masterCoaList.find(coa => String(coa.kode) === String(queryParam));
      return found ? `${found.kode} - ${found.nama}` : queryParam;
    }

    return selectedCOA;
  };

  // ✅ HELPER: Other helper functions
  const getCoaName = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `${found.kode} - ${found.nama}` : kode;
  };

  const getAkunTransaksiName = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  const getAkunTransaksiKode = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? found.kode : kode;
  };

  const getAkunTransaksiNamaOnly = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? found.nama : '';
  };

  const getProjectName = (kodeProject) => {
    if (!kodeProject) return '';
    const found = projectList.find(project => project.kode_project === kodeProject);
    return found ? found.nama_project : kodeProject;
  };

  // ✅ DATA PROCESSING
  const { filteredData, sortedFiltered } = React.useMemo(() => {

    // Step 1: Filter data (Global + Column)
    const filtered = data.filter(row => {
      // 1. Global Search
      let matchesGlobal = true;
      if (search) {
        const searchLower = search.toLowerCase();
        matchesGlobal = (
          String(row.noTransaksi || '').toLowerCase().includes(searchLower) ||
          String(row.deskripsi || '').toLowerCase().includes(searchLower) ||
          String(row.projectNo || '').toLowerCase().includes(searchLower) ||
          String(row.projectName || '').toLowerCase().includes(searchLower) ||
          getCoaName(row.coaAkunBank).toLowerCase().includes(searchLower) ||
          getAkunTransaksiName(row.akunTransaksi).toLowerCase().includes(searchLower)
        );
      }
      if (!matchesGlobal) return false;

      // 2. Column Filters
      const matchesColumns = Object.keys(columnFilters).every(key => {
        const filterValue = columnFilters[key]?.toLowerCase();
        if (!filterValue) return true;

        let rowValue = "";
        switch (key) {
          case 'tanggal': rowValue = formatDateDMY(row.tanggal); break;
          case 'coaAkunBank': rowValue = getCoaName(row.coaAkunBank); break;
          case 'akunTransaksi': rowValue = getAkunTransaksiName(row.akunTransaksi); break;
          case 'projectNo': rowValue = row.projectNo || ""; break;
          case 'projectName': rowValue = getProjectName(row.projectNo); break;
          case 'debit': rowValue = row.debit ? row.debit.toString() : ""; break;
          case 'kredit': rowValue = row.kredit ? row.kredit.toString() : ""; break;
          default: rowValue = String(row[key] || "");
        }

        return rowValue.toLowerCase().includes(filterValue);
      });

      return matchesColumns;
    });

    // Step 2: Sort data
    const sorted = filtered.sort((a, b) => {
      // 1. Custom Sort
      if (sortConfig.key) {
        let valA, valB;

        // Extract values based on key
        switch (sortConfig.key) {
          case 'tanggal':
            valA = new Date(a.tanggal || 0).getTime();
            valB = new Date(b.tanggal || 0).getTime();
            break;
          case 'coaAkunBank':
            valA = getCoaName(a.coaAkunBank);
            valB = getCoaName(b.coaAkunBank);
            break;
          case 'akunTransaksi':
            valA = getAkunTransaksiName(a.akunTransaksi);
            valB = getAkunTransaksiName(b.akunTransaksi);
            break;
          case 'projectName':
            valA = getProjectName(a.projectNo);
            valB = getProjectName(b.projectNo);
            break;
          case 'debit':
            valA = Number(a.debit || 0);
            valB = Number(b.debit || 0);
            break;
          case 'kredit':
            valA = Number(a.kredit || 0);
            valB = Number(b.kredit || 0);
            break;
          default:
            valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : "";
            valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : "";
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      }

      // 2. Default Sort (Date Ascending -> ID Ascending)
      // Only apply default sort if no custom sort or as tie-breaker?
      // Actually, user might want to see latest first if they sort desc.
      // But keeping default logic as fallback is good.

      const dateA = new Date(a.tanggal || 0);
      const dateB = new Date(b.tanggal || 0);

      // Primary sort: by date (ascending - oldest first for chronological order)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      // Secondary sort: by ID (ascending - oldest first)
      return (a.id || 0) - (b.id || 0);
    });

    return {
      filteredData: filtered,
      sortedFiltered: sorted
    };
  }, [data, search, masterCoaList, projectList, sortConfig, columnFilters]); // ✅ All dependencies for filtering/sorting

  // ✅ ENHANCED: Smart auto-jump using the same filtered data
  // We use a timestamp tracking to ensure we only jump when the user requested it AND data is ready
  useEffect(() => {
    if (shouldJumpToLatest && latestTransaksiData && sortedFiltered.length > 0) {
      const targetIndex = sortedFiltered.findIndex(item =>
        String(item.id) === String(latestTransaksiData.id) ||
        (item.noTransaksi === latestTransaksiData.noTransaksi)
      );

      if (targetIndex !== -1 && shouldJumpToLatest) {
        // Found it!
        const targetPage = Math.ceil((targetIndex + 1) / itemsPerPage);
        if (page !== targetPage) {
          console.log("� Jumping to page:", targetPage, "for item:", latestTransaksiData.noTransaksi);
          setPage(targetPage);
          // Clear search if it was hiding the item (though sortedFiltered implies it's visible)
          if (search && !sortedFiltered.some(i => i.id === latestTransaksiData.id)) {
            setSearch("");
          }

          if (onJumpCompleted) {
            // Delay slightly to allow render
            setTimeout(onJumpCompleted, 500);
          }
        }
      }
    }
  }, [shouldJumpToLatest, latestTransaksiData, sortedFiltered, itemsPerPage, onJumpCompleted, page, search]);

  // ✅ PAGINATION: Use the memoized sorted data
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paged = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

  // ✅ SALDO CALCULATION: Use the memoized sorted data
  const masterSaldoAwal = React.useMemo(() => {
    if (!selectedCOA || !coaList.length) return 0;

    const coa = coaList.find(coa => String(coa.id) === String(selectedCOA));
    if (!coa) return 0;

    const saldoAwal = coa.saldoAwal;
    if (saldoAwal === null || saldoAwal === undefined || isNaN(saldoAwal)) return 0;

    return Number(saldoAwal);
  }, [coaList, selectedCOA]);

  const saldoAwalPage = React.useMemo(() => {
    if (!sortedFiltered || !sortedFiltered.length) return masterSaldoAwal;

    const transaksSebelumPage = (page - 1) * itemsPerPage;

    if (transaksSebelumPage === 0) {
      return masterSaldoAwal;
    }

    let saldo = masterSaldoAwal;
    for (let i = 0; i < transaksSebelumPage && i < sortedFiltered.length; i++) {
      const row = sortedFiltered[i];
      if (row) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        saldo += debit - kredit;
      }
    }

    return saldo;
  }, [sortedFiltered, masterSaldoAwal, page, itemsPerPage]);

  const calculateBalances = React.useMemo(() => {
    if (!paged || !paged.length) return {};

    let running = saldoAwalPage;
    const balanceMap = {};

    paged.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        running += debit - kredit;
        balanceMap[row.id] = running;
      }
    });

    return balanceMap;
  }, [paged, saldoAwalPage]);

  // ✅ PAGE VALIDATION: Use the memoized sorted data
  // ✅ AUTO-JUMP to Last Page on Data Load (for new COA selection)
  useEffect(() => {
    // Only jump if we have data, pagination is enabled, and we haven't manually set a page yet (or just switched COA)
    // We can use a simple heuristic: if page is 1 (default) and we have data, jump to last.
    // However, we need to distinguish between "User clicked First Page" and "Initial Load".

    // Better approach: When selectedCOA changes, we want to jump to the last page once data is loaded.
    // The `useEffect` below handles page validation. We can modify it.

    if (sortedFiltered.length > 0 && itemsPerPage > 0) {
      const totalPagesCalc = Math.ceil(sortedFiltered.length / itemsPerPage);

      // Helper to check if this is likely an initial load or COA switch
      // If we are on page 1, and there are multiple pages, and we just got data... 
      // But we need to be careful not to override user navigation.

      // Let's rely on the fact that when COA changes, page is usually reset to 1 (or needs to be).
      // If the user wants "Default to Last Page", we should do it here.

      // Check if we need to adjust page due to filter changes reducing count
      if (page > totalPagesCalc) {
        setPage(totalPagesCalc);
      }
      // Logic for jumping to last page on load/COA change could be complex to get perfect without extra state.
      // For now, let's prioritize the user's request: "kalo dropdown di ganti... ga langsung ke last page".
      // We'll trust that jumping to the last page is the desired default state for this table.
      else if (page === 1 && totalPagesCalc > 1 && !search && !shouldJumpToLatest) {
        // Only auto-jump if we are on page 1, have >1 pages, no search active, and not currently doing a specific transaction jump.
        // This might annoy users who actually want to go to page 1, but for a "Journal/Ledger" view, last page is usually most relevant.
        // We can add a ref to track if 'initial load' for this COA is done if this is too aggressive.

        // For now, let's try strict ID-based tracking: only jump if COA changed? 
        // But we don't track previous COA easily here. 

        // Let's assume on data load (e.g. sortedFiltered changes length significantly), we prefer last page?
        // No, that's bad.

        // Let's look at `localRefresh` or `selectedCOA` dependency in a separate effect.
      }
    } else if (sortedFiltered.length === 0) {
      setPage(1);
    }
  }, [sortedFiltered.length, page, itemsPerPage, search, shouldJumpToLatest]);

  // ✅ NEW EFFECT: Force jump to last page when COA changes
  // We use a ref to store the 'last seen COA' to detect actual changes.
  const prevCOARef = React.useRef(selectedCOA);

  useEffect(() => {
    if (prevCOARef.current !== selectedCOA) {
      // COA changed!
      prevCOARef.current = selectedCOA;
      // We can't jump yet because data might not be loaded.
      // But we can set a flag or just wait for data.
      // Actually, when COA changes, we can just reset page to 'last' in the render cycle? No, data is async.

      // We'll set page to 1 initially to be safe? Or wait?
      // Best way: When data arrives and matches this new COA, jump.
    }
  }, [selectedCOA]);

  // Combined logic: When filtered data updates, if it looks like a "new" full dataset (not a filter/search), default to last.
  // Implementation:
  // If we are on Page 1, and we have Data > 1 page, and !search.
  // To prevent locking user to Page 1->Last loop, we need a flag "hasJumpedToLastOnLoad".

  const [hasJumpedToLastOnLoad, setHasJumpedToLastOnLoad] = useState(false);

  // Reset flag when COA changes
  useEffect(() => {
    setHasJumpedToLastOnLoad(false);
  }, [selectedCOA]);

  useEffect(() => {
    if (!hasJumpedToLastOnLoad && sortedFiltered.length > 0 && !search && itemsPerPage > 0) {
      const total = Math.ceil(sortedFiltered.length / itemsPerPage);
      if (total > 1) {
        setPage(total);
        setHasJumpedToLastOnLoad(true);
      }
    }
  }, [sortedFiltered.length, hasJumpedToLastOnLoad, search, itemsPerPage, selectedCOA]);

  // Standard validation (keep existing but modified)
  useEffect(() => {
    if (sortedFiltered.length > 0 && itemsPerPage > 0) {
      const totalPagesCalc = Math.ceil(sortedFiltered.length / itemsPerPage);
      if (page > totalPagesCalc && totalPagesCalc > 0) {
        setPage(totalPagesCalc);
      } else if (page < 1) {
        setPage(1);
      }
    } else if (sortedFiltered.length === 0) {
      setPage(1);
    }
  }, [sortedFiltered.length, page, itemsPerPage]);

  // ✅ PRINT FUNCTION
  const handlePrint = () => {
    const selectedCoaName = getSelectedCoaName();
    const printData = [...sortedFiltered];
    let runningBalance = masterSaldoAwal;
    const balancesForPrint = {};

    printData.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        runningBalance += debit - kredit;
        balancesForPrint[row.id] = runningBalance;
      }
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Transaksi - ${selectedCoaName}</title>
        <style>
          @page { margin: 20px; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .saldo-awal { background-color: #fffbf0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Daftar Transaksi</div>
          <div class="subtitle">${selectedCoaName}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>COA Akun Bank</th>
              <th>Kode Akun</th>
              <th>Nama Akun</th>
              <th>Deskripsi</th>
              <th>Debit</th>
              <th>Kredit</th>
              <th>Balance</th>
              <th>Nomor Transaksi</th>
              <th>Project No</th>
              <th>Project Name</th>
            </tr>
          </thead>
          <tbody>
            <tr class="saldo-awal">
              <td class="text-center" colspan="8">Saldo Awal</td>
              <td class="text-right">${masterSaldoAwal.toLocaleString()}</td>
              <td colspan="3"></td>
            </tr>
            ${printData.map((row, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${formatDateDMY(row.tanggal)}</td>
                <td>${getCoaName(row.coaAkunBank)}</td>
                <td class="text-center">${getAkunTransaksiKode(row.akunTransaksi)}</td>
                <td>${getAkunTransaksiNamaOnly(row.akunTransaksi)}</td>
                <td>${row.deskripsi || ''}</td>
                <td class="text-right">${row.debit && Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}</td>
                <td class="text-right">${row.kredit && Number(row.kredit) > 0 ? Number(row.kredit).toLocaleString() : '-'}</td>
                <td class="text-right">${balancesForPrint[row.id].toLocaleString()}</td>
                <td class="text-center">${row.noTransaksi || ''}</td>
                <td class="text-center">${row.projectNo || ''}</td>
                <td>${getProjectName(row.projectNo)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Buka window baru untuk print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // ✅ EXPORT EXCEL FUNCTION
  const handleExportExcel = () => {
    const selectedCoaName = getSelectedCoaName();
    const exportData = [...sortedFiltered];
    let runningBalance = masterSaldoAwal;
    const balancesForExport = {};

    exportData.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        runningBalance += debit - kredit;
        balancesForExport[row.id] = runningBalance;
      }
    });

    const excelData = [
      [`Daftar Transaksi - ${selectedCoaName}`],
      [],
      [
        'No',
        'Tanggal',
        'COA Akun Bank',
        'Kode Akun',
        'Nama Akun',
        'Deskripsi',
        'Debit',
        'Kredit',
        'Balance',
        'Nomor Transaksi',
        'Project No',
        'Project Name'
      ],
      [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Saldo Awal',
        masterSaldoAwal,
        '',
        '',
        ''
      ],
      ...exportData.map((row, idx) => [
        idx + 1,
        formatDateDMY(row.tanggal),
        getCoaName(row.coaAkunBank),
        getAkunTransaksiKode(row.akunTransaksi),
        getAkunTransaksiNamaOnly(row.akunTransaksi),
        row.deskripsi || '',
        row.debit || 0,
        row.kredit || 0,
        balancesForExport[row.id],
        row.noTransaksi || '',
        row.projectNo || '',
        getProjectName(row.projectNo)
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },   // No
      { wch: 12 },  // Tanggal
      { wch: 20 },  // COA Akun Bank
      { wch: 12 },  // Kode Akun
      { wch: 25 },  // Nama Akun
      { wch: 25 },  // Deskripsi
      { wch: 15 },  // Debit
      { wch: 15 },  // Kredit
      { wch: 15 },  // Balance
      { wch: 20 },  // Nomor Transaksi
      { wch: 12 },  // Project No
      { wch: 20 }   // Project Name
    ];
    ws['!cols'] = colWidths;

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Transaksi');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `Daftar_Transaksi_${selectedCoaName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  // ...rest of existing code unchanged...

  // ✅ HELPERS FOR SORT/FILTER UI
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ✅ RENDER HEADER HELPER (Modified for Compactness)
  const renderHeader = (label, key, canSort = true, canFilter = true) => {
    return (
      <th
        className="px-2 py-0.5 border relative"
        style={{ minWidth: (key === 'deskripsi' || key === 'akunTransaksi') ? '150px' : 'auto' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`cursor-pointer select-none flex-1 truncate ${canSort ? 'hover:text-blue-600' : ''}`}
            onClick={() => canSort && handleSort(key)}
            title={label}
          >
            {label}
            {sortConfig.key === key && (
              <span className="ml-1 inline-block align-middle">
                {sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </span>
            )}
          </span>

          {canFilter && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFilterColumn(activeFilterColumn === key ? null : key);
                }}
                className={`p-1 rounded hover:bg-gray-200 ${columnFilters[key] ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
                title="Filter kolom ini"
              >
                <Filter size={14} className={columnFilters[key] ? "fill-current" : ""} />
              </button>

              {/* Filter Dropdown */}
              {activeFilterColumn === key && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-white border rounded shadow-lg z-50 p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 text-xs font-semibold text-gray-600 uppercase">Filter {label}</div>
                  <div className="flex gap-1 mb-2">
                    <input
                      autoFocus
                      type="text"
                      className="w-full border rounded px-2 py-1 text-sm text-black"
                      placeholder={`Cari ${label}...`}
                      value={columnFilters[key] || ''}
                      onChange={(e) => setColumnFilters({ ...columnFilters, [key]: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        const newFilters = { ...columnFilters };
                        delete newFilters[key];
                        setColumnFilters(newFilters);
                        setActiveFilterColumn(null); // Close after reset? Or keep open?
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center"
                    >
                      <RotateCcw size={12} className="mr-1" /> Reset
                    </button>
                    <button
                      onClick={() => setActiveFilterColumn(null)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </th>
    );
  };

  return (
    <div
      className="w-full rounded shadow px-2 py-0.5 mt-2 overflow-x-auto"
      style={{
        background: theme.formColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        minHeight: '300px' // Reduced min-height
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2
            className="text-sm font-bold"
            style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}
          >
            Data Transaksi{selectedCOA ? ` - ${getSelectedCoaName()}` : ""}
          </h2>
          <span className="text-xs opacity-50 select-none" style={{ color: theme.fontColor }}>
            (Double-click row untuk edit)
          </span>
        </div>

        {selectedCOA && (
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
              className="px-3 py-1 rounded text-xs shadow-sm"
            >
              Print
            </button>
            <button
              onClick={handleExportExcel}
              style={{ background: theme.buttonUpdate, color: "#fff", fontFamily: theme.fontFamily }}
              className="px-3 py-1 rounded text-xs shadow-sm"
            >
              Export Excel
            </button>
          </div>
        )}
      </div>

      {!selectedCOA && (
        <div
          className="text-center mb-4 p-4 rounded"
          style={{
            background: theme.fieldColor,
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
          }}
        >
          Pilih COA Akun Bank dari form di atas untuk melihat data transaksi
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="min-w-full border text-xs"
          style={{
            fontFamily: theme.tableFontFamily,
          }}
        >
          <thead>
            <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              {renderHeader("No", "id", true, false)}
              {renderHeader("Tanggal", "tanggal")}
              {renderHeader("COA Akun Bank", "coaAkunBank")}
              {renderHeader("Akun Transaksi", "akunTransaksi")}
              {renderHeader("Deskripsi", "deskripsi")}
              {renderHeader("Debit", "debit")}
              {renderHeader("Kredit", "kredit")}
              <th className="px-2 py-0.5 border">Balance</th>
              {renderHeader("No Transaksi", "noTransaksi")}
              {renderHeader("Project No", "projectNo")}
              {renderHeader("Project Name", "projectName")}
              <th className="px-2 py-0.5 border">Jurnal</th>
            </tr>
          </thead>
          <tbody>
            {selectedCOA && (
              <tr className="text-xs leading-none" style={{ background: theme.cardColor, color: theme.fontColor }}>
                <td className="px-2 py-0.5 border text-center font-bold" colSpan={7}>
                  Saldo Awal
                </td>
                <td className="px-2 py-0.5 border text-right font-bold">
                  {saldoAwalPage && !isNaN(saldoAwalPage) ? saldoAwalPage.toLocaleString() : '0'}
                </td>
                <td className="px-2 py-0.5 border" colSpan={4}></td>
              </tr>
            )}
            {!selectedCOA ? (
              <tr className="text-xs">
                <td colSpan={12} className="text-center p-8" style={{ color: theme.fontColor }}>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📋</div>
                    <div className="font-medium">Pilih COA Akun Bank</div>
                    <div className="text-sm">Silakan pilih COA Akun Bank terlebih dahulu untuk melihat data transaksi</div>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr className="text-xs">
                <td colSpan={12} className="text-center p-4" style={{ color: theme.fontColor }}>
                  {data.length === 0 ? (
                    <>
                      <div>Tidak ada data transaksi untuk COA yang dipilih</div>
                      <div className="text-xs mt-2">
                        Raw data: {data.length} | Filtered: {filteredData.length} | Search: "{search}"
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Tidak ada data yang sesuai dengan pencarian "{search}"</div>
                      <div className="text-xs mt-2">
                        Total data: {data.length} | Hasil filter: {filteredData.length}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const globalIndex = sortedFiltered.findIndex(item => item.id === row.id);
                const globalNo = globalIndex + 1;
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors text-xs leading-none"
                    style={{
                      background: theme.tableBodyColor,
                      color: theme.tableFontColor,
                      fontFamily: theme.tableFontFamily,
                    }}
                    onDoubleClick={() => {
                      if (onRowDoubleClick) {
                        onRowDoubleClick(row);
                      }
                    }}
                    title="Double-click untuk edit transaksi"
                  >
                    <td className="px-2 py-0.5 border text-center" style={{ width: '40px' }}>{globalNo}</td>
                    <td className="px-2 py-0.5 border whitespace-nowrap">{formatDateDMY(row.tanggal)}</td>
                    <td className="px-2 py-0.5 border truncate max-w-[150px]" title={getCoaName(row.coaAkunBank)}>{getCoaName(row.coaAkunBank)}</td>
                    <td className="px-2 py-0.5 border truncate max-w-[200px]" title={getAkunTransaksiName(row.akunTransaksi)}>{getAkunTransaksiName(row.akunTransaksi)}</td>
                    <td className="px-2 py-0.5 border truncate max-w-[200px]" title={row.deskripsi}>{row.deskripsi}</td>
                    <td className="px-2 py-0.5 border text-right">
                      {row.debit && !isNaN(row.debit) && Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-0.5 border text-right">
                      {row.kredit && !isNaN(row.kredit) && Number(row.kredit) > 0 ? Number(row.kredit).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-0.5 border text-right">{calculateBalances[row.id] && !isNaN(calculateBalances[row.id]) ? calculateBalances[row.id].toLocaleString() : '0'}</td>
                    <td className="px-2 py-0.5 border whitespace-nowrap">{row.noTransaksi}</td>
                    <td className="px-2 py-0.5 border">{row.projectNo}</td>
                    <td className="px-2 py-0.5 border truncate max-w-[150px]">{getProjectName(row.projectNo)}</td>
                    <td className="p-0 border text-center align-middle">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setJournalNomorTransaksi(row.noTransaksi);
                          setShowJournalModal(true);
                        }}
                        className="text-[14px] hover:underline leading-none px-1"
                        title="Lihat Jurnal"
                        style={{ color: theme.buttonEdit || '#4f46e5' }}
                      >
                        Lihat
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <JournalPreviewModal
        open={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        nomorTransaksi={journalNomorTransaksi}
        title="Jurnal Transaksi Kas/Bank"
      />

      {selectedCOA && paged.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">

          {/* Left Side: Show Rows */}
          <div className="flex items-center text-sm" style={{ color: theme.fontColor }}>
            <span className="mr-2">Show</span>
            <select
              value={itemsPerPage}
              disabled // Fixed to 10 for now as per code logic, logic needs update to support dynamic var but user didn't ask for that yet.
              className="border rounded px-2 py-1 mx-1"
              style={{ background: theme.fieldColor, color: theme.fontColor }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2">rows per page</span>
            <span className="ml-4 text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedFiltered.length)} of {sortedFiltered.length} records
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          <div className="flex items-center space-x-1">
            {/* First Page */}
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
              style={{
                borderColor: theme.borderColor || '#d1d5db',
                color: theme.buttonEdit || '#3b82f6',
                background: theme.cardColor
              }}
              title="First Page"
            >
              «
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
              style={{
                borderColor: theme.borderColor || '#d1d5db',
                color: theme.buttonEdit || '#3b82f6',
                background: theme.cardColor
              }}
              title="Previous"
            >
              ‹
            </button>

            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);

              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              if (startPage > 1) {
                pages.push(
                  <span key="dots-start" className="px-2">...</span>
                );
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-1 rounded border ${page === i ? 'font-bold' : 'hover:bg-blue-50'}`}
                    style={{
                      background: page === i ? (theme.buttonEdit || '#3b82f6') : theme.cardColor,
                      color: page === i ? '#fff' : (theme.fontColor),
                      borderColor: theme.buttonEdit || '#3b82f6'
                    }}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                pages.push(
                  <span key="dots-end" className="px-2">...</span>
                );
              }

              return pages;
            })()}

            {/* Next Page */}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
              style={{
                borderColor: theme.borderColor || '#d1d5db',
                color: theme.buttonEdit || '#3b82f6',
                background: theme.cardColor
              }}
              title="Next"
            >
              ›
            </button>

            {/* Last Page */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
              style={{
                borderColor: theme.borderColor || '#d1d5db',
                color: theme.buttonEdit || '#3b82f6',
                background: theme.cardColor
              }}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
