import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { useToast } from "../components/ui/Toast";
import { copyToClipboard } from "../utils/clipboard";
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
  Code,
  Clock,
  Shuffle,
  Globe,
  Pause,
  Play,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { Offer, OfferEvent, TrackingUrlItem, TargetPageRule, TrackingDomain } from "../types";
import { CountrySelect } from "../components/ui/CountrySelect";
import { normalizeCountryCode } from "../utils/countries";

function toLocalDatetimeInput(isoString?: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toUtcIsoString(localString?: string | null): string | null {
  if (!localString || !localString.trim()) return null;
  const date = new Date(localString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

const POPULAR_BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Opera", "Mobile Safari", "Samsung Internet"];
const POPULAR_CITIES = ["New York", "London", "Singapore", "Mumbai", "Tokyo", "Sydney", "Toronto", "Dubai", "Paris", "Berlin"];
const POPULAR_ISPS = ["Comcast", "Verizon", "AT&T", "Spectrum", "Vodafone", "Jio", "Airtel", "Deutsche Telekom"];

export default function Offers() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOfferForCode, setSelectedOfferForCode] = useState<Offer | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [postbackSecret, setPostbackSecret] = useState("npc_postback_sec_2026");
  const [formErrors, setFormErrors] = useState<{ name?: string; destinationUrl?: string }>({});

  // Input states for pickers
  const [cityInput, setCityInput] = useState("");
  const [browserInput, setBrowserInput] = useState("");
  const [ispInput, setIspInput] = useState("");

  useEffect(() => {
    axios.get("/api/system-config").then((res) => {
      if (res.data?.postbackSecret) {
        setPostbackSecret(res.data.postbackSecret);
      }
    }).catch(() => {});
  }, []);

  // Form state
  const initialFormState = {
    name: "",
    destinationUrl: "",
    fallbackUrl: "",
    payout: 4.5,
    revenue: 12.0,
    geoTargeting: [] as string[],
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
  };

  const [formData, setFormData] = useState(initialFormState);

  // Sub-items temporary forms
  const [newEvent, setNewEvent] = useState({ eventName: "", payout: 0, revenue: 0 });
  const [newTrackingUrl, setNewTrackingUrl] = useState({
    name: "",
    url: "",
    weight: 50,
    deviceType: "All" as "All" | "Mobile" | "Desktop",
    status: "active" as "active" | "paused"
  });

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/offers");
      setOffers(res.data);
    } catch (err: any) {
      showToast("error", "Failed to load campaigns", err?.response?.data?.error || "Network error.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchOffers();
    fetchDomains();
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedOfferForCode) {
          setSelectedOfferForCode(null);
        } else if (showDrawer) {
          handleCloseDrawer();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDrawer, selectedOfferForCode, formData]);

  // Lock body scroll when modal or drawer is open
  useEffect(() => {
    if (showDrawer || selectedOfferForCode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showDrawer, selectedOfferForCode]);

  const handleDestinationUrlChange = (newUrl: string) => {
    setFormData(prev => {
      let urls = [...prev.trackingUrls];
      const primaryIndex = urls.findIndex(u => u.id === "primary");
      if (primaryIndex >= 0) {
        urls[primaryIndex] = { ...urls[primaryIndex], url: newUrl };
      } else if (urls.length > 0) {
        urls.unshift({
          id: "primary",
          name: "Primary Landing Page",
          url: newUrl,
          weight: Math.max(1, 100 - urls.reduce((sum, u) => sum + (Number(u.weight) || 0), 0)),
          deviceType: "All",
          status: "active"
        });
      }
      return {
        ...prev,
        destinationUrl: newUrl,
        trackingUrls: urls
      };
    });
  };

  const handleAddTrackingUrl = () => {
    if (!newTrackingUrl.name.trim() || !newTrackingUrl.url.trim()) {
      showToast("warning", "Missing fields", "Please provide both a label and a destination URL.");
      return;
    }

    let currentUrls = [...formData.trackingUrls];
    const hasPrimary = currentUrls.some(u => u.id === "primary" || u.url === formData.destinationUrl);
    if (!hasPrimary && formData.destinationUrl.trim()) {
      currentUrls.unshift({
        id: "primary",
        name: "Primary Landing Page",
        url: formData.destinationUrl.trim(),
        weight: 50,
        deviceType: "All",
        status: "active"
      });
    }

    const item: TrackingUrlItem = {
      id: "url-" + Math.random().toString(36).substring(2, 9),
      name: newTrackingUrl.name.trim(),
      url: newTrackingUrl.url.trim(),
      weight: Number(newTrackingUrl.weight) || (currentUrls.length === 1 ? 50 : Math.max(10, Math.floor(100 / (currentUrls.length + 1)))),
      deviceType: newTrackingUrl.deviceType,
      status: newTrackingUrl.status
    };

    const updated = [...currentUrls, item];
    if (updated.length === 2 && updated[0].id === "primary") {
      updated[0].weight = 50;
      updated[1].weight = 50;
    }

    setFormData(prev => ({ ...prev, trackingUrls: updated }));
    setNewTrackingUrl({ name: "", url: "", weight: 50, deviceType: "All", status: "active" });
    showToast("success", "Rotation URL added", `Added "${item.name}" to rotation pool.`);
  };

  const handleRemoveTrackingUrl = (id: string) => {
    if (id === "primary") {
      showToast("warning", "Cannot remove primary page", "Edit its URL in Step 1.");
      return;
    }
    const remaining = formData.trackingUrls.filter(u => u.id !== id);
    if (remaining.length === 1 && remaining[0].id === "primary") {
      remaining[0].weight = 100;
    }
    setFormData(prev => ({ ...prev, trackingUrls: remaining }));
    showToast("info", "Landing page removed", "Removed page from rotation.");
  };

  const handleUpdateTrackingUrlWeight = (id: string, newWeight: number) => {
    const safeWeight = Math.max(1, Math.min(100, Math.round(newWeight) || 1));
    setFormData(prev => ({
      ...prev,
      trackingUrls: prev.trackingUrls.map(u => u.id === id ? { ...u, weight: safeWeight } : u)
    }));
  };

  const handleEqualizeTrackingUrls = () => {
    if (formData.trackingUrls.length === 0) return;
    const count = formData.trackingUrls.length;
    const baseShare = Math.floor(100 / count);
    const remainder = 100 - (baseShare * count);
    setFormData(prev => ({
      ...prev,
      trackingUrls: prev.trackingUrls.map((u, i) => ({
        ...u,
        weight: baseShare + (i < remainder ? 1 : 0)
      }))
    }));
    showToast("success", "Weights balanced", `Split 100% equally across ${count} pages.`);
  };

  const isFormDirty = () => {
    return Boolean(
      formData.name.trim() ||
      formData.destinationUrl.trim() ||
      formData.fallbackUrl.trim() ||
      formData.trackingUrls.length > 0 ||
      formData.eventsList.length > 0 ||
      formData.cityTargeting ||
      formData.browserTargeting ||
      formData.ispTargeting
    );
  };

  const handleCloseDrawer = () => {
    if (isFormDirty() && !editingOfferId) {
      if (!window.confirm("You have unsaved changes in this campaign form. Discard?")) {
        return;
      }
    }
    setShowDrawer(false);
    setEditingOfferId(null);
    setCurrentStep(1);
    setFormErrors({});
    setFormData(initialFormState);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; destinationUrl?: string } = {};
    if (!formData.name.trim()) errors.name = "Campaign name is required.";
    if (!formData.destinationUrl.trim()) errors.destinationUrl = "Landing page URL is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setCurrentStep(1);
      showToast("error", "Missing required fields", "Please fill in the required fields on Step 1.");
      return;
    }

    const parseCSV = (str: string) => str ? str.split(",").map(g => g.trim().toUpperCase()).filter(g => g.length > 0) : [];

    const payload = {
      name: formData.name.trim(),
      destinationUrl: formData.destinationUrl.trim(),
      fallbackUrl: formData.fallbackUrl.trim() || formData.destinationUrl.trim(),
      payout: Number(formData.payout) || 0,
      revenue: Number(formData.revenue) || 10,
      geoTargeting: formData.geoTargeting.map(normalizeCountryCode).filter(Boolean),
      cityTargeting: parseCSV(formData.cityTargeting),
      deviceType: formData.deviceType,
      osType: formData.osType,
      browserTargeting: parseCSV(formData.browserTargeting),
      ispTargeting: parseCSV(formData.ispTargeting),
      dailyCap: Number(formData.dailyCap) || 0,
      hourlyCap: Number(formData.hourlyCap) || 0,
      startDate: toUtcIsoString(formData.startDate),
      endDate: toUtcIsoString(formData.endDate),
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
        showToast("success", "Campaign updated", `"${payload.name}" has been saved.`);
      } else {
        await axios.post("/api/offers", payload);
        showToast("success", "Campaign created", `"${payload.name}" is now active.`);
      }
      setShowDrawer(false);
      setEditingOfferId(null);
      setCurrentStep(1);
      setFormErrors({});
      setFormData(initialFormState);
      fetchOffers();
    } catch (err: any) {
      const raw = err.response?.data?.error || err.response?.data || err.message;
      const errMsg = typeof raw === "string" ? raw : (raw?.message || "Failed to save campaign.");
      showToast("error", "Save failed", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (offer: Offer) => {
    setEditingOfferId(offer._id);
    setFormErrors({});

    const initialTrackingUrls: TrackingUrlItem[] = Array.isArray(offer.trackingUrls) ? [...offer.trackingUrls] : [];
    const hasPrimary = initialTrackingUrls.some(u => u.id === "primary" || u.url === offer.destinationUrl);
    if (!hasPrimary && offer.destinationUrl) {
      if (initialTrackingUrls.length > 0) {
        const variantSum = initialTrackingUrls.reduce((sum, u) => sum + (Number(u.weight) || 0), 0);
        initialTrackingUrls.unshift({
          id: "primary",
          name: "Primary Landing Page",
          url: offer.destinationUrl,
          weight: Math.max(1, 100 - variantSum),
          deviceType: "All",
          status: "active"
        });
      } else {
        initialTrackingUrls.push({
          id: "primary",
          name: "Primary Landing Page",
          url: offer.destinationUrl,
          weight: 100,
          deviceType: "All",
          status: "active"
        });
      }
    }

    setFormData({
      name: offer.name,
      destinationUrl: offer.destinationUrl,
      fallbackUrl: offer.fallbackUrl,
      payout: offer.payout,
      revenue: offer.revenue,
      geoTargeting: (offer.geoTargeting || []).map(normalizeCountryCode).filter(Boolean),
      cityTargeting: (offer.cityTargeting || []).join(", "),
      deviceType: offer.deviceType,
      osType: offer.osType,
      browserTargeting: (offer.browserTargeting || []).join(", "),
      ispTargeting: (offer.ispTargeting || []).join(", "),
      dailyCap: offer.dailyCap || 0,
      hourlyCap: offer.hourlyCap || 0,
      startDate: toLocalDatetimeInput(offer.startDate),
      endDate: toLocalDatetimeInput(offer.endDate),
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
      trackingUrls: initialTrackingUrls,
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
      showToast("success", "Campaign deleted", `"${name}" removed.`);
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
      eventsList: [
        ...prev.eventsList,
        {
          eventName: newEvent.eventName.trim(),
          payout: Number(newEvent.payout) || 0,
          revenue: Number(newEvent.revenue) || 0
        }
      ]
    }));
    setNewEvent({ eventName: "", payout: 0, revenue: 0 });
    showToast("success", "Event rule added", `"${newEvent.eventName.trim()}" event attached.`);
  };

  const handleRemoveEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eventsList: prev.eventsList.filter((_, i) => i !== index)
    }));
    showToast("info", "Event removed", "Event rule deleted.");
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      showToast("success", "Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    }
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
  const getScriptTag = (offerId: string) => `<script src="${getActiveBaseUrl()}/cdn/v2/wgt.js?id=${offerId}" async></script>`;
  const getImagePixelTag = (offerId: string) => `<img src="${getActiveBaseUrl()}/px?offer_id=${offerId}&fmt=img" width="1" height="1" style="display:none;" alt="" />`;
  const getIframePixelTag = (offerId: string) => `<iframe src="${getActiveBaseUrl()}/px?offer_id=${offerId}&fmt=iframe" width="1" height="1" style="display:none;"></iframe>`;

  // Targeting Helper functions for City, Browser, and ISP
  const getTargetingList = (str: string) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];
  
  const toggleItemInList = (currentStr: string, item: string) => {
    const list = getTargetingList(currentStr);
    const upper = item.trim().toUpperCase();
    const exists = list.some(x => x.toUpperCase() === upper);
    const updated = exists ? list.filter(x => x.toUpperCase() !== upper) : [...list, item.trim()];
    return updated.join(", ");
  };

  const addItemToList = (currentStr: string, item: string) => {
    if (!item.trim()) return currentStr;
    const list = getTargetingList(currentStr);
    const upper = item.trim().toUpperCase();
    if (list.some(x => x.toUpperCase() === upper)) return currentStr;
    return [...list, item.trim()].join(", ");
  };

  const removeItemFromList = (currentStr: string, item: string) => {
    const list = getTargetingList(currentStr);
    const upper = item.trim().toUpperCase();
    return list.filter(x => x.toUpperCase() !== upper).join(", ");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h2>
          <p className="text-sm text-slate-500">Manage tracking links, landing page rotation, and targeting rules.</p>
        </div>
        <Button onClick={() => setShowDrawer(true)} className="gap-2 shadow-xs cursor-pointer">
          <Plus size={16} /> New Campaign
        </Button>
      </header>

      {/* Campaign List Table */}
      <Card className="flex flex-col overflow-hidden border-slate-200 shadow-2xs">
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-800 transition-all placeholder:text-slate-400"
                aria-label="Search campaigns"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[860px]">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Campaign</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Schedule & Caps</th>
                <th className="px-6 py-3.5 text-right">Default Values</th>
                <th className="px-6 py-3.5 text-center">Tracking Snippets</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={15} className="animate-spin text-slate-600" />
                      <span>Loading campaigns...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium text-sm">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-slate-50/60 transition-colors">
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
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span className="truncate">{offer.destinationUrl}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={offer.status === "active" ? "success" : "warning"}>
                        {offer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="space-y-1">
                        {offer.startDate && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={12} className="text-slate-500" />
                            <span>Starts: {new Date(offer.startDate).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        )}
                        <div className="text-slate-500">
                          Daily Cap: {offer.dailyCap ? `${offer.dailyCap.toLocaleString()} clicks` : "Unlimited"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      <div>Rev: ₹{(Number(offer.revenue) || 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500">Payout: ₹{(Number(offer.payout) || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOfferForCode(offer)}
                        className="gap-1.5 text-xs text-slate-700 bg-white"
                        aria-label="View tracking snippets and postback"
                      >
                        <Code size={13} /> Snippets & Links
                      </Button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleTogglePause(offer)}
                          disabled={togglingId === offer._id}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={offer.status === "active" ? "Pause Campaign" : "Activate Campaign"}
                          aria-label={offer.status === "active" ? "Pause Campaign" : "Activate Campaign"}
                        >
                          {togglingId === offer._id ? (
                            <RefreshCw size={15} className="animate-spin text-slate-600" />
                          ) : offer.status === "active" ? (
                            <Pause size={15} />
                          ) : (
                            <Play size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditClick(offer)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Campaign"
                          aria-label="Edit Campaign"
                        >
                          <Edit size={15} />
                        </button>
                        {confirmDeleteId === offer._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteOffer(offer._id, offer.name)}
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
                            onClick={() => handleDeleteOffer(offer._id, offer.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Campaign"
                            aria-label={`Delete campaign ${offer.name}`}
                          >
                            <Trash2 size={15} />
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
      {selectedOfferForCode && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOfferForCode(null);
          }}
        >
          <Card className="max-w-2xl w-full bg-white shadow-2xl animate-scaleIn border-slate-200 my-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base text-slate-900">Integration Snippets: {selectedOfferForCode.name}</CardTitle>
                <p className="text-xs text-slate-500">Tracking URLs, JavaScript pixels, and S2S postbacks.</p>
              </div>
              <button
                onClick={() => setSelectedOfferForCode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent className="space-y-5 pt-4 text-xs">
              {/* Domain Selector */}
              {domains.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-slate-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Tracking Domain</span>
                      <span className="text-[11px] text-slate-500">Select domain to format generated links:</span>
                    </div>
                  </div>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    options={[
                      { value: "", label: `Default Host (${window.location.host})` },
                      ...domains.map(d => ({ value: d.domain, label: `${d.domain} ${d.isDefault ? '(Default)' : ''}` }))
                    ]}
                    className="w-56 text-xs font-mono bg-white"
                  />
                </div>
              )}

              {/* Redirect Link */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 block text-xs">1. Direct Tracking Link (For Affiliates/Publishers)</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800 text-xs">{getTrackingUrl(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => handleCopy(getTrackingUrl(selectedOfferForCode._id), "link")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copiedId === "link" ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />} Copy
                  </button>
                </div>
              </div>

              {/* JS Pixel Embed */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 block text-xs">2. Client-Side JavaScript Pixel</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800 text-xs">{getScriptTag(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => handleCopy(getScriptTag(selectedOfferForCode._id), "js")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copiedId === "js" ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />} Copy
                  </button>
                </div>
              </div>

              {/* Image Pixel */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 block text-xs">3. Image Pixel Tag (&lt;img&gt;)</label>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800 text-xs">{getImagePixelTag(selectedOfferForCode._id)}</span>
                  <button
                    onClick={() => handleCopy(getImagePixelTag(selectedOfferForCode._id), "img")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copiedId === "img" ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />} Copy
                  </button>
                </div>
              </div>

              {/* S2S Postback URL with Secret Masking */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 block text-xs">4. Server-to-Server (S2S) Postback URL</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    aria-label={showSecret ? "Hide secret token" : "Show secret token"}
                  >
                    {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showSecret ? "Hide secret" : "Show secret"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono flex-1 truncate text-slate-800 text-xs">
                    {showSecret
                      ? getPostbackUrl(selectedOfferForCode._id)
                      : getPostbackUrl(selectedOfferForCode._id).replace(/token=[^&]+/, "token=••••••••••••")}
                  </span>
                  <button
                    onClick={() => handleCopy(getPostbackUrl(selectedOfferForCode._id), "postback")}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copiedId === "postback" ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />} Copy
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* Campaign Form Drawer/Modal */}
      {showDrawer && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDrawer();
          }}
        >
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] my-auto flex flex-col rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">
                  {editingOfferId ? "Edit Campaign" : "New Campaign"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure tracking links, rotation rules, and targeting criteria.</p>
              </div>
              <button 
                onClick={handleCloseDrawer} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                aria-label="Close campaign form"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Tabs Indicator */}
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200/80 shrink-0">
              <div className="grid grid-cols-4 gap-2 bg-slate-200/70 p-1 rounded-xl">
                {[
                  { step: 1, full: "1. Setup & Links", short: "1. Setup" },
                  { step: 2, full: "2. Rotation & Events", short: "2. Rotation" },
                  { step: 3, full: "3. Caps & Schedule", short: "3. Schedule" },
                  { step: 4, full: "4. Audience & Targeting", short: "4. Audience" },
                ].map(({ step, full, short }) => {
                  const isActive = currentStep === step;
                  const isPassed = currentStep > step;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setCurrentStep(step)}
                      className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all text-center truncate cursor-pointer ${
                        isActive
                          ? "bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/80"
                          : isPassed
                          ? "text-slate-700 hover:bg-white/60 hover:text-slate-900"
                          : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                      }`}
                    >
                      <span className="hidden md:inline">{full}</span>
                      <span className="md:hidden">{short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Content Body: onKeyDown prevents early submission on Enter */}
            <form
              onSubmit={handleCreateOrUpdate}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
                  e.preventDefault();
                }
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* STEP 1: SETUP & LINK */}
                {currentStep === 1 && (
                <div className="space-y-5">
                  <Input
                    label="Campaign Name"
                    placeholder="e.g. Winter Sale Promo 2026"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    error={formErrors.name}
                    required
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Main Landing Page URL"
                      placeholder="https://advertiser.com/landing?pub={pub_id}&sub1={sub_id1}"
                      value={formData.destinationUrl}
                      onChange={(e) => {
                        handleDestinationUrlChange(e.target.value);
                        if (formErrors.destinationUrl) setFormErrors({ ...formErrors, destinationUrl: undefined });
                      }}
                      error={formErrors.destinationUrl}
                      required
                    />
                    <Input
                      label="Fallback URL (For Filtered Visitors)"
                      placeholder="https://fallback.com/backup"
                      value={formData.fallbackUrl}
                      onChange={(e) => setFormData({ ...formData, fallbackUrl: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Default Revenue per Conversion (₹)"
                      type="number"
                      step="0.01"
                      placeholder="12.00"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    />
                    <Input
                      label="Default Publisher Payout (₹)"
                      type="number"
                      step="0.01"
                      placeholder="4.50"
                      value={formData.payout}
                      onChange={(e) => setFormData({ ...formData, payout: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Redirect Method"
                      value={formData.redirectType}
                      onChange={(e) => setFormData({ ...formData, redirectType: e.target.value as any })}
                      options={[
                        { value: "302", label: "302 Standard Redirect" },
                        { value: "307", label: "307 Temporary Redirect" },
                        { value: "meta", label: "Meta Refresh / Referrer Stripper" },
                        { value: "double_meta", label: "Double Meta Refresh (Blank Referrer)" },
                        { value: "custom_referrer", label: "Custom Referrer Spoof" }
                      ]}
                    />
                    <Select
                      label="Action on Filtered / Blocked Traffic"
                      value={formData.actionOnFilter}
                      onChange={(e) => setFormData({ ...formData, actionOnFilter: e.target.value as any })}
                      options={[
                        { value: "redirect", label: "Redirect to Fallback URL" },
                        { value: "block", label: "HTTP 403 Forbidden" },
                        { value: "drop", label: "Drop Silently (Blank Screen)" },
                        { value: "log", label: "Log & Allow Through" }
                      ]}
                    />
                  </div>

                  {formData.redirectType === "custom_referrer" && (
                    <Input
                      label="Custom Spoofed Referrer URL"
                      placeholder="https://google.com/"
                      value={formData.customReferrerUrl}
                      onChange={(e) => setFormData({ ...formData, customReferrerUrl: e.target.value })}
                    />
                  )}
                </div>
              )}

              {/* STEP 2: PAGES & EVENTS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Landing page rotation */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Shuffle size={15} className="text-slate-700" />
                          Multi-Link Landing Page Rotation (SWRR)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Distribute clicks across multiple landing pages smoothly using Smooth Weighted Round-Robin.
                        </p>
                      </div>
                      {formData.trackingUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleEqualizeTrackingUrls}
                          className="text-xs font-medium bg-white"
                        >
                          Equalize Weights
                        </Button>
                      )}
                    </div>

                    {/* Landing Page List */}
                    <div className="space-y-2">
                      {formData.trackingUrls.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-colors ${
                            item.status === "active" ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-800">{item.name}</span>
                              {item.id === "primary" && (
                                <Badge variant="primary" className="text-[10px] py-0 px-1.5">Primary</Badge>
                              )}
                              <Badge variant={item.status === "active" ? "success" : "warning"} className="text-[10px] py-0 px-1.5">
                                {item.status}
                              </Badge>
                            </div>
                            <div className="text-xs font-mono text-slate-500 truncate mt-0.5">{item.url}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">Weight:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.weight}
                                onChange={(e) => handleUpdateTrackingUrlWeight(item.id, Number(e.target.value))}
                                className="w-14 px-2 py-1 text-xs border border-slate-200 rounded font-bold text-center bg-slate-50 focus:bg-white outline-none"
                              />
                              <span className="text-xs text-slate-400">%</span>
                            </div>

                            {item.id !== "primary" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTrackingUrl(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                aria-label={`Remove landing page ${item.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add rotation page row */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs font-semibold text-slate-700 block mb-2">Add Another Landing Page</span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <Input
                          placeholder="Page Label (e.g. Variant B)"
                          value={newTrackingUrl.name}
                          onChange={(e) => setNewTrackingUrl({ ...newTrackingUrl, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTrackingUrl();
                            }
                          }}
                        />
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Destination URL (https://...)"
                            value={newTrackingUrl.url}
                            onChange={(e) => setNewTrackingUrl({ ...newTrackingUrl, url: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTrackingUrl();
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddTrackingUrl}
                          className="bg-slate-900 text-xs font-semibold h-full"
                        >
                          <Plus size={14} /> Add Page
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Event Payouts */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Custom Conversion Events</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define distinct payouts for secondary actions like lead, deposit, or purchase.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input
                        placeholder="Event (e.g. deposit)"
                        value={newEvent.eventName}
                        onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddEvent();
                          }
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Revenue (₹)"
                        value={newEvent.revenue || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, revenue: Number(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Payout (₹)"
                        value={newEvent.payout || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, payout: Number(e.target.value) })}
                      />
                      <Button
                        type="button"
                        onClick={handleAddEvent}
                        className="bg-slate-900 text-xs font-semibold"
                      >
                        <Plus size={14} /> Add Event
                      </Button>
                    </div>

                    {formData.eventsList.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
                        {formData.eventsList.map((ev, i) => (
                          <div key={i} className="flex justify-between items-center p-3 text-xs">
                            <div className="flex items-center gap-3 font-medium text-slate-800">
                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                event={ev.eventName}
                              </span>
                              <span>Revenue: <b>₹{ev.revenue}</b></span>
                              <span>Payout: <b>₹{ev.payout}</b></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(i)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              aria-label={`Remove event ${ev.eventName}`}
                            >
                              <Trash2 size={14} />
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
                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl space-y-3">
                    <Switch
                      checked={formData.blockBots}
                      onChange={(val) => setFormData({ ...formData, blockBots: val })}
                      label="Automatic Bot & Crawler Protection"
                      description="Filter known automated scrapers and search bots to protect landing page conversion metrics."
                    />
                  </div>

                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl space-y-3">
                    <Switch
                      checked={formData.sessionCheckEnabled}
                      onChange={(val) => setFormData({ ...formData, sessionCheckEnabled: val })}
                      label="Require Valid Session Cookie"
                      description="Only attribute conversions from visitors who possess a valid tracking session cookie."
                    />

                    {formData.sessionCheckEnabled && (
                      <Input
                        label="Session Lifetime (Minutes)"
                        type="number"
                        placeholder="1440 (24 Hours)"
                        value={formData.sessionTtlMinutes}
                        onChange={(e) => setFormData({ ...formData, sessionTtlMinutes: Number(e.target.value) })}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Daily Cap (0 = Unlimited)"
                      type="number"
                      value={formData.dailyCap}
                      onChange={(e) => setFormData({ ...formData, dailyCap: Number(e.target.value) })}
                    />
                    <Input
                      label="Hourly Cap (0 = Unlimited)"
                      type="number"
                      value={formData.hourlyCap}
                      onChange={(e) => setFormData({ ...formData, hourlyCap: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1.5">Campaign Start (Local Time)</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1.5">Campaign End (Local Time)</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-700"
                      />
                    </div>
                  </div>

                  <Input
                    label="Duplicate Click Guard Window (Minutes, 0 = Allow All)"
                    type="number"
                    value={formData.duplicateWindowMinutes}
                    onChange={(e) => setFormData({ ...formData, duplicateWindowMinutes: Number(e.target.value) })}
                  />
                </div>
              )}

              {/* STEP 4: AUDIENCE & TARGETING */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Country Selector */}
                  <div className="space-y-1.5">
                    <CountrySelect
                      value={formData.geoTargeting}
                      selected={formData.geoTargeting}
                      onChange={(codes) => setFormData({ ...formData, geoTargeting: codes })}
                    />
                  </div>

                  {/* City Selector */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                    <label className="text-xs font-medium text-slate-700 block">City Targeting</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add city (e.g. London, Singapore)..."
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            if (cityInput.trim()) {
                              setFormData(prev => ({ ...prev, cityTargeting: addItemToList(prev.cityTargeting, cityInput) }));
                              setCityInput("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (cityInput.trim()) {
                            setFormData(prev => ({ ...prev, cityTargeting: addItemToList(prev.cityTargeting, cityInput) }));
                            setCityInput("");
                          }
                        }}
                        className="bg-slate-900 text-xs px-4"
                      >
                        Add
                      </Button>
                    </div>

                    {/* Quick select popular cities */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-medium text-slate-500 mr-1">Suggestions:</span>
                      {POPULAR_CITIES.map((c) => {
                        const inList = getTargetingList(formData.cityTargeting).some(x => x.toUpperCase() === c.toUpperCase());
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, cityTargeting: toggleItemInList(prev.cityTargeting, c) }))}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              inList
                                ? "bg-slate-900 text-white border-slate-900 font-medium"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {c} {inList ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected city badges */}
                    {getTargetingList(formData.cityTargeting).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                        {getTargetingList(formData.cityTargeting).map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 text-white"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, cityTargeting: removeItemFromList(prev.cityTargeting, city) }))}
                              className="hover:text-rose-300 cursor-pointer"
                              aria-label={`Remove ${city}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Device and OS */}
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

                  {/* Browser Selector */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                    <label className="text-xs font-medium text-slate-700 block">Allowed Browsers</label>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_BROWSERS.map((b) => {
                        const inList = getTargetingList(formData.browserTargeting).some(x => x.toUpperCase() === b.toUpperCase());
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, browserTargeting: toggleItemInList(prev.browserTargeting, b) }))}
                            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                              inList
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {b} {inList ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Add other browser name..."
                        value={browserInput}
                        onChange={(e) => setBrowserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (browserInput.trim()) {
                              setFormData(prev => ({ ...prev, browserTargeting: addItemToList(prev.browserTargeting, browserInput) }));
                              setBrowserInput("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (browserInput.trim()) {
                            setFormData(prev => ({ ...prev, browserTargeting: addItemToList(prev.browserTargeting, browserInput) }));
                            setBrowserInput("");
                          }
                        }}
                        className="bg-slate-900 text-xs px-4"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* ISP Selector */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                    <label className="text-xs font-medium text-slate-700 block">Allowed Internet Service Providers (ISP)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add ISP name (e.g. Comcast, Jio)..."
                        value={ispInput}
                        onChange={(e) => setIspInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (ispInput.trim()) {
                              setFormData(prev => ({ ...prev, ispTargeting: addItemToList(prev.ispTargeting, ispInput) }));
                              setIspInput("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (ispInput.trim()) {
                            setFormData(prev => ({ ...prev, ispTargeting: addItemToList(prev.ispTargeting, ispInput) }));
                            setIspInput("");
                          }
                        }}
                        className="bg-slate-900 text-xs px-4"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-medium text-slate-500 mr-1">Suggestions:</span>
                      {POPULAR_ISPS.map((isp) => {
                        const inList = getTargetingList(formData.ispTargeting).some(x => x.toUpperCase() === isp.toUpperCase());
                        return (
                          <button
                            key={isp}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ispTargeting: toggleItemInList(prev.ispTargeting, isp) }))}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              inList
                                ? "bg-slate-900 text-white border-slate-900 font-medium"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isp} {inList ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>

                    {getTargetingList(formData.ispTargeting).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                        {getTargetingList(formData.ispTargeting).map((isp) => (
                          <span
                            key={isp}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 text-white"
                          >
                            {isp}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, ispTargeting: removeItemFromList(prev.ispTargeting, isp) }))}
                              className="hover:text-rose-300 cursor-pointer"
                              aria-label={`Remove ${isp}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

              {/* Drawer Footer Buttons */}
              <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleCloseDrawer}>
                    Cancel
                  </Button>
                  {currentStep < 4 ? (
                    <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-slate-900 hover:bg-slate-800 font-semibold px-6 gap-2"
                    >
                      {submitting ? <RefreshCw size={14} className="animate-spin" /> : null}
                      {submitting ? "Saving..." : editingOfferId ? "Save Changes" : "Create Campaign"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
