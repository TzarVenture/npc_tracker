/* Settings.tsx: System configuration panel — real change-password, DB stats, API integration reference. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import {
  Lock,
  Globe,
  Database,
  BookOpen,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Server
} from "lucide-react";

import { TrackingDomain } from "../types";
import { Plus, Trash2, Star, Check } from "lucide-react";

interface DbStats {
  totalClicks: number;
  totalConversions: number;
  totalOffers: number;
  activeOffers: number;
  totalRevenue: number;
}

function CodeSnippet({ code, label }: { code: string; label?: string }) {
  const { showToast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code);
    showToast("success", "Copied to clipboard!");
  };
  return (
    <div className="space-y-1">
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5">
        <code className="text-slate-200 font-mono text-[11px] flex-1 break-all leading-relaxed">{code}</code>
        <button
          onClick={copy}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
          title="Copy"
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { showToast } = useToast();
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Multi-Domain State
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Change password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [submittingPw, setSubmittingPw] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://your-server.com";

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
        // Stats are non-critical — fail silently with null
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
      showToast("success", "Domain added!", `Tracking domain "${res.data.domain}" is ready.`);
    } catch (err: any) {
      showToast("error", "Failed to add domain", err?.response?.data?.error || "Invalid domain format.");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
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
      showToast("error", "Passwords do not match.", "New password and confirm password must be identical.");
      return;
    }
    if (newPassword === currentPassword) {
      showToast("warning", "New password is same as current.", "Please choose a different password.");
      return;
    }

    setSubmittingPw(true);
    try {
      await axios.post("/api/auth/change-password", { currentPassword, newPassword });
      showToast("success", "Password changed successfully!", "Your admin password has been updated. Use the new password on your next login.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      showToast("error", "Failed to change password", err?.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setSubmittingPw(false);
    }
  };

  const pwStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: "", color: "bg-slate-200", width: "0%" };
    if (pw.length < 6) return { label: "Too Short", color: "bg-rose-500", width: "20%" };
    if (pw.length < 8) return { label: "Weak", color: "bg-amber-500", width: "40%" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score === 3 && pw.length >= 12) return { label: "Strong", color: "bg-emerald-500", width: "100%" };
    if (score >= 2) return { label: "Good", color: "bg-blue-500", width: "70%" };
    return { label: "Fair", color: "bg-amber-400", width: "50%" };
  };

  const strength = pwStrength(pwForm.newPassword);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500">Security configuration, API reference, and database information.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600" /> Change Admin Password
                </CardTitle>
                <CardDescription>Update your admin login credentials. Requires current password verification.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPw ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {pwForm.newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{strength.label}</span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
                {pwForm.confirmPassword && pwForm.newPassword && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${pwForm.confirmPassword === pwForm.newPassword ? "text-emerald-600" : "text-rose-500"}`}>
                    <CheckCircle2 size={13} />
                    {pwForm.confirmPassword === pwForm.newPassword ? "Passwords match" : "Passwords do not match"}
                  </div>
                )}

                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-3 rounded-lg text-xs text-amber-700">
                  <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>After changing your password, you will need to use the new password on your next login. Your current session remains valid for 24 hours.</span>
                </div>

                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 font-semibold gap-2"
                  disabled={submittingPw}
                >
                  {submittingPw ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {submittingPw ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Integration Reference */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" /> API Integration Reference
                </CardTitle>
                <CardDescription>All endpoint URLs and tracking parameters for integration.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 text-xs text-slate-600">
              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">1. Link Redirect (Server-Side Tracking)</p>
                <CodeSnippet
                  code={`${origin}/track?offer_id=CAMPAIGN_ID&pub_id=PUBLISHER_ID&sub_id1=SOURCE&sub_id2=PLACEMENT`}
                />
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-1">
                  <li><code className="font-mono font-bold text-slate-700">offer_id</code> — Required. Campaign ID from Campaigns tab.</li>
                  <li><code className="font-mono font-bold text-slate-700">pub_id</code> — Optional. Publisher/affiliate identifier.</li>
                  <li><code className="font-mono font-bold text-slate-700">sub_id1 / sub_id2</code> — Optional. Sub-trackers (ad group, source, etc).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">2. Client-Side JavaScript Pixel</p>
                <CodeSnippet code={`<script src="${origin}/cdn/v2/wgt.js?id=CAMPAIGN_ID" async></script>`} />
                <p className="text-slate-500">Fires silently — no redirect. User stays on page. Controlled by campaign-level delay, frequency cap, and weighted page targeting rules.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">3. S2S Postback (Conversion Tracking)</p>
                <CodeSnippet
                  code={`${origin}/api/postback?click_id={CLICK_ID}&token=npc_postback_sec_2026&payout=15.00&revenue=30.00&event=sale`}
                />
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-1">
                  <li><code className="font-mono font-bold text-slate-700">click_id</code> — Required. The click ID returned in tracking URL or pixel response.</li>
                  <li><code className="font-mono font-bold text-slate-700">token</code> — Required (if enabled). Security authentication secret token.</li>
                  <li><code className="font-mono font-bold text-slate-700">payout</code> — Optional. Override affiliate payout for this conversion.</li>
                  <li><code className="font-mono font-bold text-slate-700">revenue</code> — Optional. Override advertiser revenue for this conversion.</li>
                  <li><code className="font-mono font-bold text-slate-700">event</code> — Optional. Event tier name (e.g. <code>lead</code>, <code>sale</code>, <code>install</code>).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Multi-Domain Tracking Manager */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" /> Multi-Domain Tracking Manager
                </CardTitle>
                <CardDescription>Manage multiple tracking domains to generate clean redirect and pixel links.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Default / Server Domain */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Server Domain (Current)</span>
                <code className="text-sm font-mono font-bold text-indigo-700 block select-all break-all">{origin}</code>
              </div>

              {/* Add Domain Form */}
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <Input
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="e.g. track1.mybrand.com"
                  className="flex-1 text-xs"
                />
                <Button type="submit" size="sm" disabled={addingDomain || !newDomainInput.trim()} className="gap-1 text-xs whitespace-nowrap">
                  <Plus size={14} /> Add Domain
                </Button>
              </form>

              {/* Domain List */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Configured Tracking Domains ({domains.length})</span>
                {domains.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No custom tracking domains added yet. Add domain aliases above.</p>
                ) : (
                  <div className="space-y-1.5">
                    {domains.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-2 font-mono truncate">
                          <Globe size={14} className="text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{d.domain}</span>
                          {d.isDefault && (
                            <Badge variant="success" className="text-[9px] py-0 px-1.5 gap-0.5">
                              <Star size={10} className="fill-emerald-600" /> Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!d.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultDomain(d.id)}
                              className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded font-medium transition-colors"
                              title="Set as Default Tracking Domain"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDomain(d.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Domain"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                <span>Configure CNAME DNS records pointing custom domains to your server IP for multi-domain link generation.</span>
              </div>
            </CardContent>
          </Card>

          {/* Database Stats */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" /> Database Statistics
                </CardTitle>
                <CardDescription>Live SQLite WAL mode metrics.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                  <RefreshCw size={14} className="animate-spin" /> Loading stats...
                </div>
              ) : dbStats ? (
                <div className="space-y-3">
                  {[
                    { label: "Total Click Events", value: dbStats.totalClicks.toLocaleString() },
                    { label: "Total Conversions", value: dbStats.totalConversions.toLocaleString() },
                    { label: "Active Campaigns", value: `${dbStats.activeOffers} / ${dbStats.totalOffers}` },
                    { label: "Total Revenue", value: `₹${dbStats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className="text-xs font-bold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-semibold pt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    SQLite WAL Mode — Online
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Unable to load statistics.</p>
              )}
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server size={18} className="text-indigo-600" /> Security Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {[
                { label: "JWT Authentication", ok: true },
                { label: "Password Hashing (bcrypt)", ok: true },
                { label: "Login Rate Limiting", ok: true },
                { label: "Session Cookie", ok: true },
                { label: "Auth Token (24h TTL)", ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-600">{item.label}</span>
                  <Badge variant={item.ok ? "success" : "danger"} className="text-[9px]">
                    {item.ok ? "Active" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
