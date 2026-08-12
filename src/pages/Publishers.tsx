/* Publishers.tsx: Affiliate & Publisher management with full DB persistence, stats merge, and toast notifications. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { Award, RefreshCw, Plus, Copy, Check, Users, Link2, X, Trash2, TrendingUp, Filter, DollarSign } from "lucide-react";

interface PublisherRow {
  id: string;          // pub_id used as display ID
  pubId?: string;      // registered pub_id from DB
  name: string;
  clickCount: number;
  passed: number;
  filtered: number;
  payout: number;
  revenue: number;
  // registration metadata (only present for registered publishers)
  createdAt?: string;
}

interface OfferOption {
  _id: string;
  name: string;
}

export default function Publishers() {
  const { showToast } = useToast();
  const [publishers, setPublishers] = useState<PublisherRow[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New publisher form state
  const [newPubId, setNewPubId] = useState("");
  const [newPubName, setNewPubName] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pubRes, offerRes] = await Promise.all([
        axios.get("/api/publishers"),
        axios.get("/api/offers")
      ]);
      setPublishers(pubRes.data);
      setOffers(offerRes.data);
      if (offerRes.data.length > 0) {
        setSelectedOfferId(offerRes.data[0]._id);
      }
    } catch (err: any) {
      showToast("error", "Failed to load publishers", err?.response?.data?.error || "Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    const autoId = "PUB-" + Math.floor(1000 + Math.random() * 9000);
    setNewPubId(autoId);
    setNewPubName("");
    setShowModal(true);
  };

  const handleAddPublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubId.trim()) {
      showToast("error", "Publisher ID is required.");
      return;
    }
    if (!newPubName.trim()) {
      showToast("error", "Publisher Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/publishers", { pubId: newPubId.trim(), name: newPubName.trim() });
      setShowModal(false);
      showToast("success", "Publisher registered!", `"${newPubName.trim()}" has been saved permanently.`);
      fetchData();
    } catch (err: any) {
      showToast("error", "Failed to register publisher", err?.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePublisher = async (pub: PublisherRow) => {
    if (confirmDeleteId !== pub.id) {
      setConfirmDeleteId(pub.id);
      return;
    }
    setDeletingId(pub.id);
    setConfirmDeleteId(null);
    try {
      // Find the DB record id — for registered publishers pubId is stored
      await axios.delete(`/api/publishers/${encodeURIComponent(pub.id)}`);
      showToast("success", "Publisher removed", `"${pub.name}" has been permanently deleted.`);
      fetchData();
    } catch (err: any) {
      showToast("error", "Failed to delete publisher", err?.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const trackingUrl = `${window.location.origin}/track?offer_id=${selectedOfferId || "off-id"}&pub_id=${newPubId || "PUB-101"}&sub_id1={sub_id1}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalClicks = publishers.reduce((s, p) => s + p.clickCount, 0);
  const totalPassed = publishers.reduce((s, p) => s + p.passed, 0);
  const totalRevenue = publishers.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-800" /> Publishers & Affiliates
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register media partners, generate tracking URLs, and monitor traffic quality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="gap-2 text-slate-600" title="Refresh">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 font-semibold gap-2 shrink-0">
            <Plus size={16} /> Register Publisher
          </Button>
        </div>
      </header>

      {/* Summary KPIs */}
      {publishers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Partners", value: publishers.length, icon: Users, color: "text-slate-700" },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: TrendingUp, color: "text-indigo-600" },
            { label: "Net Revenue", value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-emerald-600" },
          ].map(kpi => (
            <Card key={kpi.label} className="p-4 flex items-center gap-3 border border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
                <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <RefreshCw size={24} className="text-slate-700 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading publisher data...</p>
        </div>
      ) : publishers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border border-dashed border-slate-200 rounded-2xl bg-white p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">No Publishers Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Click <strong>Register Publisher</strong> to save a partner with a unique <code>pub_id</code>. Data persists permanently across sessions.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold gap-1.5 mt-2">
            <Plus size={14} /> Register Publisher
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Publisher</th>
                <th className="px-6 py-4 text-right">Clicks Sent</th>
                <th className="px-6 py-4 text-right">Clean / Passed</th>
                <th className="px-6 py-4 text-right">Quality Rate</th>
                <th className="px-6 py-4 text-right">Net Revenue</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {publishers.map((p) => {
                const qualityRate = p.clickCount > 0 ? ((p.passed / p.clickCount) * 100).toFixed(1) : "0.0";
                const isRegistered = Boolean(p.createdAt || p.pubId);
                const isDeleting = deletingId === p.id;
                const isConfirming = confirmDeleteId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Award size={15} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold font-mono tracking-wider">
                              {p.id}
                            </span>
                            {isRegistered && (
                              <Badge variant="success" className="text-[9px] py-0 px-1.5">Registered</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                      {p.clickCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      {p.passed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${Number(qualityRate) >= 70 ? "text-emerald-600" : Number(qualityRate) >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                        {qualityRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isRegistered ? (
                        isConfirming ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs text-rose-600 font-semibold">Confirm?</span>
                            <button
                              onClick={() => handleDeletePublisher(p)}
                              disabled={isDeleting}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                            >
                              {isDeleting ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeletePublisher(p)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove publisher"
                          >
                            <Trash2 size={15} />
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Traffic only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Publisher / Link Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-slate-800" /> Register Publisher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign credentials and generate a tracking URL. Saved permanently to database.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPublisher} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Publisher ID (pub_id)"
                  placeholder="e.g. PUB-101"
                  value={newPubId}
                  onChange={(e) => setNewPubId(e.target.value.toUpperCase())}
                  required
                />
                <Input
                  label="Publisher Name / Agency"
                  placeholder="e.g. Alpha Traffic Network"
                  value={newPubName}
                  onChange={(e) => setNewPubName(e.target.value)}
                  required
                />
              </div>

              {offers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Select Campaign for Tracking Link</label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-900 font-medium"
                  >
                    {offers.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.name} ({off._id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generated Tracking Link */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Link2 size={14} className="text-slate-800" /> Generated Tracking URL
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-xs text-slate-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 break-all select-all">
                  {trackingUrl}
                </div>
                <p className="text-[11px] text-slate-500">
                  Share this URL with the publisher. The <code>sub_id1</code> token can be dynamically replaced by their ad platform.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 font-semibold px-6 gap-2"
                  disabled={submitting}
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {submitting ? "Saving..." : "Save Publisher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
