/* Offers.tsx: Campaign management, filtering rules, multi-event payouts, scheduling, and integration code generators. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import {
  Plus,
  Search,
  CheckCircle2,
  Link2,
  Copy,
  Trash2,
  Edit,
  X,
  ExternalLink,
  Info,
  Code,
  Calendar,
  Layers,
  Clock
} from "lucide-react";
import { Offer, OfferEvent } from "../types";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOfferForCode, setSelectedOfferForCode] = useState<Offer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    destinationUrl: "",
    fallbackUrl: "",
    payout: 4.5,
    revenue: 12.0,
    geoTargeting: "",
    cityTargeting: "",
    deviceType: "All" as "All" | "Mobile" | "Desktop",
    osType: "All" as "All" | "iOS" | "Android" | "Windows",
    browserTargeting: "",
    ispTargeting: "",
    dailyCap: 0,
    hourlyCap: 0,
    startDate: "",
    endDate: "",
    duplicateWindowMinutes: 0,
    eventsList: [] as OfferEvent[],
    actionOnFilter: "redirect" as "redirect" | "block" | "log" | "drop",
    blockBots: true,
    targetPages: "",
    triggerDelayMs: 0,
    triggerIntervalMs: 0,
    triggerRepeatCount: 0,
    frequencyCap: "unlimited" as "unlimited" | "once_per_session" | "once_per_user",
    status: "active" as "active" | "paused"
  });

  // Event creation temporary form state
  const [newEvent, setNewEvent] = useState({ eventName: "", payout: 0, revenue: 0 });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("/api/offers");
      setOffers(res.data);
    } catch (err) {
      // Quiet fail if error
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.destinationUrl) {
      alert("Campaign Name and Destination URL are required.");
      return;
    }

    const parseCSV = (str: string) => str ? str.split(",").map(g => g.trim().toUpperCase()).filter(g => g.length > 0) : [];

    const payload = {
      name: formData.name,
      destinationUrl: formData.destinationUrl,
      fallbackUrl: formData.fallbackUrl || formData.destinationUrl,
      payout: Number(formData.payout) || 0,
      revenue: Number(formData.revenue) || 10,
      geoTargeting: parseCSV(formData.geoTargeting),
      cityTargeting: parseCSV(formData.cityTargeting),
      deviceType: formData.deviceType,
      osType: formData.osType,
      browserTargeting: parseCSV(formData.browserTargeting),
      ispTargeting: parseCSV(formData.ispTargeting),
      dailyCap: Number(formData.dailyCap) || 0,
      hourlyCap: Number(formData.hourlyCap) || 0,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      duplicateWindowMinutes: Number(formData.duplicateWindowMinutes) || 0,
      events: formData.eventsList,
      actionOnFilter: formData.actionOnFilter,
      blockBots: formData.blockBots,
      targetPages: parseCSV(formData.targetPages),
      triggerDelayMs: Number(formData.triggerDelayMs) || 0,
      triggerIntervalMs: Number(formData.triggerIntervalMs) || 0,
      triggerRepeatCount: Number(formData.triggerRepeatCount) || 0,
      frequencyCap: formData.frequencyCap,
      status: formData.status
    };

    try {
      if (editingOfferId) {
        await axios.put(`/api/offers/${editingOfferId}`, payload);
      } else {
        await axios.post("/api/offers", payload);
      }
      closeDrawer();
      fetchOffers();
    } catch (err) {
      // Quiet fail
    }
  };

  const handleEditClick = (offer: Offer) => {
    setEditingOfferId(offer._id);
    setFormData({
      name: offer.name,
      destinationUrl: offer.destinationUrl,
      fallbackUrl: offer.fallbackUrl,
      payout: offer.payout,
      revenue: offer.revenue,
      geoTargeting: (offer.geoTargeting || []).join(", "),
      cityTargeting: (offer.cityTargeting || []).join(", "),
      deviceType: offer.deviceType,
      osType: offer.osType,
      browserTargeting: (offer.browserTargeting || []).join(", "),
      ispTargeting: (offer.ispTargeting || []).join(", "),
      dailyCap: offer.dailyCap || 0,
      hourlyCap: offer.hourlyCap || 0,
      startDate: offer.startDate ? offer.startDate.substring(0, 16) : "",
      endDate: offer.endDate ? offer.endDate.substring(0, 16) : "",
      duplicateWindowMinutes: offer.duplicateWindowMinutes || 0,
      eventsList: offer.events || [],
      actionOnFilter: offer.actionOnFilter,
      blockBots: offer.blockBots,
      targetPages: (offer.targetPages || []).join(", "),
      triggerDelayMs: offer.triggerDelayMs || 0,
      triggerIntervalMs: offer.triggerIntervalMs || 0,
      triggerRepeatCount: offer.triggerRepeatCount || 0,
      frequencyCap: offer.frequencyCap || "unlimited",
      status: offer.status
    });
    setCurrentStep(1);
    setShowDrawer(true);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await axios.delete(`/api/offers/${id}`);
      fetchOffers();
    } catch (err) {
      // Quiet fail
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.eventName.trim()) return;
    setFormData(prev => ({
      ...prev,
      eventsList: [...prev.eventsList, { eventName: newEvent.eventName.trim(), payout: Number(newEvent.payout) || 0, revenue: Number(newEvent.revenue) || 0 }]
    }));
    setNewEvent({ eventName: "", payout: 0, revenue: 0 });
  };

  const handleRemoveEvent = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      eventsList: prev.eventsList.filter((_, i) => i !== idx)
    }));
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingOfferId(null);
    setCurrentStep(1);
    setFormData({
      name: "",
      destinationUrl: "",
      fallbackUrl: "",
      payout: 4.5,
      revenue: 12.0,
      geoTargeting: "",
      cityTargeting: "",
      deviceType: "All",
      osType: "All",
      browserTargeting: "",
      ispTargeting: "",
      dailyCap: 0,
      hourlyCap: 0,
      startDate: "",
      endDate: "",
      duplicateWindowMinutes: 0,
      eventsList: [],
      actionOnFilter: "redirect",
      blockBots: true,
      targetPages: "",
      triggerDelayMs: 0,
      triggerIntervalMs: 0,
      triggerRepeatCount: 0,
      frequencyCap: "unlimited",
      status: "active"
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const filteredOffers = offers.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.destinationUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTrackingUrl = (offerId: string) => `${window.location.origin}/track?offer_id=${offerId}&pub_id={pub_id}&sub_id1={sub_id1}`;
  const getPostbackUrl = (offerId: string) => `${window.location.origin}/api/postback?click_id={click_id}&revenue=10&payout=5`;
  const getScriptTag = (offerId: string) => `<script src="${window.location.origin}/api/script/${offerId}.js" async></script>`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h2>
          <p className="text-sm text-slate-500">Manage tracking links, multi-event payouts, and targeting controls.</p>
        </div>
        <Button onClick={() => setShowDrawer(true)} className="gap-2 shadow-sm cursor-pointer">
          <Plus size={16} /> New Campaign
        </Button>
      </header>

      {/* Campaign List Table */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Caps & Schedule</th>
                <th className="px-6 py-4 text-right">Metrics & Events</th>
                <th className="px-6 py-4 text-center">Integration Code</th>
                <th className="px-6 py-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Link2 size={16} />
                        </div>
                        <div className="max-w-[280px]">
                          <div className="font-semibold text-slate-950 truncate" title={offer.name}>{offer.name}</div>
                          <a
                            href={offer.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline truncate mt-0.5"
                          >
                            {offer.destinationUrl}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={offer.status === "active" ? "success" : "warning"}>
                        {offer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] text-slate-400 uppercase">Caps:</span>
                          <span>Daily: {offer.dailyCap || "∞"} | Hourly: {offer.hourlyCap || "∞"}</span>
                        </div>
                        {offer.startDate && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock size={10} /> {new Date(offer.startDate).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">${offer.revenue.toFixed(2)} Rev / ${offer.payout.toFixed(2)} Pay</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {offer.events && offer.events.length > 0 ? (
                          <span className="text-indigo-600 font-bold">{offer.events.length} Custom Event Tiers</span>
                        ) : (
                          "Default Single Payout"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOfferForCode(offer)}
                        className="gap-1.5 text-xs text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                      >
                        <Code size={13} /> Get Links & Pixel
                      </Button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(offer)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Integration Links Modal */}
      {selectedOfferForCode && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white shadow-2xl animate-fadeIn">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base text-slate-900">Integration Snippets: {selectedOfferForCode.name}</CardTitle>
                <p className="text-xs text-slate-500">Copy redirect URLs, JavaScript pixels, and S2S Postbacks.</p>
              </div>
              <button onClick={() => setSelectedOfferForCode(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 text-xs">
              {/* Redirect Link */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">1. Link Redirect URL (For Affiliates/Publishers)</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800">{getTrackingUrl(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => copyToClipboard(getTrackingUrl(selectedOfferForCode._id), "link")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === "link" ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy
                  </button>
                </div>
              </div>

              {/* JS Pixel Embed */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">2. Client-Side JavaScript Pixel Script</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800">{getScriptTag(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => copyToClipboard(getScriptTag(selectedOfferForCode._id), "js")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === "js" ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy
                  </button>
                </div>
              </div>

              {/* S2S Postback URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">3. Server-to-Server (S2S) Postback URL (For Conversions)</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-indigo-700">{getPostbackUrl(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => copyToClipboard(getPostbackUrl(selectedOfferForCode._id), "postback")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === "postback" ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Create/Edit Modal Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl animate-fadeIn">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingOfferId ? "Edit Campaign" : "Create New Campaign"}
                </h3>
                <p className="text-xs text-slate-500">Configure tracking parameters, rules, and schedules.</p>
              </div>
              <button onClick={closeDrawer} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Step Tabs Indicator */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500">
              {["1. General", "2. Targeting", "3. Capping & Schedule", "4. Multi-Events"].map((title, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i + 1)}
                  className={`flex-1 py-3 border-b-2 text-center transition-colors ${
                    currentStep === i + 1 ? "border-indigo-600 text-indigo-600" : "border-transparent"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Form Steps */}
            <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Campaign Name"
                    placeholder="e.g. Adidas Winter Sale 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Destination URL"
                    placeholder="https://advertiser.com/landing?pub={pub_id}&sub1={sub_id1}"
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                    required
                  />
                  <Input
                    label="Fallback URL (For Filtered Traffic)"
                    placeholder="https://fallback.com/backup"
                    value={formData.fallbackUrl}
                    onChange={(e) => setFormData({ ...formData, fallbackUrl: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Default Revenue ($)"
                      type="number"
                      step="0.1"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    />
                    <Input
                      label="Default Affiliate Payout ($)"
                      type="number"
                      step="0.1"
                      value={formData.payout}
                      onChange={(e) => setFormData({ ...formData, payout: Number(e.target.value) })}
                    />
                  </div>
                  <Select
                    label="Filter Violation Action"
                    value={formData.actionOnFilter}
                    onChange={(e) => setFormData({ ...formData, actionOnFilter: e.target.value as any })}
                    options={[
                      { value: "redirect", label: "Redirect to Fallback URL" },
                      { value: "block", label: "Block with 403 Access Denied" },
                      { value: "log", label: "Log click & proceed to destination" },
                      { value: "drop", label: "Drop Pixel ping silently" }
                    ]}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <Input
                    label="Geo Country Codes (CSV)"
                    placeholder="e.g. US, CA, GB (Leave blank for ALL)"
                    value={formData.geoTargeting}
                    onChange={(e) => setFormData({ ...formData, geoTargeting: e.target.value })}
                  />
                  <Input
                    label="City Restrictions (CSV)"
                    placeholder="e.g. NEW YORK, LONDON"
                    value={formData.cityTargeting}
                    onChange={(e) => setFormData({ ...formData, cityTargeting: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Device Restriction"
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                      options={[
                        { value: "All", label: "All Devices" },
                        { value: "Mobile", label: "Mobile Only" },
                        { value: "Desktop", label: "Desktop Only" }
                      ]}
                    />
                    <Select
                      label="OS Restriction"
                      value={formData.osType}
                      onChange={(e) => setFormData({ ...formData, osType: e.target.value as any })}
                      options={[
                        { value: "All", label: "All Operating Systems" },
                        { value: "iOS", label: "iOS Only" },
                        { value: "Android", label: "Android Only" },
                        { value: "Windows", label: "Windows Only" }
                      ]}
                    />
                  </div>
                  <Input
                    label="Browser Restrictions (CSV)"
                    placeholder="e.g. CHROME, SAFARI"
                    value={formData.browserTargeting}
                    onChange={(e) => setFormData({ ...formData, browserTargeting: e.target.value })}
                  />
                  <Input
                    label="ISP Restrictions (CSV)"
                    placeholder="e.g. VERIZON, COMCAST"
                    value={formData.ispTargeting}
                    onChange={(e) => setFormData({ ...formData, ispTargeting: e.target.value })}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Daily Click Cap (0 = Unlimited)"
                      type="number"
                      value={formData.dailyCap}
                      onChange={(e) => setFormData({ ...formData, dailyCap: Number(e.target.value) })}
                    />
                    <Input
                      label="Hourly Click Cap (0 = Unlimited)"
                      type="number"
                      value={formData.hourlyCap}
                      onChange={(e) => setFormData({ ...formData, hourlyCap: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Campaign Start Date/Time"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                    <Input
                      label="Campaign End Date/Time"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Duplicate IP Filter Window (Minutes)"
                    type="number"
                    placeholder="e.g. 15 (Blocks repeat clicks within 15 mins)"
                    value={formData.duplicateWindowMinutes}
                    onChange={(e) => setFormData({ ...formData, duplicateWindowMinutes: Number(e.target.value) })}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <label className="font-bold text-slate-800 text-xs uppercase tracking-wider block">Multi-Event Conversion Tiers</label>
                  <p className="text-xs text-slate-500">Configure different payout/revenue rates for events like Install, Lead, or Sale.</p>

                  <div className="grid grid-cols-3 gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <Input
                      label="Event Name"
                      placeholder="e.g. lead"
                      value={newEvent.eventName}
                      onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                    />
                    <Input
                      label="Payout ($)"
                      type="number"
                      step="0.1"
                      value={newEvent.payout}
                      onChange={(e) => setNewEvent({ ...newEvent, payout: Number(e.target.value) })}
                    />
                    <div className="flex gap-2">
                      <Input
                        label="Revenue ($)"
                        type="number"
                        step="0.1"
                        value={newEvent.revenue}
                        onChange={(e) => setNewEvent({ ...newEvent, revenue: Number(e.target.value) })}
                      />
                      <Button type="button" onClick={handleAddEvent} className="h-[42px] mt-auto">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  {formData.eventsList.length > 0 && (
                    <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden text-xs">
                      {formData.eventsList.map((ev, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border-b last:border-0 border-slate-100">
                          <div>
                            <span className="font-bold text-slate-900 uppercase">{ev.eventName}</span>
                            <span className="text-slate-500 ml-2">Rev: ${ev.revenue} | Pay: ${ev.payout}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvent(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep}>Previous</Button>
              ) : <div />}

              {currentStep < 4 ? (
                <Button onClick={nextStep}>Next Step</Button>
              ) : (
                <Button onClick={handleCreateOrUpdate} className="bg-indigo-600 hover:bg-indigo-500">Save Campaign</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
