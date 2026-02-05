import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import SideNavbar from "../components/SideNavbar";
import ClientSelector from "../components/ClientSelector";

// Header component definition extracted outside
// Fixed: Force white background, Large Icons (Gull Style), High Contrast
const Header = ({ theme, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header
      className="h-20 flex items-center justify-between px-6 border-b border-gray-100 shadow-sm sticky top-0 z-50 bg-white"
      style={{
        backgroundColor: "#ffffff",
        color: "#333333"
      }}
    >
      <div className="flex items-center gap-4">
        {/* Sidebar toggle button - HUGE & CLEAR */}
        <button
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-200 focus:outline-none shadow-sm"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle Sidebar"
          title="Toggle Menu"
        >
          {/* Hamburger Icon - Bold & Large (32px) */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Brand / Page Title Area */}
        <div className="flex flex-col justify-center h-full">
          <span className="font-bold text-2xl tracking-tight text-gray-800">
            Temui
          </span>
        </div>

        {/* Client Selector for Consultant Mode - Centered in Header */}
        <div className="hidden md:block ml-4">
          <ClientSelector />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Right Icons - Large & High Contrast */}
        <button
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-600 hover:text-purple-600 transition-colors duration-200 hidden sm:flex"
          aria-label="Calendar"
          title="Kalender"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>

        <button
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-600 hover:text-purple-600 transition-colors duration-200 hidden sm:flex"
          aria-label="Note"
          title="Catatan"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </button>

        <button
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-600 hover:text-purple-600 transition-colors duration-200 relative"
          aria-label="Notification"
          title="Notifikasi"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {/* Notification Dot */}
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Divider Vertical */}
        <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

        {/* Interactive User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-gray-700 leading-tight">{user?.name || "User"}</div>
              <div className="text-xs text-gray-500 font-medium">@{user?.username || "Guest"}</div>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-purple-200 transition-all bg-purple-100 text-purple-700 font-bold text-lg"
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                <p className="text-sm font-bold text-gray-800">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500">@{user?.username || "Guest"}</p>
              </div>

              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  Profile Saya
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
                  Settings
                </button>
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default function Layout({ children }) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ background: theme.backgroundColor, minHeight: "100vh" }}>
      {theme.menuPosition === "top" ? (
        <>
          <TopNavbar />
          <main className="p-6 transition-all duration-300 no-print" style={{ background: theme.backgroundColor }}>
            {children}
          </main>
        </>
      ) : (
        <div className="flex h-screen overflow-hidden relative">
          {/* Sidebar Area */}
          <div
            className={`transition-[width] duration-300 flex-shrink-0 no-print ${!sidebarOpen ? 'w-0' : ''}`}
          >
            {/* SideNavbar now handles its own fixed positioning and placeholder */}
            <SideNavbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Main Content Area (Header + Children) */}
          <div className="flex-1 flex flex-col min-w-0 h-full transition-[width] duration-300">
            <div className="no-print flex-shrink-0 z-20 relative">
              <Header theme={theme} setSidebarOpen={setSidebarOpen} />
            </div>
            <main
              className="flex-1 p-6 overflow-y-auto"
              style={{
                background: theme.backgroundColor,
              }}
            >
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}