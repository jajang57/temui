import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import Select from "react-select";

const RegistrasiAset = () => {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [coaOptions, setCoaOptions] = useState([]);
  
  const [form, setForm] = useState({
    kodeAset: "",
    namaAset: "",
    kategoriAset: "",
    tanggalPerolehan: "",
    hargaPerolehan: 0,
    umurEkonomis: 12,
    nilaiResidu: 0,
    metodePenyusutan: "Garis Lurus",
    tanggalMulaiPenyusutan: "",
    akunAsetTetap: null,
    akunAkumulasiPenyusutan: null,
    akunBebanPenyusutan: null,
    keterangan: "",
    nomorTransaksiPembelian: "",
    kodePembelian: "",
  });

  const kategoriOptions = [
    { value: "Kendaraan", label: "Kendaraan" },
    { value: "Bangunan", label: "Bangunan" },
    { value: "Peralatan", label: "Peralatan" },
    { value: "Mesin", label: "Mesin" },
    { value: "Furniture", label: "Furniture" },
    { value: "Elektronik", label: "Elektronik" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const metodeOptions = [
    { value: "Garis Lurus", label: "Garis Lurus" },
    { value: "Saldo Menurun", label: "Saldo Menurun" },
  ];

  useEffect(() => {
    fetchItems();
    fetchCOA();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get("/aset-tetap/items-for-registration");
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      alert("Gagal memuat data pembelian");
      setItems([]);
    }
    setLoading(false);
  };

  const fetchCOA = async () => {
    try {
      const response = await api.get("/master-coa");
      const options = response.data.map((coa) => ({
        value: coa.kodeCOA,
        label: `${coa.kodeCOA} - ${coa.namaCOA}`,
      }));
      setCoaOptions(options);
    } catch (error) {
      console.error("Error fetching COA:", error);
    }
  };

  const handleDaftarClick = (item) => {
    setSelectedItem(item);
    setForm({
      kodeAset: generateKodeAset(),
      namaAset: item.namaItem,
      kategoriAset: "",
      tanggalPerolehan: item.tanggalPembelian,
      hargaPerolehan: item.totalPrice,
      umurEkonomis: 12,
      nilaiResidu: 0,
      metodePenyusutan: "Garis Lurus",
      tanggalMulaiPenyusutan: "",
      akunAsetTetap: null,
      akunAkumulasiPenyusutan: null,
      akunBebanPenyusutan: null,
      keterangan: `Aset dari pembelian ${item.nomorAPInvoice}`,
      nomorTransaksiPembelian: item.nomorAPInvoice,
      kodePembelian: item.kodeItem,
    });
    setModalOpen(true);
  };

  const generateKodeAset = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `AST${timestamp}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selected) => {
    setForm((prev) => ({ ...prev, [name]: selected }));
  };

  const formatNumber = (num) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const unformatNumber = (str) => {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/,/g, "")) || 0;
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    const numValue = unformatNumber(value);
    setForm((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.kodeAset || !form.namaAset || !form.kategoriAset) {
      alert("Kode Aset, Nama Aset, dan Kategori harus diisi");
      return;
    }

    if (!form.akunAsetTetap || !form.akunAkumulasiPenyusutan || !form.akunBebanPenyusutan) {
      alert("Semua akun COA harus dipilih");
      return;
    }

    const payload = {
      kodeAset: form.kodeAset,
      namaAset: form.namaAset,
      kategoriAset: form.kategoriAset,
      tanggalPerolehan: form.tanggalPerolehan,
      hargaPerolehan: parseFloat(form.hargaPerolehan),
      umurEkonomis: parseInt(form.umurEkonomis),
      nilaiResidu: parseFloat(form.nilaiResidu),
      metodePenyusutan: form.metodePenyusutan,
      tanggalMulaiPenyusutan: form.tanggalMulaiPenyusutan,
      akunAsetTetap: form.akunAsetTetap.value,
      akunAkumulasiPenyusutan: form.akunAkumulasiPenyusutan.value,
      akunBebanPenyusutan: form.akunBebanPenyusutan.value,
      keterangan: form.keterangan,
      nomorTransaksiPembelian: form.nomorTransaksiPembelian,
      kodePembelian: form.kodePembelian,
      statusPosting: "Draft",
      aktif: true,
    };

    try {
      await api.post("/master-aset-tetap", payload);
      alert("Aset berhasil didaftarkan");
      setModalOpen(false);
      fetchItems(); // Refresh list
    } catch (error) {
      console.error("Error registering asset:", error);
      alert(error.response?.data?.error || "Gagal mendaftarkan aset");
    }
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: theme.cardBg || "#ffffff",
      borderColor: theme.borderColor || "#d1d5db",
      color: theme.textColor || "#000000",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme.cardBg || "#ffffff",
      color: theme.textColor || "#000000",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? theme.hoverBg || "#e5e7eb"
        : theme.cardBg || "#ffffff",
      color: theme.textColor || "#000000",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme.textColor || "#000000",
    }),
  };

  // Filter items: show only items NOT yet registered
  const availableItems = (items || []).filter(item => !item.sudahDiregister);
  const registeredItems = (items || []).filter(item => item.sudahDiregister);

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Registrasi Aset Tetap</h1>
        <p className="mb-4 text-sm">
          Daftarkan barang dari pembelian yang ditandai sebagai Aset Tetap ke dalam Master Aset Tetap.
        </p>

        {loading ? (
          <p>Memuat data...</p>
        ) : (
          <>
            {/* Available Items Table */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Belum Didaftarkan ({availableItems.length})</h2>
              <div
                className="rounded-lg shadow-md overflow-x-auto"
                style={{ backgroundColor: theme.cardBg }}
              >
                <table className="min-w-full">
                  <thead style={{ backgroundColor: theme.primaryColor }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-white">No. AP Invoice</th>
                      <th className="px-4 py-3 text-left text-white">Tanggal</th>
                      <th className="px-4 py-3 text-left text-white">Pemasok</th>
                      <th className="px-4 py-3 text-left text-white">Kode Item</th>
                      <th className="px-4 py-3 text-left text-white">Nama Item</th>
                      <th className="px-4 py-3 text-right text-white">Qty</th>
                      <th className="px-4 py-3 text-right text-white">Harga</th>
                      <th className="px-4 py-3 text-right text-white">Total</th>
                      <th className="px-4 py-3 text-center text-white">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-3 text-center text-gray-500">
                          Tidak ada item yang tersedia untuk didaftarkan
                        </td>
                      </tr>
                    ) : (
                      availableItems.map((item) => (
                        <tr
                          key={`${item.pembelianId}-${item.detailId}`}
                          className="border-b hover:bg-opacity-50"
                          style={{ borderColor: theme.borderColor }}
                        >
                          <td className="px-4 py-3">{item.nomorAPInvoice}</td>
                          <td className="px-4 py-3">{item.tanggalPembelian}</td>
                          <td className="px-4 py-3 text-sm">
                            {item.kodePemasok} - {item.namaPemasok}
                          </td>
                          <td className="px-4 py-3">{item.kodeItem}</td>
                          <td className="px-4 py-3">{item.namaItem}</td>
                          <td className="px-4 py-3 text-right">{item.qty}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(item.price)}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatNumber(item.totalPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDaftarClick(item)}
                              className="px-3 py-1 rounded text-white text-sm"
                              style={{
                                backgroundColor: theme.primaryColor,
                              }}
                            >
                              📋 Daftar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered Items Table */}
            {registeredItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Sudah Didaftarkan ({registeredItems.length})</h2>
                <div
                  className="rounded-lg shadow-md overflow-x-auto"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: theme.secondaryColor || "#6b7280" }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-white">No. AP Invoice</th>
                        <th className="px-4 py-3 text-left text-white">Tanggal</th>
                        <th className="px-4 py-3 text-left text-white">Pemasok</th>
                        <th className="px-4 py-3 text-left text-white">Kode Item</th>
                        <th className="px-4 py-3 text-left text-white">Nama Item</th>
                        <th className="px-4 py-3 text-right text-white">Total</th>
                        <th className="px-4 py-3 text-center text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredItems.map((item) => (
                        <tr
                          key={`${item.pembelianId}-${item.detailId}`}
                          className="border-b"
                          style={{ borderColor: theme.borderColor }}
                        >
                          <td className="px-4 py-3">{item.nomorAPInvoice}</td>
                          <td className="px-4 py-3">{item.tanggalPembelian}</td>
                          <td className="px-4 py-3 text-sm">
                            {item.kodePemasok} - {item.namaPemasok}
                          </td>
                          <td className="px-4 py-3">{item.kodeItem}</td>
                          <td className="px-4 py-3">{item.namaItem}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(item.totalPrice)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              ✓ Terdaftar
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-lg shadow-xl max-w-4xl w-full my-8"
            style={{ backgroundColor: theme.cardBg, color: theme.textColor }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: theme.borderColor }}
            >
              <h2 className="text-xl font-bold">Daftar Aset Tetap</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-2xl font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Source Info */}
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme.hoverBg || "#f3f4f6" }}>
                <p className="text-sm">
                  <strong>Sumber:</strong> {selectedItem?.nomorAPInvoice} - {selectedItem?.namaItem}
                </p>
              </div>

              <div className="grid grid-cols-12 gap-3">
                {/* Row 1 */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Kode Aset *</label>
                  <input
                    type="text"
                    name="kodeAset"
                    value={form.kodeAset}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                    required
                  />
                </div>

                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">Nama Aset *</label>
                  <input
                    type="text"
                    name="namaAset"
                    value={form.namaAset}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                    required
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Kategori *</label>
                  <Select
                    options={kategoriOptions}
                    value={kategoriOptions.find((opt) => opt.value === form.kategoriAset)}
                    onChange={(selected) => handleInputChange({ target: { name: "kategoriAset", value: selected.value } })}
                    styles={customSelectStyles}
                    placeholder="Pilih kategori"
                  />
                </div>

                {/* Row 2 */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Tanggal Perolehan</label>
                  <input
                    type="date"
                    name="tanggalPerolehan"
                    value={form.tanggalPerolehan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Harga Perolehan</label>
                  <input
                    type="text"
                    name="hargaPerolehan"
                    value={formatNumber(form.hargaPerolehan)}
                    onChange={handleNumberInput}
                    className="w-full px-3 py-2 border rounded text-right"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Umur Ekonomis (bulan)</label>
                  <input
                    type="number"
                    name="umurEkonomis"
                    value={form.umurEkonomis}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                    min="1"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Nilai Residu</label>
                  <input
                    type="text"
                    name="nilaiResidu"
                    value={formatNumber(form.nilaiResidu)}
                    onChange={handleNumberInput}
                    className="w-full px-3 py-2 border rounded text-right"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  />
                </div>

                {/* Row 3 */}
                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Metode Penyusutan</label>
                  <Select
                    options={metodeOptions}
                    value={metodeOptions.find((opt) => opt.value === form.metodePenyusutan)}
                    onChange={(selected) => handleInputChange({ target: { name: "metodePenyusutan", value: selected.value } })}
                    styles={customSelectStyles}
                    placeholder="Pilih metode"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai Penyusutan</label>
                  <input
                    type="date"
                    name="tanggalMulaiPenyusutan"
                    value={form.tanggalMulaiPenyusutan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  />
                </div>

                <div className="col-span-4"></div>

                {/* Row 4 - COA Fields */}
                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Akun Aset Tetap *</label>
                  <Select
                    options={coaOptions}
                    value={form.akunAsetTetap}
                    onChange={(selected) => handleSelectChange("akunAsetTetap", selected)}
                    styles={customSelectStyles}
                    placeholder="Pilih akun"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Akun Akumulasi Penyusutan *</label>
                  <Select
                    options={coaOptions}
                    value={form.akunAkumulasiPenyusutan}
                    onChange={(selected) => handleSelectChange("akunAkumulasiPenyusutan", selected)}
                    styles={customSelectStyles}
                    placeholder="Pilih akun"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Akun Beban Penyusutan *</label>
                  <Select
                    options={coaOptions}
                    value={form.akunBebanPenyusutan}
                    onChange={(selected) => handleSelectChange("akunBebanPenyusutan", selected)}
                    styles={customSelectStyles}
                    placeholder="Pilih akun"
                  />
                </div>

                {/* Row 5 - Keterangan */}
                <div className="col-span-12">
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <textarea
                    name="keterangan"
                    value={form.keterangan}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border"
                  style={{
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-white"
                  style={{
                    backgroundColor: theme.primaryColor,
                  }}
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrasiAset;
