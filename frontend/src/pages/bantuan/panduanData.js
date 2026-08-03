// Manifest dokumentasi pengguna (Panduan Pengguna).
// Isi markdown diimpor langsung dari folder /docs di root repo (sumber tunggal),
// jadi tidak ada duplikasi konten antara dokumentasi developer dan halaman ini.
// Struktur grup di bawah ini mengikuti struktur menu sidebar aplikasi (SideNavbar.jsx).

import overview from "../../../../docs/README.md?raw";
import dashboard from "../../../../docs/dashboard.md?raw";

import masterCoa from "../../../../docs/master-coa.md?raw";
import inputTransaksi from "../../../../docs/input-transaksi.md?raw";
import pembelian from "../../../../docs/pembelian.md?raw";
import penjualan from "../../../../docs/penjualan.md?raw";
import masterAsetTetap from "../../../../docs/master-aset-tetap.md?raw";
import registrasiAset from "../../../../docs/registrasi-aset.md?raw";
import postingAsetGL from "../../../../docs/posting-aset-gl.md?raw";
import hitungPenyusutan from "../../../../docs/hitung-penyusutan.md?raw";

import jurnalUmum from "../../../../docs/jurnal-umum.md?raw";
import jurnalPenyesuaianAje from "../../../../docs/jurnal-penyesuaian-aje.md?raw";

import neracaSaldo from "../../../../docs/neraca-saldo.md?raw";
import bukuBesar from "../../../../docs/buku-besar.md?raw";
import bukuBesarPembantu from "../../../../docs/buku-besar-pembantu.md?raw";
import masterPemasok from "../../../../docs/master-pemasok.md?raw";
import masterPembeli from "../../../../docs/master-pembeli.md?raw";
import masterProject from "../../../../docs/master-project.md?raw";
import masterMataUang from "../../../../docs/master-mata-uang.md?raw";
import masterPajak from "../../../../docs/master-pajak.md?raw";

import masterBarangJasa from "../../../../docs/master-barang-jasa.md?raw";
import masterGudang from "../../../../docs/master-gudang.md?raw";
import penyesuaianPersediaan from "../../../../docs/penyesuaian-persediaan.md?raw";
import masterPersediaan from "../../../../docs/master-persediaan.md?raw";

import labaRugi from "../../../../docs/laporan-laba-rugi.md?raw";
import neraca from "../../../../docs/neraca.md?raw";
import arusKas from "../../../../docs/laporan-arus-kas.md?raw";
import perubahanModal from "../../../../docs/laporan-perubahan-modal.md?raw";
import fixAsset from "../../../../docs/laporan-fix-asset.md?raw";

import informasiUmum from "../../../../docs/informasi-umum.md?raw";
import masterKaryawan from "../../../../docs/master-karyawan.md?raw";
import tampilanSetting from "../../../../docs/tampilan-setting.md?raw";
import consultantSettings from "../../../../docs/consultant-settings.md?raw";

export const panduanGroups = [
  {
    group: "Ringkasan",
    items: [
      { slug: "overview", title: "Daftar Isi & Alur Kerja", content: overview },
      { slug: "dashboard", title: "Dashboard", content: dashboard },
    ],
  },
  {
    group: "Transaksi",
    items: [
      { slug: "master-coa", title: "Akun (Chart of Accounts)", content: masterCoa },
      { slug: "input-transaksi", title: "Buku Kas (Input Transaksi)", content: inputTransaksi },
      { slug: "pembelian", title: "Pembelian (AP Invoice)", content: pembelian },
      { slug: "penjualan", title: "Penjualan (AR Invoice)", content: penjualan },
      { slug: "master-aset-tetap", title: "Aset Tetap — Master Aset Tetap", content: masterAsetTetap },
      { slug: "registrasi-aset", title: "Aset Tetap — Registrasi Aset", content: registrasiAset },
      { slug: "posting-aset-gl", title: "Aset Tetap — Posting ke GL", content: postingAsetGL },
      { slug: "hitung-penyusutan", title: "Aset Tetap — Hitung Penyusutan", content: hitungPenyusutan },
    ],
  },
  {
    group: "Jurnal",
    items: [
      { slug: "jurnal-umum", title: "Jurnal Umum", content: jurnalUmum },
      { slug: "jurnal-penyesuaian-aje", title: "Jurnal Penyesuaian (AJE)", content: jurnalPenyesuaianAje },
    ],
  },
  {
    group: "Buku Besar",
    items: [
      { slug: "neraca-saldo", title: "Neraca Saldo", content: neracaSaldo },
      { slug: "buku-besar", title: "Buku Besar Utama", content: bukuBesar },
      { slug: "buku-besar-pembantu", title: "Buku Besar Pembantu", content: bukuBesarPembantu },
      { slug: "master-pemasok", title: "Pemasok", content: masterPemasok },
      { slug: "master-pembeli", title: "Pembeli", content: masterPembeli },
      { slug: "master-project", title: "Pekerjaan (Project)", content: masterProject },
      { slug: "master-mata-uang", title: "Mata Uang", content: masterMataUang },
      { slug: "master-pajak", title: "Pajak", content: masterPajak },
    ],
  },
  {
    group: "Persediaan",
    items: [
      { slug: "master-barang-jasa", title: "Barang Dan Jasa", content: masterBarangJasa },
      { slug: "master-gudang", title: "Gudang", content: masterGudang },
      { slug: "penyesuaian-persediaan", title: "Penyesuaian Persediaan", content: penyesuaianPersediaan },
      { slug: "master-persediaan", title: "Persediaan (Laporan Stok)", content: masterPersediaan },
    ],
  },
  {
    group: "Laporan Keuangan",
    items: [
      { slug: "laba-rugi", title: "Laba Rugi", content: labaRugi },
      { slug: "neraca", title: "Neraca", content: neraca },
      { slug: "arus-kas", title: "Arus Kas", content: arusKas },
      { slug: "perubahan-modal", title: "Perubahan Modal", content: perubahanModal },
      { slug: "fix-asset", title: "Fix Asset (History & Summary)", content: fixAsset },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      { slug: "informasi-umum", title: "Profil Perusahaan — Informasi Umum", content: informasiUmum },
      { slug: "master-karyawan", title: "Profil Perusahaan — Karyawan", content: masterKaryawan },
      { slug: "tampilan-setting", title: "Tampilan", content: tampilanSetting },
      { slug: "consultant-settings", title: "Consultant Settings", content: consultantSettings },
    ],
  },
];

export const panduanItemsFlat = panduanGroups.flatMap((g) => g.items);

export function getPanduanBySlug(slug) {
  return panduanItemsFlat.find((item) => item.slug === slug);
}
