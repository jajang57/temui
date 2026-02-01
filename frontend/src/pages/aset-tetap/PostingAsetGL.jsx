import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import JournalPreviewModal from "../../components/JournalPreviewModal";

const PostingAsetGL = () => {
  const { theme } = useTheme();
  const [draftAssets, setDraftAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [postedAssets, setPostedAssets] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalNomorTransaksi, setJournalNomorTransaksi] = useState("");

  useEffect(() => {
    fetchDraftAssets();
    fetchPostedAssets();
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
      setDraftAssets(response.data || []);
    } catch (error) {
      console.error("Error fetching draft assets:", error);
    }
    setLoading(false);
  };

  const fetchPostedAssets = async () => {
    try {
      const response = await api.get("/aset-tetap/items");
      const allItems = response.data || [];
      setPostedAssets(allItems.filter(asset => asset.statusPosting === "Posted"));
    } catch (error) {
      console.error("Error fetching posted assets:", error);
    }
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Logic for sorting and pagination
  const sortedDrafts = [...draftAssets].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedDrafts.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedDrafts.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePreview = () => {
    if (selectedAssets.length === 0) {
      alert("Pilih minimal 1 aset untuk preview");
      return;
    }

    const selectedData = draftAssets.filter((asset) =>
      selectedAssets.includes(asset.id)
    );

    const getCoaName = (kode) => {
      const coa = coaList.find(c => c.kode === kode);
      return coa ? coa.nama : "";
    };

    const preview = [];
    selectedData.forEach((asset) => {
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

      // Kredit
      let kreditAkun = "";
      let kreditNamaAkun = "";
      let kreditDeskripsi = "";

      if (asset.kodePembelian) {
        kreditAkun = "Akun Persediaan";
        kreditNamaAkun = "(dari master barang/jasa)";
        kreditDeskripsi = `Posting Aset Tetap - ${asset.namaAset || ""} (Transfer dari Persediaan)`;
      } else {
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

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handlePost = async () => {
    if (selectedAssets.length === 0) return;

    if (!window.confirm(`Anda akan memposting ${selectedAssets.length} aset ke General Ledger. Lanjutkan?`)) return;

    setLoading(true);
    try {
      const response = await api.post("/aset-tetap/post-to-gl", {
        assetIds: selectedAssets,
      });
      alert(response.data.message);
      setSelectedAssets([]);
      setShowPreview(false);
      fetchDraftAssets();
      fetchPostedAssets();
    } catch (error) {
      console.error("Error posting assets:", error);
      alert(error.response?.data?.error || "Gagal posting aset ke GL");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Posting Aset Tetap ke GL</h1>
        <p className="mb-4 text-sm" style={{ color: theme.fontColor }}>
          Pilih aset dengan status Draft untuk diposting ke General Ledger.
        </p>

        {loading ? (
          <p style={{ color: theme.fontColor }}>Memuat data...</p>
        ) : (
          <>
            <div className="rounded-lg shadow-md overflow-x-auto mb-6" style={{ backgroundColor: theme.cardColor }}>
              <table className="min-w-full">
                <thead style={{ backgroundColor: theme.tableHeaderColor, color: theme.fontColor }}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === draftAssets.length && draftAssets.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("kodeAset")}>
                      Kode Aset {sortConfig.key === "kodeAset" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("namaAset")}>
                      Nama Aset {sortConfig.key === "namaAset" ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : "↕️"}
                    </th>
                    <th className="px-4 py-3 text-left">Kategori</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody style={{ color: theme.fontColor }}>
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-3 text-center text-gray-500">
                        Tidak ada aset dengan status Draft
                      </td>
                    </tr>
                  ) : (
                    currentRows.map((asset) => (
                      <tr key={asset.id} className="border-b hover:bg-opacity-50">
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
                        <td className="px-4 py-3 text-right font-semibold">{formatNumber(asset.hargaPerolehan)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Draft</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="p-4 flex justify-between items-center bg-gray-50 text-xs border-t">
                  <div style={{ color: '#666' }}>
                    Menampilkan {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, sortedDrafts.length)} dari {sortedDrafts.length} aset
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 border rounded bg-white">Prev</button>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded">{currentPage}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded bg-white">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mb-12">
              <button
                onClick={handlePreview}
                disabled={selectedAssets.length === 0}
                className="px-6 py-2 rounded text-white disabled:opacity-50"
                style={{ backgroundColor: theme.buttonRefresh }}
              >
                👁️ Preview Jurnal ({selectedAssets.length})
              </button>
              <button
                onClick={handlePost}
                disabled={selectedAssets.length === 0}
                className="px-6 py-2 rounded text-white disabled:opacity-50"
                style={{ backgroundColor: theme.buttonUpdate }}
              >
                📤 Post ke GL ({selectedAssets.length})
              </button>
            </div>

            {postedAssets.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: theme.fontColor }}>Riwayat Posting Aset</h2>
                <div className="rounded-lg shadow-md overflow-x-auto" style={{ backgroundColor: theme.cardColor }}>
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>
                      <tr>
                        <th className="px-4 py-3 text-left">Kode Aset</th>
                        <th className="px-4 py-3 text-left">Nama Aset</th>
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Jurnal</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: theme.fontColor }}>
                      {postedAssets.map((asset) => (
                        <tr key={asset.id} className="border-b">
                          <td className="px-4 py-3">{asset.kodeAset}</td>
                          <td className="px-4 py-3">{asset.namaAset}</td>
                          <td className="px-4 py-3">{asset.tanggalPerolehan}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatNumber(asset.hargaPerolehan)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Posted</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => { setJournalNomorTransaksi(asset.nomorTransaksi); setShowJournalModal(true); }}
                              className="p-1 hover:bg-indigo-100 rounded-full transition-colors"
                              title="Lihat Jurnal"
                            >
                              👁️
                            </button>
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

      <JournalPreviewModal
        open={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        nomorTransaksi={journalNomorTransaksi}
        title="Jurnal Aset Tetap"
      />

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-xl max-w-5xl w-full bg-white max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Preview Jurnal GL</h2>
              <button onClick={() => setShowPreview(false)} className="text-2xl font-bold">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <table className="min-w-full border">
                <thead style={{ backgroundColor: "#f9fafb" }}>
                  <tr>
                    <th className="px-4 py-2 text-left border">Akun</th>
                    <th className="px-4 py-2 text-left border">Nama Akun</th>
                    <th className="px-4 py-2 text-left border">Deskripsi</th>
                    <th className="px-4 py-2 text-right border">Debit</th>
                    <th className="px-4 py-2 text-right border">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((entry, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 border text-sm">{entry.akun}</td>
                      <td className="px-4 py-2 border text-sm">{entry.namaAkun}</td>
                      <td className="px-4 py-2 border text-sm">{entry.deskripsi}</td>
                      <td className="px-4 py-2 text-right border font-semibold">{entry.debit > 0 ? formatNumber(entry.debit) : "-"}</td>
                      <td className="px-4 py-2 text-right border font-semibold">{entry.kredit > 0 ? formatNumber(entry.kredit) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded border">Tutup</button>
              <button
                onClick={() => { setShowPreview(false); handlePost(); }}
                className="px-4 py-2 rounded text-white bg-blue-600"
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
