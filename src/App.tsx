/* App.tsx: Root application component managing layout and navigation routes. */
import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Shield,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Menu,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Terminal,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Offers from "./pages/Offers";
import Filters from "./pages/Filters";
import Reports from "./pages/Reports";
import Publishers from "./pages/Publishers";
import Settings from "./pages/Settings";
import { Badge } from "./components/ui/Badge";

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Campaigns", path: "/offers", icon: Zap },
    { name: "Filters", path: "/filters", icon: Shield },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Publishers", path: "/publishers", icon: Users },
    { name: "Settings", path: "/settings", icon: SettingsIcon }
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-black font-mono">NT</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">NPC_tracker</span>
          </div>
          {/* Mobile menu close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 md:hidden"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer in Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
              EA
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">Enterprise Admin</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Node Active
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile navigation menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Toggle mobile sidebar */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="hidden sm:block text-sm font-bold text-slate-500 uppercase tracking-widest">
              Traffic Redirect Operations
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-200" />

            <Badge variant="primary" className="bg-indigo-50 border-indigo-100 text-indigo-700">
              Live Gateway v2.4
            </Badge>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto w-full h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/filters" element={<Filters />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/publishers" element={<Publishers />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center h-96">
                    <h2 className="text-xl font-bold text-slate-900">Route not found</h2>
                    <p className="text-slate-500 mt-2">The requested workspace tab is missing.</p>
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// Simple custom inline Close icon
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
