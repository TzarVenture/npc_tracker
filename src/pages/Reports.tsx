/* Reports.tsx: Traffic log viewer, conversions ledger, debounced search, and CSV exporter. */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { copyToClipboard } from "../utils/clipboard";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search input to avoid calling the backend on every keypress
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      showToast("success", "Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toUtcParam = (dateStr: string, isEnd = false): string => {
    if (!dateStr || !dateStr.trim()) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    if (isEnd && dateStr.length === 16) {
      d.setSeconds(59, 999);
    }
    return d.toISOString();
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const utcStart = toUtcParam(startDate, false);
      const utcEnd = toUtcParam(endDate, true);
      const dateParams = utcStart ? `&startDate=${encodeURIComponent(utcStart)}` : "";
      const dateEndParams = utcEnd ? `&endDate=${encodeURIComponent(utcEnd)}` : "";

      if (activeTab === "clicks") {
        const [clicksRes, offersRes] = await Promise.all([
          axios.get(`/api/clicks?page=${page}&limit=${limit}&offerId=${selectedOffer}&status=${selectedStatus}&search=${encodeURIComponent(debouncedSearch)}${dateParams}${dateEndParams}`),
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
  }, [activeTab, page, limit, selectedOffer, selectedStatus, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getCampaignName = (offerId: string) => {
    const found = offers.find((o) => o._id === offerId);
    return found ? found.name : "Unknown Campaign";
  };

  // CSV EXPORT
  const exportFullCSV = async () => {
    try {
      const utcStart = toUtcParam(startDate, false);
      const utcEnd = toUtcParam(endDate, true);
      const dateParams = utcStart ? `&startDate=${encodeURIComponent(utcStart)}` : "";
      const dateEndParams = utcEnd ? `&endDate=${encodeURIComponent(utcEnd)}` : "";

      const response = await axios.get(
        `/api/clicks/export?offerId=${selectedOffer}&status=${selectedStatus}&search=${encodeURIComponent(debouncedSearch)}${dateParams}${dateEndParams}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clicks_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("success", "CSV export started", "Check your downloads folder.");
    } catch (err: any) {
      showToast("error", "CSV export failed", err?.response?.data?.error || "Please try again.");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedOffer("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Logs</h2>
          <p className="text-sm text-slate-500">Inspect real-time click and conversion telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "clicks" && (
            <Button
              variant="outline"
              onClick={exportFullCSV}
              className="gap-2 bg-white text-slate-700 shadow-2xs"
              aria-label="Export logs to CSV"
            >
              <Download size={15} /> Export CSV
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("clicks"); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "clicks"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MousePointerClick size={16} /> Click Logs
        </button>
        <button
          onClick={() => { setActiveTab("conversions"); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "conversions"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap size={16} /> Conversions
        </button>
      </div>

      {/* Filters Bar */}
      {activeTab === "clicks" && (
        <Card className="p-4 shadow-2xs border-slate-200 bg-white">
          <CardContent className="p-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="text"
                  placeholder="Search IP, Pub ID, Sub ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:bg-white focus:border-slate-800 transition-all placeholder:text-slate-400"
                  aria-label="Search clicks"
                />
              </div>

              <Select
                value={selectedOffer}
                onChange={(e) => { setSelectedOffer(e.target.value); setPage(1); }}
                options={[
                  { value: "all", label: "All Campaigns" },
                  ...offers.map((o) => ({ value: o._id, label: o.name }))
                ]}
              />

              <Select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "passed", label: "Passed" },
                  { value: "filtered", label: "Filtered" },
                  { value: "capped", label: "Capped" },
                  { value: "blocked", label: "Blocked" }
                ]}
              />

              <Button variant="outline" onClick={fetchLogs} className="gap-2 w-full text-slate-700 bg-white" aria-label="Refresh logs">
                <ArrowUpDown size={14} /> Refresh
              </Button>
            </div>

            {/* Date Range Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Calendar size={13} className="text-slate-500" /> Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Calendar size={13} className="text-slate-500" /> End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-800 font-medium"
                />
              </div>
              {(startDate || endDate || search || selectedOffer !== "all" || selectedStatus !== "all") && (
                <Button variant="outline" onClick={handleClearFilters} className="text-slate-600 gap-1.5 h-[34px]">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Table Grid */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          {activeTab === "clicks" ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Click ID</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Campaign</th>
                  <th className="px-6 py-3.5">Client IP</th>
                  <th className="px-6 py-3.5">Location & Device</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Loading clicks...
                    </td>
                  </tr>
                ) : clicks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium text-sm">
                      No matching clicks found.
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
                      <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-900 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate w-24 select-all" title={c._id}>{c._id}</span>
                            <button
                              onClick={() => handleCopy(c._id, c._id)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy Click ID"
                              aria-label="Copy Click ID"
                            >
                              {copiedId === c._id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                          {formattedTime}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-slate-900">{getCampaignName(c.offerId)}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">pub: {c.pubId || "direct"} | sub1: {c.subId1 || "none"}</div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                          {c.ip}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{c.country}</span>
                            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                              {c.device} ({c.os})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Badge variant={c.status === "passed" ? "success" : c.status === "filtered" ? "warning" : c.status === "capped" ? "warning" : "danger"}>
                            {c.status}
                          </Badge>
                          {c.filterReason && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]" title={c.filterReason}>
                              {c.filterReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-slate-900">
                          ₹{(Number(c.revenue) || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Conversion ID</th>
                  <th className="px-6 py-3.5">Click ID</th>
                  <th className="px-6 py-3.5">Campaign</th>
                  <th className="px-6 py-3.5">Event</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Revenue (₹)</th>
                  <th className="px-6 py-3.5 text-right">Payout (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Loading conversions...
                    </td>
                  </tr>
                ) : conversions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium text-sm">
                      No conversions recorded yet.
                    </td>
                  </tr>
                ) : (
                  conversions.map((conv) => {
                    const convTime = new Date(conv.timestamp);
                    const formatted = convTime.toLocaleDateString([], {
                      month: "short",
                      day: "numeric"
                    }) + " " + convTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <tr key={conv._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate w-24 select-all" title={conv._id}>{conv._id}</span>
                            <button
                              onClick={() => handleCopy(conv._id, conv._id)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy Conversion ID"
                              aria-label="Copy Conversion ID"
                            >
                              {copiedId === conv._id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600 select-all">
                          {conv.clickId}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {getCampaignName(conv.offerId)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700">
                            {conv.eventName || "default"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                          {formatted}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                          ₹{(conv.revenue || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-slate-900">
                          ₹{(conv.payout || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{Math.min(totalRecords, (page - 1) * limit + 1)}</span> to{" "}
            <span className="font-semibold">{Math.min(totalRecords, page * limit)}</span> of{" "}
            <span className="font-semibold">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
