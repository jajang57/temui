import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';

const HitungPenyusutan = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('belum'); // 'belum', 'sudah', 'semua'
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalAkhir, setTanggalAkhir] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    // Set default tanggal to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setTanggalMulai(firstDay.toISOString().split('T')[0]);
    setTanggalAkhir(lastDay.toISOString().split('T')[0]);
  }, []);

  const handleLoadAssets = async () => {
    if (!tanggalMulai || !tanggalAkhir) {
      alert('Pilih tanggal mulai dan akhir terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/aset-tetap/assets-for-depreciation?tanggalMulai=${tanggalMulai}&tanggalAkhir=${tanggalAkhir}`);
      setAssets(response.data || []);
      setSelectedAssets([]);
    } catch (error) {
      console.error('Error loading assets:', error);
      alert('Gagal memuat data aset');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (assetKey) => {
    console.log('handleSelectAsset called:', assetKey);
    setSelectedAssets(prev => {
      console.log('selectedAssets before:', prev);
      let next;
      if (prev.includes(assetKey)) {
        // Uncheck: cari asset dan uncheck semua periode setelahnya
        const idxDash = assetKey.indexOf('-');
        const id = assetKey.substring(0, idxDash);
        const periode = assetKey.substring(idxDash + 1);
        const assetPeriods = filteredAssets
          .filter(a => String(a.id) === String(id))
          .map(a => String(a.periode))
          .sort();
        const idx = assetPeriods.indexOf(String(periode));
        const toUncheck = assetPeriods.slice(idx);
        console.log('DEBUG UNCHECK:', {id, periode, assetPeriods, idx, toUncheck});
        next = prev.filter(key => {
          const idxDash = key.indexOf('-');
          const kId = key.substring(0, idxDash);
          const kPeriode = key.substring(idxDash + 1);
          const match = (String(kId) === String(id) && toUncheck.includes(String(kPeriode)));
          if (match) console.log('REMOVE:', key);
          return !match;
        });
      } else {
        next = [...prev, assetKey];
      }
      console.log('selectedAssets after:', next);
      return next;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleAssets = assets.filter(asset => !asset.sudahDisusutkan);
      setSelectedAssets(eligibleAssets.map(asset => `${asset.id}-${asset.periode}`));
    } else {
      setSelectedAssets([]);
    }
  };

  const handlePreview = () => {
    if (selectedAssets.length === 0) {
      alert('Pilih minimal satu aset untuk preview');
      return;
    }

    const selectedData = assets.filter(asset => selectedAssets.includes(`${asset.id}-${asset.periode}`));
    
    const journalEntries = [];
    selectedData.forEach(asset => {
      journalEntries.push({
        akun: asset.akunBebanPenyusutan,
        deskripsi: `Penyusutan ${asset.namaAset} - ${asset.periode}`,
        debit: asset.penyusutanBulanan,
        kredit: 0
      });
      journalEntries.push({
        akun: asset.akunAkumulasiPenyusutan,
        deskripsi: `Akumulasi Penyusutan ${asset.namaAset} - ${asset.periode}`,
        debit: 0,
        kredit: asset.penyusutanBulanan
      });
    });

    setPreviewData(journalEntries);
    setShowPreview(true);
  };

  const handlePost = async () => {
    if (selectedAssets.length === 0) {
      alert('Pilih minimal satu aset untuk diposting');
      return;
    }

    const selectedData = assets.filter(asset => selectedAssets.includes(`${asset.id}-${asset.periode}`));
    const confirmation = confirm(`Posting penyusutan untuk ${selectedData.length} periode?`);
    if (!confirmation) return;

    setLoading(true);
    try {
      // Get selected asset details with periode
      const selectedData = assets.filter(asset => selectedAssets.includes(`${asset.id}-${asset.periode}`));
      
      const response = await api.post('/aset-tetap/post-depreciation', {
        assets: selectedData.map(asset => ({
          id: asset.id,
          periode: asset.periode
        }))
      });
      
      alert(response.data.message);
      setShowPreview(false);
      handleLoadAssets();
    } catch (error) {
      console.error('Error posting depreciation:', error);
      alert(error.response?.data?.error || 'Gagal posting penyusutan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalDebit = previewData.reduce((sum, entry) => sum + entry.debit, 0);
  const totalKredit = previewData.reduce((sum, entry) => sum + entry.kredit, 0);

  // Filter assets sesuai status
  let filteredAssets = assets;
  if (filterStatus === 'belum') {
    filteredAssets = assets.filter(asset => !asset.sudahDisusutkan);
  } else if (filterStatus === 'sudah') {
    filteredAssets = assets.filter(asset => asset.sudahDisusutkan);
  }

  return (
    <div className="p-6" style={{ background: theme.backgroundColor, minHeight: '100vh' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.fontColor }}>
          Hitung Penyusutan Aset Tetap
        </h1>
        <p style={{ color: theme.fontColor, opacity: 0.7 }}>Hitung dan posting penyusutan bulanan untuk aset tetap</p>
      </div>

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.fontColor }}>
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{
              borderColor: theme.fontColor + '30',
              backgroundColor: theme.fieldColor,
              color: theme.fontColor
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.fontColor }}>
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={tanggalAkhir}
            onChange={(e) => setTanggalAkhir(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{
              borderColor: theme.fontColor + '30',
              backgroundColor: theme.fieldColor,
              color: theme.fontColor
            }}
          />
        </div>
        <button
          onClick={handleLoadAssets}
          disabled={loading}
          className="px-6 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: loading ? '#999' : theme.buttonSimpan,
            color: "#fff",
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Muat Data Aset'}
        </button>
      </div>

      {assets.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedAssets.length > 0 && selectedAssets.length === filteredAssets.filter(a => !a.sudahDisusutkan).length}
                  disabled={filterStatus === 'sudah'}
                />
                <span style={{ color: theme.fontColor }}>
                  Pilih Semua ({filteredAssets.filter(a => !a.sudahDisusutkan).length} aset belum disusutkan)
                </span>
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                style={{ borderColor: theme.fontColor + '30', backgroundColor: theme.fieldColor, color: theme.fontColor }}
              >
                <option value="belum">Belum Disusutkan</option>
                <option value="sudah">Sudah Disusutkan</option>
                <option value="semua">Semua</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={selectedAssets.length === 0}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: selectedAssets.length === 0 ? '#999' : theme.buttonSimpan,
                  color: "#fff",
                  cursor: selectedAssets.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Preview ({selectedAssets.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border" style={{ borderColor: theme.fontColor + '30', background: theme.formColor }}>
              <thead style={{ backgroundColor: theme.tableHeaderColor, color: theme.fontColor }}>
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Kode Aset</th>
                  <th className="px-4 py-3 text-left">Nama Aset</th>
                  <th className="px-4 py-3 text-left">Kategori</th>
                  <th className="px-4 py-3 text-left">Periode</th>
                  <th className="px-4 py-3 text-right">Harga Perolehan</th>
                  <th className="px-4 py-3 text-right">Akumulasi</th>
                  <th className="px-4 py-3 text-right">Nilai Buku</th>
                  <th className="px-4 py-3 text-right">Penyusutan Bulan Ini</th>
                  <th className="px-4 py-3 text-center">Metode</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => {
                  const assetKey = `${asset.id}-${asset.periode}`;
                  console.log('RENDER ROW:', assetKey, 'checked?', selectedAssets.includes(assetKey), 'selectedAssets:', selectedAssets);
                  let result = asset.sudahDisusutkan ? true : (
                    selectedAssets.includes(assetKey)
                      ? false
                      : filteredAssets.some(a =>
                          a.kodeAset === asset.kodeAset &&
                          a.periode < asset.periode &&
                          !a.sudahDisusutkan &&
                          !selectedAssets.includes(`${a.id}-${a.periode}`)
                        )
                  );
                  console.log('DISABLED?', assetKey, result);
                  return (
                    <tr
                      key={assetKey}
                      className="border-t"
                      style={{
                        borderColor: theme.fontColor + '30',
                        backgroundColor: asset.sudahDisusutkan ? (theme.fontColor + '10') : 'transparent',
                        opacity: asset.sudahDisusutkan ? 0.6 : 1
                      }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(assetKey)}
                          onChange={e => {
                            console.log('Checkbox clicked:', assetKey, e.target.checked);
                            handleSelectAsset(assetKey);
                          }}
                          disabled={result}
                        />
                      </td>
                      <td className="px-4 py-3" style={{ color: theme.fontColor }}>{asset.kodeAset}</td>
                      <td className="px-4 py-3" style={{ color: theme.fontColor }}>{asset.namaAset}</td>
                      <td className="px-4 py-3" style={{ color: theme.fontColor }}>{asset.kategoriAset}</td>
                      <td className="px-4 py-3 text-left" style={{ color: theme.fontColor }}>{asset.periode}</td>
                      <td className="px-4 py-3 text-right" style={{ color: theme.fontColor }}>{formatCurrency(asset.hargaPerolehan)}</td>
                      <td className="px-4 py-3 text-right" style={{ color: theme.fontColor }}>{formatCurrency(asset.akumulasiPenyusutan)}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: theme.fontColor }}>{formatCurrency(asset.nilaiBuku)}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#3b82f6' }}>{formatCurrency(asset.penyusutanBulanan)}</td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: theme.fontColor }}>{asset.metodePenyusutan}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded" style={{ backgroundColor: asset.sudahDisusutkan ? theme.buttonSimpan : theme.buttonHapus, color: '#fff', fontSize: 12 }}>
                          {asset.sudahDisusutkan ? 'Sudah Disusutkan' : 'Belum Disusutkan'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {assets.length === 0 && !loading && (
        <div className="text-center py-12" style={{ color: theme.fontColor, opacity: 0.6 }}>
          Pilih range tanggal dan klik "Muat Data Aset" untuk menampilkan aset yang eligible untuk penyusutan
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme.formColor }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: theme.fontColor }}>
              Preview Jurnal Penyusutan - Periode {tanggalMulai} s/d {tanggalAkhir}
            </h2>

            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border" style={{ borderColor: theme.fontColor + '30' }}>
                <thead style={{ backgroundColor: theme.tableHeaderColor, color: theme.fontColor }}>
                  <tr>
                    <th className="px-4 py-2 text-left">Akun</th>
                    <th className="px-4 py-2 text-left">Deskripsi</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((entry, index) => (
                    <tr key={index} className="border-t" style={{ borderColor: theme.fontColor + '30' }}>
                      <td className="px-4 py-2" style={{ color: theme.fontColor }}>{entry.akun}</td>
                      <td className="px-4 py-2" style={{ color: theme.fontColor }}>{entry.deskripsi}</td>
                      <td className="px-4 py-2 text-right" style={{ color: theme.fontColor }}>
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: theme.fontColor }}>
                        {entry.kredit > 0 ? formatCurrency(entry.kredit) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold" style={{ borderColor: theme.fontColor + '30' }}>
                    <td colSpan="2" className="px-4 py-2 text-right" style={{ color: theme.fontColor }}>TOTAL:</td>
                    <td className="px-4 py-2 text-right" style={{ color: theme.fontColor }}>
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="px-4 py-2 text-right" style={{ color: theme.fontColor }}>
                      {formatCurrency(totalKredit)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center">
                      <span className="font-semibold" style={{ color: totalDebit === totalKredit ? '#10b981' : '#ef4444' }}>
                        {totalDebit === totalKredit ? '✓ Jurnal Balance' : '✗ Jurnal Tidak Balance'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border rounded-lg"
                style={{
                  borderColor: theme.fontColor + '30',
                  backgroundColor: theme.buttonHapus,
                  color: "#fff"
                }}
              >
                Tutup
              </button>
              <button
                onClick={handlePost}
                disabled={loading || totalDebit !== totalKredit}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: (loading || totalDebit !== totalKredit) ? '#999' : theme.buttonSimpan,
                  color: "#fff",
                  cursor: (loading || totalDebit !== totalKredit) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Posting...' : 'Post ke GL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HitungPenyusutan;
