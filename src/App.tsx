/* App.tsx: Root application component managing layout, protected authentication, and navigation routes. */
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Zap,
  Shield,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Terminal
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Offers from "./pages/Offers";
import Filters from "./pages/Filters";
import Reports from "./pages/Reports";
import Publishers from "./pages/Publishers";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { Badge } from "./components/ui/Badge";
import { ToastProvider } from "./components/ui/Toast";
import { User } from "./types";

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem("npc_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("npc_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Attach Axios request & response interceptors for Authorization header and auto-logout on expired token
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("npc_token");
      if (storedToken) {
        config.headers["Authorization"] = `Bearer ${storedToken}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem("npc_token");
          localStorage.removeItem("npc_user");
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("npc_token");
    localStorage.removeItem("npc_user");
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <ToastProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Campaigns", path: "/offers", icon: Zap },
    { name: "Filters", path: "/filters", icon: Shield },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Publishers", path: "/publishers", icon: Users },
    { name: "Settings", path: "/settings", icon: SettingsIcon }
  ];

  return (
    <ToastProvider>
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
            <img src="/favicon.png" className="w-8 h-8 rounded-lg object-contain shadow-sm" alt="ClicksTracker Logo" />
            <span className="font-bold text-lg tracking-tight text-slate-900">ClicksTracker</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 md:hidden"
          >
            <X className="w-5 h-5" />
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

        {/* Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">{user?.username || "Admin"}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active Session
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
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
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="hidden sm:block text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              Traffic Operations & Redirect Engine
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/simulator.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Terminal size={14} className="text-indigo-600" />
              Live Script Simulator
            </a>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">System Active</span>
            </div>
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
    </ToastProvider>
  );
}
