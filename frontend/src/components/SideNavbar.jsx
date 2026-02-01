import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function SideNavbar({ onClose, isOpen = true }) {
  const { theme } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  // State untuk dropdown dan subDropdown
  // Hanya satu dropdown yang bisa terbuka pada satu waktu
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);

  // Tambahkan icon SVG di setiap menu utama - REVISED ICONS
  const navItems = [
    {
      name: "Dashboard",
      to: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: "Transaksi",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-2.25v2.25m3-2.25v2.25m3-2.25v2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      ),
      dropdown: [
        { name: "Akun", to: "/master-data/coa" },
        { name: "Buku Kas", to: "/input-transaksi" },
        { name: "Pembelian", to: "/transaksi/pembelian" },
        { name: "Penjualan", to: "/transaksi/penjualan" },
        {
          name: "Aset Tetap",
          subDropdown: [
            { name: "Master Aset Tetap", to: "/master-data/aset-tetap" },
            { name: "Registrasi Aset", to: "/aset-tetap/registrasi" },
            { name: "Posting ke GL", to: "/aset-tetap/posting-gl" },
            { name: "Hitung Penyusutan", to: "/aset-tetap/penyusutan" },
          ]
        },
      ],
    },
    {
      name: "Jurnal",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      dropdown: [
        { name: "Jurnal Umum", to: "/transaksi/gl" },
        { name: "Jurnal Penyesuaian", to: "/transaksi/AJE" },
        { name: "Riwayat Jurnal" },
      ],
    },
    {
      name: "Buku Besar",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      dropdown: [
        { name: "Neraca Saldo", to: "/laporan/trial-balance" },
        { name: "Buku Besar Utama", to: "/laporan/buku-besar" },
        { name: "Buku Besar Pembantu", to: "/laporan/buku-besar-pembantu" },
        { name: "Pemasok", to: "/master-data/pemasok" },
        { name: "Pembeli", to: "/master-data/pembeli" },
        { name: "Pekerjaan", to: "/master-data/project" },
        { name: "Mata Uang", to: "/master-data/mata-uang" },
        { name: "Pajak", to: "/master-data/pajak" },
      ],
    },
    {
      name: "Persediaan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      dropdown: [
        { name: "Barang Dan Jasa", to: "/master-data/barang-jasa" },
        { name: "Gudang", to: "/master-data/gudang" },
        { name: "Penyesuaian Persediaan", to: "/master-data/penyesuaian-persediaan" },
        { name: "Persediaan", to: "/master-data/persediaan" },
      ],
    },
    {
      name: "Pajak",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
      dropdown: [
        { name: "Kalkulator Pajak" },
        { name: "Proyeksi Pajak" },
        {
          name: "Arsip Pajak",
          subDropdown: [
            { name: "Faktur Pajak" },
            { name: "Bukti Potong Pajak" },
          ],
        },
      ],
    },
    {
      name: "Laporan Keuangan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      ),
      dropdown: [
        { name: "Laba Rugi", to: "/laporan/laba-rugi" },
        { name: "Neraca", to: "/laporan/neraca" },
        { name: "Arus Kas", to: "/laporan/arus-kas" },
        { name: "Perubahan Modal", to: "/laporan/perubahan-modal" },
      ],
    },
    {
      name: "Anggaran",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      dropdown: [
        { name: "Anggaran Tahunan / Bulanan" },
        { name: "Anggaran Dan Realisasi" },
        { name: "Simulasi Pajak Berdasarkan Anggaran" },
      ],
    },
    {
      name: "Pengaturan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
      ),
      dropdown: [
        {
          name: "Profil Perusahaan",
          subDropdown: [
            { name: "Informasi umum", to: "/profil/informasi-umum" },
            { name: "Karyawan", to: "/profil/karyawan" },
          ],
        },
        { name: "Pajak Perusahaan" },
        { name: "Sinkronisasi" },
        { name: "Tampilan", to: "/setting" },
        { name: "Consultant Settings", to: "/consultant-settings" },
      ],
    },
    {
      name: "Bantuan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      ),
      dropdown: [
        { name: "Panduan Pengguna (FAQ)" },
        { name: "Chat Dukungan/ Tiket Masalah" },
        { name: "Kontak CS/ Konsultan Pajak" },
      ],
    },
    {
      name: "Pemberitahuan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      logout();
    }
  };

  return (
    <>
      {/* Placeholder for layout to prevent content overlap */}
      <div
        className={`w-64 hidden md:block flex-shrink-0 transition-all duration-300 ${!isOpen ? '-ml-64' : ''}`}
      />

      {/* Actual Fixed Sidebar */}
      <aside
        className={`w-64 flex flex-col professional-sidebar z-50 shadow-xl transition-transform duration-300 ease-in-out bg-white no-print`}
        style={{
          color: theme.fontColor,
          height: "100vh", /* Fallback */
          minHeight: "100dvh", // Modern CSS
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          borderRight: "1px solid #e2e8f0",
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >

        {/* Header Logo Area - Added per Gull Theme */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-purple-200">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800">Temui</span>
        </div>

        {/* Client Selector moved to Header */}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-section overscroll-contain">
          <nav className="flex flex-col gap-1 px-3 mt-4 pb-4">
            {navItems.map((item, idx) =>
              item.dropdown ? (
                <div key={item.name}>
                  <button
                    type="button"
                    className={`w-full flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition font-medium group ${openDropdown === idx ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600"
                      }`}
                    onClick={() => {
                      setOpenDropdown(openDropdown === idx ? null : idx);
                      setOpenSubDropdown(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon with fixed width for alignment */}
                      <div className={`w-5 h-5 flex items-center justify-center transition-colors ${openDropdown === idx ? "text-purple-600" : "text-gray-400 group-hover:text-purple-500"}`}>
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openDropdown === idx ? "rotate-90 text-purple-600" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {openDropdown === idx && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-purple-100 pl-2">
                      {item.dropdown.map((drop, dropIdx) =>
                        drop.subDropdown ? (
                          <div key={drop.name}>
                            <button
                              type="button"
                              className={`w-full flex justify-between items-center px-3 py-2 rounded-md hover:bg-purple-50 transition text-sm ${openSubDropdown === dropIdx ? "text-purple-700 font-medium bg-purple-50/50" : "text-gray-500 hover:text-purple-600"
                                }`}
                              onClick={() => setOpenSubDropdown(openSubDropdown === dropIdx ? null : dropIdx)}
                            >
                              <span>{drop.name}</span>
                              <svg
                                className={`w-3 h-3 ml-1 transition-transform ${openSubDropdown === dropIdx ? "rotate-90 text-purple-600" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            {openSubDropdown === dropIdx && (
                              <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-purple-100 pl-2">
                                {drop.subDropdown.map((sub) =>
                                  sub.to ? (
                                    <Link
                                      key={sub.to}
                                      to={sub.to}
                                      className={`block px-3 py-2 rounded-md hover:bg-purple-50 transition text-sm ${location.pathname === sub.to ? "text-purple-700 font-semibold" : "text-gray-500 hover:text-purple-600"
                                        }`}
                                      onClick={() => setOpenSubDropdown(null)}
                                    >
                                      {sub.name}
                                    </Link>
                                  ) : (
                                    <span key={sub.name} className="block px-3 py-2 text-gray-400 text-sm">
                                      {sub.name}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ) : drop.to ? (
                          <Link
                            key={drop.to}
                            to={drop.to}
                            className={`block px-3 py-2 rounded-md hover:bg-purple-50 transition text-sm ${location.pathname === drop.to ? "text-purple-700 bg-purple-50 font-semibold border-r-2 border-purple-500" : "text-gray-500 hover:text-purple-600"
                              }`}
                            // Jangan tutup dropdown utama!
                            onClick={() => setOpenSubDropdown(null)}
                          >
                            {drop.name}
                          </Link>
                        ) : (
                          <span key={drop.name} className="block px-3 py-2 text-gray-400 text-sm">
                            {drop.name}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : item.to ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition font-medium group ${location.pathname === item.to ? "bg-purple-50 text-purple-700 font-semibold shadow-sm" : "text-gray-600"
                    }`}
                >
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${location.pathname === item.to ? "text-purple-600" : "text-gray-400 group-hover:text-purple-500"}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ) : (
                <span key={item.name} className="flex items-center gap-3 px-3 py-2 text-gray-600 font-medium">
                  {item.icon}
                  {item.name}
                </span>
              )
            )}
          </nav>
        </div>

        {/* User Menu - Fixed at Bottom with Safe Padding */}

      </aside>
    </>
  );
}