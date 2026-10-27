/* App.tsx: Root application component managing layout, protected authentication, and navigation routes. */
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
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
  LogOut
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Offers from "./pages/Offers";
import Filters from "./pages/Filters";
import Reports from "./pages/Reports";
import Publishers from "./pages/Publishers";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { ToastProvider } from "./components/ui/Toast";
import { User } from "./types";

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalTracking, setGlobalTracking] = useState<boolean | null>(null);
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

  useEffect(() => {
    if (token) {
      axios.get("/api/system-config")
        .then(res => setGlobalTracking(res.data?.globalTracking !== false))
        .catch(() => setGlobalTracking(true));
    }
  }, [token, location.pathname]);

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
      <div className="flex h-screen bg-[#f1f4f8] text-slate-900 font-sans overflow-hidden">
        {/* Sidebar Navigation - Sleek dark contrast */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transform transition-transform duration-200 md:relative md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" className="w-8 h-8 rounded-lg object-contain shadow-xs" alt="ClicksTracker Logo" />
              <span className="font-bold text-lg tracking-tight text-white">ClicksTracker</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const currentPath = location.pathname.replace(/\/+$/, "") || "/";
              const targetPath = item.path.replace(/\/+$/, "") || "/";
              const isActive = targetPath === "/"
                ? currentPath === "/"
                : currentPath === targetPath || currentPath.startsWith(targetPath + "/");

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white shadow-xs border border-slate-700/60"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Profile & Logout Footer */}
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60">
            <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">{user?.username || "Admin"}</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Active session
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area with warm/soft neutral canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f1f4f8]">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
              <span className="hidden sm:inline-block text-sm font-semibold text-slate-800">
                Traffic & Attribution Console
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${globalTracking === false ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-slate-700 font-medium">
                {globalTracking === false ? "Tracking Paused" : "Tracking Active"}
              </span>
            </div>
          </header>

          {/* Page Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
                      <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
                      <p className="text-slate-500 mt-2">The requested tab does not exist.</p>
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
