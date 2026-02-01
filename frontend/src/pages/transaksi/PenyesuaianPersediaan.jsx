import React, { useState, useEffect, useMemo } from "react";
import { Box, Button, Typography, Modal, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from "@mui/material";
import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import api from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

const styleModal = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

const fmtNum = (n) => Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
const toDateStr = (d) => {
    const dt = d ? new Date(d) : new Date();
    return dt.toISOString().split('T')[0];
};

export default function PenyesuaianPersediaan() {
    const { theme } = useTheme();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterGudang, setFilterGudang] = useState(null);

    // Modal State
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        tanggal: new Date(),
        noBukti: "",
        gudang: null,
        item: null,
        qtySystem: 0,
        qtyActual: "",
        alasan: "",
        contraAccount: null
    });
    const [loadingStock, setLoadingStock] = useState(false);

    // Options
    const [itemOptions, setItemOptions] = useState([]);
    const [gudangOptions, setGudangOptions] = useState([]);
    const [coaOptions, setCoaOptions] = useState([]);

    useEffect(() => {
        loadOptions();
        loadAdjustments();
    }, []);

    const loadOptions = async () => {
        try {
            const [iRes, gRes, cRes] = await Promise.all([
                api.get("/master-barang-jasa", { params: { aktif: true } }),
                api.get("/master-gudang", { params: { aktif: true } }),
                api.get("/master-coa")
            ]);
            setItemOptions((iRes.data?.data || iRes.data || []).map(x => ({ value: x.kode, label: `${x.kode} - ${x.nama}` })));
            setGudangOptions((gRes.data?.data || gRes.data || []).map(x => ({ value: x.id, label: x.nama })));

            // Filter COA for relevant accounts (Expenses 5xxx, 6xxx, Other Income 8xxx, etc.) or just all valid transaction accounts
            const allCoa = cRes.data?.data || cRes.data || [];
            // Optional: Filter logic if needed, for now show all non-header accounts
            setCoaOptions(allCoa.filter(c => c.header !== 'Y').map(x => ({ value: x.id, label: `${x.kode} - ${x.nama}` })));

        } catch (e) {
            console.error(e);
        }
    };

    const loadAdjustments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterGudang) params.gudangId = filterGudang.value;
            const res = await api.get("/adjustment", { params });
            setRows(res.data?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch System Qty when Item/Gudang changes in form
    useEffect(() => {
        if (formData.gudang && formData.item) {
            fetchCurrentStock(formData.item.value, formData.gudang.value);
        }
    }, [formData.gudang, formData.item]);

    const fetchCurrentStock = async (itemCode, gudangId) => {
        setLoadingStock(true);
        try {
            const res = await api.get("/persediaan/summary", { params: { itemCode, gudangId, endDate: toDateStr(new Date()) } });
            const data = res.data?.data;
            const stock = Array.isArray(data) && data.length > 0 ? data[0].saldoAkhirQty : 0;
            setFormData(prev => ({ ...prev, qtySystem: stock }));
        } catch (e) {
            console.error(e);
            setFormData(prev => ({ ...prev, qtySystem: 0 }));
        } finally {
            setLoadingStock(false);
        }
    };

    const [editId, setEditId] = useState(null);

    const handleCreate = async () => {
        if (!formData.gudang || !formData.item || formData.qtyActual === "") {
            alert("Mohon lengkapi data");
            return;
        }

        try {
            const payload = {
                tanggal: formData.tanggal,
                gudangId: formData.gudang.value,
                itemCode: formData.item.value,
                qtySystem: Number(formData.qtySystem),
                qtyActual: Number(formData.qtyActual),
                alasan: formData.alasan,
                contraAccountId: formData.contraAccount ? formData.contraAccount.value : null
            };

            if (editId) {
                await api.put(`/adjustment/${editId}`, payload);
            } else {
                await api.post("/adjustment", payload);
            }

            setOpen(false);
            setEditId(null);
            loadAdjustments();
            alert("Penyesuaian berhasil disimpan");
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan: " + (e.response?.data?.error || e.message));
        }
    };

    const handleEdit = (row) => {
        setEditId(row.id);
        setFormData({
            tanggal: new Date(row.tanggal),
            noBukti: row.noBukti,
            gudang: row.gudang ? { value: row.gudangID, label: row.gudang.nama } : null,
            item: row.item ? { value: row.itemID, label: row.item.nama } : null,
            qtySystem: row.qtySystem,
            qtyActual: row.qtyActual,
            alasan: row.alasan,
            contraAccount: row.contraAccount ? { value: row.contraAccountID, label: row.contraAccount.nama } : null
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus data ini?")) return;
        try {
            await api.delete(`/adjustment/${id}`);
            loadAdjustments();
        } catch (e) {
            alert("Gagal hapus");
        }
    }

    const columns = [
        { field: "noBukti", headerName: "No Bukti", width: 150 },
        { field: "tanggal", headerName: "Tanggal", width: 120, valueFormatter: (p) => toDateStr(p.value) },
        { field: "gudang", headerName: "Gudang", width: 150, renderCell: (p) => p.row.gudang?.nama || "-" },
        { field: "item", headerName: "Barang", width: 200, renderCell: (p) => p.row.item?.nama || p.row.itemCode },
        { field: "qtySystem", headerName: "Qty System", width: 100, type: "number" },
        { field: "qtyActual", headerName: "Qty Fisik", width: 100, type: "number" },
        {
            field: "qtyDiff", headerName: "Selisih", width: 100, type: "number", renderCell: (p) => (
                <span style={{ color: p.value < 0 ? 'red' : p.value > 0 ? 'green' : 'black', fontWeight: 'bold' }}>
                    {p.value > 0 ? "+" : ""}{p.value}
                </span>
            )
        },
        { field: "alasan", headerName: "Alasan", flex: 1 },
        { field: "contraAccount", headerName: "Akun Lawan", width: 150, renderCell: (p) => p.row.contraAccount?.nama || "-" },
        {
            field: "actions", headerName: "Aksi", width: 120, renderCell: (p) => (
                <>
                    <IconButton color="primary" onClick={() => handleEdit(p.row)}><FiEdit /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(p.row.id)}><FiTrash2 /></IconButton>
                </>
            )
        }
    ];

    return (
        <Box sx={{ p: 3, background: "#f5f7fa", minHeight: "100vh" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">Penyesuaian Persediaan (Stock Opname)</Typography>
                <Button variant="contained" startIcon={<FiPlus />} onClick={() => {
                    setEditId(null);
                    setFormData({
                        tanggal: new Date(),
                        noBukti: "",
                        gudang: null,
                        item: null,
                        qtySystem: 0,
                        qtyActual: "",
                        alasan: "",
                        contraAccount: null
                    });
                    setOpen(true);
                }}>
                    Buat Penyesuaian
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 300 }}>
                        <label>Filter Gudang</label>
                        <Select options={gudangOptions} value={filterGudang} onChange={setFilterGudang} isClearable placeholder="Semua Gudang" />
                    </Box>
                    <Button variant="outlined" onClick={loadAdjustments} sx={{ mt: 3 }}>Refresh</Button>
                </Box>
            </Paper>

            <div style={{ height: 600, width: "100%", background: "white" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbarQuickFilter }}
                    slotProps={{ toolbar: { showQuickFilter: true } }}
                />
            </div>

            {/* MODAL FORM */}
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box sx={styleModal}>
                    <Typography variant="h6" mb={2}>{editId ? "Edit Penyesuaian" : "Input Penyesuaian Stok"}</Typography>

                    <Box display="grid" gap={2}>
                        <Box>
                            <label style={{ display: 'block', marginBottom: 4 }}>Tanggal</label>
                            <DatePicker
                                selected={formData.tanggal}
                                onChange={(d) => setFormData({ ...formData, tanggal: d })}
                                className="form-control"
                            />
                        </Box>

                        <Box>
                            <label>Gudang</label>
                            <Select
                                options={gudangOptions}
                                value={formData.gudang}
                                onChange={(v) => setFormData({ ...formData, gudang: v })}
                            />
                        </Box>

                        <Box>
                            <label>Barang</label>
                            <Select
                                options={itemOptions}
                                value={formData.item}
                                onChange={(v) => setFormData({ ...formData, item: v })}
                            />
                        </Box>

                        <Box display="flex" gap={2}>
                            <TextField
                                label="Qty System (Otomatis)"
                                value={loadingStock ? "Loading..." : formData.qtySystem}
                                fullWidth
                                inputProps={{ readOnly: true }}
                                variant="filled"
                            />
                            <TextField
                                label="Qty Fisik (Actual)"
                                type="number"
                                value={formData.qtyActual}
                                onChange={(e) => setFormData({ ...formData, qtyActual: e.target.value })}
                                fullWidth
                                autoFocus
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" color={
                                (Number(formData.qtyActual || 0) - formData.qtySystem) < 0 ? "error" : "success"
                            } fontWeight="bold">
                                Selisih: {(Number(formData.qtyActual || 0) - formData.qtySystem)}
                            </Typography>
                        </Box>

                        <TextField
                            label="Alasan / Keterangan"
                            multiline
                            rows={2}
                            value={formData.alasan}
                            onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                            fullWidth
                        />

                        <Box>
                            <label>Akun Lawan (Contra Account)</label>
                            <Select
                                options={coaOptions}
                                value={formData.contraAccount}
                                onChange={(v) => setFormData({ ...formData, contraAccount: v })}
                                placeholder="Pilih Akun (Beban/Pendapatan)"
                            />
                            <Typography variant="caption" color="text.secondary">
                                *Akun yang akan di-Debit/Kredit lawan Persediaan.
                            </Typography>
                        </Box>

                        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                            <Button onClick={() => setOpen(false)}>Batal</Button>
                            <Button variant="contained" onClick={handleCreate} disabled={loadingStock}>Simpan</Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>

        </Box>
    );
}
