/* Dashboard.tsx: Main analytics overview rendering live stats and charts. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { Input, Select } from "../components/ui/Input";
import {
  MousePointerClick,
  ShieldAlert,
  DollarSign,
  Activity,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Monitor,
  Cpu,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Terminal,
  Send,
  X
} from "lucide-react";
import { Offer, Click, DashboardStats } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOffers: 0,
    activeOffers: 0,
    totalClicks: 0,
    filteredTraffic: 0,
    passedTraffic: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalRevenue: 0
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<Click[]>([]);
  const [globalTracking, setGlobalTracking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Traffic Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simFormData, setSimFormData] = useState({
    offerId: "",
    ip: "192.168.12.34",
    country: "US",
    pubId: "AFF-PRO-88",
    subId1: "social_promo",
    subId2: "tracker_test",
    userAgentPreset: "iPhone"
  });

  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // User-agent presets
  const uaPresets = [
    { value: "iPhone", label: "iPhone / Mobile Safari (iOS)" },
    { value: "Android", label: "Samsung Galaxy / Chrome Mobile (Android)" },
    { value: "Desktop", label: "Windows 11 PC / Chrome Desktop" },
    { value: "macOS", label: "Apple MacBook / macOS Safari" },
    { value: "Googlebot", label: "Google Crawler Bot" },
    { value: "Lighthouse", label: "Chrome Lighthouse / PageSpeed Audit" }
  ];

  const getUAByPreset = (preset: string) => {
    switch (preset) {
      case "iPhone":
        return "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
      case "Android":
        return "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36";
      case "macOS":
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15";
      case "Googlebot":
        return "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
      case "Lighthouse":
        return "Mozilla/5.0 (Linux; Android 11; moto g(30)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse";
      default:
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";
    }
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, offersRes, perfRes, geoRes, liveRes, globalRes] = await Promise.all([
        axios.get("/api/stats"),
        axios.get("/api/offers"),
        axios.get("/api/stats/performance"),
        axios.get("/api/stats/geos"),
        axios.get("/api/stats/live"),
        axios.get("/api/global-tracking")
      ]);

      setStats(statsRes.data);
      setOffers(offersRes.data);
      setPerformanceData(perfRes.data);
      setGeoData(geoRes.data);
      setLiveLogs(liveRes.data);
      setGlobalTracking(globalRes.data.globalTracking);

      // Pre-select first offer in simulator if not set
      if (offersRes.data.length > 0 && !simFormData.offerId) {
        setSimFormData(prev => ({ ...prev, offerId: offersRes.data[0]._id }));
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh stats every 8 seconds for a rich live feel
    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleGlobalTrackingToggle = async (active: boolean) => {
    try {
      const res = await axios.post("/api/global-tracking", { active });
      setGlobalTracking(res.data.globalTracking);
      fetchData(true);
    } catch (err) {
      console.error("Error toggling global tracking:", err);
    }
  };



  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simFormData.offerId) {
      alert("Please select a target campaign to simulate.");
      return;
    }

    setSimulating(true);
    setSimResult(null);

    const payload = {
      offerId: simFormData.offerId,
      ip: simFormData.ip,
      country: simFormData.country,
      userAgent: getUAByPreset(simFormData.userAgentPreset),
      pubId: simFormData.pubId,
      subId1: simFormData.subId1,
      subId2: simFormData.subId2
    };

    try {
      const res = await axios.post("/api/simulate", payload);
      // Give it a subtle delay for high quality feeling
      setTimeout(() => {
        setSimResult(res.data);
        setSimulating(false);
        fetchData(true);
      }, 700);
    } catch (err) {
      console.error("Simulation failed:", err);
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Analyzing tracking data nodes...</p>
      </div>
    );
  }

  // Calculate stats pass rate
  const passRate = stats.totalClicks > 0 
    ? ((stats.passedTraffic / stats.totalClicks) * 100).toFixed(1) 
    : "100";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section with live buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Dashboard
            {refreshing && (
              <RefreshCw size={16} className="text-indigo-600 animate-spin" />
            )}
          </h2>
          <p className="text-sm text-slate-500">Real-time traffic overview and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleGlobalTrackingToggle(!globalTracking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer ${
              globalTracking
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${globalTracking ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
            {globalTracking ? "Tracking Live" : "Tracking Paused"}
          </button>

          <Button variant="outline" onClick={() => setShowSimulator(true)} className="gap-2 text-slate-800 bg-slate-50 border-slate-200 hover:bg-slate-100">
            <Activity size={16} />
            Test Click Simulator
          </Button>
        </div>
      </div>

      {/* Metric Cards - 5 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              Total Incoming Traffic
              <MousePointerClick size={14} className="text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalClicks.toLocaleString()}</div>
          </div>
          <div className="text-indigo-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5">100%</span>
            Total registered sessions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              Clean Passed Traffic
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.passedTraffic.toLocaleString()}</div>
          </div>
          <div className="text-emerald-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5">{passRate}%</span>
            Passed routing policy
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              Total Conversions
              <Zap size={14} className="text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalConversions?.toLocaleString() || 0}</div>
          </div>
          <div className="text-indigo-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5">
              {stats.conversionRate?.toFixed(2) || "0.00"}%
            </span>
            Conversion Rate (CR%)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              Filtered & Blocked
              <ShieldAlert size={14} className="text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.filteredTraffic.toLocaleString()}</div>
          </div>
          <div className="text-rose-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-rose-50 px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5">
              {(stats.totalClicks > 0 ? ((stats.filteredTraffic / stats.totalClicks) * 100).toFixed(1) : "0")}%
            </span>
            Bots, Caps or Geo-filtered
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              Campaign Net Revenue
              <DollarSign size={14} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-amber-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5">
              ${stats.totalConversions && stats.totalConversions > 0 ? (stats.totalRevenue / stats.totalConversions).toFixed(2) : "0.00"}
            </span>
            Average payout per conversion
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Graph */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Hourly Traffic Performance</CardTitle>
              <CardDescription>Click volume and revenue generation trends</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {performanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No traffic records in the current window</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#10b981", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)"
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    name="Clicks Logged"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Geos Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Traffic Markets</CardTitle>
              <CardDescription>Highest volume countries mapped</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-between">
            {geoData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Waiting for incoming geos...</div>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={geoData} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}
                      />
                      <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={16}>
                        {geoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#4f46e5" : index === 1 ? "#6366f1" : "#cbd5e1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {geoData.map((g, idx) => (
                    <div key={g.code} className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-indigo-600" : idx === 1 ? "bg-indigo-400" : "bg-slate-300"}`} />
                        <span>{g.name}</span>
                      </div>
                      <span className="text-slate-500">{g.val} clicks ({((g.val / stats.totalClicks) * 100 || 0).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid below: Tracking Ledger (Live clicks) and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Click Stream Ledger - 2 Columns Width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-bold text-slate-800">Live Traffic</h3>
              <p className="text-xs text-slate-500 mt-0.5">Continuous stream of recent clicks</p>
            </div>
            <Badge variant="primary" className="font-semibold bg-indigo-50 border-indigo-100 text-indigo-700">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping mr-1" />
              Live Feed Enabled
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Geo</th>
                  <th className="px-6 py-3">Client Parameters</th>
                  <th className="px-6 py-3 text-right">Routing Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {liveLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No clicks recorded yet. Click "Test Click Simulator" to generate records!
                    </td>
                  </tr>
                ) : (
                  liveLogs.slice(0, 7).map((log) => {
                    const cleanIp = log.ip || "127.0.0.1";
                    const maskedIp = cleanIp.includes(":") 
                      ? cleanIp.substring(0, 12) + "..." 
                      : cleanIp.split(".").slice(0, 2).join(".") + ".x.x";

                    const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    });

                    return (
                      <tr key={log._id} className="hover:bg-slate-50/50 border-b border-slate-100/60 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-xs">{timeStr}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{maskedIp}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800 mr-1.5">{log.country}</span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 text-slate-500 rounded font-medium">{log.device}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                          {log.pubId ? `pub:${log.pubId}` : "direct"}
                          {log.subId1 ? ` | sub1:${log.subId1}` : ""}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant={log.status === "passed" ? "success" : log.status === "filtered" ? "warning" : log.status === "capped" ? "warning" : "danger"}>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center mt-auto">
            <span className="text-slate-500 text-xs font-semibold">Showing up to 7 most recent transactions</span>
          </div>
        </div>

        {/* Event Logs stream on the right */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-1.5">
              <Terminal size={16} className="text-slate-600" />
              Event Telemetry log
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">Tracking controller baseline established</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System online</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${globalTracking ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    Global routing rules is <span className="font-semibold">{globalTracking ? "ACTIVE" : "SUSPENDED"}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Policy Engine</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    Managed offers: <span className="font-semibold">{offers.length} configured</span> campaigns
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registry Sync</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">Bot protection lists up to date</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fraud detection</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Developer Notice</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tracking links generate absolute redirection. Copy links from the Campaigns tab to test active routing workflows directly!
            </p>
          </div>
        </div>
      </div>

      {/* Traffic Simulator Drawer/Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowSimulator(false)}></div>
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full relative z-10 flex flex-col shadow-2xl animate-slideLeft">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="text-slate-800" size={20} />
                  Test Click Simulator
                </h3>
                <p className="text-sm text-slate-500 mt-1">Simulate real clicks to test your geo, device, bot and cap logic instantly.</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 cursor-pointer"
                onClick={() => setShowSimulator(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <form onSubmit={runSimulation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Target Campaign"
                    value={simFormData.offerId}
                    onChange={(e) => setSimFormData({ ...simFormData, offerId: e.target.value })}
                    options={offers.map((o) => ({ value: o._id, label: `${o.name} (${o.status})` }))}
                  />
                  <Select
                    label="Visitor Client UA"
                    value={simFormData.userAgentPreset}
                    onChange={(e) => setSimFormData({ ...simFormData, userAgentPreset: e.target.value })}
                    options={uaPresets}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Client IP"
                    value={simFormData.ip}
                    onChange={(e) => setSimFormData({ ...simFormData, ip: e.target.value })}
                    placeholder="e.g. 8.8.8.8"
                  />
                  <Select
                    label="Mock Country Code"
                    value={simFormData.country}
                    onChange={(e) => setSimFormData({ ...simFormData, country: e.target.value })}
                    options={[
                      { value: "US", label: "US - United States" },
                      { value: "CA", label: "CA - Canada" },
                      { value: "GB", label: "GB - United Kingdom" },
                      { value: "IN", label: "IN - India" },
                      { value: "DE", label: "DE - Germany" },
                      { value: "FR", label: "FR - France" },
                      { value: "AU", label: "AU - Australia" },
                      { value: "JP", label: "JP - Japan" }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Publisher ID (pub_id)"
                    value={simFormData.pubId}
                    onChange={(e) => setSimFormData({ ...simFormData, pubId: e.target.value })}
                    placeholder="e.g. AFF-01"
                  />
                  <Input
                    label="Sub ID 1 (sub_id1)"
                    value={simFormData.subId1}
                    onChange={(e) => setSimFormData({ ...simFormData, subId1: e.target.value })}
                    placeholder="e.g. google_ads"
                  />
                  <Input
                    label="Sub ID 2 (sub_id2)"
                    value={simFormData.subId2}
                    onChange={(e) => setSimFormData({ ...simFormData, subId2: e.target.value })}
                    placeholder="e.g. ad_group_5"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={simulating} className="w-full gap-2">
                    {simulating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Running Redirection Simulation...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Trigger Simulation Click
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Simulation Result Output */}
              {simResult && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-6 font-mono text-xs space-y-4 shadow-inner border border-slate-800 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                      <Terminal size={14} />
                      PIPELINE PROCESSING AUDIT
                    </span>
                    <Badge
                      variant={
                        simResult.outcome === "passed"
                          ? "success"
                          : simResult.outcome === "filtered" || simResult.outcome === "capped"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px]"
                    >
                      {simResult.outcome.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Visitor Location:</span>
                      <span className="text-white font-semibold">{simResult.click.country} (IP: {simResult.click.ip})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client Platform:</span>
                      <span className="text-white font-semibold">{simResult.click.os} ({simResult.click.device})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evaluation Outcome:</span>
                      <span className={`font-bold ${simResult.outcome === "passed" ? "text-emerald-400" : "text-amber-400"}`}>
                        {simResult.outcome.toUpperCase()} {simResult.reason ? `(${simResult.reason})` : ""}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  <div className="space-y-3">
                    <div>
                      <span className="text-indigo-400 font-bold uppercase block mb-1">Incoming Redirect Request:</span>
                      <div className="bg-slate-950 p-2 rounded text-slate-300 break-all border border-slate-800/50">
                        GET /track?offer_id={simFormData.offerId}&pub_id={simFormData.pubId || ""}&sub_id1={simFormData.subId1 || ""}
                      </div>
                    </div>

                    <div>
                      <span className="text-indigo-400 font-bold uppercase block mb-1">Primary Offer Destination:</span>
                      <div className="bg-slate-950 p-2 rounded text-slate-400 break-all border border-slate-800/50">
                        {simResult.originalDest}
                      </div>
                    </div>

                    <div>
                      <span className="text-indigo-400 font-bold uppercase block mb-1">Final Dispatched Output:</span>
                      <div className={`p-2 rounded break-all border font-bold ${
                        simResult.outcome === "passed" 
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-900" 
                          : simResult.finalDest === "BLOCK_ACCESS_DENIED" 
                          ? "bg-rose-950/40 text-rose-300 border-rose-900" 
                          : "bg-amber-950/40 text-amber-300 border-amber-900"
                      }`}>
                        {simResult.finalDest === "BLOCK_ACCESS_DENIED" ? "HTTP 403 Access Denied" : `302 Redirect to -> ${simResult.finalDest}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end">
              <Button variant="outline" onClick={() => setShowSimulator(false)}>Close Simulator</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
