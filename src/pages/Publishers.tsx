import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { copyToClipboard } from "../utils/clipboard";
import { 
  Award, 
  RefreshCw, 
  Plus, 
  Copy, 
  Check, 
  Users, 
  Link2, 
  X, 
  Trash2, 
  TrendingUp, 
  IndianRupee
} from "lucide-react";

interface PublisherRow {
  id: string;          // pub_id used as display ID
  pubId?: string;      // registered pub_id from DB
  name: string;
  clickCount: number;
  passed: number;
  filtered: number;
  payout: number;
  revenue: number;
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
        setSelectedOfferId(prev => (prev && offerRes.data.some((o: OfferOption) => o._id === prev) ? prev : offerRes.data[0]._id));
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

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
      showToast("success", "Publisher registered", `"${newPubName.trim()}" has been saved.`);
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
      await axios.delete(`/api/publishers/${encodeURIComponent(pub.id)}`);
      showToast("success", "Publisher removed", `"${pub.name}" has been removed.`);
      fetchData();
    } catch (err: any) {
      showToast("error", "Failed to delete publisher", err?.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const trackingUrl = `${window.location.origin}/track?offer_id=${selectedOfferId || "off-id"}&pub_id=${newPubId || "PUB-101"}&sub_id1={sub_id1}`;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(trackingUrl);
    if (ok) {
      setCopied(true);
      showToast("success", "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalClicks = publishers.reduce((s, p) => s + (p.clickCount || 0), 0);
  const totalRevenue = publishers.reduce((s, p) => s + (p.revenue || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Publishers</h2>
          <p className="text-sm text-slate-500">Manage affiliate traffic partners and attribution codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-2 text-slate-700 bg-white"
            aria-label="Refresh publishers list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
          <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold gap-1.5 shadow-xs">
            <Plus size={15} /> Add Publisher
          </Button>
        </div>
      </header>

      {/* Summary KPIs */}
      {publishers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Partners", value: publishers.length, icon: Users, color: "text-slate-700" },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: TrendingUp, color: "text-indigo-600" },
            { label: "Net Revenue", value: `₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: IndianRupee, color: "text-emerald-600" },
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
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <RefreshCw size={22} className="text-slate-600 animate-spin" />
          <p className="text-slate-500 text-sm">Loading publishers...</p>
        </div>
      ) : publishers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border border-dashed border-slate-200 rounded-xl bg-white p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">No Publishers Found</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Click <strong>Add Publisher</strong> to register a partner with a unique code.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="text-xs font-semibold gap-1.5 mt-2">
            <Plus size={14} /> Add Publisher
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs min-w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Publisher</th>
                <th className="px-6 py-3.5 text-right">Clicks</th>
                <th className="px-6 py-3.5 text-right">Passed</th>
                <th className="px-6 py-3.5 text-right">Quality Rate</th>
                <th className="px-6 py-3.5 text-right">Revenue</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {publishers.map((p) => {
                const qualityRate = p.clickCount > 0 ? ((p.passed / p.clickCount) * 100).toFixed(1) : "0.0";
                const isRegistered = Boolean(p.createdAt || p.pubId);
                const isDeleting = deletingId === p.id;
                const isConfirming = confirmDeleteId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Award size={15} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                              {p.id}
                            </span>
                            {isRegistered && (
                              <Badge variant="success" className="text-[10px] py-0 px-1.5">Registered</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {(p.clickCount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      {(p.passed || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${Number(qualityRate) >= 75 ? "text-emerald-600" : Number(qualityRate) >= 40 ? "text-amber-600" : "text-slate-500"}`}>
                        {qualityRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      ₹{(p.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isConfirming ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDeletePublisher(p)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Delete?
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeletePublisher(p)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Publisher"
                          aria-label={`Delete publisher ${p.name}`}
                        >
                          {isDeleting ? <RefreshCw size={14} className="animate-spin text-rose-600" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Publisher Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-slate-800" /> Add Publisher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign credentials and generate a tracking URL.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPublisher} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Publisher ID"
                  placeholder="e.g. PUB-101"
                  value={newPubId}
                  onChange={(e) => setNewPubId(e.target.value.toUpperCase())}
                  required
                />
                <Input
                  label="Publisher Name / Agency"
                  placeholder="e.g. Alpha Network"
                  value={newPubName}
                  onChange={(e) => setNewPubName(e.target.value)}
                  required
                />
              </div>

              {offers.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="select-campaign-pub" className="text-xs font-medium text-slate-700 block">
                    Select Campaign for Tracking Link
                  </label>
                  <select
                    id="select-campaign-pub"
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-slate-800 font-medium"
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
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Link2 size={14} className="text-slate-800" /> Generated Tracking URL
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-xs text-slate-800 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-all select-all">
                  {trackingUrl}
                </div>
                <p className="text-[11px] text-slate-500">
                  The <code>{`{sub_id1}`}</code> macro can be replaced with your publisher's sub-ID parameter.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
        </div>,
        document.body
      )}
    </div>
  );
}
