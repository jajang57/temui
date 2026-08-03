import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import api from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

export default function MasterAsetTetap() {
  const { theme } = useTheme();
  const [form, setForm] = useState({
    kodeAset: "",
    namaAset: "",
    kategoriAset: "",
    tanggalPerolehan: "",
    hargaPerolehan: "",
    qty: 1,
    umurEkonomis: "",
    nilaiResidu: "",
    metodePenyusutan: "Garis Lurus",
    statusPosting: "Draft",
    kodePembelian: "",
    nomorTransaksiPembelian: "",
    tanggalMulaiPenyusutan: "",
    akunAsetTetap: "",
    akunAkumulasiPenyusutan: "",
    akunBebanPenyusutan: "",
    akunLawan: "",
    keterangan: "",
    aktif: true
  });

  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const tableRef = useRef();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showJualModal, setShowJualModal] = useState(false);
  const [jualForm, setJualForm] = useState({
    tanggalPenjualan: "",
    hargaJual: "",
    akunKas: "",
    akunLabaRugiPenjualan: "",
    keteranganPenjualan: ""
  });

  // State untuk format angka
  const [formattedHargaPerolehan, setFormattedHargaPerolehan] = useState("");
  const [formattedNilaiResidu, setFormattedNilaiResidu] = useState("");

  // Helper: sort COA by kode
  const sortedCoaList = [...coaList].sort((a, b) => a.kode.localeCompare(b.kode));
  const coaOptions = sortedCoaList.map(coa => ({ 
    value: coa.kode, 
    label: `${coa.kode} - ${coa.nama}` 
  }));

  // Format number dengan 2 desimal
  const formatNumber = (value) => {
    if (!value || value === '') return '';
    let cleanValue = value.toString().replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    const numericValue = parseFloat(cleanValue) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  };

  const unformatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  // Hitung Nilai Buku
  const hitungNilaiBuku = (row) => {
    // Jika ada nilaiBuku dari backend (dari histori posting), gunakan itu
    if (row.nilaiBuku !== undefined && row.nilaiBuku !== null) {
      return row.nilaiBuku;
    }

    // Fallback: hitung manual jika belum ada histori posting
    if (!row.hargaPerolehan || !row.tanggalPerolehan || !row.umurEkonomis) {
      return row.hargaPerolehan || 0;
    }

    const hargaPerolehan = parseFloat(row.hargaPerolehan) || 0;
    const nilaiResidu = parseFloat(row.nilaiResidu) || 0;
    const umurBulan = parseInt(row.umurEkonomis) || 1;
    const tanggalMulai = row.tanggalMulaiPenyusutan || row.tanggalPerolehan;
    
    // Hitung bulan berjalan sejak tanggal mulai penyusutan
    const startDate = new Date(tanggalMulai);
    const currentDate = new Date();
    const bulanBerjalan = Math.max(0, 
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - startDate.getMonth())
    );

    // Penyusutan metode garis lurus
    const penyusutanPerBulan = (hargaPerolehan - nilaiResidu) / umurBulan;
    const akumulasiPenyusutan = Math.min(penyusutanPerBulan * bulanBerjalan, hargaPerolehan - nilaiResidu);
    const nilaiBuku = Math.max(hargaPerolehan - akumulasiPenyusutan, nilaiResidu);

    return nilaiBuku;
  };

  // Hitung detail penyusutan
  const hitungDetailPenyusutan = (row) => {
    const hargaPerolehan = parseFloat(row.hargaPerolehan) || 0;
    const nilaiResidu = parseFloat(row.nilaiResidu) || 0;
    const umurBulan = parseInt(row.umurEkonomis) || 1;
    const tanggalMulai = row.tanggalMulaiPenyusutan || row.tanggalPerolehan;
    
    const startDate = new Date(tanggalMulai);
    const currentDate = new Date();
    const bulanBerjalan = Math.max(0, 
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - startDate.getMonth())
    );

    const penyusutanPerBulan = (hargaPerolehan - nilaiResidu) / umurBulan;
    const penyusutanPerTahun = penyusutanPerBulan * 12;
    
    // Gunakan akumulasi dari backend jika ada (dari histori posting)
    const akumulasiPenyusutan = row.akumulasiPenyusutan !== undefined 
      ? parseFloat(row.akumulasiPenyusutan) 
      : Math.min(penyusutanPerBulan * bulanBerjalan, hargaPerolehan - nilaiResidu);
    
    // Gunakan nilai buku dari backend jika ada
    const nilaiBuku = row.nilaiBuku !== undefined 
      ? parseFloat(row.nilaiBuku) 
      : Math.max(hargaPerolehan - akumulasiPenyusutan, nilaiResidu);
    
    const sisaBulan = Math.max(0, umurBulan - bulanBerjalan);

    return {
      hargaPerolehan,
      nilaiResidu,
      umurBulan,
      bulanBerjalan,
      sisaBulan,
      penyusutanPerBulan,
      penyusutanPerTahun,
      akumulasiPenyusutan,
      nilaiBuku
    };
  };

  const handleShowDetail = (row) => {
    setSelectedAsset(row);
    setShowDetailModal(true);
  };

  const handleShowJualModal = (row) => {
    setSelectedAsset(row);
    setJualForm({
      tanggalPenjualan: new Date().toISOString().split('T')[0],
      hargaJual: "",
      akunKas: "",
      akunLabaRugiPenjualan: "",
      keteranganPenjualan: ""
    });
    setShowJualModal(true);
  };

  const handleJualAset = (e) => {
    e.preventDefault();
    
    if (!jualForm.tanggalPenjualan || !jualForm.hargaJual || !jualForm.akunKas || !jualForm.akunLabaRugiPenjualan) {
      window.alert("Semua field wajib diisi!");
      return;
    }

    if (window.confirm(`Apakah yakin ingin menjual aset "${selectedAsset.namaAset}" dengan harga Rp ${formatNumber(jualForm.hargaJual)}?`)) {
      const payload = {
        tanggalPenjualan: jualForm.tanggalPenjualan,
        hargaJual: parseFloat(jualForm.hargaJual),
        akunKas: jualForm.akunKas,
        akunLabaRugiPenjualan: jualForm.akunLabaRugiPenjualan,
        keteranganPenjualan: jualForm.keteranganPenjualan
      };

      api.post(`/master-aset-tetap/${selectedAsset.id}/jual`, payload)
        .then((res) => {
          const result = res.data;
          const statusMsg = result.labaRugiPenjualan >= 0 ? "LABA" : "RUGI";
          const labaRugiAbs = Math.abs(result.labaRugiPenjualan);
          
          window.alert(
            `Aset berhasil dijual!\n\n` +
            `Nomor Transaksi: ${result.nomorTransaksi}\n` +
            `Nilai Buku: Rp ${formatNumber(result.nilaiBuku)}\n` +
            `Harga Jual: Rp ${formatNumber(result.hargaJual)}\n` +
            `${statusMsg}: Rp ${formatNumber(labaRugiAbs)}`
          );
          
          setShowJualModal(false);
          fetchData();
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal menjual aset";
          window.alert(errorMsg);
        });
    }
  };

  useEffect(() => {
    fetchData();
    fetchCoaList();
  }, []);

  const fetchData = () => {
    api.get("/master-aset-tetap")
      .then((res) => setData(res.data || []))
      .catch(() => setError("Gagal mengambil data Aset Tetap dari server"));
  };

  const fetchCoaList = () => {
    api.get("/master-coa")
      .then((res) => setCoaList(res.data || []))
      .catch(() => setCoaList([]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.kodeAset || !form.namaAset) {
      setError("Kode Aset dan Nama Aset wajib diisi!");
      return;
    }

    const payload = {
      ...form,
      hargaPerolehan: form.hargaPerolehan ? parseFloat(unformatNumber(form.hargaPerolehan)) : 0,
      nilaiResidu: form.nilaiResidu ? parseFloat(unformatNumber(form.nilaiResidu)) : 0,
      umurEkonomis: form.umurEkonomis ? parseInt(form.umurEkonomis) : 0,
    };

    // Cek duplikat kode
    const isDuplicate = data.some(
      (item) => item.kodeAset === form.kodeAset && item.id !== editId
    );
    if (isDuplicate) {
      window.alert(`Kode "${form.kodeAset}" sudah terdaftar!`);
      return;
    }

    if (editId) {
      // Edit mode
      api.put(`/master-aset-tetap/${editId}`, payload)
        .then(() => {
          fetchData();
          handleResetForm();
          setError("");
          window.alert("Data berhasil diupdate!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal update ke server";
          setError(errorMsg);
        });
    } else {
      // Insert mode
      api.post("/master-aset-tetap", payload)
        .then(() => {
          fetchData();
          handleResetForm();
          setError("");
          window.alert("Data berhasil disimpan!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal simpan ke server";
          setError(errorMsg);
        });
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Apakah yakin ingin menghapus "${row.kodeAset} - ${row.namaAset}"?`)) {
      api.delete(`/master-aset-tetap/${row.id}`)
        .then(() => {
          fetchData();
          window.alert("Data berhasil dihapus!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal hapus dari server";
          window.alert(errorMsg);
        });
    }
  };

  const handleEdit = (row) => {
    setForm({
      kodeAset: row.kodeAset,
      namaAset: row.namaAset,
      kategoriAset: row.kategoriAset || "",
      tanggalPerolehan: row.tanggalPerolehan ? row.tanggalPerolehan.split('T')[0] : "",
      hargaPerolehan: row.hargaPerolehan?.toString() || "",
      qty: row.qty ?? 1,
      umurEkonomis: row.umurEkonomis?.toString() || "",
      nilaiResidu: row.nilaiResidu?.toString() || "",
      metodePenyusutan: row.metodePenyusutan || "Garis Lurus",
      statusPosting: row.statusPosting || "Draft",
      kodePembelian: row.kodePembelian || "",
      nomorTransaksiPembelian: row.nomorTransaksiPembelian || "",
      tanggalMulaiPenyusutan: row.tanggalMulaiPenyusutan ? row.tanggalMulaiPenyusutan.split('T')[0] : "",
      akunAsetTetap: row.akunAsetTetap || "",
      akunAkumulasiPenyusutan: row.akunAkumulasiPenyusutan || "",
      akunBebanPenyusutan: row.akunBebanPenyusutan || "",
      akunLawan: row.akunLawan || "",
      keterangan: row.keterangan || "",
      aktif: row.aktif !== false
    });
    setFormattedHargaPerolehan(row.hargaPerolehan ? formatNumber(row.hargaPerolehan) : "");
    setFormattedNilaiResidu(row.nilaiResidu ? formatNumber(row.nilaiResidu) : "");
    setEditId(row.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "hargaPerolehan") {
      setFormattedHargaPerolehan(value);
      setForm(prev => ({ ...prev, [name]: unformatNumber(value) }));
    } else if (name === "nilaiResidu") {
      setFormattedNilaiResidu(value);
      setForm(prev => ({ ...prev, [name]: unformatNumber(value) }));
    } else if (type === "checkbox") {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResetForm = () => {
    setForm({
      kodeAset: "",
      namaAset: "",
      kategoriAset: "",
      tanggalPerolehan: "",
      hargaPerolehan: "",
      qty: 1,
      umurEkonomis: "",
      nilaiResidu: "",
      metodePenyusutan: "Garis Lurus",
      statusPosting: "Draft",
      kodePembelian: "",
      nomorTransaksiPembelian: "",
      tanggalMulaiPenyusutan: "",
      akunAsetTetap: "",
      akunAkumulasiPenyusutan: "",
      akunBebanPenyusutan: "",
      akunLawan: "",
      keterangan: "",
      aktif: true
    });
    setFormattedHargaPerolehan("");
    setFormattedNilaiResidu("");
    setEditId(null);
    setError("");
    setShowForm(false);
  };

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight" 
            style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
          Master Aset Tetap
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              resetForm();
            }
          }}
          className="px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
          style={{
            background: showForm ? theme.buttonHapus : theme.buttonSimpan,
            color: "#fff"
          }}
        >
          {showForm ? "Tutup Form" : "Tambah Aset Tetap"}
        </button>
      </div>

      {/* Form Input */}
      {showForm && (
      <div className="rounded-xl shadow-lg p-6 border" style={{ background: theme.formColor }}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kode Aset */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Kode Aset *
              </label>
              <input
                type="text"
                name="kodeAset"
                value={form.kodeAset}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="Contoh: AST001"
                required
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Nama Aset */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Nama Aset *
              </label>
              <input
                type="text"
                name="namaAset"
                value={form.namaAset}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="Nama aset tetap"
                required
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Kategori Aset */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Kategori Aset
              </label>
              <select
                name="kategoriAset"
                value={form.kategoriAset}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                <option value="">Pilih Kategori</option>
                <option value="Kendaraan">Kendaraan</option>
                <option value="Bangunan">Bangunan</option>
                <option value="Peralatan">Peralatan</option>
                <option value="Mesin">Mesin</option>
                <option value="Furniture">Furniture</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Tanggal Perolehan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Tanggal Perolehan
              </label>
              <input
                type="date"
                name="tanggalPerolehan"
                value={form.tanggalPerolehan}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Harga Perolehan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Harga Perolehan
              </label>
              <input
                type="text"
                name="hargaPerolehan"
                value={formattedHargaPerolehan}
                onChange={handleChange}
                onBlur={() => {
                  if (form.hargaPerolehan) {
                    setFormattedHargaPerolehan(formatNumber(form.hargaPerolehan));
                  }
                }}
                onFocus={() => {
                  if (form.hargaPerolehan) {
                    setFormattedHargaPerolehan(form.hargaPerolehan);
                  }
                }}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="0.00"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Umur Ekonomis */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Umur Ekonomis (Bulan)
              </label>
              <input
                type="number"
                name="umurEkonomis"
                value={form.umurEkonomis}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="Contoh: 60 (5 tahun)"
                min="0"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Qty */}
            <div>
              <label className="block mb-1 font-semibold"
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Qty
              </label>
              <input
                type="number"
                name="qty"
                value={form.qty}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="1"
                min="1"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Nilai Residu */}
            <div>
              <label className="block mb-1 font-semibold"
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Nilai Residu
              </label>
              <input
                type="text"
                name="nilaiResidu"
                value={formattedNilaiResidu}
                onChange={handleChange}
                onBlur={() => {
                  if (form.nilaiResidu) {
                    setFormattedNilaiResidu(formatNumber(form.nilaiResidu));
                  }
                }}
                onFocus={() => {
                  if (form.nilaiResidu) {
                    setFormattedNilaiResidu(form.nilaiResidu);
                  }
                }}
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="0.00"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Metode Penyusutan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Metode Penyusutan
              </label>
              <select
                name="metodePenyusutan"
                value={form.metodePenyusutan}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                <option value="Garis Lurus">Garis Lurus</option>
                <option value="Saldo Menurun">Saldo Menurun</option>
              </select>
            </div>

            {/* Tanggal Mulai Penyusutan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Tanggal Mulai Penyusutan
              </label>
              <input
                type="date"
                name="tanggalMulaiPenyusutan"
                value={form.tanggalMulaiPenyusutan}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 transition"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Akun Aset Tetap */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Akun Aset Tetap
              </label>
              <Select
                options={coaOptions}
                value={coaOptions.find(opt => opt.value === form.akunAsetTetap) || null}
                onChange={opt => setForm(prev => ({ ...prev, akunAsetTetap: opt ? opt.value : "" }))}
                isClearable
                placeholder="Pilih Akun Aset Tetap"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                  menu: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    zIndex: 20,
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                    color: state.isSelected ? "#fff" : theme.fontColor,
                    fontFamily: theme.fontFamily,
                    "&:hover": {
                      background: theme.buttonUpdate,
                      color: "#fff",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                }}
              />
            </div>

            {/* Akun Akumulasi Penyusutan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Akun Akumulasi Penyusutan
              </label>
              <Select
                options={coaOptions}
                value={coaOptions.find(opt => opt.value === form.akunAkumulasiPenyusutan) || null}
                onChange={opt => setForm(prev => ({ ...prev, akunAkumulasiPenyusutan: opt ? opt.value : "" }))}
                isClearable
                placeholder="Pilih Akun Akumulasi"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                  menu: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    zIndex: 20,
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                    color: state.isSelected ? "#fff" : theme.fontColor,
                    fontFamily: theme.fontFamily,
                    "&:hover": {
                      background: theme.buttonUpdate,
                      color: "#fff",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                }}
              />
            </div>

            {/* Akun Beban Penyusutan */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Akun Beban Penyusutan
              </label>
              <Select
                options={coaOptions}
                value={coaOptions.find(opt => opt.value === form.akunBebanPenyusutan) || null}
                onChange={opt => setForm(prev => ({ ...prev, akunBebanPenyusutan: opt ? opt.value : "" }))}
                isClearable
                placeholder="Pilih Akun Beban"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                  menu: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    zIndex: 20,
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                    color: state.isSelected ? "#fff" : theme.fontColor,
                    fontFamily: theme.fontFamily,
                    "&:hover": {
                      background: theme.buttonUpdate,
                      color: "#fff",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                }}
              />
            </div>

            {/* Akun Lawan (Kredit saat posting) */}
            <div>
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Akun Lawan <span className="text-sm text-gray-500">(Kredit saat posting)</span>
              </label>
              <Select
                options={coaOptions}
                value={coaOptions.find(opt => opt.value === form.akunLawan) || null}
                onChange={opt => setForm(prev => ({ ...prev, akunLawan: opt ? opt.value : "" }))}
                isClearable
                placeholder="Pilih Akun (Kas/Bank/Hutang)"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                  menu: (base) => ({
                    ...base,
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    zIndex: 20,
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                    color: state.isSelected ? "#fff" : theme.fontColor,
                    fontFamily: theme.fontFamily,
                    "&:hover": {
                      background: theme.buttonUpdate,
                      color: "#fff",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }),
                }}
              />
            </div>

            {/* Keterangan */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block mb-1 font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={form.keterangan}
                onChange={handleChange}
                rows="3"
                className="w-full border rounded-lg px-4 py-2 transition"
                placeholder="Keterangan tambahan"
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                }}
              />
            </div>

            {/* Checkbox Aktif */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="aktif"
                checked={form.aktif}
                onChange={handleChange}
                id="aktif"
                className="rounded"
              />
              <label htmlFor="aktif" className="font-semibold" 
                     style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Aktif
              </label>
            </div>

            {error && (
              <div className="md:col-span-2 lg:col-span-3">
                <div className="text-red-500 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Tombol Submit */}
          <div className="mt-6 flex gap-2 justify-end">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold transition"
              style={{
                background: theme.buttonSimpan,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
            >
              {editId ? 'Update' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 rounded-lg font-semibold transition"
              style={{
                background: theme.buttonRefresh,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
            >
              Kosongkan
            </button>
            {editId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 rounded-lg font-semibold transition"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* Tabel Data */}
      <div className="w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg font-semibold transition print:hidden"
            type="button"
            style={{
              background: theme.buttonSimpan,
              color: "#fff",
              fontFamily: theme.fontFamily,
            }}
          >
            Print
          </button>
        </div>
        
        <div ref={tableRef} style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="w-full border rounded-lg text-sm shadow-sm" 
                 style={{ fontFamily: theme.tableFontFamily }}>
            <thead>
              <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                <th className="px-3 py-2 font-semibold border-b">Kode</th>
                <th className="px-3 py-2 font-semibold border-b">Nama Aset</th>
                <th className="px-3 py-2 font-semibold border-b">Kategori</th>
                <th className="px-3 py-2 font-semibold border-b">Tanggal Perolehan</th>
                <th className="px-3 py-2 font-semibold border-b">Harga Perolehan</th>
                <th className="px-3 py-2 font-semibold border-b text-center">Qty</th>
                <th className="px-3 py-2 font-semibold border-b">Umur (Bulan)</th>
                <th className="px-3 py-2 font-semibold border-b">Nilai Buku</th>
                <th className="px-3 py-2 font-semibold border-b">Metode</th>
                <th className="px-3 py-2 font-semibold border-b">Status</th>
                <th className="px-3 py-2 font-semibold border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" 
                    style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                  <td className="px-3 py-2">{row.kodeAset}</td>
                  <td className="px-3 py-2">{row.namaAset}</td>
                  <td className="px-3 py-2">{row.kategoriAset || "-"}</td>
                  <td className="px-3 py-2">
                    {row.tanggalPerolehan ? new Date(row.tanggalPerolehan).toLocaleDateString('id-ID') : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.hargaPerolehan ? formatNumber(row.hargaPerolehan) : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">{row.qty ?? 1}</td>
                  <td className="px-3 py-2 text-center">{row.umurEkonomis || "-"}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: theme.buttonSimpan }}>
                    {row.hargaPerolehan ? formatNumber(hitungNilaiBuku(row)) : "-"}
                  </td>
                  <td className="px-3 py-2">{row.metodePenyusutan || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.statusPosting === 'Posted' ? 'bg-green-100 text-green-800' :
                      row.statusPosting === 'Disposed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {row.statusPosting || 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleShowDetail(row)}
                        className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                        style={{
                          background: theme.buttonSimpan,
                          color: "#fff",
                          fontFamily: theme.fontFamily,
                        }}
                      >
                        Detail
                      </button>
                      {row.statusPosting !== 'Disposed' && (
                        <>
                          <button
                            onClick={() => handleShowJualModal(row)}
                            className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                            style={{
                              background: "#f59e0b",
                              color: "#fff",
                              fontFamily: theme.fontFamily,
                            }}
                          >
                            Jual
                          </button>
                          <button
                            onClick={() => handleEdit(row)}
                            className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                            style={{
                              background: theme.buttonUpdate,
                              color: "#fff",
                              fontFamily: theme.fontFamily,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                            style={{
                              background: theme.buttonHapus,
                              color: "#fff",
                              fontFamily: theme.fontFamily,
                            }}
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Penyusutan */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             onClick={() => setShowDetailModal(false)}>
          <div className="rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
               style={{ background: theme.formColor }}
               onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Detail Penyusutan Aset
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-1 rounded-lg font-semibold transition"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                ✕
              </button>
            </div>

            {(() => {
              const detail = hitungDetailPenyusutan(selectedAsset);
              return (
                <div className="space-y-4">
                  {/* Info Aset */}
                  <div className="border-b pb-4" style={{ borderColor: theme.fontColor + '30' }}>
                    <h3 className="font-bold mb-2" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Informasi Aset
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Kode Aset:</span>
                        <p className="font-semibold" style={{ color: theme.fontColor }}>{selectedAsset.kodeAset}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Nama Aset:</span>
                        <p className="font-semibold" style={{ color: theme.fontColor }}>{selectedAsset.namaAset}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Kategori:</span>
                        <p className="font-semibold" style={{ color: theme.fontColor }}>{selectedAsset.kategoriAset || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Metode:</span>
                        <p className="font-semibold" style={{ color: theme.fontColor }}>{selectedAsset.metodePenyusutan}</p>
                      </div>
                    </div>
                  </div>

                  {/* Perhitungan */}
                  <div className="space-y-3">
                    <h3 className="font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Perhitungan Penyusutan
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Harga Perolehan:</span>
                        <p className="font-bold text-lg" style={{ color: theme.fontColor }}>
                          Rp {formatNumber(detail.hargaPerolehan)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Nilai Residu:</span>
                        <p className="font-bold text-lg" style={{ color: theme.fontColor }}>
                          Rp {formatNumber(detail.nilaiResidu)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Masa Manfaat:</span>
                        <p className="font-bold text-lg" style={{ color: theme.fontColor }}>
                          {detail.umurBulan} Bulan ({(detail.umurBulan / 12).toFixed(1)} Tahun)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Bulan Berjalan:</span>
                        <p className="font-bold text-lg" style={{ color: theme.fontColor }}>
                          {detail.bulanBerjalan} Bulan ({(detail.bulanBerjalan / 12).toFixed(1)} Tahun)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Penyusutan/Bulan:</span>
                        <p className="font-bold text-lg" style={{ color: theme.buttonUpdate }}>
                          Rp {formatNumber(detail.penyusutanPerBulan)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Penyusutan/Tahun:</span>
                        <p className="font-bold text-lg" style={{ color: theme.buttonUpdate }}>
                          Rp {formatNumber(detail.penyusutanPerTahun)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                        <span className="text-gray-500">Akumulasi Penyusutan:</span>
                        <p className="font-bold text-lg" style={{ color: theme.buttonHapus }}>
                          Rp {formatNumber(detail.akumulasiPenyusutan)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border-2" style={{ background: theme.buttonSimpan + '20', borderColor: theme.buttonSimpan }}>
                        <span className="text-gray-500">Nilai Buku Saat Ini:</span>
                        <p className="font-bold text-xl" style={{ color: theme.buttonSimpan }}>
                          Rp {formatNumber(detail.nilaiBuku)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                      <span className="text-gray-500">Sisa Umur Ekonomis:</span>
                      <p className="font-bold text-lg" style={{ color: theme.fontColor }}>
                        {detail.sisaBulan} Bulan ({(detail.sisaBulan / 12).toFixed(1)} Tahun)
                      </p>
                    </div>
                  </div>

                  {/* Info Tambahan */}
                  <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: theme.buttonSimpan + '10' }}>
                    <p style={{ color: theme.fontColor }}>
                      <strong>Catatan:</strong> Perhitungan menggunakan metode {selectedAsset.metodePenyusutan}.
                      {detail.sisaBulan === 0 && " Aset telah selesai disusutkan."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Jual Aset */}
      {showJualModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             onClick={() => setShowJualModal(false)}>
          <div className="rounded-xl shadow-2xl p-6 max-w-lg w-full"
               style={{ background: theme.formColor }}
               onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Jual Aset: {selectedAsset.namaAset}
              </h2>
              <button
                onClick={() => setShowJualModal(false)}
                className="px-3 py-1 rounded-lg font-semibold transition"
                style={{
                  background: theme.buttonHapus,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJualAset} className="space-y-4">
              {/* Info Aset */}
              <div className="p-3 rounded-lg" style={{ background: theme.fieldColor }}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Kode:</span>
                    <p className="font-semibold" style={{ color: theme.fontColor }}>{selectedAsset.kodeAset}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nilai Buku:</span>
                    <p className="font-bold text-lg" style={{ color: theme.buttonSimpan }}>
                      Rp {formatNumber(selectedAsset.nilaiBuku || hitungNilaiBuku(selectedAsset))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tanggal Penjualan */}
              <div>
                <label className="block mb-1 font-semibold" 
                       style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Tanggal Penjualan *
                </label>
                <input
                  type="date"
                  value={jualForm.tanggalPenjualan}
                  onChange={(e) => setJualForm(prev => ({ ...prev, tanggalPenjualan: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }}
                />
              </div>

              {/* Harga Jual */}
              <div>
                <label className="block mb-1 font-semibold" 
                       style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Harga Jual *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={jualForm.hargaJual}
                  onChange={(e) => setJualForm(prev => ({ ...prev, hargaJual: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="0.00"
                  required
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }}
                />
              </div>

              {/* Akun Kas */}
              <div>
                <label className="block mb-1 font-semibold" 
                       style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Akun Kas/Bank *
                </label>
                <Select
                  options={coaOptions}
                  value={coaOptions.find(opt => opt.value === jualForm.akunKas) || null}
                  onChange={opt => setJualForm(prev => ({ ...prev, akunKas: opt ? opt.value : "" }))}
                  isClearable
                  placeholder="Pilih Akun Kas"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }),
                    menu: (base) => ({
                      ...base,
                      background: theme.fieldColor,
                      zIndex: 30,
                    }),
                    option: (base, state) => ({
                      ...base,
                      background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                      color: state.isSelected ? "#fff" : theme.fontColor,
                      "&:hover": {
                        background: theme.buttonUpdate,
                        color: "#fff",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: theme.fontColor,
                    }),
                  }}
                />
              </div>

              {/* Akun Laba/Rugi */}
              <div>
                <label className="block mb-1 font-semibold" 
                       style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Akun Laba/Rugi Penjualan Aset *
                </label>
                <Select
                  options={coaOptions}
                  value={coaOptions.find(opt => opt.value === jualForm.akunLabaRugiPenjualan) || null}
                  onChange={opt => setJualForm(prev => ({ ...prev, akunLabaRugiPenjualan: opt ? opt.value : "" }))}
                  isClearable
                  placeholder="Pilih Akun Laba/Rugi"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }),
                    menu: (base) => ({
                      ...base,
                      background: theme.fieldColor,
                      zIndex: 30,
                    }),
                    option: (base, state) => ({
                      ...base,
                      background: state.isSelected ? theme.buttonSimpan : theme.fieldColor,
                      color: state.isSelected ? "#fff" : theme.fontColor,
                      "&:hover": {
                        background: theme.buttonUpdate,
                        color: "#fff",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: theme.fontColor,
                    }),
                  }}
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block mb-1 font-semibold" 
                       style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Keterangan
                </label>
                <textarea
                  value={jualForm.keteranganPenjualan}
                  onChange={(e) => setJualForm(prev => ({ ...prev, keteranganPenjualan: e.target.value }))}
                  rows="3"
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Keterangan penjualan"
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                  }}
                />
              </div>

              {/* Estimasi Laba/Rugi */}
              {jualForm.hargaJual && (
                <div className="p-3 rounded-lg border-2" 
                     style={{ 
                       background: theme.fieldColor,
                       borderColor: parseFloat(jualForm.hargaJual) >= (selectedAsset.nilaiBuku || hitungNilaiBuku(selectedAsset)) 
                         ? theme.buttonSimpan 
                         : theme.buttonHapus
                     }}>
                  <span className="text-gray-500 text-sm">Estimasi Laba/Rugi:</span>
                  <p className="font-bold text-xl" 
                     style={{ 
                       color: parseFloat(jualForm.hargaJual) >= (selectedAsset.nilaiBuku || hitungNilaiBuku(selectedAsset))
                         ? theme.buttonSimpan 
                         : theme.buttonHapus
                     }}>
                    {parseFloat(jualForm.hargaJual) >= (selectedAsset.nilaiBuku || hitungNilaiBuku(selectedAsset)) ? "LABA" : "RUGI"}: 
                    Rp {formatNumber(Math.abs(parseFloat(jualForm.hargaJual) - (selectedAsset.nilaiBuku || hitungNilaiBuku(selectedAsset))))}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowJualModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold"
                  style={{
                    background: theme.buttonRefresh,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-semibold"
                  style={{
                    background: "#f59e0b",
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  Jual Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
