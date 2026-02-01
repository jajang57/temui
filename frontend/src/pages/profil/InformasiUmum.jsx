import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import api from '../../utils/api';
import { toast, Toaster } from 'react-hot-toast';

export default function InformasiUmum() {
    const [formData, setFormData] = useState({
        nama: '',
        alamat: '',
        noTelepon: '',
        email: '',
        website: '',
        npwp: '',
        logoPath: ''
    });
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/company/profile');
            if (response.data.data) {
                setFormData(response.data.data);
                if (response.data.data.logoPath) {
                    setLogoPreview(import.meta.env.VITE_API_URL + response.data.data.logoPath);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('nama', formData.nama);
        data.append('alamat', formData.alamat);
        data.append('noTelepon', formData.noTelepon);
        data.append('email', formData.email);
        data.append('website', formData.website);
        data.append('npwp', formData.npwp);

        if (fileInputRef.current && fileInputRef.current.files[0]) {
            data.append('logo', fileInputRef.current.files[0]);
        }

        try {
            const response = await api.post('/company/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFormData(response.data.data);
            if (response.data.data.logoPath) {
                setLogoPreview(import.meta.env.VITE_API_URL + response.data.data.logoPath);
            }
            toast.success('Profil perusahaan berhasil disimpan');
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Informasi Umum Perusahaan</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Section */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Logo Perusahaan</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-gray-400 text-sm p-4 text-center">Upload Logo</span>
                                )}
                            </div>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="text-sm"
                            />
                            <p className="text-xs text-gray-500 text-center">
                                Format: JPG, PNG. Max 2MB.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Details Section */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Detail Perusahaan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan *</label>
                                <Input
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Contoh: PT. Maju Jaya"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                <Textarea
                                    name="alamat"
                                    value={formData.alamat}
                                    onChange={handleInputChange}
                                    placeholder="Jl. Raya No. 123, Jakarta..."
                                    className="resize-none h-24"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                                    <Input
                                        name="noTelepon"
                                        value={formData.noTelepon}
                                        onChange={handleInputChange}
                                        placeholder="021-12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="info@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <Input
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        placeholder="www.company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                                    <Input
                                        name="npwp"
                                        value={formData.npwp}
                                        onChange={handleInputChange}
                                        placeholder="00.000.000.0-000.000"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={loading} className="w-full md:w-auto min-w-[120px]">
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
