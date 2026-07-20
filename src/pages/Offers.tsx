/* Offers.tsx: Campaign management, filtering rules, and integration codes. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Link2,
  Copy,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  X,
  ExternalLink,
  Info,
  Code
} from "lucide-react";
import { Offer } from "../types";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    actionOnFilter: "redirect" as "redirect" | "block" | "log" | "drop",
    blockBots: true,
    status: "active" as "active" | "paused"
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("/api/offers");
      setOffers(res.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
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
      actionOnFilter: formData.actionOnFilter,
      blockBots: formData.blockBots,
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
      console.error("Error creating/updating campaign:", err);
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
      dailyCap: offer.dailyCap,
      actionOnFilter: offer.actionOnFilter,
      blockBots: offer.blockBots,
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
      console.error("Error deleting campaign:", err);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === "active" ? "paused" : "active";
    try {
      await axios.put(`/api/offers/${offer._id}`, { status: newStatus });
      fetchOffers();
    } catch (err) {
      console.error("Error toggling campaign status:", err);
    }
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
      actionOnFilter: "redirect",
      blockBots: true,
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h2>
          <p className="text-sm text-slate-500">Manage tracking links, integrations, and targeting rules.</p>
        </div>
        <Button onClick={() => setShowDrawer(true)} className="gap-2 shadow-sm cursor-pointer">
          <Plus size={16} /> New Campaign
        </Button>
      </header>

      {/* Campaign List Card */}
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
                <th className="px-6 py-4">Targeting</th>
                <th className="px-6 py-4 text-right">Metrics</th>
                <th className="px-6 py-4 text-right">Action Rule</th>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Geo:</span>
                          {offer.geoTargeting && offer.geoTargeting.length > 0 ? (
                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-semibold uppercase">
                              {offer.geoTargeting.join(", ")}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                              ALL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {offer.deviceType} / {offer.osType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">{offer.clickCount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Rev: <span className="font-semibold text-emerald-600">${(offer.clickCount * offer.revenue).toLocaleString()}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-slate-800">
                        {offer.dailyCap === 0 ? "No Cap" : `${offer.dailyCap}/day`}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mt-0.5">
                        Filter: <span className="font-semibold text-indigo-600">{offer.actionOnFilter}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingOfferId(offer._id);
                            setCurrentStep(4);
                            setShowDrawer(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="View Integration Code"
                        >
                          <Code size={14} className="text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(offer)}
                          className="h-8 w-8 p-0"
                        >
                          {offer.status === "active" ? (
                            <Pause size={14} className="text-amber-500" />
                          ) : (
                            <Play size={14} className="text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(offer)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} className="text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer._id)}
                          className="h-8 w-8 p-0 hover:bg-rose-50"
                        >
                          <Trash2 size={14} className="text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Multi-step Campaign Creator Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full relative z-10 flex flex-col shadow-2xl animate-slideLeft">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingOfferId && currentStep === 4 ? "Integration Setup" : editingOfferId ? "Edit Campaign" : "New Campaign"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Configure targeting rules and grab your tracking code.</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 cursor-pointer"
                onClick={closeDrawer}
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div className="px-8 py-5 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center gap-1.5 bg-white px-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                        currentStep > step
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : currentStep === step
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                          : "border-slate-200 text-slate-400 bg-white"
                      }`}
                    >
                      {currentStep > step ? <CheckCircle2 size={14} /> : step}
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${currentStep >= step ? "text-slate-800" : "text-slate-400"}`}>
                      {step === 1 ? "Details" : step === 2 ? "Filters" : step === 3 ? "Action" : "Integration"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 bg-slate-50/20">
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <Input
                    label="Campaign Name"
                    placeholder="e.g. Adidas Promo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Destination URL"
                    placeholder="https://www.advertiser.com/offer"
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Payout ($)"
                      type="number"
                      step="0.01"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                    />
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "paused" })}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "paused", label: "Paused" }
                      ]}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Countries (ISO-2, comma separated)"
                      placeholder="e.g. US, CA, GB"
                      value={formData.geoTargeting}
                      onChange={(e) => setFormData({ ...formData, geoTargeting: e.target.value })}
                    />
                    <Input
                      label="Cities (comma separated)"
                      placeholder="e.g. New York, London"
                      value={formData.cityTargeting}
                      onChange={(e) => setFormData({ ...formData, cityTargeting: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Device"
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as "All" | "Mobile" | "Desktop" })}
                      options={[
                        { value: "All", label: "All" },
                        { value: "Mobile", label: "Mobile" },
                        { value: "Desktop", label: "Desktop" }
                      ]}
                    />
                    <Select
                      label="OS"
                      value={formData.osType}
                      onChange={(e) => setFormData({ ...formData, osType: e.target.value as "All" | "iOS" | "Android" | "Windows" })}
                      options={[
                        { value: "All", label: "All" },
                        { value: "iOS", label: "iOS" },
                        { value: "Android", label: "Android" },
                        { value: "Windows", label: "Windows" }
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Browsers (comma separated)"
                      placeholder="e.g. Chrome, Safari, Edge"
                      value={formData.browserTargeting}
                      onChange={(e) => setFormData({ ...formData, browserTargeting: e.target.value })}
                    />
                    <Input
                      label="ISP / Network"
                      placeholder="e.g. Comcast, AT&T"
                      value={formData.ispTargeting}
                      onChange={(e) => setFormData({ ...formData, ispTargeting: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <Input
                    label="Daily Click Cap (0 for unlimited)"
                    type="number"
                    value={formData.dailyCap}
                    onChange={(e) => setFormData({ ...formData, dailyCap: parseInt(e.target.value) || 0 })}
                  />

                  <Select
                    label="Filter Action"
                    value={formData.actionOnFilter}
                    onChange={(e) => setFormData({ ...formData, actionOnFilter: e.target.value as "redirect" | "block" | "log" | "drop" })}
                    options={[
                      { value: "redirect", label: "Redirect to Fallback" },
                      { value: "block", label: "Block (HTTP 403)" },
                      { value: "drop", label: "Drop (No tracking, stop API)" },
                      { value: "log", label: "Log Only (Pass through)" }
                    ]}
                  />

                  {formData.actionOnFilter === "redirect" && (
                    <Input
                      label="Fallback URL"
                      placeholder="https://backup-offer.com"
                      value={formData.fallbackUrl}
                      onChange={(e) => setFormData({ ...formData, fallbackUrl: e.target.value })}
                    />
                  )}

                  <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl mt-4">
                    <Switch
                      label="Bot Protection"
                      description="Block crawlers and scrapers."
                      checked={formData.blockBots}
                      onChange={(checked) => setFormData({ ...formData, blockBots: checked })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  {editingOfferId ? (
                    <>
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <h4 className="text-sm font-bold text-indigo-900 mb-2">Option A: Redirect Link</h4>
                        <p className="text-xs text-indigo-700 mb-3">Share this link directly. Traffic is evaluated on our server before reaching the destination.</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-indigo-200 p-2 rounded text-xs text-indigo-900 overflow-x-auto whitespace-nowrap">
                            {window.location.origin}/track?offer_id={editingOfferId}&pub_id=AFF001
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(`${window.location.origin}/track?offer_id=${editingOfferId}&pub_id=AFF001`, "link")}
                          >
                            {copiedId === "link" ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">Option B: Client-Side Pixel (JS)</h4>
                        <p className="text-xs text-slate-500 mb-3">Embed this on the target page for manual triggering (e.g. tracking specific page loads).</p>
                        <div className="flex items-start gap-2">
                          <code className="flex-1 bg-slate-900 p-3 rounded-lg text-xs text-emerald-400 font-mono whitespace-pre overflow-x-auto">
                            {`<script \n  src="${window.location.origin}/pixel.js" \n  data-offer-id="${editingOfferId}"\n  data-pub-id="AFF001"\n  data-delay="2000">\n</script>`}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(`<script src="${window.location.origin}/pixel.js" data-offer-id="${editingOfferId}" data-pub-id="AFF001" data-delay="2000"></script>`, "pixel")}
                          >
                            {copiedId === "pixel" ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Save this campaign first to generate integration codes!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between items-center">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft size={16} /> Back
                </Button>
              ) : (
               <Button variant="ghost" onClick={closeDrawer}>Cancel</Button>
              )}

              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  Continue <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleCreateOrUpdate} variant="success">
                  {editingOfferId ? "Save Changes" : "Launch Campaign"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
