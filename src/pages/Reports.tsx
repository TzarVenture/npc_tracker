/* Reports.tsx: Real-time traffic log viewer, conversions ledger, date-range filtering, and full server-side CSV log exporter. */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import {
  FileText,
  Search,
  Download,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Zap,
  MousePointerClick,
  Calendar
} from "lucide-react";
import { Click, Offer, Conversion } from "../types";

export default function Reports() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"clicks" | "conversions">("clicks");
  const [clicks, setClicks] = useState<Click[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopiedId(id);
    showToast("success", "Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      textarea.style.top = "-999999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (err) {}
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const dateParams = startDate ? `&startDate=${encodeURIComponent(startDate)}` : "";
      const dateEndParams = endDate ? `&endDate=${encodeURIComponent(endDate + ":59")}` : "";
      if (activeTab === "clicks") {
        const [clicksRes, offersRes] = await Promise.all([
          axios.get(`/api/clicks?page=${page}&limit=${limit}&offerId=${selectedOffer}&status=${selectedStatus}&search=${encodeURIComponent(search)}${dateParams}${dateEndParams}`),
          axios.get("/api/offers")
        ]);
        setClicks(clicksRes.data.data);
        setTotalRecords(clicksRes.data.total);
        setOffers(offersRes.data);
      } else {
        const [convRes, offersRes] = await Promise.all([
          axios.get(`/api/conversions?page=${page}&limit=${limit}`),
          axios.get("/api/offers")
        ]);
        setConversions(convRes.data.data);
        setTotalRecords(convRes.data.total);
        setOffers(offersRes.data);
      }
    } catch (err: any) {
      showToast("error", "Failed to load log data", err?.response?.data?.error || "Check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, selectedOffer, selectedStatus, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getCampaignName = (offerId: string) => {
    const found = offers.find((o) => o._id === offerId);
    return found ? found.name : "Unknown Campaign";
  };

  // FULL SERVER-SIDE CSV EXPORT
  const exportFullCSV = async () => {
    try {
      const dateParams = startDate ? `&startDate=${encodeURIComponent(startDate)}` : "";
      const dateEndParams = endDate ? `&endDate=${encodeURIComponent(endDate + ":59")}` : "";
      const response = await axios.get(
        `/api/clicks/export?offerId=${selectedOffer}&status=${selectedStatus}&search=${encodeURIComponent(search)}${dateParams}${dateEndParams}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `npc_tracker_full_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("success", "CSV export started!", "Check your downloads folder.");
    } catch (err: any) {
      showToast("error", "CSV export failed", err?.response?.data?.error || "Please try again.");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedOffer("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Telemetry</h2>
          <p className="text-sm text-slate-500">Search, audit, and download raw click and conversion streams.</p>
        </div>
        <Button variant="outline" onClick={exportFullCSV} className="gap-2 text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
          <Download size={16} /> Export Full Server CSV
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("clicks"); setPage(1); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "clicks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MousePointerClick size={14} /> Click Stream Ledger
        </button>
        <button
          onClick={() => { setActiveTab("conversions"); setPage(1); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "conversions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Zap size={14} /> Conversions Ledger
        </button>
      </div>

      {/* Filter Toolbar Card (Only for Clicks) */}
      {activeTab === "clicks" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="IP, PubID, Country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Select
                label="Campaign filter"
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
                options={[
                  { value: "all", label: "All Campaigns" },
                  ...offers.map((o) => ({ value: o._id, label: o.name }))
                ]}
              />

              <Select
                label="Routing Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "passed", label: "Passed" },
                  { value: "filtered", label: "Filtered" },
                  { value: "capped", label: "Capped" },
                  { value: "blocked", label: "Blocked" }
                ]}
              />

              <Button variant="outline" onClick={fetchLogs} className="gap-2 w-full text-slate-700 bg-white">
                <ArrowUpDown size={14} /> Refresh Logs
              </Button>
            </div>

            {/* Date Range Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-1 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Calendar size={10} /> From Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Calendar size={10} /> To Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-700"
                />
              </div>
              {(startDate || endDate || search || selectedOffer !== "all" || selectedStatus !== "all") && (
                <Button variant="outline" onClick={handleClearFilters} className="text-slate-500 gap-1.5">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Table Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "clicks" ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
                <tr>
                  <th className="px-6 py-4">Click Identifier</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Campaign Context</th>
                  <th className="px-6 py-4">Client IP</th>
                  <th className="px-6 py-4">Geo & Agent</th>
                  <th className="px-6 py-4 text-center">Outcome</th>
                  <th className="px-6 py-4 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium animate-pulse">
                      Fetching log records...
                    </td>
                  </tr>
                ) : clicks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No matching click telemetry found in database.
                    </td>
                  </tr>
                ) : (
                  clicks.map((c) => {
                    const clickTime = new Date(c.timestamp);
                    const formattedTime = clickTime.toLocaleDateString([], {
                      month: "short",
                      day: "numeric"
                    }) + " " + clickTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <tr key={c._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="truncate w-24 select-all" title={c._id}>{c._id}</span>
                            <button
                              onClick={() => copyToClipboard(c._id, c._id)}
                              className="p-1 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Copy Click ID"
                            >
                              {copiedId === c._id ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">
                          {formattedTime}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{getCampaignName(c.offerId)}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">pub: {c.pubId || "direct"} | sub1: {c.subId1 || "none"}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {c.ip}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{c.country}</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500 font-medium">
                              {c.device} ({c.os})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={c.status === "passed" ? "success" : c.status === "filtered" ? "warning" : c.status === "capped" ? "warning" : "danger"}>
                            {c.status}
                          </Badge>
                          {c.filterReason && (
                            <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]" title={c.filterReason}>
                              {c.filterReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ₹{c.status === "passed" ? c.revenue.toFixed(2) : "0.00"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
                <tr>
                  <th className="px-6 py-4">Conversion ID</th>
                  <th className="px-6 py-4">Click ID</th>
                  <th className="px-6 py-4">Campaign Context</th>
                  <th className="px-6 py-4">Event Tier</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Revenue (₹)</th>
                  <th className="px-6 py-4 text-right">Payout (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium animate-pulse">
                      Fetching conversion records...
                    </td>
                  </tr>
                ) : conversions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No conversions logged yet. Trigger S2S postbacks using /api/postback?click_id=...
                    </td>
                  </tr>
                ) : (
                  conversions.map((conv) => (
                    <tr key={conv._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{conv._id}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{conv.clickId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{getCampaignName(conv.offerId)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase">
                          {conv.eventName || "default"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{new Date(conv.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{conv.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">₹{conv.payout.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100/80 flex flex-col sm:flex-row justify-between items-center gap-4 px-6">
          <span className="text-slate-500 text-xs font-semibold">
            Showing records on page {page} (Total Records: {totalRecords})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs font-medium text-slate-600 px-2">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
