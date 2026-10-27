import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { Input, Select } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import {
  MousePointerClick,
  ShieldAlert,
  IndianRupee,
  Activity,
  Zap,
  CheckCircle2,
  Globe,
  Monitor,
  Cpu,
  RefreshCw,
  X
} from "lucide-react";
import { Offer, Click, DashboardStats } from "../types";

export default function Dashboard() {
  const { showToast } = useToast();
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
  const [postbackSecret, setPostbackSecret] = useState("npc_postback_sec_2026");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    axios.get("/api/system-config").then((res) => {
      if (res.data?.postbackSecret) {
        setPostbackSecret(res.data.postbackSecret);
      }
    }).catch(() => {});
  }, []);

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
  const [simPostbackLoading, setSimPostbackLoading] = useState(false);
  const [simPostbackResult, setSimPostbackResult] = useState<any | null>(null);

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
        axios.get("/api/performance/hourly"),
        axios.get("/api/stats/geo"),
        axios.get("/api/logs/live"),
        axios.get("/api/global-tracking")
      ]);

      setStats(statsRes.data);
      setOffers(offersRes.data);
      setPerformanceData(perfRes.data);
      setGeoData(geoRes.data);
      setLiveLogs(liveRes.data);
      setGlobalTracking(globalRes.data.globalTracking);

      if (offersRes.data.length > 0 && !simFormData.offerId) {
        setSimFormData(prev => ({ ...prev, offerId: offersRes.data[0]._id }));
      }
    } catch (err: any) {
      if (!isSilent) showToast("error", "Failed to load dashboard", "Please refresh the page.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Visibility-aware polling
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchData(true);
    }, 8000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchData(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Close simulator on Escape key
  useEffect(() => {
    if (!showSimulator) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSimulator(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSimulator]);

  // Lock body scroll when simulator is open
  useEffect(() => {
    if (showSimulator) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSimulator]);

  const handleGlobalTrackingToggle = async (active: boolean) => {
    try {
      const res = await axios.post("/api/global-tracking", { active });
      setGlobalTracking(res.data.globalTracking);
      fetchData(true);
      showToast(active ? "success" : "warning", active ? "Global tracking enabled" : "Global tracking paused", active ? "All campaigns are now routing traffic." : "Traffic is currently paused globally.");
    } catch (err: any) {
      showToast("error", "Failed to toggle tracking", err?.response?.data?.error || "Please try again.");
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simFormData.offerId) {
      showToast("warning", "No campaign selected", "Create a campaign before simulating traffic.");
      return;
    }

    setSimulating(true);
    setSimResult(null);
    setSimPostbackResult(null);

    try {
      const selectedUA = getUAByPreset(simFormData.userAgentPreset);
      const res = await axios.post("/api/simulate", {
        offerId: simFormData.offerId,
        ip: simFormData.ip,
        country: simFormData.country,
        userAgent: selectedUA,
        pubId: simFormData.pubId,
        subId1: simFormData.subId1,
        subId2: simFormData.subId2
      });

      setSimResult(res.data);
      showToast(
        res.data.outcome === "passed" ? "success" : "warning",
        `Simulation ${res.data.outcome.toUpperCase()}`,
        `Action: ${res.data.actionTaken} — ${res.data.filterReason || "Passed checks"}`
      );
      fetchData(true);
    } catch (err: any) {
      showToast("error", "Simulation Failed", err?.response?.data?.error || "Check backend status.");
    } finally {
      setSimulating(false);
    }
  };

  const triggerPostbackFromSim = async (clickId: string) => {
    setSimPostbackLoading(true);
    setSimPostbackResult(null);

    try {
      const res = await axios.get(`/api/postback?click_id=${clickId}&token=${postbackSecret}&revenue=100&payout=50`);
      setSimPostbackResult({ success: true, data: res.data });
      showToast("success", "S2S Postback Recorded", `Conversion logged with ₹100 Revenue & ₹50 Payout.`);
      fetchData(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to trigger S2S postback";
      setSimPostbackResult({ success: false, error: errorMsg });
      showToast("error", "Postback Rejected", errorMsg);
    } finally {
      setSimPostbackLoading(false);
    }
  };

  const passRate = stats.totalClicks > 0
    ? ((stats.passedTraffic / stats.totalClicks) * 100).toFixed(1)
    : "100.0";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw size={24} className="text-slate-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Traffic Overview
            {refreshing && <RefreshCw size={14} className="text-slate-500 animate-spin" />}
          </h2>
          <p className="text-sm text-slate-500">Real-time performance telemetry and traffic routing metrics.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleGlobalTrackingToggle(!globalTracking)}
            className="gap-2 text-xs font-semibold bg-white"
          >
            <span className={`w-2 h-2 rounded-full ${globalTracking ? "bg-emerald-500" : "bg-rose-500"}`} />
            {globalTracking ? "Tracking Active" : "Tracking Paused"}
          </Button>

          <Button onClick={() => setShowSimulator(true)} className="gap-2 text-xs bg-slate-900 shadow-xs">
            <Activity size={15} />
            Test Click Simulator
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-xs font-medium mb-1 flex items-center justify-between">
              Total Clicks
              <MousePointerClick size={14} className="text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalClicks.toLocaleString()}</div>
          </div>
          <div className="text-slate-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">100%</span>
            Total sessions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-xs font-medium mb-1 flex items-center justify-between">
              Clean Traffic
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.passedTraffic.toLocaleString()}</div>
          </div>
          <div className="text-emerald-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">{passRate}%</span>
            Passed routing policy
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-xs font-medium mb-1 flex items-center justify-between">
              Conversions
              <Zap size={14} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalConversions?.toLocaleString() || 0}</div>
          </div>
          <div className="text-indigo-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">
              {stats.conversionRate?.toFixed(2) || "0.00"}%
            </span>
            Conversion Rate (CR%)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-xs font-medium mb-1 flex items-center justify-between">
              Filtered & Blocked
              <ShieldAlert size={14} className="text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.filteredTraffic.toLocaleString()}</div>
          </div>
          <div className="text-rose-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-rose-50 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">
              {(stats.totalClicks > 0 ? ((stats.filteredTraffic / stats.totalClicks) * 100).toFixed(1) : "0")}%
            </span>
            Bots, caps or geo-filtered
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-xs font-medium mb-1 flex items-center justify-between">
              Total Revenue
              <IndianRupee size={14} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-slate-600 text-xs mt-3 flex items-center font-medium">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">
              ₹{stats.totalConversions && stats.totalConversions > 0 ? (stats.totalRevenue / stats.totalConversions).toFixed(2) : "0.00"}
            </span>
            Avg. revenue / conv (RPC)
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Graph */}
        <Card className="lg:col-span-2 border-slate-200 shadow-2xs">
          <CardHeader>
            <div>
              <CardTitle className="text-base text-slate-900">Hourly Traffic Performance</CardTitle>
              <CardDescription>Click volume and revenue generation trends</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {performanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 font-medium text-xs">No traffic records in the current window</div>
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
                      boxShadow: "0 2px 4px rgb(0 0 0 / 0.05)"
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    name="Clicks Logged"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Geos Card */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader>
            <div>
              <CardTitle className="text-base text-slate-900">Traffic by Region</CardTitle>
              <CardDescription>Highest volume countries</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {geoData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 font-medium text-xs">No geo records available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis dataKey="country" type="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                    {geoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#4f46e5" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Clicks & Real System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Traffic table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Traffic Activity</h3>
            <span className="text-xs text-slate-500">Last {liveLogs.length} events</span>
          </div>
          <div className="overflow-x-auto flex-1 min-w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[550px]">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Client IP</th>
                  <th className="px-6 py-3">Location & Device</th>
                  <th className="px-6 py-3">Tracking Context</th>
                  <th className="px-6 py-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {liveLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium text-sm">
                      No click records logged yet.
                    </td>
                  </tr>
                ) : (
                  liveLogs.slice(0, 7).map((log) => {
                    const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    return (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 text-slate-500 font-mono">{timeStr}</td>
                        <td className="px-6 py-3 font-mono text-slate-700">{log.ip}</td>
                        <td className="px-6 py-3">
                          <span className="font-semibold text-slate-800 mr-1.5">{log.country}</span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 text-slate-600 rounded font-medium">{log.device}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-500 font-mono">
                          {log.pubId ? `pub:${log.pubId}` : "direct"}
                          {log.subId1 ? ` | sub1:${log.subId1}` : ""}
                        </td>
                        <td className="px-6 py-3 text-right">
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
        </div>

        {/* Real Live Engine Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Cpu size={16} className="text-slate-700" />
              Traffic Engine Status
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Global Routing</span>
                <Badge variant={globalTracking ? "success" : "danger"}>
                  {globalTracking ? "Active" : "Paused"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Active Campaigns</span>
                <span className="text-xs font-semibold text-slate-800">
                  {offers.filter(o => o.status === "active").length} of {offers.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Traffic Quality Rate</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {passRate}% passed
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Total Conversions</span>
                <span className="text-xs font-semibold text-slate-800">
                  {stats.totalConversions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500">Total Revenue</span>
                <span className="text-xs font-bold text-slate-900">
                  ₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGlobalTrackingToggle(!globalTracking)}
              className="w-full text-xs font-medium bg-white"
            >
              {globalTracking ? "Pause Global Tracking" : "Resume Global Tracking"}
            </Button>
          </div>
        </div>
      </div>

      {/* Traffic Simulator Modal/Drawer */}
      {showSimulator && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSimulator(false)}
          />
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full relative z-10 flex flex-col shadow-2xl animate-slideLeft">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity size={18} className="text-slate-800" />
                  Traffic Click Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Test campaign geo, caps, and rotation routing logic.</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                onClick={() => setShowSimulator(false)}
                aria-label="Close simulator"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form onSubmit={handleRunSimulation} className="space-y-4">
                <Select
                  label="Campaign to Test"
                  value={simFormData.offerId}
                  onChange={(e) => setSimFormData({ ...simFormData, offerId: e.target.value })}
                  options={offers.map((o) => ({ value: o._id, label: `${o.name} (${o._id})` }))}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Visitor IP"
                    value={simFormData.ip}
                    onChange={(e) => setSimFormData({ ...simFormData, ip: e.target.value })}
                  />
                  <Input
                    label="ISO Country Code"
                    value={simFormData.country}
                    onChange={(e) => setSimFormData({ ...simFormData, country: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Publisher ID (pub_id)"
                    value={simFormData.pubId}
                    onChange={(e) => setSimFormData({ ...simFormData, pubId: e.target.value })}
                  />
                  <Input
                    label="Sub ID (sub_id1)"
                    value={simFormData.subId1}
                    onChange={(e) => setSimFormData({ ...simFormData, subId1: e.target.value })}
                  />
                </div>

                <Select
                  label="Device & Browser Preset"
                  value={simFormData.userAgentPreset}
                  onChange={(e) => setSimFormData({ ...simFormData, userAgentPreset: e.target.value })}
                  options={uaPresets}
                />

                <Button
                  type="submit"
                  disabled={simulating}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-xs font-semibold py-2.5"
                >
                  {simulating ? <RefreshCw size={14} className="animate-spin mr-2" /> : null}
                  {simulating ? "Evaluating Rules..." : "Simulate Click Event"}
                </Button>
              </form>

              {simResult && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-5 text-xs space-y-4 border border-slate-800 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-medium">Evaluation Outcome:</span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-xs ${
                      simResult.outcome === "passed"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}>
                      {simResult.outcome.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div><span className="text-slate-400">Routing Action:</span> <span className="text-slate-200">{simResult.actionTaken}</span></div>
                    {simResult.filterReason && <div><span className="text-slate-400">Filter Reason:</span> <span className="text-rose-300">{simResult.filterReason}</span></div>}
                    <div><span className="text-slate-400">Target URL:</span> <span className="text-emerald-300 break-all">{simResult.redirectUrl}</span></div>
                  </div>

                  {simResult.outcome === "passed" && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <Button
                        type="button"
                        onClick={() => triggerPostbackFromSim(simResult.click._id)}
                        disabled={simPostbackLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                      >
                        {simPostbackLoading ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : null}
                        {simPostbackLoading ? "Recording Postback..." : "Trigger Conversion Postback"}
                      </Button>

                      {simPostbackResult && (
                        <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono">
                          {simPostbackResult.success ? (
                            <span className="text-emerald-400">Conversion recorded: ID {simPostbackResult.data.conversion._id}</span>
                          ) : (
                            <span className="text-rose-400">{simPostbackResult.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
