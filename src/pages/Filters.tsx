/* Filters.tsx: Global security controls including IP Blacklists & Master Global Tracking Switch. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { Shield, Plus, Trash2, Power, AlertTriangle, RefreshCw } from "lucide-react";

export default function Filters() {
  const { showToast } = useToast();
  const [globalTracking, setGlobalTracking] = useState<boolean>(true);
  const [togglingGlobal, setTogglingGlobal] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [addingIp, setAddingIp] = useState(false);
  const [removingIp, setRemovingIp] = useState<string | null>(null);
  const [confirmDeleteIp, setConfirmDeleteIp] = useState<string | null>(null);

  useEffect(() => {
    fetchGlobalTracking();
    fetchBlacklist();
  }, []);

  const fetchGlobalTracking = async () => {
    try {
      const res = await axios.get("/api/global-tracking");
      setGlobalTracking(res.data.globalTracking !== false);
    } catch (err) {
      console.error("Failed to fetch global tracking status", err);
    }
  };

  const toggleGlobalTracking = async (targetActive: boolean) => {
    setTogglingGlobal(true);
    try {
      const res = await axios.post("/api/global-tracking", { active: targetActive });
      const updatedState = res.data.globalTracking !== false;
      setGlobalTracking(updatedState);
      showToast(
        updatedState ? "success" : "warning",
        updatedState ? "Global tracking resumed" : "Global tracking paused",
        updatedState
          ? "All active campaigns are now actively routing traffic."
          : "Global traffic tracking is paused across all campaigns."
      );
    } catch (err: any) {
      showToast("error", "Failed to update tracking switch", err?.response?.data?.error || "Please try again.");
    } finally {
      setTogglingGlobal(false);
    }
  };

  const fetchBlacklist = async () => {
    try {
      const res = await axios.get("/api/blacklist");
      setBlacklist(res.data);
    } catch (err: any) {
      showToast("error", "Failed to load blacklist", err?.response?.data?.error || "Please refresh.");
    }
  };

  const addIp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newIp.trim();
    if (!trimmed) return;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed);
    const ipv6 = trimmed.includes(":");
    if (!ipv4 && !ipv6) {
      showToast("error", "Invalid IP address", `"${trimmed}" is not a valid IPv4 or IPv6 address.`);
      return;
    }
    setAddingIp(true);
    try {
      const res = await axios.post("/api/blacklist", { ip: trimmed });
      setBlacklist(res.data);
      setNewIp("");
      showToast("success", "IP blacklisted", `${trimmed} is now blocked across all campaigns.`);
    } catch (err: any) {
      showToast("error", "Failed to add IP", err?.response?.data?.error || "Please try again.");
    } finally {
      setAddingIp(false);
    }
  };

  const removeIp = async (ip: string) => {
    if (confirmDeleteIp !== ip) {
      setConfirmDeleteIp(ip);
      return;
    }
    setConfirmDeleteIp(null);
    setRemovingIp(ip);
    try {
      const res = await axios.delete(`/api/blacklist/${encodeURIComponent(ip)}`);
      setBlacklist(res.data);
      showToast("success", "IP removed", `${ip} has been removed from the blacklist.`);
    } catch (err: any) {
      showToast("error", "Failed to remove IP", err?.response?.data?.error || "Please try again.");
    } finally {
      setRemovingIp(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Traffic Filters & Controls</h2>
          <p className="text-sm text-slate-500">Manage the master tracking switch and global IP blacklists.</p>
        </div>
      </header>

      {/* Master Tracking Switch Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${globalTracking ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                <Power size={18} />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900">Master Tracking Switch</CardTitle>
                <CardDescription>
                  {globalTracking
                    ? "Global tracking is ON. Clicks are evaluated through campaign rules and routed to destinations."
                    : "Global tracking is PAUSED. All incoming traffic is routed to fallback URLs or blocked."}
                </CardDescription>
              </div>
            </div>
            <Badge variant={globalTracking ? "success" : "danger"}>
              {globalTracking ? "Active" : "Paused"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Use this toggle to instantly pause or resume all click tracking across every campaign in the platform without modifying individual campaigns.
            </p>
            <Button
              type="button"
              disabled={togglingGlobal}
              onClick={() => toggleGlobalTracking(!globalTracking)}
              className={`shrink-0 font-medium text-xs rounded-lg transition-colors cursor-pointer ${
                globalTracking
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <Power size={14} />
              {togglingGlobal 
                ? "Updating..." 
                : globalTracking 
                  ? "Pause All Tracking" 
                  : "Resume All Tracking"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IP Blacklist Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <AlertTriangle size={18} />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900">Global IP Blacklist</CardTitle>
                <CardDescription>
                  Block specific IP addresses across all campaigns. Traffic from these IPs will be rejected.
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {blacklist.length} {blacklist.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Add IP Form */}
          <form onSubmit={addIp} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter IPv4 or IPv6 address (e.g. 192.168.1.1 or 2001:db8::1)"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={addingIp || !newIp.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-5"
            >
              {addingIp ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {addingIp ? "Adding..." : "Block IP"}
            </Button>
          </form>

          {/* Blacklisted IPs List */}
          {blacklist.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Shield size={22} className="mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-600 font-medium">No IPs currently blacklisted.</p>
              <p className="text-xs text-slate-500 mt-1">Add an IP address above to block it from all campaigns.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {blacklist.map((ip) => (
                <div key={ip} className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <code className="text-xs font-mono font-semibold text-slate-800">{ip}</code>
                  </div>

                  <div>
                    {confirmDeleteIp === ip ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removeIp(ip)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Confirm Delete?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteIp(null)}
                          className="text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeIp(ip)}
                        disabled={removingIp === ip}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove IP from blacklist"
                        aria-label={`Remove IP ${ip}`}
                      >
                        {removingIp === ip ? <RefreshCw size={14} className="animate-spin text-rose-600" /> : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
