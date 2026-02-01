import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import MasterButton from '../master_fn/MasterButton';

export default function ConsultantSettings() {
    const { appMode } = useContext(AppContext);
    const [clients, setClients] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [backupFiles, setBackupFiles] = useState([]);
    const [editingClient, setEditingClient] = useState(null);
    const [showMasterRestoreModal, setShowMasterRestoreModal] = useState(false);
    const [masterBackupFiles, setMasterBackupFiles] = useState([]);
    const [theme, setTheme] = useState({ pgBinPath: '' });
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        url: '',
        dbHost: 'localhost',
        dbPort: '5432',
        dbName: '',
        dbUser: '',
        dbPassword: ''
    });

    useEffect(() => {
        if (appMode === 'consultant') {
            fetchClients();
            fetchTheme();
        }
    }, [appMode]);

    const fetchTheme = async () => {
        try {
            const res = await api.get('/user-theme-setting');
            if (res.data.theme) {
                setTheme(res.data.theme);
            }
        } catch (err) {
            console.error('Failed to fetch theme', err);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/consultant/clients');
            setClients(res.data || []);
        } catch (err) {
            console.error('Failed to fetch clients', err);
        }
    };

    const handleAddClient = () => {
        setFormData({
            id: '',
            name: '',
            url: '',
            dbHost: 'localhost',
            dbPort: '5432',
            dbName: '',
            dbUser: '',
            dbPassword: ''
        });
        setEditingClient(null);
        setShowAddModal(true);
    };

    const handleEditClient = (client) => {
        let dbConfig = {};
        try {
            dbConfig = client.dbConfig ? JSON.parse(client.dbConfig) : {};
        } catch (e) {
            console.error('Failed to parse dbConfig', e);
        }

        setFormData({
            id: client.id,
            name: client.name,
            url: client.url,
            dbHost: dbConfig.host || 'localhost',
            dbPort: dbConfig.port || '5432',
            dbName: dbConfig.database || '',
            dbUser: dbConfig.user || '',
            dbPassword: dbConfig.password || ''
        });
        setEditingClient(client);
        setShowAddModal(true);
    };

    const handleSaveClient = async () => {
        try {
            const dbConfig = JSON.stringify({
                host: formData.dbHost,
                port: formData.dbPort,
                database: formData.dbName,
                user: formData.dbUser,
                password: formData.dbPassword
            });

            const clientData = {
                id: formData.id,
                name: formData.name,
                url: formData.url,
                dbConfig: dbConfig
            };

            if (editingClient) {
                await api.put(`/consultant/clients/${formData.id}`, clientData);
                alert('Client berhasil diupdate!');
            } else {
                await api.post('/consultant/clients', clientData);
                alert('Client berhasil ditambahkan!');
            }
            setShowAddModal(false);
            fetchClients();
        } catch (err) {
            alert('Gagal menyimpan client: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (!confirm('Yakin ingin menghapus client ini?')) return;
        try {
            await api.delete(`/consultant/clients/${clientId}`);
            alert('Client berhasil dihapus!');
            fetchClients();
        } catch (err) {
            alert('Gagal menghapus client: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleTestConnection = async (clientId) => {
        try {
            await api.get(`/consultant/clients/${clientId}/test-connection`);
            alert('✅ Koneksi berhasil!');
        } catch (err) {
            alert('❌ Koneksi gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleBackupDatabase = async (clientId) => {
        try {
            const res = await api.post(`/consultant/clients/${clientId}/backup`);
            alert(`Backup berhasil dibuat: ${res.data.filename}`);
        } catch (err) {
            alert('Gagal backup database: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleShowRestore = async (client) => {
        setSelectedClient(client);
        try {
            const res = await api.get(`/consultant/clients/${client.id}/backups`);
            setBackupFiles(res.data || []);
            setShowRestoreModal(true);
        } catch (err) {
            alert('Gagal memuat daftar backup: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleRestoreDatabase = async (backupFile) => {
        if (!confirm(`Yakin ingin restore database client dari backup:\n${backupFile.filename}?`)) return;
        try {
            await api.post(`/consultant/clients/${selectedClient.id}/restore`, {
                backup_file: backupFile.path
            });
            alert('✅ Database berhasil di-restore!');
            setShowRestoreModal(false);
        } catch (err) {
            alert('❌ Gagal restore database: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleMigrateDatabase = async (clientId) => {
        if (!confirm('Yakin ingin migrasi database client ini?')) return;
        try {
            await api.post(`/consultant/clients/${clientId}/migrate`);
            alert('✅ Database berhasil dimigrasi!');
        } catch (err) {
            alert('❌ Gagal migrasi database: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleBackupMaster = async () => {
        try {
            const res = await api.post('/consultant/master-backup');
            alert(`Backup Master berhasil: ${res.data.filename}`);
        } catch (err) {
            alert('Gagal backup master database: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSaveSystemSettings = async () => {
        try {
            await api.post('/user-theme-setting', theme);
            alert('Pengaturan sistem berhasil disimpan!');
        } catch (err) {
            alert('Gagal menyimpan pengaturan: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleShowMasterRestore = async () => {
        try {
            const res = await api.get('/consultant/master-backups');
            setMasterBackupFiles(res.data || []);
            setShowMasterRestoreModal(true);
        } catch (err) {
            alert('Gagal memuat backup master: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleRestoreMaster = async (backupFile) => {
        if (!confirm(`⚠️ PERINGATAN KRITIS ⚠️\n\nRestore Master Database akan menimpa seluruh data utama.\nYakin ingin restore dari:\n${backupFile.filename}?`)) return;
        try {
            await api.post('/consultant/master-restore', {
                backup_file: backupFile.path
            });
            alert('✅ Master Database berhasil di-restore! Silakan refresh halaman.');
            setShowMasterRestoreModal(false);
        } catch (err) {
            alert('❌ Gagal restore master database: ' + (err.response?.data?.error || err.message));
        }
    };

    if (appMode !== 'consultant') {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">Halaman ini hanya tersedia dalam Consultant Mode.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Consultant Settings</h1>
                <div className="flex gap-2">
                    <MasterButton type="simpan" onClick={handleBackupMaster} className="bg-purple-600 hover:bg-purple-700">
                        Backup Master DB
                    </MasterButton>
                    <MasterButton type="simpan" onClick={handleShowMasterRestore} className="bg-green-600 hover:bg-green-700">
                        Restore Master DB
                    </MasterButton>
                    <MasterButton type="simpan" onClick={handleAddClient}>
                        + Tambah Client Baru
                    </MasterButton>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-indigo-600 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left">Client ID</th>
                            <th className="px-6 py-3 text-left">Nama Client</th>
                            <th className="px-6 py-3 text-left">URL Server</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-sm">{client.id}</td>
                                <td className="px-6 py-4 font-semibold">{client.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{client.url}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => handleTestConnection(client.id)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Test</button>
                                        <button onClick={() => handleBackupDatabase(client.id)} className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">Backup</button>
                                        <button onClick={() => handleShowRestore(client)} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Restore</button>
                                        <button onClick={() => handleMigrateDatabase(client.id)} className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">Migrate</button>
                                        <button onClick={() => handleEditClient(client)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">Edit</button>
                                        <button onClick={() => handleDeleteClient(client.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {clients.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Belum ada client terdaftar.</div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingClient ? 'Edit Client' : 'Tambah Client Baru'}</h2>
                        <div className="space-y-4">
                            <input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Client ID" disabled={!!editingClient} />
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Nama Client" />
                            <input type="text" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="URL Server" />
                            <div className="border-t pt-2">
                                <h3 className="font-semibold mb-2">DB Config</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" value={formData.dbHost} onChange={(e) => setFormData({ ...formData, dbHost: e.target.value })} className="border rounded px-3 py-2" placeholder="Host" />
                                    <input type="text" value={formData.dbPort} onChange={(e) => setFormData({ ...formData, dbPort: e.target.value })} className="border rounded px-3 py-2" placeholder="Port" />
                                </div>
                                <input type="text" value={formData.dbName} onChange={(e) => setFormData({ ...formData, dbName: e.target.value })} className="w-full border rounded px-3 py-2 mt-2" placeholder="DB Name" />
                                <input type="text" value={formData.dbUser} onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })} className="w-full border rounded px-3 py-2 mt-2" placeholder="User" />
                                <input type="password" value={formData.dbPassword} onChange={(e) => setFormData({ ...formData, dbPassword: e.target.value })} className="w-full border rounded px-3 py-2 mt-2" placeholder="Password" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <MasterButton type="simpan" onClick={handleSaveClient} className="flex-1">Simpan</MasterButton>
                            <MasterButton type="hapus" onClick={() => setShowAddModal(false)} className="flex-1">Batal</MasterButton>
                        </div>
                    </div>
                </div>
            )}

            {showRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Restore Database - {selectedClient?.name}</h2>
                        <div className="space-y-2">
                            {backupFiles.map((backup, index) => (
                                <div key={index} className="border rounded p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{backup.filename}</p>
                                        <p className="text-sm text-gray-500">Created: {new Date(backup.created_at).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleRestoreDatabase(backup)} className="px-4 py-2 bg-green-500 text-white rounded">Restore</button>
                                </div>
                            ))}
                        </div>
                        <MasterButton type="hapus" onClick={() => setShowRestoreModal(false)} className="w-full mt-6">Tutup</MasterButton>
                    </div>
                </div>
            )}

            {showMasterRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl border-4 border-red-500">
                        <h2 className="text-xl font-bold mb-2 text-red-600">Restore Master Database</h2>
                        <p className="text-red-500 text-sm mb-4">Peringatan: Data Utama akan ditimpa.</p>
                        <div className="space-y-2">
                            {masterBackupFiles.map((backup, index) => (
                                <div key={index} className="border rounded p-4 flex justify-between items-center">
                                    <p className="font-semibold">{backup.filename}</p>
                                    <button onClick={() => handleRestoreMaster(backup)} className="px-4 py-2 bg-red-600 text-white rounded font-bold">RESTORE</button>
                                </div>
                            ))}
                        </div>
                        <MasterButton type="hapus" onClick={() => setShowMasterRestoreModal(false)} className="w-full mt-6">Tutup</MasterButton>
                    </div>
                </div>
            )}
            {/* Global System Settings */}
            <div className="mt-8 bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Global System Settings</h2>
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Path Bin PostgreSQL (pg_dump)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={theme.pgBinPath || ''}
                            onChange={(e) => setTheme({ ...theme, pgBinPath: e.target.value })}
                            placeholder="C:\Program Files\PostgreSQL\16\bin"
                            className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <MasterButton type="simpan" onClick={handleSaveSystemSettings}>
                            Simpan
                        </MasterButton>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Isi path lengkap ke folder <code>bin</code> PostgreSQL jika backup/restore gagal karena file tidak ditemukan.
                    </p>
                </div>
            </div>
        </div>
    );
}
