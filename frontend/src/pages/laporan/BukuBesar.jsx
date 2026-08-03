import React, { useEffect, useState } from "react";
import { Box, Paper, Grid, TextField, Button, CircularProgress } from "@mui/material";
import ReactSelect from "react-select";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { AiFillFilePdf } from "react-icons/ai";
import { useTheme } from "../../context/ThemeContext";
import ReportLayout from "../../components/ReportLayout";

function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return "-";
  const n = Number(num);
  if (n === 0) return "-";
  return n < 0
    ? `(${Math.abs(n).toLocaleString('id-ID')})`
    : n.toLocaleString('id-ID');
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTransactionType(nomor) {
  if (!nomor) return '';
  const prefix = nomor.split('/')[0];
  const map = {
    CBO: 'Cash Bank Out', CBI: 'Cash Bank In',
    APINV: 'AP Invoice', SINV: 'Sales Invoice',
    JU: 'Journal', OPBAL: 'OB', JV: 'Journal',
  };
  return map[prefix] || prefix;
}

export default function BukuBesar() {
  const { theme } = useTheme();
  const [coaList, setCoaList] = useState([]);
  const [selectedCoa, setSelectedCoa] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortedCoaList = [...coaList].sort((a, b) => a.kode.localeCompare(b.kode));

  useEffect(() => {
    api.get("/master-coa").then(res => setCoaList(res.data || []));
  }, []);

  const fetchData = async () => {
    if (!selectedCoa.length) {
      setError("Pilih minimal satu akun COA terlebih dahulu.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Tanggal awal dan akhir harus diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        selectedCoa.map(async (opt) => {
          const res = await api.get("/buku-besar", {
            params: { coa: opt.value, tanggal_awal: startDate, tanggal_akhir: endDate }
          });
          const rows = res.data || [];
          const saldoAwal = rows[0]?.saldo_awal ?? 0;
          const txns = rows.filter(r => r.tanggal && r.nomorTransaksi);
          const subDebit = txns.reduce((s, r) => s + (r.debit || 0), 0);
          const subKredit = txns.reduce((s, r) => s + (r.kredit || 0), 0);
          return {
            kode: opt.value,
            nama: coaList.find(c => c.kode === opt.value)?.nama || opt.value,
            saldoAwal,
            txns,
            subDebit,
            subKredit,
            closing: saldoAwal + subDebit - subKredit,
          };
        })
      );
      setGroupedData(results);
    } catch {
      setError("Gagal mengambil data Buku Besar.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text("Laporan Buku Besar Utama", 148, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`, 148, 22, { align: 'center' });

    let startY = 30;
    for (const group of groupedData) {
      const body = [
        ['OB', '', '', 'OPENING BALANCE', '-', '-', formatNumber(group.saldoAwal)],
        ...group.txns.map(r => [
          getTransactionType(r.nomorTransaksi), r.nomorTransaksi, formatDate(r.tanggal), r.deskripsi,
          r.debit ? formatNumber(r.debit) : '-', r.kredit ? formatNumber(r.kredit) : '-', '0',
        ]),
        [`Sub Total ${group.nama}`, '', '', '', formatNumber(group.subDebit), formatNumber(group.subKredit), formatNumber(group.subDebit - group.subKredit)],
        [`Closing Balance ${group.nama}`, '', '', '', '-', '-', formatNumber(group.closing)],
      ];
      autoTable(doc, {
        startY,
        head: [[{ content: `${group.kode} - ${group.nama}`, colSpan: 7, styles: { fillColor: [30, 95, 204], halign: 'left' } }],
               ['Tipe', 'Nomor Transaksi', 'Tanggal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo']],
        body,
        headStyles: { fillColor: [30, 136, 229], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: { 3: { cellWidth: 65 }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
        margin: { left: 8, right: 8 },
        didParseCell: (data) => {
          const lastBodyRow = data.table.body.length - 1;
          const secondLastRow = data.table.body.length - 2;
          if (data.section === 'body' && (data.row.index === lastBodyRow || data.row.index === secondLastRow)) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [245, 245, 245];
          }
        },
      });
      startY = (doc.lastAutoTable?.finalY || startY) + 6;
    }
    doc.save("BukuBesarUtama.pdf");
  };

  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    const wsData = [
      ["Laporan Buku Besar Utama", '', '', '', '', '', ''],
      [`Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`, '', '', '', '', '', ''],
      [],
      ['Tipe', 'Nomor Transaksi', 'Tanggal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo'],
    ];
    for (const group of groupedData) {
      wsData.push([`${group.kode} - ${group.nama}`, '', '', '', '', '', '']);
      wsData.push(['OB', '', '', 'OPENING BALANCE', '-', '-', group.saldoAwal]);
      group.txns.forEach(r => wsData.push([
        getTransactionType(r.nomorTransaksi), r.nomorTransaksi, formatDate(r.tanggal), r.deskripsi,
        r.debit || 0, r.kredit || 0, 0,
      ]));
      wsData.push([`Sub Total ${group.nama}`, '', '', '', group.subDebit, group.subKredit, group.subDebit - group.subKredit]);
      wsData.push([`Closing Balance ${group.nama}`, '', '', '', '', '', group.closing]);
      wsData.push([]);
    }
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "BukuBesar");
    xlsx.writeFile(wb, "BukuBesarUtama.xlsx");
  };

  // Shared cell styles
  const th = (align = 'left') => ({
    padding: '8px 12px', fontWeight: 'bold',
    borderBottom: `2px solid ${theme.cardBorderColor || '#e0e0e0'}`,
    background: theme.tableHeaderColor, color: theme.tableFontColor,
    textAlign: align, whiteSpace: 'nowrap', fontFamily: theme.tableFontFamily,
  });
  const td = (align = 'left', extra = {}) => ({
    padding: '5px 12px',
    borderBottom: `1px solid ${theme.cardBorderColor || '#e0e0e0'}`,
    color: theme.tableFontColor, textAlign: align,
    fontFamily: theme.tableFontFamily, ...extra,
  });
  // Cell dengan indentasi untuk baris OB dan transaksi
  const tdi = (align = 'left', extra = {}) => ({
    padding: '5px 12px 5px 32px',
    borderBottom: `1px solid ${theme.cardBorderColor || '#e0e0e0'}`,
    color: theme.tableFontColor, textAlign: align,
    fontFamily: theme.tableFontFamily, ...extra,
  });

  return (
    <ReportLayout>
      <ReportLayout.Header>
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2, background: theme.cardColor }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <ReactSelect
                isMulti
                isClearable
                isSearchable
                placeholder="Pilih Akun COA (bisa lebih dari satu)..."
                options={sortedCoaList.map(coa => ({ value: coa.kode, label: `${coa.kode} - ${coa.nama}` }))}
                value={selectedCoa}
                onChange={val => setSelectedCoa(val || [])}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: b => ({ ...b, zIndex: 9999 }),
                  control: b => ({ ...b, background: theme.fieldColor, borderColor: theme.cardBorderColor, minHeight: 40, fontFamily: theme.fontFamily }),
                  menu: b => ({ ...b, background: theme.cardColor, fontFamily: theme.fontFamily }),
                  option: (b, s) => ({ ...b, background: s.isFocused ? (theme.tableAltRowColor || '#f5f5f5') : theme.cardColor, color: theme.fontColor }),
                  multiValue: b => ({ ...b, background: theme.buttonSimpan || '#1976d2' }),
                  multiValueLabel: b => ({ ...b, color: '#fff', fontSize: 12 }),
                  multiValueRemove: b => ({ ...b, color: '#fff', ':hover': { background: theme.buttonHapus || '#d32f2f' } }),
                  input: b => ({ ...b, color: theme.fontColor }),
                  placeholder: b => ({ ...b, color: theme.fontColor, opacity: 0.5 }),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2.5}>
              <TextField label="Tanggal Awal" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={startDate} onChange={e => setStartDate(e.target.value)}
                sx={{ background: theme.fieldColor }}
                inputProps={{ style: { color: theme.fontColor, fontFamily: theme.fontFamily } }} />
            </Grid>
            <Grid item xs={6} md={2.5}>
              <TextField label="Tanggal Akhir" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true, style: { color: theme.fontColor, fontFamily: theme.fontFamily } }}
                value={endDate} onChange={e => setEndDate(e.target.value)}
                sx={{ background: theme.fieldColor }}
                inputProps={{ style: { color: theme.fontColor, fontFamily: theme.fontFamily } }} />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <Button variant="contained" fullWidth
                sx={{ height: 40, background: theme.buttonSimpan, color: '#fff', fontFamily: theme.fontFamily }}
                onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Tampilkan"}
              </Button>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              <Button onClick={handlePrint} variant="contained" startIcon={<FiPrinter />}
                sx={{ background: theme.buttonSimpan, color: '#fff', fontFamily: theme.fontFamily }}>
                Print Preview
              </Button>
              <Button onClick={handleExportPDF} variant="contained" startIcon={<AiFillFilePdf />}
                sx={{ background: theme.buttonHapus, color: '#fff', fontFamily: theme.fontFamily }}>
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} variant="contained" startIcon={<FaFileExcel />}
                sx={{ background: theme.buttonEdit || '#2e7d32', color: '#fff', fontFamily: theme.fontFamily }}>
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </ReportLayout.Header>

      {error && (
        <Box sx={{ px: 2, py: 1, color: 'error.main', fontFamily: theme.fontFamily }}>{error}</Box>
      )}

      <ReportLayout.Content>
        <Box sx={{ overflow: 'auto', height: '100%' }}>

          {/* Empty state */}
          {groupedData.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 10, color: theme.fontColor, opacity: 0.4, fontFamily: theme.fontFamily }}>
              Pilih akun COA dan periode, lalu klik Tampilkan
            </Box>
          )}

          {/* Grouped Ledger Table */}
          {groupedData.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 150 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 110 }} />
                <col />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 140 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={th()}>Tipe</th>
                  <th style={th()}>Nomor Transaksi</th>
                  <th style={th()}>Tanggal</th>
                  <th style={th()}>Deskripsi</th>
                  <th style={th('right')}>Debit</th>
                  <th style={th('right')}>Kredit</th>
                  <th style={th('right')}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) => (
                  <React.Fragment key={group.kode}>

                    {/* Account Name Header */}
                    <tr>
                      <td colSpan={4} style={{
                        ...td(), color: '#1e5fcc', fontWeight: 'bold', fontSize: 14,
                        paddingTop: 18, paddingBottom: 6, background: theme.cardColor,
                      }}>
                        {group.kode} - {group.nama}
                      </td>
                      <td style={{ ...td('right'), color: '#1e5fcc', background: theme.cardColor, paddingTop: 18 }}>-</td>
                      <td style={{ ...td('right'), color: '#1e5fcc', background: theme.cardColor, paddingTop: 18 }}>-</td>
                      <td style={{ ...td('right'), color: '#1e5fcc', background: theme.cardColor, paddingTop: 18 }}>-</td>
                    </tr>

                    {/* Opening Balance */}
                    <tr style={{ background: theme.tableBodyColor }}>
                      <td style={td()}><span style={{ marginLeft: 24, display: 'inline-block' }}>OB</span></td>
                      <td style={td()}></td>
                      <td style={td()}></td>
                      <td style={td()}>OPENING BALANCE</td>
                      <td style={td('right')}>-</td>
                      <td style={td('right')}>-</td>
                      <td style={{ ...td('right'), fontWeight: 'bold' }}>{formatNumber(group.saldoAwal)}</td>
                    </tr>

                    {/* Transactions */}
                    {group.txns.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? theme.tableBodyColor : (theme.tableAltRowColor || theme.tableBodyColor) }}>
                        <td style={{ ...td(), overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <span style={{ marginLeft: 24, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{getTransactionType(row.nomorTransaksi)}</span>
                        </td>
                        <td style={{ ...td(), color: '#1e5fcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.nomorTransaksi}</td>
                        <td style={{ ...td(), whiteSpace: 'nowrap' }}>{formatDate(row.tanggal)}</td>
                        <td style={{ ...td(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.deskripsi}</td>
                        <td style={td('right')}>{row.debit ? formatNumber(row.debit) : '-'}</td>
                        <td style={td('right')}>{row.kredit ? formatNumber(row.kredit) : '-'}</td>
                        <td style={td('right')}>0</td>
                      </tr>
                    ))}

                    {/* Sub Total */}
                    <tr style={{ background: theme.tableBodyColor }}>
                      <td colSpan={4} style={{ ...td(), fontWeight: 'bold' }}>
                        Sub Total {group.nama}
                      </td>
                      <td style={{ ...td('right'), fontWeight: 'bold' }}>
                        {group.subDebit ? formatNumber(group.subDebit) : '-'}
                      </td>
                      <td style={{ ...td('right'), fontWeight: 'bold' }}>
                        {group.subKredit ? formatNumber(group.subKredit) : '-'}
                      </td>
                      <td style={{ ...td('right'), fontWeight: 'bold' }}>
                        {formatNumber(group.subDebit - group.subKredit)}
                      </td>
                    </tr>

                    {/* Closing Balance */}
                    <tr style={{ background: theme.tableBodyColor, borderBottom: `2px solid ${theme.cardBorderColor || '#ccc'}` }}>
                      <td colSpan={4} style={{ ...td(), fontWeight: 'bold', paddingBottom: 12 }}>
                        Closing Balance {group.nama}
                      </td>
                      <td style={{ ...td('right'), paddingBottom: 12 }}>-</td>
                      <td style={{ ...td('right'), paddingBottom: 12 }}>-</td>
                      <td style={{ ...td('right'), fontWeight: 'bold', paddingBottom: 12 }}>
                        {formatNumber(group.closing)}
                      </td>
                    </tr>

                    {/* Row spacer */}
                    <tr><td colSpan={7} style={{ height: 10, background: theme.backgroundColor || '#fff' }}></td></tr>

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {/* Print-only area */}
          <div className="print-only-area">
            <h1 style={{ textAlign: 'center', fontSize: '16pt', margin: '0 0 4px' }}>Laporan Buku Besar Utama</h1>
            <p style={{ textAlign: 'center', fontSize: '10pt', margin: '0 0 16px' }}>
              Periode: {startDate ? formatDate(startDate) : '-'} s/d {endDate ? formatDate(endDate) : '-'}
            </p>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Nomor Transaksi</th>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Kredit</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) => (
                  <React.Fragment key={group.kode}>
                    <tr className="print-account-header">
                      <td colSpan={4}>{group.kode} - {group.nama}</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                    </tr>
                    <tr>
                      <td>OB</td><td></td><td></td><td>OPENING BALANCE</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right bold">{formatNumber(group.saldoAwal)}</td>
                    </tr>
                    {group.txns.map((row, i) => (
                      <tr key={i}>
                        <td>{getTransactionType(row.nomorTransaksi)}</td>
                        <td>{row.nomorTransaksi}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.tanggal)}</td>
                        <td>{row.deskripsi}</td>
                        <td className="text-right">{row.debit ? formatNumber(row.debit) : '-'}</td>
                        <td className="text-right">{row.kredit ? formatNumber(row.kredit) : '-'}</td>
                        <td className="text-right">0</td>
                      </tr>
                    ))}
                    <tr className="print-subtotal">
                      <td colSpan={4}>Sub Total {group.nama}</td>
                      <td className="text-right">{group.subDebit ? formatNumber(group.subDebit) : '-'}</td>
                      <td className="text-right">{group.subKredit ? formatNumber(group.subKredit) : '-'}</td>
                      <td className="text-right">{formatNumber(group.subDebit - group.subKredit)}</td>
                    </tr>
                    <tr className="print-closing">
                      <td colSpan={4}>Closing Balance {group.nama}</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right bold">{formatNumber(group.closing)}</td>
                    </tr>
                    <tr><td colSpan={7} style={{ height: 6 }}></td></tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Box>
      </ReportLayout.Content>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body * { visibility: hidden; background: white !important; }
          .print-only-area, .print-only-area * { visibility: visible; }
          .print-only-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; font-family: Arial, sans-serif; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .print-table th { background-color: #1e88e5 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 6px 8px; font-size: 9pt; border: 1px solid #1565c0; }
          .print-table td { padding: 4px 6px; font-size: 8.5pt; border: 1px solid #dee2e6; }
          .text-right { text-align: right !important; }
          .bold { font-weight: bold; }
          .print-account-header td { color: #1e5fcc !important; font-weight: bold; font-size: 10pt; background: #eef2ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding-top: 10px; }
          .print-subtotal td, .print-closing td { font-weight: bold; background: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
        }
        .print-only-area { display: none; }
      `}</style>
    </ReportLayout>
  );
}
