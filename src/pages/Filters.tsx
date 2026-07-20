/* Filters.tsx: Global security and anti-fraud settings including IP Blacklists. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import { Shield, ShieldCheck, Globe, Wifi, Settings, AlertTriangle, Monitor, Cpu, Plus, Trash2 } from "lucide-react";

export default function Filters() {
  const [activeTab, setActiveTab] = useState("bots");
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    if (activeTab === "blacklist") {
      fetchBlacklist();
    }
  }, [activeTab]);

  const fetchBlacklist = async () => {
    try {
      const res = await axios.get("/api/blacklist");
      setBlacklist(res.data);
    } catch (err) {
      console.error("Failed to fetch blacklist", err);
    }
  };

  const addIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    try {
      const res = await axios.post("/api/blacklist", { ip: newIp.trim() });
      setBlacklist(res.data);
      setNewIp("");
    } catch (err) {
      console.error("Failed to add IP", err);
    }
  };

  const removeIp = async (ip: string) => {
    try {
      const res = await axios.delete(`/api/blacklist/${encodeURIComponent(ip)}`);
      setBlacklist(res.data);
    } catch (err) {
      console.error("Failed to remove IP", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Global Filters</h2>
          <p className="text-sm text-slate-500">Manage global anti-fraud rules and blacklists.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation column */}
        <div className="md:col-span-1 space-y-1.5">
          <button
            onClick={() => setActiveTab("bots")}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "bots"
                ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <Shield size={14} />
            Bot & Fraud Blocker
          </button>
          <button
            onClick={() => setActiveTab("geos")}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "geos"
                ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <Globe size={14} />
            Geo-Targeting Hub
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "blacklist"
                ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <AlertTriangle size={14} />
            IP Blacklist Rule
          </button>
        </div>

        {/* Content column */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === "bots" && (
            <Card className="animate-fadeIn">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <ShieldCheck className="text-emerald-600" size={20} />
                    Active Anti-Fraud Blocker
                  </CardTitle>
                  <CardDescription>
                    Automatically check signatures, headers, and behaviors to intercept spam networks.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex gap-2.5">
                  <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Bot Blocker Status: </span>
                    Anti-Fraud database is fully synchronized. Verified crawlers (Google, Bing, DuckDuckGo) are labeled and processed in accordance with campaign-level specifications.
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identified Signatures Database</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="font-bold text-slate-800 block mb-1">Search Bots (Google, Bing)</span>
                      <p className="text-slate-500">Redirects to backup domains, minimizing load on tracking redirect links.</p>
                      <Badge variant="success" className="mt-2">ACTIVE PROTECTION</Badge>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="font-bold text-slate-800 block mb-1">Scrapers & Headless Chrome</span>
                      <p className="text-slate-500">Filters automatic request patterns mimicking headless client configurations.</p>
                      <Badge variant="success" className="mt-2">ACTIVE PROTECTION</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "geos" && (
            <Card className="animate-fadeIn">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Globe className="text-indigo-600" size={20} />
                    Geo-Targeting Policy
                  </CardTitle>
                  <CardDescription>
                    Manage visitor routing based on country code parameters.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex gap-2.5">
                  <Globe size={18} className="shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Local Geo IP Database: </span>
                    Local prefix matching database handles location validation instantly.
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <p>
                    When a campaign has geo-targeting constraints defined (e.g. <span className="font-bold font-mono">US, CA</span>), visitors from outside those countries are classified as <span className="font-semibold text-amber-600">filtered</span> and dispatched to the designated backup fallback URL.
                  </p>
                  <p>
                    Leaves fields blank in the Campaign Editor to mark campaigns as <span className="font-bold text-emerald-600">GLOBAL</span> to allow redirects for traffic originating from any country.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "blacklist" && (
            <Card className="animate-fadeIn">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <AlertTriangle className="text-amber-500" size={20} />
                    IP Blacklist Rule Engine
                  </CardTitle>
                  <CardDescription>
                    Explicitly exclude specific IP networks or fraudulent subnets.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-xs text-slate-600">
                <p>
                  To secure campaigns against proxy-cycling traffic, add IP addresses below. Traffic from these IPs will be blocked with a 403 Access Denied error.
                </p>

                <form onSubmit={addIp} className="flex gap-2">
                  <Input 
                    placeholder="Enter IP Address (e.g. 192.168.1.1)" 
                    value={newIp} 
                    onChange={(e) => setNewIp(e.target.value)} 
                    className="flex-1"
                  />
                  <Button type="submit" className="gap-2 shrink-0 h-[42px] mt-0">
                    <Plus size={16} /> Add IP
                  </Button>
                </form>

                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-xs">IP Address</th>
                        <th className="px-4 py-3 text-right font-semibold text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blacklist.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-slate-400 text-xs">No IP addresses blacklisted.</td>
                        </tr>
                      ) : (
                        blacklist.map((ip) => (
                          <tr key={ip} className="hover:bg-white transition-colors">
                            <td className="px-4 py-3 font-mono">{ip}</td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeIp(ip)}
                                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
