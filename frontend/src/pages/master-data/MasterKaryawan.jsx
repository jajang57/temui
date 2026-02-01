import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import api from '../../utils/api';
import { toast, Toaster } from 'react-hot-toast';

// Helper function to format numbers
const formatNumber = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID').format(value);
};

const parseNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '');
};

export default function MasterKaryawan() {
  const [karyawanData, setKaryawanData] = useState([]);
  const [formData, setFormData] = useState({
    // Data Pribadi
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'Laki-laki',
    statusPernikahan: 'Belum Menikah',
    // Alamat & Kontak
    alamat: '',
    kota: '',
    kodePos: '',
    noTelepon: '',
    email: '',
    // Informasi Pekerjaan
    departemen: '',
    jabatan: '',
    tanggalMasuk: '',
    statusKaryawan: 'Aktif',
    // Penggajian & Pajak
    gajiPokok: '',
    tunjangan: '',
    noRekening: '',
    namaBank: '',
    npwp: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    fetchKaryawan();
  }, [searchTerm]);

  const fetchKaryawan = async () => {
    try {
      const response = await api.get(`/karyawan?search=${searchTerm}`);
      setKaryawanData(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch karyawan", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.tanggalMasuk) newErrors.tanggalMasuk = 'Tanggal masuk wajib diisi';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'gajiPokok' || name === 'tunjangan') {
      processedValue = parseNumber(value);
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string to clear the input
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    const parsedValue = parseNumber(value);
    if (!isNaN(parsedValue)) {
      // Limit to reasonably large number to prevent overflow/issues
      if (parsedValue.length < 20) {
        setFormData(prev => ({ ...prev, [name]: parseInt(parsedValue) }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Convert dates to ISO or proper format if needed, but backend accepts string for now if formatted correctly
      // Ensure numeric fields are numbers
      const payload = {
        ...formData,
        gajiPokok: Number(formData.gajiPokok),
        tunjangan: Number(formData.tunjangan),
        // Handle Dates: empty string to null or proper format
        tanggalLahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
        tanggalMasuk: formData.tanggalMasuk ? new Date(formData.tanggalMasuk) : null,
      }

      if (editingId) {
        await api.put(`/karyawan/${editingId}`, payload);
        toast.success('Data karyawan berhasil diperbarui');
      } else {
        await api.post('/karyawan', payload);
        toast.success('Karyawan baru berhasil ditambahkan');
      }
      fetchKaryawan();
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (item) => {
    // Format dates for input type="date"
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString().split('T')[0];
    };

    setFormData({
      ...item,
      tanggalLahir: formatDate(item.tanggalLahir),
      tanggalMasuk: formatDate(item.tanggalMasuk),
    });
    setEditingId(item.id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await api.delete(`/karyawan/${id}`);
        toast.success('Data karyawan berhasil dihapus');
        fetchKaryawan();
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      nik: '', nama: '', tempatLahir: '', tanggalLahir: '', jenisKelamin: 'Laki-laki', statusPernikahan: 'Belum Menikah',
      alamat: '', kota: '', kodePos: '', noTelepon: '', email: '',
      departemen: '', jabatan: '', tanggalMasuk: '', statusKaryawan: 'Aktif',
      gajiPokok: '', tunjangan: '', noRekening: '', namaBank: '', npwp: '',
    });
    setEditingId(null);
    setErrors({});
  };

  const filteredData = karyawanData; // Search handled by API

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-gray-900">Master Data Karyawan</h1>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="pribadi" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pribadi">Data Pribadi</TabsTrigger>
                <TabsTrigger value="kontak">Alamat & Kontak</TabsTrigger>
                <TabsTrigger value="pekerjaan">Info Pekerjaan</TabsTrigger>
                <TabsTrigger value="penggajian">Penggajian & Pajak</TabsTrigger>
              </TabsList>

              <TabsContent value="pribadi" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIK *</label>
                    <Input name="nik" value={formData.nik} onChange={handleInputChange} className={errors.nik ? 'border-red-500' : ''} />
                    {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                    <Input name="nama" value={formData.nama} onChange={handleInputChange} className={errors.nama ? 'border-red-500' : ''} />
                    {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <Input name="tempatLahir" value={formData.tempatLahir} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <Input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Pernikahan</label>
                    <select name="statusPernikahan" value={formData.statusPernikahan} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                      <option>Belum Menikah</option>
                      <option>Menikah</option>
                      <option>Cerai</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kontak" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <Input name="alamat" value={formData.alamat} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                    <Input name="kota" value={formData.kota} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                    <Input name="kodePos" value={formData.kodePos} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <Input name="noTelepon" value={formData.noTelepon} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleInputChange} className={errors.email ? 'border-red-500' : ''} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pekerjaan" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                    <Input name="departemen" value={formData.departemen} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                    <Input name="jabatan" value={formData.jabatan} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk *</label>
                    <Input type="date" name="tanggalMasuk" value={formData.tanggalMasuk} onChange={handleInputChange} className={errors.tanggalMasuk ? 'border-red-500' : ''} />
                    {errors.tanggalMasuk && <p className="text-red-500 text-xs mt-1">{errors.tanggalMasuk}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Karyawan</label>
                    <select name="statusKaryawan" value={formData.statusKaryawan} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                      <option>Aktif</option>
                      <option>Tidak Aktif</option>
                      <option>Cuti</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="penggajian" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok</label>
                    <Input name="gajiPokok" value={formatNumber(formData.gajiPokok)} onChange={handleNumericInputChange} placeholder="Rp" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tunjangan</label>
                    <Input name="tunjangan" value={formatNumber(formData.tunjangan)} onChange={handleNumericInputChange} placeholder="Rp" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
                    <Input name="noRekening" value={formData.noRekening} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                    <Input name="namaBank" value={formData.namaBank} onChange={handleInputChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                    <Input name="npwp" value={formData.npwp} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex gap-2 mt-6">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingId ? 'Update' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Data Karyawan</CardTitle>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Cari NIK, nama, jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">NIK</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nama</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Jabatan</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">No. Telepon</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{item.nik}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.nama}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.jabatan}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.noTelepon}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.statusKaryawan}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Hapus</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      Tidak ada data karyawan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Sebelumnya</Button>
              <span className="text-sm text-gray-600">Halaman {currentPage} dari {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Selanjutnya</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
