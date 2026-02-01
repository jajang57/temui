import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SingleDeviceAlert from "./components/SingleDeviceAlert";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MasterItem from "./pages/master-data/MasterItem";
import MasterCOA from "./pages/master-data/MasterCOA";
import MasterCategoryCOA from "./pages/master-data/MasterCategoryCOA";
import MasterPemasok from "./pages/master-data/MasterPemasok";
import MasterPembeli from "./pages/master-data/MasterPembeli";
import MasterKaryawan from "./pages/master-data/MasterKaryawan";
import MasterProject from "./pages/master-data/MasterProject";
import MasterBarangJasa from "./pages/master-data/MasterBarangJasa";
import MasterAsetTetap from "./pages/master-data/MasterAsetTetap";
import MasterPersediaan from "./pages/master-data/MasterPersediaan";
import MasterGudang from "./pages/master-data/MasterGudang";
import MasterMataUang from "./pages/master-data/MasterMataUang";
import MasterPajak from "./pages/master-data/masterPajak";
import Setting from "./pages/Setting";
import ConsultantSettings from "./pages/ConsultantSettings";
import InformasiUmum from "./pages/profil/InformasiUmum";
import TrialBalance from "./pages/laporan/TrialBalance";
import BukuBesar from "./pages/laporan/BukuBesar";
import BukuBesarUtama from "./pages/laporan/BukuBesarUtama";

import LabaRugi from "./pages/laporan/LabaRugi";
import Neraca from "./pages/laporan/Neraca";
import ArusKas from "./pages/laporan/ArusKas";
import PerubahanModal from "./pages/laporan/PerubahanModal";
import Transaksi from "./pages/Transaksi";
import AJE from "./pages/transaksi/AJE";
import Pembelian from "./pages/transaksi/Pembelian";
import Penjualan from "./pages/transaksi/Penjualan";
import InputTransaksiPage from "./pages/transaksi/InputTransaksiPage";
import TransaksiGL from "./pages/transaksi/AgGridTransaksiGL";
import PenyesuaianPersediaan from "./pages/transaksi/PenyesuaianPersediaan";
import RegistrasiAset from "./pages/aset-tetap/RegistrasiAset";
import PostingAsetGL from "./pages/aset-tetap/PostingAsetGL";
import HitungPenyusutan from "./pages/aset-tetap/HitungPenyusutan";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <SingleDeviceAlert />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/item" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterItem />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/coa" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterCOA />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/mastercatcoa" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterCategoryCOA />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/pemasok" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterPemasok />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/pembeli" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterPembeli />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/project" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterProject />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/karyawan" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterKaryawan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/barang-jasa" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterBarangJasa />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/aset-tetap" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterAsetTetap />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aset-tetap/registrasi" element={
                <ProtectedRoute>
                  <Layout>
                    <RegistrasiAset />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aset-tetap/posting-gl" element={
                <ProtectedRoute>
                  <Layout>
                    <PostingAsetGL />
                  </Layout>
                </ProtectedRoute>
              } />            <Route path="/aset-tetap/penyusutan" element={
                <ProtectedRoute>
                  <Layout>
                    <HitungPenyusutan />
                  </Layout>
                </ProtectedRoute>
              } />            <Route path="/aset-tetap/penyusutan" element={
                <ProtectedRoute>
                  <Layout>
                    <HitungPenyusutan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/persediaan" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterPersediaan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/setting" element={
                <ProtectedRoute>
                  <Layout>
                    <Setting />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/consultant-settings" element={
                <ProtectedRoute>
                  <Layout>
                    <ConsultantSettings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profil/informasi-umum" element={
                <ProtectedRoute>
                  <Layout>
                    <InformasiUmum />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profil/karyawan" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterKaryawan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transaksi" element={
                <ProtectedRoute>
                  <Layout>
                    <Transaksi />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transaksi/AJE" element={
                <ProtectedRoute>
                  <Layout>
                    <AJE />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transaksi/pembelian" element={
                <ProtectedRoute>
                  <Layout>
                    <Pembelian />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transaksi/penjualan" element={
                <ProtectedRoute>
                  <Layout>
                    <Penjualan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/input-transaksi" element={
                <ProtectedRoute>
                  <Layout>
                    <InputTransaksiPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transaksi/gl" element={
                <ProtectedRoute>
                  <Layout>
                    <TransaksiGL />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/trial-balance" element={
                <ProtectedRoute>
                  <Layout>
                    <TrialBalance />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/buku-besar" element={
                <ProtectedRoute>
                  <Layout>
                    <BukuBesar />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/buku-besar-pembantu" element={
                <ProtectedRoute>
                  <Layout>
                    <BukuBesarUtama />
                  </Layout>
                </ProtectedRoute>
              } />


              <Route path="/master-data/penyesuaian-persediaan" element={
                <ProtectedRoute>
                  <Layout>
                    <PenyesuaianPersediaan />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/laporan/laba-rugi" element={
                <ProtectedRoute>
                  <Layout>
                    <LabaRugi />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/neraca" element={
                <ProtectedRoute>
                  <Layout>
                    <Neraca />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/arus-kas" element={
                <ProtectedRoute>
                  <Layout>
                    <ArusKas />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/laporan/perubahan-modal" element={
                <ProtectedRoute>
                  <Layout>
                    <PerubahanModal />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/gudang" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterGudang />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/mata-uang" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterMataUang />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/master-data/pajak" element={
                <ProtectedRoute>
                  <Layout>
                    <MasterPajak />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Catch all route - redirect to login if not authenticated */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}