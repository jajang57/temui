import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    CircularProgress,
    Divider,
} from '@mui/material';
import { Close as CloseIcon, ReceiptLong as ReceiptIcon } from '@mui/icons-material';
import api from '../utils/api';

const JournalPreviewModal = ({ open, onClose, nomorTransaksi, title = "Journal Preview" }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coaList, setCoaList] = useState([]);

    // Fetch Master COA for name resolution
    useEffect(() => {
        api.get("/master-coa")
            .then(res => {
                setCoaList(res.data.data || res.data || []);
            })
            .catch(err => console.error("Error fetching master COA:", err));
    }, []);

    useEffect(() => {
        if (open && nomorTransaksi) {
            fetchJournal();
        }
    }, [open, nomorTransaksi]);

    const fetchJournal = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/gl?nomor_transaksi=${encodeURIComponent(nomorTransaksi)}`);
            setData(response.data || []);
        } catch (err) {
            console.error("Error fetching journal:", err);
            setError("Gagal mengambil data jurnal.");
        } finally {
            setLoading(false);
        }
    };

    const getCoaName = (kode) => {
        if (!kode || coaList.length === 0) return kode;
        const found = coaList.find(c => String(c.kode) === String(kode));
        return found ? `(${found.kode}) ${found.nama}` : kode;
    };

    const totalDebit = data.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalKredit = data.reduce((sum, item) => sum + (item.kredit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01;

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', md: '800px' },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflow: 'auto',
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                        <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h2">
                            {title} - {nomorTransaksi}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" textAlign="center" py={4}>
                        {error}
                    </Typography>
                ) : data.length === 0 ? (
                    <Typography textAlign="center" py={4} color="text.secondary">
                        Tidak ada data jurnal ditemukan untuk transaksi ini.
                    </Typography>
                ) : (
                    <>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Tanggal</TableCell>
                                        <TableCell>No. Jurnal</TableCell>
                                        <TableCell>Akun</TableCell>
                                        <TableCell>Deskripsi</TableCell>
                                        <TableCell align="right">Debit</TableCell>
                                        <TableCell align="right">Kredit</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.map((row, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {new Date(row.tanggal).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {row.nomorJurnal || '-'}
                                            </TableCell>
                                            <TableCell>{getCoaName(row.akunTransaksi)}</TableCell>
                                            <TableCell>{row.deskripsi}</TableCell>
                                            <TableCell align="right">
                                                {row.debit > 0 ? row.debit.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.kredit > 0 ? row.kredit.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: 'action.selected' }}>
                                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                                            TOTAL
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totalKredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {!isBalanced && (
                            <Typography color="error" variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                                Peringatan: Jurnal tidak seimbang! (Selisih: {(totalDebit - totalKredit).toLocaleString('id-ID')})
                            </Typography>
                        )}

                        <Box mt={2} display="flex" justifyContent="flex-end">
                            <Typography variant="body2" color="text.secondary">
                                Menampilkan {data.length} baris entri jurnal.
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    );
};

export default JournalPreviewModal;
