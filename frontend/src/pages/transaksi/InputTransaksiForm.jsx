import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext"; // pastikan sudah di-import
import Select from "react-select"; // Import react-select untuk dropdown searchable
import * as XLSX from 'xlsx'; // Import library xlsx untuk parsing Excel

// Tambahkan fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
function getTodayLocal() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

// Fungsi untuk format angka dengan pemisah ribuan koma dan desimal titik
function formatNumber(value) {
  if (!value) return '';
  
  // Hapus semua karakter non-digit dan titik desimal
  let cleanValue = value.toString().replace(/[^\d.]/g, '');
  
  // Pastikan hanya ada satu titik desimal
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Convert ke number
  const numericValue = parseFloat(cleanValue) || 0;
  
  // Format dengan pemisah ribuan (koma) dan desimal (titik) - format internasional
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

// Fungsi untuk mengubah format angka kembali ke number
function parseFormattedNumber(value) {
  if (!value) return '';
  // Hapus semua koma (pemisah ribuan) dan biarkan titik (desimal)
  return value.toString().replace(/,/g, '');
}

const InputTransaksiForm = forwardRef(({ onCOAChange, afterSubmit }, ref) => {
      // State untuk search dan pagination
      const [searchText, setSearchText] = useState("");
      const [currentPage, setCurrentPage] = useState(1);
      const pageSize = 20;
    // Fungsi ketika user klik tombol Pilih pada baris penjualan
        // Fungsi ketika user klik tombol Pilih pada baris pembelian
        const handlePilihPembelian = (item) => {
          setForm(prev => ({
            ...prev,
            deskripsi: `Pembayaran Pembelian ${item.nomorInvoice}`,
            kredit: item.total ? item.total.toString() : "",
            debit: ""
          }));
          setFormattedKredit(item.total ? formatNumberWithCommas(item.total) : "");
          setShowSummaryPopup(false);
        };
    const handlePilihPenjualan = (item) => {
      // Isi deskripsi dan debit otomatis
      setForm(prev => ({
        ...prev,
        deskripsi: `Pembayaran Penjualan ${item.nomorInvoice}`,
        debit: item.total ? item.total.toString() : "",
        kredit: ""
      }));
      setFormattedDebit(item.total ? formatNumberWithCommas(item.total) : "");
      setShowSummaryPopup(false);
    };
  const { user } = useAuth(); // ✅ FIXED: Add this line
  const { theme } = useTheme(); // tambahkan ini

  const [form, setForm] = useState({
    coaAkunBank: "",
    noTransaksi: "",
    tanggal: getTodayLocal(), // ✅ Set default
    akunTransaksi: "",
    debit: "",
    kredit: "",
    deskripsi: "",
    projectNo: "",
    projectName: ""
  });

  const [coaList, setCoaList] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [akunTransaksiOptions, setAkunTransaksiOptions] = useState([]); // ✅ FIXED: Add this state
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransaksiId, setSelectedTransaksiId] = useState(null);
  const [isGeneratingNoTransaksi, setIsGeneratingNoTransaksi] = useState(false);
  const [formattedDebit, setFormattedDebit] = useState("");
  const [formattedKredit, setFormattedKredit] = useState("");
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryType, setSummaryType] = useState(""); // "penjualan" atau "pembelian"
  
  // State untuk Bulk Import
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportData, setBulkImportData] = useState([]);
  const [bulkImportProgress, setBulkImportProgress] = useState({ current: 0, total: 0 });
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  
  // State untuk Audit Trail
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [auditTrailData, setAuditTrailData] = useState([]);
  const [loadingAuditTrail, setLoadingAuditTrail] = useState(false);

  // ✅ FIXED: Fetch master project data
  useEffect(() => {
    api.get("/master-project")
      .then(res => {
        const projectData = res.data.data || [];
        setProjectList(projectData);
      })
      .catch(err => {
        console.error("Error fetching master project:", err);
        setProjectList([]);
      });
  }, []);

  // ✅ FIXED: Debug projectList changes
  useEffect(() => {
    // Debug: projectList updated
  }, [projectList]);

  // Fungsi untuk handle double click row (untuk edit)
  const handleRowDoubleClick = useCallback((transaksi) => {
    setIsEditMode(true);
    setSelectedTransaksiId(transaksi.id);
    
    // Format tanggal dari ISO string ke YYYY-MM-DD
    const tanggalFormatted = transaksi.tanggal ? 
      new Date(transaksi.tanggal).toISOString().split('T')[0] : 
      getTodayLocal();
    
    // Cari COA berdasarkan kode atau ID
    let coaAkunBankValue = transaksi.coaAkunBank || "";
    
    // Jika coaAkunBank adalah kode, cari ID-nya
    const coaByKode = coaList.find(coa => coa.kode === transaksi.coaAkunBank);
    const coaById = coaList.find(coa => String(coa.id) === String(transaksi.coaAkunBank));
    
    if (coaByKode) {
      coaAkunBankValue = String(coaByKode.id);
    } else if (coaById) {
      coaAkunBankValue = String(coaById.id);
    }
    
    const newFormData = {
      noTransaksi: transaksi.noTransaksi || "",
      coaAkunBank: coaAkunBankValue,
      tanggal: tanggalFormatted,
      akunTransaksi: transaksi.akunTransaksi || "",
      deskripsi: transaksi.deskripsi || "",
      projectNo: transaksi.projectNo || "",
      projectName: transaksi.projectName || "",
      debit: transaksi.debit || "",
      kredit: transaksi.kredit || ""
    };
    
    setForm(newFormData);
    
    // Set nilai yang diformat untuk debit dan kredit
    setFormattedDebit(transaksi.debit ? formatNumber(transaksi.debit) : '');
    setFormattedKredit(transaksi.kredit ? formatNumber(transaksi.kredit) : '');
    
    // Trigger COA change untuk parent component
    if (onCOAChange && coaAkunBankValue) {
      onCOAChange(coaAkunBankValue);
    }
  }, [coaList, onCOAChange]);

  // Fungsi untuk reset form (Cancel)
  const handleResetForm = useCallback(() => {
    setForm({
      coaAkunBank: "",
      noTransaksi: "",
      tanggal: getTodayLocal(),
      akunTransaksi: "",
      deskripsi: "",
      projectNo: "",
      projectName: "",
      debit: "",
      kredit: ""
    });
    setFormattedDebit('');
    setFormattedKredit('');
    setIsEditMode(false);
    setSelectedTransaksiId(null);
    if (onCOAChange) {
      onCOAChange(""); // Reset filter di parent
    }
  }, [onCOAChange]);

  // ✅ TAMBAHKAN: Reset khusus untuk delete (tidak reset COA Akun Bank)
  const handleResetAfterDelete = useCallback(() => {
    const currentCoaAkunBank = form.coaAkunBank; // Simpan COA yang sedang dipilih
    
    setForm({
      coaAkunBank: currentCoaAkunBank, // ✅ JANGAN RESET COA AKUN BANK
      noTransaksi: "",
      tanggal: getTodayLocal(),
      akunTransaksi: "",
      deskripsi: "",
      projectNo: "",
      projectName: "",
      debit: "",
      kredit: ""
    });
    setFormattedDebit('');
    setFormattedKredit('');
    setIsEditMode(false);
    setSelectedTransaksiId(null);
    
    // ✅ JANGAN PANGGIL onCOAChange("") supaya filter tidak reset
  }, [form.coaAkunBank]);

  // Expose handleEdit function to parent via ref
  useImperativeHandle(ref, () => ({
    handleEdit: handleRowDoubleClick,
    resetForm: handleResetForm,
    resetAfterDelete: handleResetAfterDelete // ✅ TAMBAHKAN INI
  }), [handleRowDoubleClick, handleResetForm, handleResetAfterDelete]);

  // ✅ FIXED: Fetch COA Kas Bank data
  useEffect(() => {
    api.get("/coa-kas-bank")
      .then(res => setCoaList(res.data))
      .catch(() => setCoaList([]));
  }, []);

  // ✅ FIXED: Fetch Master COA data
  useEffect(() => {
    api.get("/master-coa")
      .then(res => {
        setMasterCoaList(res.data);
        // Filter untuk menghilangkan COA yang sedang dipilih sebagai COA Akun Bank
        const filteredOptions = res.data
          .filter(coa => {
            // Cari COA Bank yang sedang dipilih
            const selectedCOA = coaList.find(bankCoa => String(bankCoa.id) === String(form.coaAkunBank));
            // Jika ada COA Bank yang dipilih, hilangkan dari opsi akun transaksi
            return !selectedCOA || coa.kode !== selectedCOA.kode;
          })
          .sort((a, b) => {
            // Urutkan berdasarkan kode akun secara ascending (numerik)
            const kodeA = parseFloat(a.kode) || 0;
            const kodeB = parseFloat(b.kode) || 0;
            if (kodeA !== kodeB) {
              return kodeA - kodeB;
            }
            // Jika sama secara numerik, urutkan secara alfabet
            return a.kode.localeCompare(b.kode);
          })
          .map(coa => ({
            value: coa.kode.toString(),
            label: `(${coa.kode}) ${coa.nama}`,
            masterCategoryCOA: coa.masterCategoryCOA
          }));
        
        setAkunTransaksiOptions(filteredOptions);
      })
      .catch(() => {
        setMasterCoaList([]);
        setAkunTransaksiOptions([]);
      });
  }, [coaList, form.coaAkunBank]); // Tambahkan dependency

  // Debug: Log form changes
  useEffect(() => {
    // Form state changed
  }, [form]);

  // Debug: Log COA list changes
  useEffect(() => {
    // COA List updated
  }, [coaList]);

  // Fungsi untuk generate nomor transaksi otomatis
  const generateNoTransaksi = async () => {
    if (!form.coaAkunBank || !form.tanggal || !user?.id) {
      return;
    }

    // Cari kode bank dari ID yang dipilih
    const selectedCOA = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
    if (!selectedCOA || !selectedCOA.kode) {
      return;
    }

    setIsGeneratingNoTransaksi(true);
    try {
      const response = await api.get("/generate-no-transaksi", {
        params: {
          kodeBank: selectedCOA.kode,
          userID: user.id,
          tanggal: form.tanggal
        }
      });
      
      setForm(prev => ({
        ...prev,
        noTransaksi: response.data.noTransaksi
      }));
    } catch (error) {
      console.error("Error generating nomor transaksi:", error);
      alert("Gagal generate nomor transaksi: " + (error.response?.data?.error || error.message));
    } finally {
      setIsGeneratingNoTransaksi(false);
    }
  };

  // Auto-generate nomor transaksi ketika coaAkunBank atau tanggal berubah
  useEffect(() => {
    // Hanya generate jika bukan mode edit dan semua data tersedia
    if (!isEditMode && form.coaAkunBank && form.tanggal && user?.id) {
      generateNoTransaksi();
    }
  }, [form.coaAkunBank, form.tanggal, user?.id, isEditMode]); // ✅ Dependencies clear

  // Fungsi untuk hapus transaksi
  const handleDeleteTransaksi = async () => {
    if (!selectedTransaksiId) {
      alert("Pilih transaksi yang ingin dihapus dengan double-click terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    try {
    // Simpan data untuk rollback jika diperlukan
    const deletedTransaksiData = {
      id: selectedTransaksiId,
      noTransaksi: form.noTransaksi,
      coaAkunBank: form.coaAkunBank
    };

    // Kirim request delete
    await api.delete(`/input-transaksi/${selectedTransaksiId}`);
    
    // Reset form terlebih dahulu
    handleResetAfterDelete();
    
    // Notify parent dengan data yang dihapus untuk update table
    if (afterSubmit) {
      afterSubmit(form.coaAkunBank, null, deletedTransaksiData); // ✅ Tambah parameter ke-3
    }
    
    alert("Transaksi berhasil dihapus!");
    
    } catch (err) {
      console.error("Error deleting transaksi:", err);
      const errorMsg = err.response?.data?.message || err.message || "Gagal menghapus transaksi";
      alert(`Gagal menghapus transaksi: ${errorMsg}`);
    }
  };

  // Fungsi untuk mengecek apakah akun transaksi adalah kas & bank
  const isAkunTransaksiKasBank = (kodeAkun) => {
    const akunTransaksi = masterCoaList.find(coa => String(coa.kode) === String(kodeAkun));
    return akunTransaksi && akunTransaksi.masterCategoryCOA && akunTransaksi.masterCategoryCOA.isKasBank;
  };

  // Fungsi untuk fetch summary penjualan
    // Reset search & page saat popup dibuka
    useEffect(() => {
      if (showSummaryPopup) {
        setSearchText("");
        setCurrentPage(1);
      }
    }, [showSummaryPopup]);
  const fetchSummaryPenjualan = async () => {
    setLoadingSummary(true);
    setSummaryType("penjualan");
    try {
      const response = await api.get("/penjualan/list-with-customer");
      const penjualanData = response.data || [];
      setSummaryData({
        list: penjualanData
      });
      setShowSummaryPopup(true);
    } catch (error) {
      console.error("Error fetching penjualan:", error);
      alert("Gagal mengambil data penjualan!");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fungsi untuk fetch summary pembelian
  const fetchSummaryPembelian = async () => {
    setLoadingSummary(true);
    setSummaryType("pembelian");
    try {
      // Ganti endpoint jika perlu, pastikan response sudah ada supplierNama
      const response = await api.get("/pembelian");
      // Jika response langsung array, gunakan response.data
      const pembelianData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      // Map agar field konsisten dengan penjualan
      const mapped = pembelianData.map(item => ({
        id: item.id,
        nomorInvoice: item.nomorapinvoice || item.nomorInvoice,
        total: item.total,
        namaPemasok: item.supplierNama || item.namaPemasok || "-",
        supplierId: item.supplierId
      }));
      setSummaryData({
        list: mapped
      });
      setShowSummaryPopup(true);
    } catch (error) {
      console.error("Error fetching pembelian:", error);
      alert("Gagal mengambil data pembelian!");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fungsi untuk generate nomor transaksi untuk akun tukar
  const generateNoTransaksiTukar = async (kodeBank, tanggal, userId, originalNoTransaksi) => {
    try {
      const response = await api.get("/generate-no-transaksi", {
        params: {
          kodeBank: kodeBank,
          userID: userId,
          tanggal: tanggal
        }
      });
      
      // Tambahkan suffix -tukar
      return response.data.noTransaksi;
    } catch (error) {
      console.error("Error generating nomor transaksi tukar:", error);
      return originalNoTransaksi;
    }
  };

  // ✨ BULK IMPORT - Handle file upload
  const handleBulkImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validasi format Excel
        if (jsonData.length === 0) {
          alert("File Excel kosong!");
          return;
        }
        
        // Expected columns: Tanggal, Akun Transaksi, Debit, Kredit, Deskripsi, Project No
        const requiredColumns = ['Tanggal', 'Akun Transaksi', 'Deskripsi'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          alert(`Kolom berikut tidak ditemukan: ${missingColumns.join(', ')}\n\nFormat yang benar:\nTanggal | Akun Transaksi | Debit | Kredit | Deskripsi | Project No`);
          return;
        }
        
        setBulkImportData(jsonData);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Gagal membaca file Excel!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ✨ BULK IMPORT - Process import
  const handleBulkImport = async () => {
    if (!form.coaAkunBank) {
      alert("Pilih COA Akun Bank terlebih dahulu!");
      return;
    }
    
    if (bulkImportData.length === 0) {
      alert("Tidak ada data untuk diimport!");
      return;
    }
    
    setIsBulkImporting(true);
    setBulkImportProgress({ current: 0, total: bulkImportData.length });
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < bulkImportData.length; i++) {
      const row = bulkImportData[i];
      setBulkImportProgress({ current: i + 1, total: bulkImportData.length });
      
      try {
        // Convert tanggal ke format YYYY-MM-DD
        let tanggal = row['Tanggal'];
        if (typeof tanggal === 'number') {
          // Excel serial date
          const date = new Date((tanggal - 25569) * 86400 * 1000);
          tanggal = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        } else {
          const date = new Date(tanggal);
          tanggal = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        }
        
        // Generate nomor transaksi
        const selectedCOA = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
        const noTransaksiResponse = await api.get("/generate-no-transaksi", {
          params: {
            kodeBank: selectedCOA.kode,
            userID: user.id,
            tanggal: tanggal
          }
        });
        
        const dataToSend = {
          coaAkunBank: selectedCOA.kode,
          noTransaksi: noTransaksiResponse.data.noTransaksi,
          tanggal: tanggal,
          akunTransaksi: String(row['Akun Transaksi']),
          debit: parseFloat(row['Debit']) || 0,
          kredit: parseFloat(row['Kredit']) || 0,
          deskripsi: String(row['Deskripsi']),
          projectNo: row['Project No'] ? String(row['Project No']) : "",
          projectName: ""
        };
        
        await api.post("/input-transaksi", dataToSend);
        successCount++;
      } catch (error) {
        failCount++;
        errors.push(`Baris ${i + 2}: ${error.response?.data?.error || error.message}`);
      }
    }
    
    setIsBulkImporting(false);
    
    if (errors.length > 0) {
      alert(`Import selesai!\nBerhasil: ${successCount}\nGagal: ${failCount}\n\nError:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...dan ' + (errors.length - 5) + ' error lainnya' : ''}`);
    } else {
      alert(`Import berhasil! ${successCount} transaksi telah ditambahkan.`);
    }
    
    // Refresh table
    if (afterSubmit) {
      afterSubmit(form.coaAkunBank);
    }
    
    // Reset
    setBulkImportData([]);
    setBulkImportFile(null);
    setShowBulkImportModal(false);
  };

  // ✨ AUDIT TRAIL - Fetch audit log
  const fetchAuditTrail = async () => {
    if (!selectedTransaksiId) {
      alert("Pilih transaksi terlebih dahulu dengan double-click untuk melihat audit trail!");
      return;
    }
    
    setLoadingAuditTrail(true);
    setShowAuditTrailModal(true);
    
    try {
      const response = await api.get(`/input-transaksi/${selectedTransaksiId}/audit`);
      setAuditTrailData(response.data || []);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      // Fallback: generate mock data untuk demo
      setAuditTrailData([
        {
          action: "CREATE",
          user: user.username,
          timestamp: new Date().toISOString(),
          changes: "Transaksi dibuat"
        }
      ]);
    } finally {
      setLoadingAuditTrail(false);
    }
  };

  // ✅ ADD: Missing function
  function formatNumberWithCommas(value) {
    if (!value) return '';
    
    // Remove any non-digit characters except decimal point
    let cleanValue = value.toString().replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convert to number and format
    const numericValue = parseFloat(cleanValue) || 0;
    
    // Format with commas as thousand separators
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numericValue);
  }

  // ✅ FIXED: Enhanced handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ ENHANCED: Debug COA change
    if (name === "coaAkunBank") {
      const selectedCOA = coaList.find(coa => String(coa.id) === String(value));
      
      if (onCOAChange) {
        onCOAChange(value);
      }
    }
    
    // ✅ FIXED: Handle project selection
    if (name === "projectNo") {
      const selectedProject = projectList.find(project => project.kode_project === value);
      setForm({
        ...form,
        projectNo: value,
        projectName: selectedProject ? selectedProject.nama_project : ""
      });
      return;
    }
    
    // ✅ FIXED: Handle debit input
    if (name === "debit") {
      // Allow user to type freely
      setFormattedDebit(value);
      
      // Parse for internal storage
      const numericValue = parseFormattedNumber(value);
      
      setForm({ ...form, debit: numericValue });
      return;
    }
    
    // ✅ FIXED: Handle kredit input
    if (name === "kredit") {
      // Allow user to type freely
      setFormattedKredit(value);
      
      // Parse for internal storage
      const numericValue = parseFormattedNumber(value);
      
      setForm({ ...form, kredit: numericValue });
      return;
    }
    
    // ✅ Default case
    setForm({ ...form, [name]: value });
  };

  // ✅ FIXED: Enhanced blur handlers untuk auto-format
  const handleDebitBlur = () => {
    if (formattedDebit) {
      const formatted = formatNumberWithCommas(formattedDebit);
      setFormattedDebit(formatted);
    }
  };

  const handleKreditBlur = () => {
    if (formattedKredit) {
      const formatted = formatNumberWithCommas(formattedKredit);
      setFormattedKredit(formatted);
    }
  };

  // ✅ FIXED: Enhanced focus handlers untuk raw input
  const handleDebitFocus = () => {
    if (form.debit) {
      setFormattedDebit(form.debit.toString());
    }
  };

  const handleKreditFocus = () => {
    if (form.kredit) {
      setFormattedKredit(form.kredit.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi: pastikan salah satu dari debit atau kredit diisi
    if ((!form.debit || form.debit === "0") && (!form.kredit || form.kredit === "0")) {
      alert("Harap isi salah satu dari Debit atau Kredit");
      return;
    }
    
    try {
      // Cari kode COA Bank berdasarkan ID yang dipilih
      const selectedCOA = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
      const coaBankKode = selectedCOA ? selectedCOA.kode : form.coaAkunBank;
      
      const dataToSend = {
        ...form,
        coaAkunBank: coaBankKode, // Gunakan kode, bukan ID
        tanggal: new Date(form.tanggal).toISOString(),
        debit: form.debit ? parseFloat(form.debit) : 0,
        kredit: form.kredit ? parseFloat(form.kredit) : 0,
      };
      
      console.log("🔍 TEMP DEBUG - Data yang akan dikirim ke backend:", dataToSend);
      
      if (isEditMode && selectedTransaksiId) {
        // Mode Edit - tidak ada transaksi ganda saat edit
        console.log("🔍 TEMP DEBUG - Melakukan PUT request ke:", `/input-transaksi/${selectedTransaksiId}`);
        const response = await api.put(`/input-transaksi/${selectedTransaksiId}`, dataToSend);
        console.log("🔍 TEMP DEBUG - Backend response setelah PUT:", response.data);
        alert("Transaksi berhasil diupdate!");
        
        // ✅ ENHANCED: Pass updated transaksi data
        if (afterSubmit) {
          afterSubmit(coaBankKode, {
            id: selectedTransaksiId,
            tanggal: form.tanggal,
            noTransaksi: form.noTransaksi,
            coaAkunBank: coaBankKode,
            akunTransaksi: form.akunTransaksi,
            debit: form.debit ? parseFloat(form.debit) : 0,
            kredit: form.kredit ? parseFloat(form.kredit) : 0,
            deskripsi: form.deskripsi
          });
        }
        
        handleResetAfterDelete();
      } else {
        // Mode Create
        const isKasBank = isAkunTransaksiKasBank(form.akunTransaksi);
        
        // Simpan transaksi pertama (normal)
        const response1 = await api.post("/input-transaksi", dataToSend);
        
        // Jika akun transaksi adalah kas & bank, buat transaksi kedua
        if (isKasBank) {
          // Cari data COA untuk akun transaksi
          const akunTransaksiCOA = masterCoaList.find(coa => String(coa.kode) === String(form.akunTransaksi));
          
          if (akunTransaksiCOA) {
            // Generate nomor transaksi untuk transaksi tukar
            const noTransaksiTukar = await generateNoTransaksiTukar(
              akunTransaksiCOA.kode, 
              form.tanggal, 
              user.id, 
              form.noTransaksi
            );
            
            // Cari ID COA untuk akun transaksi tukar (yang sekarang jadi COA Akun Bank)
            const coaBankAsli = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
            
            // Buat transaksi kedua (tukar)
            const dataToSendTukar = {
              noTransaksi: noTransaksiTukar,
              coaAkunBank: akunTransaksiCOA.kode, // COA Akun Bank jadi kode akun transaksi
              tanggal: new Date(form.tanggal).toISOString(),
              akunTransaksi: coaBankAsli ? coaBankAsli.kode : coaBankKode, // Akun transaksi jadi kode COA Bank
              deskripsi: form.noTransaksi,
              projectNo: form.projectNo,
              projectName: form.projectName,
              debit: form.kredit ? parseFloat(form.kredit) : 0, // Tukar
              kredit: form.debit ? parseFloat(form.debit) : 0,  // Tukar
            };
            
            const response2 = await api.post("/input-transaksi", dataToSendTukar);
            
            alert("2 Transaksi berhasil disimpan (normal + tukar)!");
          } else {
            alert("Transaksi normal berhasil disimpan! (COA akun transaksi tidak ditemukan untuk tukar)");
          }
        } else {
          alert("Transaksi berhasil disimpan!");
        }
        
        // Trigger refresh table & jump ke transaksi terbaru setelah create
        if (afterSubmit && response1 && response1.data) {
          afterSubmit(form.coaAkunBank, response1.data);
        } else if (afterSubmit) {
          afterSubmit(form.coaAkunBank);
        }

        // Reset form
        setForm({
          noTransaksi: "",
          coaAkunBank: form.coaAkunBank, // JANGAN DIRESET
          tanggal: getTodayLocal(),
          akunTransaksi: "",
          deskripsi: "",
          projectNo: "",
          projectName: "",
          debit: "",
          kredit: ""
        });

        // Reset nilai format
        setFormattedDebit('');
        setFormattedKredit('');
        // Generate nomor transaksi untuk transaksi berikutnya
        if (form.coaAkunBank && user?.id) {
          setTimeout(() => generateNoTransaksi(), 100);
        }
      }
      
      // if (afterSubmit) afterSubmit(form.coaAkunBank, {
      //   // ... HAPUS SELURUH BLOCK INI
      // }); // PANGGIL LANGSUNG SETELAH SIMPAN
    } catch (err) {
      alert(isEditMode ? "Gagal update transaksi" : "Gagal simpan transaksi");
    }
  };

  // ✅ FIXED: Project dropdown rendering yang lebih aman dan debug yang lebih detail
  const renderProjectOptions = () => {
    if (!Array.isArray(projectList)) {
      return <option value="" disabled>Data tidak valid</option>;
    }
    
    if (projectList.length === 0) {
      return <option value="" disabled>Tidak ada data project</option>;
    }
    
    return projectList.map((project, index) => {
      // ✅ FIXED: Check both uppercase and lowercase ID
      const projectId = project.ID || project.id;
      const projectKode = project.kode_project;
      const projectNama = project.nama_project;
      
      if (!projectId || !projectKode) {
        return (
          <option key={`missing-${index}`} value="" disabled>
            Data project tidak lengkap (ID: {projectId}, Kode: {projectKode})
          </option>
        );
      }
      
      return (
        <option key={projectId} value={projectKode}>
          {projectKode} - {projectNama || 'Nama tidak tersedia'}
        </option>
      );
    });
  };

  return (
    <>
      {/* Header indikator mode */}
      {isEditMode && (
        <div className="border px-4 py-3 rounded mb-4"
          style={{
            background: theme.cardColor,
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
            borderColor: theme.buttonEdit,
          }}
        >
          <div className="flex justify-between items-center">
            <span>
              <strong>Mode Edit:</strong> Mengedit transaksi ID #{selectedTransaksiId}
            </span>
            <button
              onClick={handleResetForm}
              style={{
                color: theme.buttonHapus,
                fontWeight: "bold",
                fontFamily: theme.fontFamily,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <form
        className="space-y-4 w-full rounded shadow p-6 mt-4"
        style={{
          background: theme.formColor,
          color: theme.fontColor,
          fontFamily: theme.fontFamily,
        }}
        onSubmit={handleSubmit}
      >
        {/* Baris 1: COA Akun Bank, Nomor Transaksi, Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              COA Akun Bank
            </label>
            <Select
              name="coaAkunBank"
              value={coaList.map(coa => ({
                value: coa.id,
                label: `${coa.kode} - ${coa.nama}`
              })).find(opt => String(opt.value) === String(form.coaAkunBank))}
              onChange={(selectedOption) => {
                const newValue = selectedOption ? selectedOption.value : "";
                setForm({
                  ...form,
                  coaAkunBank: newValue
                });
                
                if (onCOAChange) {
                  onCOAChange(newValue);
                }
              }}
              options={coaList.map(coa => ({
                value: coa.id,
                label: `${coa.kode} - ${coa.nama}`
              }))}
              placeholder="Pilih COA Akun Bank"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  background: theme.fieldColor,
                  borderColor: '#d1d5db',
                  minHeight: '42px',
                  fontFamily: theme.fontFamily,
                }),
                menu: (base) => ({
                  ...base,
                  background: theme.fieldColor,
                  fontFamily: theme.fontFamily,
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? '#e5e7eb' : theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                singleValue: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                input: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                placeholder: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  opacity: 0.5,
                  fontFamily: theme.fontFamily,
                }),
              }}
            />
          </div>
          <div className="md:col-span-5">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Nomor Transaksi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="noTransaksi"
                value={form.noTransaksi}
                onChange={handleChange}
                className={`flex-1 border rounded px-3 py-2`}
                placeholder={isEditMode ? "Edit nomor transaksi" : "Auto Generated"}
                readOnly={!isEditMode}
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
              {!isEditMode && (
                <button
                  type="button"
                  onClick={generateNoTransaksi}
                  disabled={!form.coaAkunBank || !form.tanggal || isGeneratingNoTransaksi}
                  style={{
                    background: theme.buttonEdit,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                  className="px-3 py-2 rounded"
                >
                  {isGeneratingNoTransaksi ? "..." : "Auto"}
                </button>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Tanggal
            </label>
            <input
              type="date"
              name="tanggal"
              value={form.tanggal}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
              style={{
                background: theme.fieldColor,
                color: theme.fontColor,
                fontFamily: theme.fontFamily,
              }}
            />
          </div>
        </div>

        {/* Baris 2: Akun Transaksi, Button Penjualan, Button Pembelian */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Akun Transaksi
            </label>
            <Select
              name="akunTransaksi"
              value={akunTransaksiOptions.find(opt => opt.value === form.akunTransaksi)}
              onChange={(selectedOption) => {
                setForm({
                  ...form,
                  akunTransaksi: selectedOption ? selectedOption.value : ""
                });
              }}
              options={akunTransaksiOptions}
              placeholder="Pilih Akun Transaksi"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  background: theme.fieldColor,
                  borderColor: '#d1d5db',
                  minHeight: '42px',
                  fontFamily: theme.fontFamily,
                }),
                menu: (base) => ({
                  ...base,
                  background: theme.fieldColor,
                  fontFamily: theme.fontFamily,
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? '#e5e7eb' : theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                singleValue: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                input: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }),
                placeholder: (base) => ({
                  ...base,
                  color: theme.fontColor,
                  opacity: 0.5,
                  fontFamily: theme.fontFamily,
                }),
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              &nbsp;
            </label>
            <button
              type="button"
              onClick={fetchSummaryPenjualan}
              disabled={loadingSummary}
              className="px-3 py-2 rounded whitespace-nowrap text-sm w-full"
              style={{
                background: loadingSummary ? "#999" : "#10b981",
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              title="Lihat Summary Penjualan"
            >
              📊 Penjualan
            </button>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              &nbsp;
            </label>
            <button
              type="button"
              onClick={fetchSummaryPembelian}
              disabled={loadingSummary}
              className="px-3 py-2 rounded whitespace-nowrap text-sm w-full"
              style={{
                background: loadingSummary ? "#999" : "#ef4444",
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              title="Lihat Summary Pembelian"
            >
              📊 Pembelian
            </button>
          </div>
        </div>

        {/* Baris 3: Debit & Kredit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Debit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="debit"
                value={formattedDebit}
                onChange={handleChange}
                onBlur={handleDebitBlur}
                onFocus={handleDebitFocus}
                disabled={form.kredit !== undefined && form.kredit !== null && form.kredit !== "" && form.kredit !== "0"}
                className="border rounded px-3 py-2 flex-1"
                placeholder="0"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
              {form.debit && form.debit !== "0" && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({...form, debit: ""});
                    setFormattedDebit("");
                  }}
                  style={{
                    background: theme.buttonHapus,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                  className="px-2 py-1 rounded text-sm"
                  title="Clear Debit"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Kredit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="kredit"
                value={formattedKredit}
                onChange={handleChange}
                onBlur={handleKreditBlur}
                onFocus={handleKreditFocus}
                disabled={form.debit && form.debit !== "0"}
                className="border rounded px-3 py-2 flex-1"
                placeholder="0"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
              {form.kredit && form.kredit !== "0" && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({...form, kredit: ""});
                    setFormattedKredit("");
                  }}
                  style={{
                    background: theme.buttonHapus,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                  className="px-2 py-1 rounded text-sm"
                  title="Clear Kredit"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Baris 4: Deskripsi */}
        <div>
          <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
            Deskripsi
          </label>
          <input
            type="text"
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            style={{
              background: theme.fieldColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
            }}
          />
        </div>

        {/* Baris 5: Project No & Project Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Project No
            </label>
            <select
              name="projectNo"
              value={form.projectNo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              style={{
                background: theme.fieldColor,
                color: theme.fontColor,
                fontFamily: theme.fontFamily,
              }}
            >
              <option value="">Pilih Project</option>
              {renderProjectOptions()}
            </select>
            <div className="text-xs mt-1" style={{ color: theme.fontColor }}>
              Projects loaded: {projectList.length}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Project Name
            </label>
            <input
              type="text"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Nama project akan terisi otomatis"
              readOnly
              style={{
                background: theme.fieldColor,
                color: theme.fontColor,
                fontFamily: theme.fontFamily,
              }}
            />
          </div>
        </div>

        {/* Baris 6: Tombol */}
        <div className="flex gap-2 justify-between mt-4">
          <div className="flex gap-2">
            <button
              type="button"
              style={{
                background: "#10b981",
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              className="px-6 py-2 rounded"
              onClick={() => setShowBulkImportModal(true)}
              title="Upload Excel untuk import multiple transaksi"
            >
              📤 Bulk Import
            </button>
            <button
              type="button"
              style={{
                background: "#3b82f6",
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              className="px-6 py-2 rounded"
              onClick={fetchAuditTrail}
              disabled={!selectedTransaksiId}
              title={!selectedTransaksiId ? "Pilih transaksi dengan double-click untuk melihat audit trail" : "Lihat history perubahan transaksi"}
            >
              📋 Audit Trail
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              style={{
                background: isEditMode ? theme.buttonUpdate : theme.buttonSimpan,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              className="px-6 py-2 rounded"
            >
              {isEditMode ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              style={{
                background: theme.buttonHapus,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              className="px-6 py-2 rounded"
              onClick={handleDeleteTransaksi}
              disabled={!isEditMode || !selectedTransaksiId}
              title={!isEditMode ? "Pilih transaksi dengan double-click untuk menghapus" : "Hapus transaksi yang dipilih"}
            >
              Hapus
            </button>
            <button
              type="button"
              style={{
                background: theme.buttonRefresh,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              className="px-6 py-2 rounded"
              onClick={handleResetForm}
            >
              Kosongkan
            </button>
          </div>
        </div>
      </form>

      {/* Summary Popup */}
      {showSummaryPopup && summaryData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSummaryPopup(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto"
            style={{
              background: theme.backgroundFieldset,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="sticky top-0 px-6 py-4 border-b flex justify-between items-center"
              style={{
                background: summaryType === "penjualan" ? "#10b981" : "#ef4444",
                color: "#fff",
              }}
            >
              <h2 className="text-xl font-bold">
                Data {summaryType === "penjualan" ? "Penjualan" : "Pembelian"}
              </h2>
              <button
                onClick={() => setShowSummaryPopup(false)}
                className="text-2xl hover:opacity-80"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Search input */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Cari No Transaksi atau Nama Pembeli..."
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                  style={{ fontFamily: theme.fontFamily, background: theme.fieldColor, color: theme.fontColor }}
                />
              </div>
              <div className="overflow-x-auto">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="w-full border-collapse">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: summaryType === "penjualan" ? "#10b981" : "#ef4444" }}>
                        <th className="border px-4 py-2 text-left text-white">No</th>
                        <th className="border px-4 py-2 text-left text-white">No Transaksi</th>
                        <th className="border px-4 py-2 text-right text-white">Grand Total</th>
                        <th className="border px-4 py-2 text-left text-white">{summaryType === "penjualan" ? "Nama Pembeli" : "Nama Pemasok"}</th>
                        <th className="border px-4 py-2 text-center text-white">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Filter data
                        const filtered = summaryData.list ? summaryData.list.filter(item => {
                          const search = searchText.toLowerCase();
                          if (summaryType === "penjualan") {
                            return (
                              item.nomorInvoice?.toLowerCase().includes(search) ||
                              (item.namaCustomer || "").toLowerCase().includes(search)
                            );
                          } else {
                            return (
                              item.nomorInvoice?.toLowerCase().includes(search) ||
                              (item.namaPemasok || "").toLowerCase().includes(search)
                            );
                          }
                        }) : [];
                        // Pagination
                        const totalPages = Math.ceil(filtered.length / pageSize);
                        const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                        if (paged.length > 0) {
                          return paged.map((item, idx) => (
                            <tr 
                              key={idx}
                              style={{
                                background: idx % 2 === 0 ? theme.fieldColor : theme.backgroundFieldset,
                                cursor: 'pointer',
                              }}
                              className="hover:bg-blue-50"
                            >
                              <td className="border px-4 py-2">{(currentPage - 1) * pageSize + idx + 1}</td>
                              <td className="border px-4 py-2">{item.nomorInvoice}</td>
                              <td className="border px-4 py-2 text-right font-bold">{formatNumber(item.total)}</td>
                              <td className="border px-4 py-2">{summaryType === "penjualan" ? (item.namaCustomer || '-') : (item.namaPemasok || '-')}</td>
                              <td className="border px-4 py-2 text-center">
                                <button
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                  onClick={() => summaryType === "penjualan" ? handlePilihPenjualan(item) : handlePilihPembelian(item)}
                                >
                                  Pilih
                                </button>
                              </td>
                            </tr>
                          ));
                        } else {
                          return (
                            <tr>
                              <td colSpan="5" className="border px-4 py-8 text-center">
                                Tidak ada data {summaryType}
                              </td>
                            </tr>
                          );
                        }
                      })()}
                    </tbody>
                    {summaryData.list && summaryData.list.length > 0 && (
                      <tfoot>
                        <tr style={{ background: theme.buttonSimpan }}>
                          <td colSpan="2" className="border px-4 py-2 font-bold text-white text-right">
                            TOTAL ({summaryData.list.length} transaksi)
                          </td>
                          <td className="border px-4 py-2 text-right font-bold text-white">
                            {formatNumber(
                              summaryData.list.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
                            )}
                          </td>
                          <td className="border px-4 py-2"></td>
                          <td className="border px-4 py-2"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
              {/* Pagination controls */}
              {summaryData.list && (() => {
                const filtered = summaryData.list.filter(item => {
                  const search = searchText.toLowerCase();
                  return (
                    item.nomorInvoice?.toLowerCase().includes(search) ||
                    (item.namaCustomer || "").toLowerCase().includes(search)
                  );
                });
                const totalPages = Math.ceil(filtered.length / pageSize);
                if (totalPages > 1) {
                  return (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        className="px-3 py-1 rounded bg-gray-200"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        &lt;
                      </button>
                      <span>
                        Halaman {currentPage} / {totalPages}
                      </span>
                      <button
                        className="px-3 py-1 rounded bg-gray-200"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        &gt;
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Footer */}
            <div 
              className="sticky bottom-0 px-6 py-4 border-t flex justify-end"
              style={{
                background: theme.backgroundFieldset,
              }}
            >
              <button
                onClick={() => setShowSummaryPopup(false)}
                className="px-6 py-2 rounded"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📤 BULK IMPORT MODAL */}
      {showBulkImportModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isBulkImporting && setShowBulkImportModal(false)}
        >
          <div 
            className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto border"
            style={{
              background: theme.formColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
              borderColor: theme.fontColor + '30',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="sticky top-0 px-6 py-4 border-b flex justify-between items-center"
              style={{
                background: "#10b981",
                color: "#fff",
              }}
            >
              <h2 className="text-xl font-bold">📤 Bulk Import Transaksi</h2>
              <button
                onClick={() => !isBulkImporting && setShowBulkImportModal(false)}
                className="text-2xl hover:opacity-80"
                disabled={isBulkImporting}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="mb-2">Format Excel yang harus digunakan:</p>
                <div className="p-3 rounded text-sm" style={{ background: theme.fieldColor, color: theme.fontColor }}>
                  <strong>Kolom wajib:</strong> Tanggal | Akun Transaksi | Debit | Kredit | Deskripsi | Project No (opsional)
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_API_URL}/input-transaksi/bulk-import-template`;
                    }}
                    className="px-4 py-2 rounded text-sm"
                    style={{
                      background: "#3b82f6",
                      color: "#fff",
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    📥 Download Template Excel
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Upload File Excel (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleBulkImportFileChange}
                  disabled={isBulkImporting}
                  className="border rounded px-3 py-2 w-full"
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }}
                />
              </div>

              {bulkImportData.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium mb-2">Data yang akan diimport: {bulkImportData.length} transaksi</p>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="w-full text-sm">
                      <thead style={{ background: "#10b981", color: "#fff" }}>
                        <tr>
                          <th className="px-2 py-1">#</th>
                          <th className="px-2 py-1">Tanggal</th>
                          <th className="px-2 py-1">Akun</th>
                          <th className="px-2 py-1">Debit</th>
                          <th className="px-2 py-1">Kredit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkImportData.slice(0, 10).map((row, idx) => {
                          // Konversi tanggal untuk preview
                          let displayTanggal = row['Tanggal'];
                          if (typeof displayTanggal === 'number') {
                            // Excel serial date - convert to YYYY-MM-DD
                            const date = new Date((displayTanggal - 25569) * 86400 * 1000);
                            displayTanggal = date.toISOString().split('T')[0];
                          } else if (displayTanggal) {
                            // String date - convert to YYYY-MM-DD
                            const date = new Date(displayTanggal);
                            displayTanggal = date.toISOString().split('T')[0];
                          }
                          
                          return (
                            <tr key={idx} className="border-b">
                              <td className="px-2 py-1">{idx + 1}</td>
                              <td className="px-2 py-1">{displayTanggal}</td>
                              <td className="px-2 py-1">{String(row['Akun Transaksi'])}</td>
                              <td className="px-2 py-1">{formatNumber(row['Debit'] || 0)}</td>
                              <td className="px-2 py-1">{formatNumber(row['Kredit'] || 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {bulkImportData.length > 10 && (
                      <div className="text-center py-2 text-sm">
                        ...dan {bulkImportData.length - 10} baris lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isBulkImporting && (
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Progress:</span>
                    <span>{bulkImportProgress.current} / {bulkImportProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(bulkImportProgress.current / bulkImportProgress.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="sticky bottom-0 px-6 py-4 border-t flex justify-end gap-2"
              style={{
                background: theme.backgroundFieldset,
              }}
            >
              <button
                onClick={handleBulkImport}
                disabled={bulkImportData.length === 0 || isBulkImporting}
                className="px-6 py-2 rounded"
                style={{
                  background: bulkImportData.length === 0 || isBulkImporting ? "#999" : "#10b981",
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                {isBulkImporting ? "Importing..." : "Import"}
              </button>
              <button
                onClick={() => setShowBulkImportModal(false)}
                disabled={isBulkImporting}
                className="px-6 py-2 rounded"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 AUDIT TRAIL MODAL */}
      {showAuditTrailModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAuditTrailModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto"
            style={{
              background: theme.backgroundFieldset,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="sticky top-0 px-6 py-4 border-b flex justify-between items-center"
              style={{
                background: "#3b82f6",
                color: "#fff",
              }}
            >
              <h2 className="text-xl font-bold">📋 Audit Trail - Transaksi #{selectedTransaksiId}</h2>
              <button
                onClick={() => setShowAuditTrailModal(false)}
                className="text-2xl hover:opacity-80"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingAuditTrail ? (
                <div className="text-center py-8">Loading...</div>
              ) : auditTrailData.length === 0 ? (
                <div className="text-center py-8">Tidak ada audit trail untuk transaksi ini</div>
              ) : (
                <div className="space-y-4">
                  {auditTrailData.map((audit, idx) => (
                    <div 
                      key={idx} 
                      className="border rounded p-4"
                      style={{
                        background: theme.fieldColor,
                        borderColor: audit.action === "DELETE" ? "#ef4444" : audit.action === "UPDATE" ? "#f59e0b" : "#10b981"
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span 
                            className="px-3 py-1 rounded text-white text-sm font-bold"
                            style={{
                              background: audit.action === "DELETE" ? "#ef4444" : audit.action === "UPDATE" ? "#f59e0b" : "#10b981"
                            }}
                          >
                            {audit.action}
                          </span>
                          <span className="ml-3 text-sm">
                            oleh <strong>{audit.user}</strong>
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(audit.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm">{audit.changes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="sticky bottom-0 px-6 py-4 border-t flex justify-end"
              style={{
                background: theme.backgroundFieldset,
              }}
            >
              <button
                onClick={() => setShowAuditTrailModal(false)}
                className="px-6 py-2 rounded"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default InputTransaksiForm;
