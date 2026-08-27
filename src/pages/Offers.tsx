import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { useToast } from "../components/ui/Toast";
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
  Clock,
  ShieldCheck,
  Shuffle,
  Globe,
  Pause,
  Play,
  RefreshCw
} from "lucide-react";
import { Offer, OfferEvent, TrackingUrlItem, TargetPageRule, TrackingDomain } from "../types";

export default function Offers() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOfferForCode, setSelectedOfferForCode] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [postbackSecret, setPostbackSecret] = useState("npc_postback_sec_2026");

  useEffect(() => {
    axios.get("/api/system-config").then((res) => {
      if (res.data?.postbackSecret) {
        setPostbackSecret(res.data.postbackSecret);
      }
    }).catch(() => {});
  }, []);

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
    sessionCheckEnabled: false,
    sessionTtlMinutes: 1440,
    trackingUrls: [] as TrackingUrlItem[],
    redirectType: "302" as "302" | "307" | "meta" | "double_meta" | "custom_referrer",
    customReferrerUrl: "",
    targetPageRules: [] as TargetPageRule[],
    status: "active" as "active" | "paused"
  });

  // Event creation temporary form state
  const [newEvent, setNewEvent] = useState({ eventName: "", payout: 0, revenue: 0 });

  // Tracking URL creation temporary form state
  const [newTrackingUrl, setNewTrackingUrl] = useState({
    name: "",
    url: "",
    weight: 50,
    deviceType: "All" as "All" | "Mobile" | "Desktop",
    status: "active" as "active" | "paused"
  });

  // TargetPageRule creation temporary form state
  const [newPageRule, setNewPageRule] = useState<Omit<TargetPageRule, 'id'>>({
    path: "",
    weight: 50,
    delayMs: 0,
    matchType: "contains",
    status: "active"
  });

  useEffect(() => {
    fetchOffers();
    fetchDomains();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("/api/offers");
      setOffers(res.data);
    } catch (err: any) {
      showToast("error", "Failed to load campaigns", err?.response?.data?.error || "Please refresh the page.");
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await axios.get("/api/domains");
      setDomains(res.data);
      const defaultDom = res.data.find((d: TrackingDomain) => d.isDefault);
      if (defaultDom) {
        setSelectedDomain(defaultDom.domain);
      }
    } catch (e) {}
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.destinationUrl.trim()) {
      showToast("error", "Required fields missing", "Campaign Name and Destination URL are required.");
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
      sessionCheckEnabled: formData.sessionCheckEnabled,
      sessionTtlMinutes: Number(formData.sessionTtlMinutes) || 1440,
      trackingUrls: formData.trackingUrls,
      redirectType: formData.redirectType,
      customReferrerUrl: formData.customReferrerUrl,
      targetPageRules: formData.targetPageRules,
      status: formData.status
    };

    setSubmitting(true);
    try {
      if (editingOfferId) {
        await axios.put(`/api/offers/${editingOfferId}`, payload);
        showToast("success", "Campaign updated!", `"${payload.name}" has been saved.`);
      } else {
        await axios.post("/api/offers", payload);
        showToast("success", "Campaign created!", `"${payload.name}" is now active.`);
      }
      closeDrawer();
      fetchOffers();
    } catch (err: any) {
      const raw = err.response?.data?.error || err.response?.data || err.message;
      const errMsg = typeof raw === "string" ? raw : (raw?.message || "Failed to save campaign. Please check your inputs or log in again.");
      showToast("error", "Save failed", errMsg);
    } finally {
      setSubmitting(false);
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
      sessionCheckEnabled: Boolean(offer.sessionCheckEnabled),
      sessionTtlMinutes: offer.sessionTtlMinutes || 1440,
      trackingUrls: offer.trackingUrls || [],
      redirectType: offer.redirectType || "302",
      customReferrerUrl: offer.customReferrerUrl || "",
      targetPageRules: offer.targetPageRules || [],
      status: offer.status
    });
    setCurrentStep(1);
    setShowDrawer(true);
  };

  const handleDeleteOffer = async (id: string, name: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    try {
      await axios.delete(`/api/offers/${id}`);
      showToast("success", "Campaign deleted", `"${name}" has been permanently removed.`);
      fetchOffers();
    } catch (err: any) {
      showToast("error", "Delete failed", err?.response?.data?.error || "Please try again.");
    }
  };

  const handleTogglePause = async (offer: Offer) => {
    const newStatus = offer.status === "active" ? "paused" : "active";
    setTogglingId(offer._id);
    try {
      await axios.put(`/api/offers/${offer._id}`, { ...offer, status: newStatus });
      showToast("success", newStatus === "active" ? "Campaign activated" : "Campaign paused", `"${offer.name}" is now ${newStatus}.`);
      fetchOffers();
    } catch (err: any) {
      showToast("error", "Status change failed", err?.response?.data?.error || "Please try again.");
    } finally {
      setTogglingId(null);
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

  const handleAddTrackingUrl = () => {
    if (!newTrackingUrl.name.trim() || !newTrackingUrl.url.trim()) {
      showToast("error", "URL fields missing", "Label Name and Target URL are required for rotation.");
      return;
    }
    const item: TrackingUrlItem = {
      id: "url-" + Math.random().toString(36).substring(2, 9),
      name: newTrackingUrl.name.trim(),
      url: newTrackingUrl.url.trim(),
      weight: Number(newTrackingUrl.weight) || 50,
      deviceType: newTrackingUrl.deviceType,
      status: newTrackingUrl.status
    };
    setFormData(prev => ({
      ...prev,
      trackingUrls: [...prev.trackingUrls, item]
    }));
    setNewTrackingUrl({ name: "", url: "", weight: 50, deviceType: "All", status: "active" });
  };

  const handleRemoveTrackingUrl = (id: string) => {
    setFormData(prev => ({
      ...prev,
      trackingUrls: prev.trackingUrls.filter(u => u.id !== id)
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
      sessionCheckEnabled: false,
      sessionTtlMinutes: 1440,
      trackingUrls: [],
      redirectType: "302",
      customReferrerUrl: "",
      targetPageRules: [],
      status: "active"
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopiedId(id);
    showToast("success", "Copied to Clipboard!", "Integration code copied.");
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

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const filteredOffers = offers.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.destinationUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveBaseUrl = () => {
    if (selectedDomain && selectedDomain.trim()) {
      const clean = selectedDomain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
      return `${window.location.protocol}//${clean}`;
    }
    return window.location.origin;
  };

  const getTrackingUrl = (offerId: string) => `${getActiveBaseUrl()}/track?offer_id=${offerId}&pub_id={pub_id}&sub_id1={sub_id1}`;
  const getPostbackUrl = (offerId: string) => `${getActiveBaseUrl()}/api/postback?click_id={click_id}&token=${postbackSecret}&revenue=10&payout=5`;
  // Stealth CDN URL — looks like a neutral analytics widget in page source & DevTools
  const getScriptTag = (offerId: string) => `<script src="${getActiveBaseUrl()}/cdn/v2/wgt.js?id=${offerId}" async></script>`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
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
                <th className="px-6 py-4 text-right">Metrics</th>
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
                      <div className="font-bold text-slate-900">₹{offer.revenue.toFixed(2)} Rev / ₹{offer.payout.toFixed(2)} Pay</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {offer.totalConversions !== undefined && offer.totalConversions > 0 ? (
                          <span className="text-emerald-600 font-bold">{offer.totalConversions} conv • CR: {(offer.conversionRate || 0).toFixed(1)}%</span>
                        ) : offer.events && offer.events.length > 0 ? (
                          <span className="text-indigo-600 font-bold">{offer.events.length} Custom Event Tiers</span>
                        ) : (
                          "No conversions yet"
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
                          onClick={() => handleTogglePause(offer)}
                          disabled={togglingId === offer._id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            offer.status === "active"
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={offer.status === "active" ? "Pause Campaign" : "Activate Campaign"}
                        >
                          {togglingId === offer._id
                            ? <RefreshCw size={15} className="animate-spin" />
                            : offer.status === "active"
                              ? <Pause size={15} />
                              : <Play size={15} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(offer)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit size={16} />
                        </button>
                        {confirmDeleteId === offer._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteOffer(offer._id, offer.name)}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 px-1.5 py-0.5 rounded transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteOffer(offer._id, offer.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
              {/* Domain Selector */}
              {domains.length > 0 && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Multi-Domain Tracking Link Generator</span>
                      <span className="text-[11px] text-slate-500">Select tracking domain to format all generated links:</span>
                    </div>
                  </div>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    options={[
                      { value: "", label: `Default Server (${window.location.host})` },
                      ...domains.map(d => ({ value: d.domain, label: `${d.domain} ${d.isDefault ? '(Default)' : ''}` }))
                    ]}
                    className="w-56 text-xs font-mono bg-white"
                  />
                </div>
              )}

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

      {/* Campaign Create/Edit Centered Multi-Step Modal */}
      {showDrawer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl h-[85vh] max-h-[820px] flex flex-col rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  {editingOfferId ? "Edit Campaign" : "Create New Campaign"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Set up your campaign link, landing pages, tracking rules, and payouts.</p>
              </div>
              <button 
                onClick={closeDrawer} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Tabs Indicator */}
            <div className="flex border-b border-slate-200/80 text-xs font-medium text-slate-500 bg-white px-6">
              {[
                { step: 1, label: "1. Setup & Link" },
                { step: 2, label: "2. Pages & Events" },
                { step: 3, label: "3. Caps & Protection" },
                { step: 4, label: "4. Audience & Rules" },
              ].map(({ step, label }) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`py-3.5 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    currentStep === step 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form Content Body */}
            <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* STEP 1: SETUP & LINK */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <Input
                    label="Campaign Name"
                    placeholder="e.g. Winter Sale Promo 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Main Landing Page URL"
                      placeholder="https://advertiser.com/landing?pub={pub_id}&sub1={sub_id1}"
                      value={formData.destinationUrl}
                      onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                      required
                    />
                    <Input
                      label="Backup URL (For Blocked Visitors)"
                      placeholder="https://fallback.com/backup"
                      value={formData.fallbackUrl}
                      onChange={(e) => setFormData({ ...formData, fallbackUrl: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Advertiser Revenue (₹)"
                      type="number"
                      step="0.01"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    />
                    <Input
                      label="Publisher Payout (₹)"
                      type="number"
                      step="0.01"
                      value={formData.payout}
                      onChange={(e) => setFormData({ ...formData, payout: Number(e.target.value) })}
                    />
                  </div>

                  <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <label className="font-bold text-slate-900 text-xs uppercase tracking-wider">Link Redirect Method</label>
                    </div>
                    <Select
                      label=""
                      value={formData.redirectType}
                      onChange={(e) => setFormData({ ...formData, redirectType: e.target.value as any })}
                      options={[
                        { value: "302", label: "Standard (Direct 302 - Strips Referrer via Policy Header)" },
                        { value: "307", label: "Strict Direct (HTTP 307 - Preserves Request Method)" },
                        { value: "meta", label: "Hide Source Domain (Meta Refresh)" },
                        { value: "double_meta", label: "Complete Anonymous (Blank Referrer)" },
                        { value: "custom_referrer", label: "Custom Referrer Brand" }
                      ]}
                    />

                    {formData.redirectType === "custom_referrer" && (
                      <Input
                        label="Custom Referrer Brand Domain / URL"
                        placeholder="https://mycustombrand.com"
                        value={formData.customReferrerUrl}
                        onChange={(e) => setFormData({ ...formData, customReferrerUrl: e.target.value })}
                      />
                    )}
                  </div>

                  <Select
                    label="Action for Blocked Visitors"
                    value={formData.actionOnFilter}
                    onChange={(e) => setFormData({ ...formData, actionOnFilter: e.target.value as any })}
                    options={[
                      { value: "redirect", label: "Send to Backup URL" },
                      { value: "block", label: "Show Access Denied (403)" },
                      { value: "log", label: "Log Click & Allow Through" },
                      { value: "drop", label: "Drop Request Silently" }
                    ]}
                  />
                </div>
              )}

              {/* STEP 2: PAGES & EVENTS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Landing Page Rotation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-indigo-600" />
                      <div>
                        <label className="font-bold text-slate-900 text-xs uppercase tracking-wider block">Landing Page Rotation & Split Testing</label>
                        <p className="text-xs text-slate-500">Distribute visitors across multiple landing pages based on percentage weights (e.g. 50% Page A, 50% Page B).</p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-700 text-xs block">Add Additional Landing Page</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Page Label"
                          placeholder="e.g. Promo Landing Page B"
                          value={newTrackingUrl.name}
                          onChange={(e) => setNewTrackingUrl({ ...newTrackingUrl, name: e.target.value })}
                        />
                        <Input
                          label="Destination URL"
                          placeholder="https://advertiser.com/landing-b?pub={pub_id}"
                          value={newTrackingUrl.url}
                          onChange={(e) => setNewTrackingUrl({ ...newTrackingUrl, url: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <Input
                          label="Weight Percentage (1 - 100)"
                          type="number"
                          min="1"
                          max="100"
                          value={newTrackingUrl.weight}
                          onChange={(e) => setNewTrackingUrl({ ...newTrackingUrl, weight: Number(e.target.value) })}
                        />
                        <Button type="button" onClick={handleAddTrackingUrl} className="bg-indigo-600 hover:bg-indigo-500 text-xs gap-1 cursor-pointer">
                          <Plus size={14} /> Add Rotation Page
                        </Button>
                      </div>
                    </div>

                    {formData.trackingUrls.length > 0 ? (
                      <div className="space-y-2 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {formData.trackingUrls.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-white border-b last:border-0 border-slate-100">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                {item.name}
                                <Badge variant="primary" className="bg-indigo-50 text-indigo-700 text-[10px]">
                                  Weight: {item.weight}%
                                </Badge>
                              </div>
                              <div className="text-slate-500 font-mono truncate text-[11px] mt-0.5">{item.url}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTrackingUrl(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No additional rotation pages added. All visitors will go to the Main Landing Page URL.
                      </div>
                    )}
                  </div>

                  {/* Custom Conversion Events */}
                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <div>
                        <label className="font-bold text-slate-900 text-xs uppercase tracking-wider block">Custom Conversion Events & Payouts</label>
                        <p className="text-xs text-slate-500">Assign specific payout amounts for different user actions (e.g. Lead, Sale, App Install).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <Input
                        label="Event Name"
                        placeholder="e.g. signup, sale, install"
                        value={newEvent.eventName}
                        onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                      />
                      <Input
                        label="Revenue (₹)"
                        type="number"
                        step="0.01"
                        value={newEvent.revenue}
                        onChange={(e) => setNewEvent({ ...newEvent, revenue: Number(e.target.value) })}
                      />
                      <Input
                        label="Payout (₹)"
                        type="number"
                        step="0.01"
                        value={newEvent.payout}
                        onChange={(e) => setNewEvent({ ...newEvent, payout: Number(e.target.value) })}
                      />
                    </div>
                    <Button type="button" onClick={handleAddEvent} variant="outline" className="w-full text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer">
                      <Plus size={14} /> Add Event Payout Rule
                    </Button>

                    {formData.eventsList.length > 0 && (
                      <div className="space-y-2 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {formData.eventsList.map((ev, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white border-b last:border-0 border-slate-100">
                            <div className="font-bold text-slate-800 flex items-center gap-3">
                              <Badge variant="primary" className="bg-indigo-100 text-indigo-800 font-mono text-[11px]">
                                &event={ev.eventName}
                              </Badge>
                              <span>Revenue: <b>₹{ev.revenue}</b></span>
                              <span>Payout: <b>₹{ev.payout}</b></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(i)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: CAPS & PROTECTION */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border border-indigo-100 bg-indigo-50/50 p-4 rounded-xl space-y-3">
                    <Switch
                      checked={formData.sessionCheckEnabled}
                      onChange={(val) => setFormData({ ...formData, sessionCheckEnabled: val })}
                      label="Require Session Cookie (Session Validation)"
                      description="Only count conversions from visitors who have an active, valid tracking cookie."
                    />

                    {formData.sessionCheckEnabled && (
                      <Input
                        label="Session Lifetime (Minutes)"
                        type="number"
                        placeholder="1440 (Default 24 Hours)"
                        value={formData.sessionTtlMinutes}
                        onChange={(e) => setFormData({ ...formData, sessionTtlMinutes: Number(e.target.value) })}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Daily Limit (Max Clicks per Day, 0 = Unlimited)"
                      type="number"
                      value={formData.dailyCap}
                      onChange={(e) => setFormData({ ...formData, dailyCap: Number(e.target.value) })}
                    />
                    <Input
                      label="Hourly Limit (Max Clicks per Hour, 0 = Unlimited)"
                      type="number"
                      value={formData.hourlyCap}
                      onChange={(e) => setFormData({ ...formData, hourlyCap: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    label="Repeat Click Protection (Minutes)"
                    type="number"
                    placeholder="e.g. 15 (Ignores repeat clicks from same IP within 15 mins)"
                    value={formData.duplicateWindowMinutes}
                    onChange={(e) => setFormData({ ...formData, duplicateWindowMinutes: Number(e.target.value) })}
                  />
                </div>
              )}

              {/* STEP 4: AUDIENCE & RULES */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Allowed Countries (CSV)"
                      placeholder="e.g. US, CA, GB (Leave blank for ALL)"
                      value={formData.geoTargeting}
                      onChange={(e) => setFormData({ ...formData, geoTargeting: e.target.value })}
                    />
                    <Input
                      label="Allowed Cities (CSV)"
                      placeholder="e.g. NEW YORK, LONDON"
                      value={formData.cityTargeting}
                      onChange={(e) => setFormData({ ...formData, cityTargeting: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Target Device"
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                      options={[
                        { value: "All", label: "All Devices" },
                        { value: "Mobile", label: "Mobile Only" },
                        { value: "Desktop", label: "Desktop Only" }
                      ]}
                    />
                    <Select
                      label="Target Operating System"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Allowed Browsers (CSV)"
                      placeholder="e.g. CHROME, SAFARI"
                      value={formData.browserTargeting}
                      onChange={(e) => setFormData({ ...formData, browserTargeting: e.target.value })}
                    />
                    <Input
                      label="Allowed Internet Providers (CSV)"
                      placeholder="e.g. VERIZON, COMCAST"
                      value={formData.ispTargeting}
                      onChange={(e) => setFormData({ ...formData, ispTargeting: e.target.value })}
                    />
                  </div>

                  {/* Pixel Trigger Controls */}
                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Page Pixel & Frequency Settings</h4>
                    
                    <Input
                      label="Specific Webpages Only (URL Path Whitelist CSV)"
                      placeholder="e.g. /checkout, /thank-you (Leave blank for ALL pages)"
                      value={formData.targetPages}
                      onChange={(e) => setFormData({ ...formData, targetPages: e.target.value })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Wait Time Before Firing (ms)"
                        type="number"
                        placeholder="0 (Instant)"
                        value={formData.triggerDelayMs}
                        onChange={(e) => setFormData({ ...formData, triggerDelayMs: Number(e.target.value) })}
                      />
                      <Input
                        label="Repeat Fire Interval (ms)"
                        type="number"
                        placeholder="0 (Disabled)"
                        value={formData.triggerIntervalMs}
                        onChange={(e) => setFormData({ ...formData, triggerIntervalMs: Number(e.target.value) })}
                      />
                      <Input
                        label="Maximum Times to Fire"
                        type="number"
                        placeholder="0 (Unlimited)"
                        value={formData.triggerRepeatCount}
                        onChange={(e) => setFormData({ ...formData, triggerRepeatCount: Number(e.target.value) })}
                      />
                    </div>

                    <Select
                      label="How Often Pixel Fires"
                      value={formData.frequencyCap}
                      onChange={(e) => setFormData({ ...formData, frequencyCap: e.target.value as any })}
                      options={[
                        { value: "unlimited", label: "Every Page Load" },
                        { value: "once_per_session", label: "Once per Visit (Session)" },
                        { value: "once_per_user", label: "Once per Person (Forever)" }
                      ]}
                    />
                  </div>

                  {/* Weighted Custom Page Rules */}
                  <div className="border-t border-slate-200 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Shuffle size={13} className="text-indigo-500" />
                        Custom Page Rules
                      </h4>
                      <span className="text-[10px] text-slate-400">{(formData.targetPageRules || []).length} rule{(formData.targetPageRules || []).length !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Target specific pages with weights and custom delay overrides — e.g. 60% weight on <code>/checkout</code>, 40% weight on <code>/thank-you</code>.</p>

                    {/* Existing rules list */}
                    {(formData.targetPageRules || []).length > 0 && (
                      <div className="space-y-2">
                        {(formData.targetPageRules || []).map((rule) => (
                          <div key={rule.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono font-bold text-indigo-700 truncate">{rule.path}</code>
                                <span className="text-[10px] text-slate-400 shrink-0">{rule.matchType}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500">Weight: <b>{rule.weight}%</b></span>
                                <span className="text-[10px] text-slate-500">Delay: <b>{rule.delayMs}ms</b></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  targetPageRules: (prev.targetPageRules || []).map(r =>
                                    r.id === rule.id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r
                                  )
                                }))}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer ${rule.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                              >{rule.status === "active" ? "Active" : "Paused"}</button>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  targetPageRules: (prev.targetPageRules || []).filter(r => r.id !== rule.id)
                                }))}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              ><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new rule row */}
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Add Page Rule</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="URL Path"
                          placeholder="/checkout"
                          value={newPageRule.path}
                          onChange={(e) => setNewPageRule(p => ({ ...p, path: e.target.value }))}
                        />
                        <Select
                          label="Match Type"
                          value={newPageRule.matchType}
                          onChange={(e) => setNewPageRule(p => ({ ...p, matchType: e.target.value as any }))}
                          options={[
                            { value: "contains", label: "Contains (default)" },
                            { value: "exact", label: "Exact match" },
                            { value: "startsWith", label: "Starts with" }
                          ]}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Weight (%)"
                          type="number"
                          placeholder="50"
                          value={newPageRule.weight}
                          onChange={(e) => setNewPageRule(p => ({ ...p, weight: Number(e.target.value) }))}
                        />
                        <Input
                          label="Delay Override (ms)"
                          type="number"
                          placeholder="0 (use global)"
                          value={newPageRule.delayMs}
                          onChange={(e) => setNewPageRule(p => ({ ...p, delayMs: Number(e.target.value) }))}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                        onClick={() => {
                          if (!newPageRule.path.trim()) return;
                          const rule: TargetPageRule = {
                            id: "pr-" + Math.random().toString(36).substring(2, 8),
                            path: newPageRule.path.trim(),
                            weight: Number(newPageRule.weight) || 50,
                            delayMs: Number(newPageRule.delayMs) || 0,
                            matchType: newPageRule.matchType,
                            status: "active"
                          };
                          setFormData(prev => ({ ...prev, targetPageRules: [...(prev.targetPageRules || []), rule] }));
                          setNewPageRule({ path: "", weight: 50, delayMs: 0, matchType: "contains", status: "active" });
                        }}
                      >
                        <Plus size={14} /> Add Page Rule
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="cursor-pointer">Previous</Button>
              ) : <div />}

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 cursor-pointer">Next Step</Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateOrUpdate}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 gap-2 cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {submitting ? "Saving..." : "Save Campaign"}
                </Button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
