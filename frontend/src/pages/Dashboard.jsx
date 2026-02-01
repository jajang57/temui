import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";
import { useContext } from "react";
import api from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { AppContext } from "../context/AppContext";

export default function Dashboard() {
  const { theme } = useTheme();
  const { appMode, activeClient, loadingConfig } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearsList, setYearsList] = useState([]);



  // Generate Year List (Current - 5 years)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    setYearsList(years);
  }, []);

  const fetchData = async () => {
    // If loading or in consultant mode and no client selected, don't fetch
    if (loadingConfig || (appMode === 'consultant' && !activeClient)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/dashboard/summary?year=${year}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);

      // Show user-friendly error for consultant mode
      if (appMode === 'consultant') {
        setData({
          error: true,
          message: `Tidak dapat terhubung ke server client "${activeClient?.name}". Pastikan server client sudah berjalan di ${activeClient?.url}`,
          suggestion: "Cek koneksi dengan tombol 'Test' di Consultant Settings"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, activeClient]);

  const COLORS = ["#6366F1", "#F43F5E", "#22C55E", "#F59E42", "#8B5CF6", "#EC4899"];

  if (loadingConfig) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-indigo-500 rounded-full"></div>
          <div className="h-3 w-3 bg-indigo-500 rounded-full"></div>
          <div className="h-3 w-3 bg-indigo-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (appMode === 'consultant' && !activeClient) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        <h2 className="text-xl font-semibold">Ready to Consult</h2>
        <p>Please select a client from the top navigation bar to view their dashboard.</p>
      </div>
    )
  }

  // Show error state if data contains error
  if (data?.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-2xl mx-auto text-center px-4">
        <svg className="w-20 h-20 mb-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Tidak Dapat Terhubung ke Client Server</h2>
        <p className="text-gray-600 mb-2">{data.message}</p>
        <p className="text-sm text-gray-500 mb-6">{data.suggestion}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/consultant-settings'}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Buka Consultant Settings
          </button>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <motion.div
      className="space-y-6 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100" style={{ background: theme.cardColor, borderColor: theme.border }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview keuangan perusahaan periode {year}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: theme.fontColor }}>Tahun:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            style={{ background: theme.fieldColor, color: theme.fontColor }}
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Refresh Data"
            style={{ color: theme.fontColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Revenue (YTD)" amount={data?.kpi?.revenue} color="text-indigo-600" bg="bg-indigo-50" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} theme={theme} />

        <KPICard title="Net Profit (YTD)" amount={data?.kpi?.net_income} color="text-emerald-600" bg="bg-emerald-50" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />} theme={theme} />

        <KPICard title="Cash Balance" amount={data?.kpi?.cash_balance} color="text-blue-600" bg="bg-blue-50" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />} theme={theme} />

        <KPICard title="Total Assets" amount={data?.kpi?.total_assets} color="text-purple-600" bg="bg-purple-50" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />} theme={theme} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl shadow-sm border border-slate-100 p-6" style={{ background: theme.cardColor, borderColor: theme.border }}>
          <h2 className="font-bold text-lg mb-6" style={{ color: theme.fontColor }}>Revenue & Profit Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.trend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.cardColor, borderColor: theme.border, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: theme.fontColor }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
              <Area type="monotone" dataKey="net_income" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="Net Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Composition */}
        <div className="rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col" style={{ background: theme.cardColor, borderColor: theme.border }}>
          <h2 className="font-bold text-lg mb-2" style={{ color: theme.fontColor }}>Asset Composition</h2>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.composition}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {data?.composition?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} layout="horizontal" align="center"
                  payload={
                    data?.composition?.slice(0, 4).map((item, index) => ({
                      id: item.name,
                      type: "square",
                      value: item.name,
                      color: COLORS[index % COLORS.length]
                    }))
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold" style={{ color: theme.fontColor }}>{data?.composition?.length}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Types</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow & Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Bar */}
        <div className="rounded-2xl shadow-sm border border-slate-100 p-6" style={{ background: theme.cardColor, borderColor: theme.border }}>
          <h2 className="font-bold text-lg mb-6" style={{ color: theme.fontColor }}>Cash Flow Activities</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.cashflow} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme.border} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: theme.fontColor, fontSize: 13, fontWeight: 500 }} />
              <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: theme.cardColor, borderColor: theme.border }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                {data?.cashflow?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#10B981" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats Grid */}
        <div className="rounded-2xl shadow-sm border border-slate-100 p-6" style={{ background: theme.cardColor, borderColor: theme.border }}>
          <h2 className="font-bold text-lg mb-6" style={{ color: theme.fontColor }}>Detailed Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <SummaryItem label="Total Expense" value={data?.kpi?.expense} color="text-red-500" />
            <SummaryItem label="Liabilities" value={data?.kpi?.total_liabilities} color="text-orange-500" />
            <SummaryItem label="Equity" value={data?.kpi?.total_equity} color="text-blue-500" />
            <SummaryItem label="Net Margin" value={data?.kpi?.revenue ? ((data.kpi.net_income / data.kpi.revenue) * 100).toFixed(1) + "%" : "0%"} color="text-emerald-500" isText />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KPICard({ title, amount, color, bg, icon, theme }) {
  const formatted = new Intl.NumberFormat('id-ID').format(amount || 0);
  return (
    <div className="rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md" style={{ background: theme.cardColor, borderColor: theme.border }}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        {/* Optional Trend indicator could go here */}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <h2 className={`text-2xl font-bold ${color}`} style={{ fontFamily: theme.fontFamily }}>
          <span className="text-sm font-normal text-gray-400 mr-1">Rp</span>
          {formatted}
        </h2>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, color, isText = false }) {
  const formatted = isText ? value : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{formatted}</div>
    </div>
  );
}