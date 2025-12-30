import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

const PostingAsetGL = () => {
  const { theme } = useTheme();
  const [draftAssets, setDraftAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [coaList, setCoaList] = useState([]);

  useEffect(() => {
    fetchDraftAssets();
    fetchCOA();
  }, []);

  const fetchCOA = async () => {
    try {
      const response = await api.get("/master-coa");
      setCoaList(response.data || []);
    } catch (error) {
      console.error("Error fetching COA:", error);
    }
  };

  const fetchDraftAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get("/aset-tetap/draft-assets");
      console.log("Draft assets received:", response.data);
      setDraftAssets(response.data || []);
    } catch (error) {
      console.error("Error fetching draft assets:", error);
      alert("Gagal memuat data aset draft");
      setDraftAssets([]);
    }
    setLoading(false);
  };

  const handleCheckboxChange = (assetId) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAssets(draftAssets.map((asset) => asset.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePreview = () => {
    if (selectedAssets.length === 0) {
      alert("Pilih minimal 1 aset untuk preview");
      return;
    }

    const selectedData = draftAssets.filter((asset) =>
      selectedAssets.includes(asset.id)
    );
    
    console.log("Selected assets for preview:", selectedData);

    // Helper function to get COA name
    const getCoaName = (kode) => {
      const coa = coaList.find(c => c.kode === kode);
      return coa ? coa.nama : "";
    };

    const preview = [];
    selectedData.forEach((asset) => {
      console.log("Processing asset:", asset);
      console.log("Akun Aset Tetap:", asset.akunAsetTetap, typeof asset.akunAsetTetap);
      console.log("Akun Lawan:", asset.akunLawan);
      console.log("Kode Pembelian:", asset.kodePembelian);
      
      // Debit: Aset Tetap
      preview.push({
        kodeAset: String(asset.kodeAset || ""),
        namaAset: String(asset.namaAset || ""),
        akun: String(asset.akunAsetTetap || ""),
        namaAkun: getCoaName(asset.akunAsetTetap),
        deskripsi: `Posting Aset Tetap - ${asset.namaAset || ""}`,
        debit: parseFloat(asset.hargaPerolehan) || 0,
        kredit: 0,
      });

      // Kredit: Determine account based on source
      let kreditAkun = "";
      let kreditNamaAkun = "";
      let kreditDeskripsi = "";
      
      if (asset.kodePembelian) {
        // From purchase - use persediaan
        kreditAkun = "Akun Persediaan"; // Backend will resolve actual account
        kreditNamaAkun = "(dari master barang/jasa)";
        kreditDeskripsi = `Posting Aset Tetap - ${asset.namaAset || ""} (Transfer dari Persediaan)`;
      } else {
        // Direct input - use akunLawan
        kreditAkun = asset.akunLawan || "Akun Lawan";
        kreditNamaAkun = getCoaName(asset.akunLawan);
        kreditDeskripsi = `Posting Aset Tetap - ${asset.namaAset || ""}`;
      }

      preview.push({
        kodeAset: String(asset.kodeAset || ""),
        namaAset: String(asset.namaAset || ""),
        akun: kreditAkun,
        namaAkun: kreditNamaAkun,
        deskripsi: kreditDeskripsi,
        debit: 0,
        kredit: parseFloat(asset.hargaPerolehan) || 0,
      });
    });
    
    console.log("Preview data:", preview);

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handlePost = async () => {
    if (selectedAssets.length === 0) {
      alert("Pilih minimal 1 aset untuk diposting");
      return;
    }

    if (
      !window.confirm(
        `Anda akan memposting ${selectedAssets.length} aset ke General Ledger. Lanjutkan?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/aset-tetap/post-to-gl", {
        assetIds: selectedAssets,
      });

      alert(response.data.message);
      setSelectedAssets([]);
      setShowPreview(false);
      fetchDraftAssets(); // Refresh list
    } catch (error) {
      console.error("Error posting assets:", error);
      alert(error.response?.data?.error || "Gagal posting aset ke GL");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Posting Aset Tetap ke GL</h1>
        <p className="mb-4 text-sm">
          Pilih aset dengan status Draft untuk diposting ke General Ledger.
        </p>

        {loading ? (
          <p>Memuat data...</p>
        ) : (
          <>
            {/* Main Table */}
            <div
              className="rounded-lg shadow-md overflow-x-auto mb-6"
              style={{ backgroundColor: theme.cardColor }}
            >
              <table className="min-w-full">
                <thead style={{ backgroundColor: theme.tableHeaderColor }}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedAssets.length === draftAssets.length &&
                          draftAssets.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Kode Aset</th>
                    <th className="px-4 py-3 text-left">Nama Aset</th>
                    <th className="px-4 py-3 text-left">Kategori</th>
                    <th className="px-4 py-3 text-left">Tanggal Perolehan</th>
                    <th className="px-4 py-3 text-right">Harga Perolehan</th>
                    <th className="px-4 py-3 text-left">Akun Aset Tetap</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {draftAssets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        Tidak ada aset dengan status Draft
                      </td>
                    </tr>
                  ) : (
                    draftAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="border-b hover:bg-opacity-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => handleCheckboxChange(asset.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">{asset.kodeAset}</td>
                        <td className="px-4 py-3">{asset.namaAset}</td>
                        <td className="px-4 py-3">{asset.kategoriAset}</td>
                        <td className="px-4 py-3">{asset.tanggalPerolehan}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatNumber(asset.hargaPerolehan)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {asset.akunAsetTetap}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePreview}
                disabled={selectedAssets.length === 0}
                className="px-6 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.buttonRefresh,
                }}
              >
                👁️ Preview Jurnal ({selectedAssets.length})
              </button>
              <button
                onClick={handlePost}
                disabled={selectedAssets.length === 0}
                className="px-6 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.buttonUpdate,
                }}
              >
                📤 Post ke GL ({selectedAssets.length})
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-lg shadow-xl max-w-5xl w-full my-8"
            style={{ backgroundColor: theme.formColor }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
            >
              <h2 className="text-xl font-bold">Preview Jurnal GL</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-2xl font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="min-w-full border">
                <thead style={{ backgroundColor: theme.tableHeaderColor }}>
                  <tr>
                    <th className="px-4 py-2 text-left border">
                      Kode Aset
                    </th>
                    <th className="px-4 py-2 text-left border">
                      Akun
                    </th>
                    <th className="px-4 py-2 text-left border">
                      Nama Akun
                    </th>
                    <th className="px-4 py-2 text-left border">
                      Deskripsi
                    </th>
                    <th className="px-4 py-2 text-right border">
                      Debit
                    </th>
                    <th className="px-4 py-2 text-right border">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((entry, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 border">
                        {entry.kodeAset}
                      </td>
                      <td className="px-4 py-2 border text-sm">
                        {entry.akun}
                      </td>
                      <td className="px-4 py-2 border text-sm">
                        {entry.namaAkun}
                      </td>
                      <td className="px-4 py-2 border text-sm">
                        {entry.deskripsi}
                      </td>
                      <td className="px-4 py-2 text-right border font-semibold">
                        {entry.debit > 0 ? formatNumber(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right border font-semibold">
                        {entry.kredit > 0 ? formatNumber(entry.kredit) : "-"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <td colSpan="4" className="px-4 py-2 border font-bold text-right">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right border font-bold">
                      {formatNumber(
                        previewData.reduce((sum, entry) => sum + entry.debit, 0)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right border font-bold">
                      {formatNumber(
                        previewData.reduce((sum, entry) => sum + entry.kredit, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6 p-4 rounded" style={{ backgroundColor: "#f3f4f6" }}>
                <p className="text-sm font-semibold mb-2">Catatan:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Debit: Akun Aset Tetap dari masing-masing aset</li>
                  <li>Kredit: Akun Persediaan dari master barang/jasa</li>
                  <li>Status aset akan berubah dari "Draft" menjadi "Posted"</li>
                  <li>Transaksi ini tidak dapat dibatalkan setelah diposting</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded border hover:bg-gray-100"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handlePost();
                }}
                className="px-4 py-2 rounded text-white"
                style={{
                  backgroundColor: theme.buttonSimpan,
                }}
              >
                Konfirmasi & Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostingAsetGL;
