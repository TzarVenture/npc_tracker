/* Settings.tsx: System configurations and developer API documentation. */
import React, { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import {
  Settings as SettingsIcon,
  RotateCcw,
  BookOpen,
  Info,
  ExternalLink,
  Lock,
  Globe,
  Database,
  Terminal,
  Cpu
} from "lucide-react";

export default function Settings() {

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500">Global configuration and API documentation.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Diagnostic Options */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  API Integration Guide
                </CardTitle>
                <CardDescription>How to configure tracking parameters.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                To route traffic through the system, direct visitors to the URL below:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] select-all border border-slate-800">
                {window.location.origin}/track?offer_id=<span className="text-indigo-400 font-bold">CAMPAIGN_ID</span>&pub_id=<span className="text-amber-400">PUBLISHER_ID</span>&sub_id1=<span className="text-emerald-400">SUB_1</span>
              </div>
              <div className="space-y-1.5 mt-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">Query Parameters Glossary:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li><span className="font-bold font-mono text-slate-700">offer_id</span>: Required. The Campaign ID from your console.</li>
                  <li><span className="font-bold font-mono text-slate-700">pub_id</span>: Optional. Identifier for the affiliate/publisher partner sending traffic.</li>
                  <li><span className="font-bold font-mono text-slate-700">sub_id1 / sub_id2</span>: Optional. Campaign sub-trackers (e.g. ad_group, source_facebook).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - General Configurations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" />
                  Redirection Domain
                </CardTitle>
                <CardDescription>Configure tracking canonical urls.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Canonical Redirect Domain"
                value={window.location.origin}
                disabled
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                NPC_tracker handles redirects automatically on Port 3000 container ingress. Links are generated self-referentially based on browser headers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600" />
                  Security Engine
                </CardTitle>
                <CardDescription>Configure system API keys.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="API Token Key"
                type="password"
                value="••••••••••••••••••••••••"
                disabled
              />
              <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                <span>Admin controls are locked. Secrets are handled securely on server-side.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
