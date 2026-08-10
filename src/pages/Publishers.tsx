/* Publishers.tsx: Aggregated performance metrics & Publisher Management gateway. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Award, RefreshCw, Plus, Copy, Check, Users, Link2, X } from "lucide-react";

interface PublisherStats {
  id: string;
  name: string;
  clickCount: number;
  passed: number;
  filtered: number;
  payout: number;
  revenue: number;
}

interface OfferOption {
  _id: string;
  name: string;
}

export default function Publishers() {
  const [publishers, setPublishers] = useState<PublisherStats[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New publisher form state
  const [newPubId, setNewPubId] = useState("");
  const [newPubName, setNewPubName] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");

  const fetchPublishers = async () => {
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
    } catch (err) {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, []);

  const handleOpenAddModal = () => {
    const autoId = "PUB-" + Math.floor(1000 + Math.random() * 9000);
    setNewPubId(autoId);
    setNewPubName("");
    setShowModal(true);
  };

  const handleAddPublisher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubId) return;

    // Check if already exists in local list
    const existing = publishers.find(p => p.id === newPubId.trim());
    if (!existing) {
      setPublishers(prev => [
        {
          id: newPubId.trim(),
          name: newPubName.trim() || `Publisher ${newPubId.trim()}`,
          clickCount: 0,
          passed: 0,
          filtered: 0,
          payout: 0,
          revenue: 0
        },
        ...prev
      ]);
    }
    setShowModal(false);
  };

  const trackingUrl = `${window.location.origin}/track?offer_id=${selectedOfferId || 'off-id'}&pub_id=${newPubId || 'PUB-101'}&sub1={sub1}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-800" /> Publishers & Affiliates
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register media partners, generate unique tracking URLs, and monitor traffic quality.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 font-semibold gap-2 shrink-0">
          <Plus size={16} /> Register Publisher
        </Button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <RefreshCw size={24} className="text-slate-700 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading publisher performance data...</p>
        </div>
      ) : publishers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border border-dashed border-slate-200 rounded-2xl bg-white p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">No Publishers Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Click <strong>Register Publisher</strong> to generate custom affiliate tracking links, or send traffic with a <code>pub_id</code> parameter.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold gap-1.5 mt-2">
            <Plus size={14} /> Register Publisher
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishers.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between border border-slate-200 bg-white">
              <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                      {p.id}
                    </span>
                    <CardTitle className="mt-2 text-base text-slate-900">{p.name}</CardTitle>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Award size={16} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Clicks Sent</span>
                    <span className="font-bold text-sm text-slate-900">{p.clickCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Clean Passed</span>
                    <span className="font-bold text-emerald-600 text-sm">{p.passed.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Quality Rate</span>
                    <span className="font-bold text-sm text-slate-900">{p.clickCount > 0 ? ((p.passed / p.clickCount) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Net Earnings</span>
                    <span className="font-bold text-slate-900 text-sm">${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Publisher / Link Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-slate-800" /> Register Publisher & Tracking Link
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign publisher credentials and generate custom campaign URL.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPublisher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Publisher ID (pub_id)"
                  placeholder="e.g. PUB-101"
                  value={newPubId}
                  onChange={(e) => setNewPubId(e.target.value)}
                  required
                />
                <Input
                  label="Publisher Name / Agency"
                  placeholder="e.g. Alpha Traffic Network"
                  value={newPubName}
                  onChange={(e) => setNewPubName(e.target.value)}
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

              {/* Generated Tracking Link Box */}
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
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 break-all select-all">
                  {trackingUrl}
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide this tracking link to the publisher. Sub-IDs (<code>sub1</code>, <code>sub2</code>) can be dynamically attached by the media buyer.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 font-semibold px-5">
                  Save Publisher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
