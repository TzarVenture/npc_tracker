/* Settings.tsx: System configuration panel — change-password, multi-domains, database stats, API integration reference. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { copyToClipboard } from "../utils/clipboard";
import {
  Lock,
  Globe,
  Database,
  BookOpen,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { TrackingDomain } from "../types";

interface DbStats {
  totalClicks: number;
  totalConversions: number;
  totalOffers: number;
  activeOffers: number;
  totalRevenue: number;
}

function CodeSnippet({ code, label }: { code: string; label?: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      showToast("success", "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-1">
      {label && <span className="text-xs font-medium text-slate-700 block">{label}</span>}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
        <code className="text-slate-200 font-mono text-xs flex-1 break-all leading-relaxed">{code}</code>
        <button
          type="button"
          onClick={copy}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors shrink-0 cursor-pointer"
          title="Copy"
          aria-label="Copy code snippet"
        >
          {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { showToast } = useToast();
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [postbackSecret, setPostbackSecret] = useState("npc_postback_sec_2026");
  const [showPostbackSecret, setShowPostbackSecret] = useState(false);

  // Multi-Domain State
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [confirmDeleteDomainId, setConfirmDeleteDomainId] = useState<string | null>(null);

  // Change password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [submittingPw, setSubmittingPw] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://your-server.com";

  useEffect(() => {
    axios.get("/api/system-config").then((res) => {
      if (res.data?.postbackSecret) {
        setPostbackSecret(res.data.postbackSecret);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await axios.get("/api/stats");
        setDbStats({
          totalClicks: res.data.totalClicks,
          totalConversions: res.data.totalConversions,
          totalOffers: res.data.totalOffers,
          activeOffers: res.data.activeOffers,
          totalRevenue: res.data.totalRevenue
        });
      } catch {
        // Non-critical
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchDomains = async () => {
      try {
        const res = await axios.get("/api/domains");
        setDomains(res.data);
      } catch (e) {}
    };

    fetchStats();
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;

    setAddingDomain(true);
    try {
      const res = await axios.post("/api/domains", { domain: newDomainInput, isDefault: domains.length === 0 });
      setDomains(prev => [res.data, ...prev.filter(d => !res.data.isDefault || !d.isDefault)]);
      setNewDomainInput("");
      showToast("success", "Domain added", `Tracking domain "${res.data.domain}" is ready.`);
    } catch (err: any) {
      showToast("error", "Failed to add domain", err?.response?.data?.error || "Invalid domain format.");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (confirmDeleteDomainId !== id) {
      setConfirmDeleteDomainId(id);
      return;
    }
    setConfirmDeleteDomainId(null);
    try {
      await axios.delete(`/api/domains/${id}`);
      setDomains(prev => prev.filter(d => d.id !== id));
      showToast("success", "Domain removed");
    } catch (err: any) {
      showToast("error", "Failed to delete domain");
    }
  };

  const handleSetDefaultDomain = async (id: string) => {
    try {
      await axios.put(`/api/domains/${id}/default`);
      setDomains(prev => prev.map(d => ({ ...d, isDefault: d.id === id })));
      showToast("success", "Default domain updated");
    } catch (err: any) {
      showToast("error", "Failed to set default domain");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("error", "All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New password and confirmation do not match.");
      return;
    }

    setSubmittingPw(true);
    try {
      await axios.post("/api/auth/change-password", { currentPassword, newPassword });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("success", "Password updated successfully", "Use your new password on your next sign-in.");
    } catch (err: any) {
      showToast("error", "Password change failed", err?.response?.data?.error || "Current password may be incorrect.");
    } finally {
      setSubmittingPw(false);
    }
  };

  const maskedPostbackUrl = `${origin}/api/postback?click_id={CLICK_ID}&token=••••••••••••••••&payout=15.00&revenue=30.00&event=sale`;
  const realPostbackUrl = `${origin}/api/postback?click_id={CLICK_ID}&token=${postbackSecret}&payout=15.00&revenue=30.00&event=sale`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <header className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500">Manage administrative credentials, tracking domains, and integration configurations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Security & Password */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Lock size={18} className="text-slate-800" /> Account Security
                </CardTitle>
                <CardDescription>Update administrative sign-in password.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Enter current password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showCurrentPw ? "Hide password" : "Show password"}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPw ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showNewPw ? "Hide password" : "Show password"}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password"
                  type={showNewPw ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submittingPw}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-xs font-semibold py-2.5"
                  >
                    {submittingPw ? <RefreshCw size={14} className="animate-spin" /> : null}
                    {submittingPw ? "Updating Password..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Integration Reference */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <BookOpen size={18} className="text-slate-800" /> Integration Endpoints
                </CardTitle>
                <CardDescription>Endpoint formats for links, client pixels, and postbacks.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 text-xs text-slate-600">
              <div className="space-y-2">
                <span className="font-medium text-slate-800 block text-xs">1. Server-Side Link Redirect</span>
                <CodeSnippet
                  code={`${origin}/track?offer_id=CAMPAIGN_ID&pub_id=PUBLISHER_ID&sub_id1=SOURCE&sub_id2=PLACEMENT`}
                />
              </div>

              <div className="space-y-2">
                <span className="font-medium text-slate-800 block text-xs">2. JavaScript Pixel Tag</span>
                <CodeSnippet code={`<script src="${origin}/cdn/v2/wgt.js?id=CAMPAIGN_ID" async></script>`} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 block text-xs">3. S2S Postback (Conversion Tracking)</span>
                  <button
                    type="button"
                    onClick={() => setShowPostbackSecret(!showPostbackSecret)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    aria-label={showPostbackSecret ? "Hide secret token" : "Show secret token"}
                  >
                    {showPostbackSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPostbackSecret ? "Hide secret" : "Show secret"}</span>
                  </button>
                </div>
                <CodeSnippet code={showPostbackSecret ? realPostbackUrl : maskedPostbackUrl} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Multi-Domain Tracking Manager */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Globe size={18} className="text-slate-800" /> Tracking Domains
                </CardTitle>
                <CardDescription>Manage alternate tracking domains to generate clean redirect and pixel URLs.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-medium text-slate-500 block mb-1">Default Server Origin</span>
                <code className="text-xs font-mono font-semibold text-slate-800 select-all">{origin}</code>
              </div>

              {/* Add Domain Form */}
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <Input
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="e.g. tracker.domain.com"
                  className="flex-1 text-xs"
                />
                <Button type="submit" size="sm" disabled={addingDomain || !newDomainInput.trim()} className="text-xs whitespace-nowrap bg-slate-900">
                  <Plus size={14} /> Add
                </Button>
              </form>

              {/* Domain List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-slate-600 block">Configured Domains ({domains.length})</span>
                {domains.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No custom tracking domains configured.</p>
                ) : (
                  <div className="space-y-2">
                    {domains.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2 font-mono text-slate-800 font-medium">
                          {d.domain}
                          {d.isDefault && <Badge variant="success" className="text-[10px] py-0 px-1.5">Default</Badge>}
                        </div>

                        <div className="flex items-center gap-2">
                          {!d.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultDomain(d.id)}
                              className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}

                          {confirmDeleteDomainId === d.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteDomain(d.id)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Delete?
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDomainId(null)}
                                className="text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(d.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete domain"
                              aria-label={`Delete domain ${d.domain}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database & Storage Telemetry */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Database size={18} className="text-slate-800" /> Database & Storage
                </CardTitle>
                <CardDescription>SQLite disk storage and runtime persistence details.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                  <RefreshCw size={14} className="animate-spin text-slate-600" /> Loading metrics...
                </div>
              ) : dbStats ? (
                <div className="space-y-2.5">
                  {[
                    { label: "Total Clicks Recorded", value: dbStats.totalClicks.toLocaleString() },
                    { label: "Total Conversions Recorded", value: dbStats.totalConversions.toLocaleString() },
                    { label: "Active Campaigns", value: `${dbStats.activeOffers} of ${dbStats.totalOffers}` },
                    { label: "Total Tracked Revenue", value: `₹${dbStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                    { label: "Database Engine", value: "SQLite 3 (WAL Mode)" },
                    { label: "Storage Persistence", value: "tracker.sqlite" }
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-600">{row.label}</span>
                      <span className="text-xs font-semibold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">Unable to load storage metrics.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
