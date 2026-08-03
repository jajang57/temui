import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../../context/ThemeContext";
import { panduanGroups, getPanduanBySlug } from "./panduanData";

// Mapping nama file markdown (dipakai di tautan antar-dokumen) -> slug internal halaman ini
const FILE_TO_SLUG = {
  "README.md": "overview",
  "dashboard.md": "dashboard",
  "master-coa.md": "master-coa",
  "input-transaksi.md": "input-transaksi",
  "pembelian.md": "pembelian",
  "penjualan.md": "penjualan",
  "master-aset-tetap.md": "master-aset-tetap",
  "registrasi-aset.md": "registrasi-aset",
  "posting-aset-gl.md": "posting-aset-gl",
  "hitung-penyusutan.md": "hitung-penyusutan",
  "jurnal-umum.md": "jurnal-umum",
  "jurnal-penyesuaian-aje.md": "jurnal-penyesuaian-aje",
  "neraca-saldo.md": "neraca-saldo",
  "buku-besar.md": "buku-besar",
  "buku-besar-pembantu.md": "buku-besar-pembantu",
  "master-pemasok.md": "master-pemasok",
  "master-pembeli.md": "master-pembeli",
  "master-project.md": "master-project",
  "master-mata-uang.md": "master-mata-uang",
  "master-pajak.md": "master-pajak",
  "master-barang-jasa.md": "master-barang-jasa",
  "master-gudang.md": "master-gudang",
  "penyesuaian-persediaan.md": "penyesuaian-persediaan",
  "master-persediaan.md": "master-persediaan",
  "laporan-laba-rugi.md": "laba-rugi",
  "neraca.md": "neraca",
  "laporan-arus-kas.md": "arus-kas",
  "laporan-perubahan-modal.md": "perubahan-modal",
  "laporan-fix-asset.md": "fix-asset",
  "informasi-umum.md": "informasi-umum",
  "master-karyawan.md": "master-karyawan",
  "tampilan-setting.md": "tampilan-setting",
  "consultant-settings.md": "consultant-settings",
};

export default function PanduanPengguna() {
  const { theme } = useTheme();
  const [selectedSlug, setSelectedSlug] = useState("overview");
  const [search, setSearch] = useState("");

  const current = useMemo(() => getPanduanBySlug(selectedSlug), [selectedSlug]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return panduanGroups;
    const q = search.toLowerCase();
    return panduanGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) => it.title.toLowerCase().includes(q) || it.content.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [search]);

  const handleLinkClick = (href, e) => {
    if (!href) return;
    const filename = href.split("/").pop();
    if (FILE_TO_SLUG[filename]) {
      e.preventDefault();
      setSelectedSlug(FILE_TO_SLUG[filename]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // link eksternal (http/https) dibiarkan berjalan normal (buka tab baru)
  };

  const border = theme.border || "#e5e7eb";
  const fontColor = theme.fontColor || "#111827";
  const fontFamily = theme.fontFamily || "inherit";
  const bgSecondary = theme.bgSecondary || theme.dropdownColor || "#f3f4f6";
  const cardColor = theme.cardColor || theme.formColor || "#ffffff";
  const accent = theme.buttonRefresh || "#6366f1";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <h1
        className="text-2xl font-bold tracking-tight mb-4 flex-none"
        style={{ color: fontColor, fontFamily }}
      >
        Panduan Pengguna
      </h1>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Sidebar daftar topik */}
        <div
          className="w-full md:w-72 flex-none rounded-xl shadow-lg border overflow-y-auto"
          style={{ borderColor: border, background: cardColor }}
        >
          <div className="p-3 sticky top-0 border-b" style={{ borderColor: border, background: cardColor }}>
            <input
              type="text"
              placeholder="Cari topik atau kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: border, color: fontColor, background: bgSecondary }}
            />
          </div>
          <nav className="p-2">
            {filteredGroups.length === 0 && (
              <p className="text-sm px-3 py-2 opacity-60" style={{ color: fontColor }}>
                Tidak ada topik yang cocok.
              </p>
            )}
            {filteredGroups.map((g) => (
              <div key={g.group} className="mb-3">
                <p
                  className="px-3 py-1 text-xs font-semibold uppercase tracking-wider opacity-60"
                  style={{ color: fontColor }}
                >
                  {g.group}
                </p>
                {g.items.map((item) => {
                  const active = item.slug === selectedSlug;
                  return (
                    <button
                      key={item.slug}
                      onClick={() => {
                        setSelectedSlug(item.slug);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition mb-0.5"
                      style={{
                        color: active ? "#fff" : fontColor,
                        background: active ? accent : "transparent",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Konten markdown */}
        <div
          className="flex-1 rounded-xl shadow-lg border p-6 md:p-8 overflow-y-auto panduan-markdown"
          style={{ borderColor: border, background: cardColor, color: fontColor, fontFamily }}
        >
          {current ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} onClick={(e) => handleLinkClick(href, e)} style={{ color: accent }}>
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse text-sm" style={{ borderColor: border }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th
                    className="border px-3 py-2 text-left font-semibold"
                    style={{ borderColor: border, background: bgSecondary }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border px-3 py-2 align-top" style={{ borderColor: border }}>
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-4 py-1 my-4 text-sm opacity-90"
                    style={{ borderColor: accent }}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 rounded text-[0.85em]"
                    style={{ background: bgSecondary }}
                  >
                    {children}
                  </code>
                ),
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-2 mb-4">{children}</h1>,
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mt-8 mb-3 pb-1 border-b" style={{ borderColor: border }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
              }}
            >
              {current.content}
            </ReactMarkdown>
          ) : (
            <p style={{ color: fontColor }}>Topik tidak ditemukan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
