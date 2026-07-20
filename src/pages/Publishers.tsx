/* Publishers.tsx: Aggregated performance metrics by publisher/affiliate IDs. */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Award, RefreshCw } from "lucide-react";

interface PublisherStats {
  id: string;
  name: string;
  clickCount: number;
  passed: number;
  filtered: number;
  payout: number;
  revenue: number;
}

export default function Publishers() {
  const [publishers, setPublishers] = useState<PublisherStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const res = await axios.get("/api/publishers");
        setPublishers(res.data);
      } catch (err) {
        console.error("Failed to fetch publishers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublishers();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Publishers</h2>
          <p className="text-sm text-slate-500">Track performance metrics across publisher networks.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <RefreshCw size={24} className="text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading publisher data...</p>
        </div>
      ) : publishers.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          No publisher data recorded yet. Send traffic with a pub_id parameter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishers.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between">
              <CardHeader className="bg-slate-50/50 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{p.id}</span>
                    <CardTitle className="mt-2 text-base text-slate-900">{p.name}</CardTitle>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Award size={16} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Clicks Sent</span>
                    <span className="font-bold text-sm">{p.clickCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Clean Passed</span>
                    <span className="font-bold text-emerald-600 text-sm">{p.passed.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Quality Rate</span>
                    <span className="font-bold text-sm">{p.clickCount > 0 ? ((p.passed / p.clickCount) * 100).toFixed(1) : 0}%</span>
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
    </div>
  );
}
