/* Reports.tsx: Paginated log viewer for inspecting raw tracking telemetry. */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Input";
import {
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy
} from "lucide-react";
import { Click, Offer } from "../types";

export default function Reports() {
  const [clicks, setClicks] = useState<Click[]>([]);
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [clicksRes, offersRes] = await Promise.all([
        axios.get(`/api/clicks?page=${page}&limit=${limit}`),
        axios.get("/api/offers")
      ]);
      setClicks(clicksRes.data.data);
      setTotalRecords(clicksRes.data.total);
      setOffers(offersRes.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs locally (applied on the fetched page)
  const filteredClicks = clicks.filter((c) => {
    const matchesSearch =
      (c.ip || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.pubId || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.subId1 || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.country || "").toLowerCase().includes(search.toLowerCase());

    const matchesOffer = selectedOffer === "all" || c.offerId === selectedOffer;
    const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;

    return matchesSearch && matchesOffer && matchesStatus;
  });

  const getCampaignName = (offerId: string) => {
    const found = offers.find((o) => o._id === offerId);
    return found ? found.name : "Unknown Campaign";
  };

  // EXPORT CSV UTILITY (Exports current page only, as it's paginated on backend)
  const exportToCSV = () => {
    if (filteredClicks.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const headers = [
      "Click ID",
      "Timestamp",
      "Campaign ID",
      "Campaign Name",
      "IP Address",
      "Country",
      "Device",
      "OS",
      "Publisher ID",
      "Sub ID 1",
      "Sub ID 2",
      "Status",
      "Revenue ($)"
    ];

    const rows = filteredClicks.map((c) => [
      c._id,
      new Date(c.timestamp).toISOString(),
      c.offerId,
      `"${getCampaignName(c.offerId).replace(/"/g, '""')}"`,
      c.ip,
      c.country,
      c.device,
      c.os,
      c.pubId || "",
      c.subId1 || "",
      c.subId2 || "",
      c.status,
      c.revenue
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `npc_tracker_click_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-sm text-slate-500">Search, audit, and export raw click logs.</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} className="gap-2 text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
          <Download size={16} /> Export Page to CSV
        </Button>
      </header>

      {/* Filter Toolbar Card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search IP, PubID, Geo..."
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
            <ArrowUpDown size={14} /> Fetch Latest Logs
          </Button>
        </CardContent>
      </Card>

      {/* Reports Table Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4">Click Identifier</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Campaign Context</th>
                <th className="px-6 py-4">Client IP</th>
                <th className="px-6 py-4">Geo & Agent</th>
                <th className="px-6 py-4 text-center">Outcome</th>
                <th className="px-6 py-4 text-right">Payout ($)</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium animate-pulse">
                    Streaming log repositories...
                  </td>
                </tr>
              ) : filteredClicks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No matching click telemetry found in database ledger.
                  </td>
                </tr>
              ) : (
                filteredClicks.map((c) => {
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
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ${c.status === "passed" ? c.revenue.toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100/80 flex flex-col sm:flex-row justify-between items-center gap-4 px-6">
          <span className="text-slate-500 text-xs font-semibold">
            Showing {Math.min(filteredClicks.length, limit)} on this page (Total Records: {totalRecords})
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
