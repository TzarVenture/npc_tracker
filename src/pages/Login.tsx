/* Login.tsx: Enterprise Fluent UI admin authentication view. */
import React, { useState } from "react";
import axios from "axios";
import { Lock, User as UserIcon, ShieldCheck, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/login", { username, password });
      if (res.data.success && res.data.token) {
        localStorage.setItem("npc_token", res.data.token);
        localStorage.setItem("npc_user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.token, res.data.user);
      } else {
        const rawErr = res.data?.error;
        const msg = typeof rawErr === "string" ? rawErr : (rawErr?.message || "Login failed.");
        setError(msg);
      }
    } catch (err: any) {
      const rawError = err.response?.data?.error || err.response?.data || err.message;
      let errorMsg = "Invalid credentials or connection error.";
      if (typeof rawError === "string") {
        errorMsg = rawError;
      } else if (rawError && typeof rawError === "object") {
        errorMsg = rawError.message || rawError.error || (err.response?.status === 404 ? "API route /api/auth/login not found (404). Ensure backend server is running & proxied." : JSON.stringify(rawError));
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-slate-800 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img src="/favicon.png" className="inline-block w-14 h-14 rounded-2xl object-contain shadow-lg" alt="ClicksTracker Logo" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ClicksTracker
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Enterprise Traffic &amp; Affiliate Control Gateway</p>
          </div>
        </div>

        {/* Enterprise Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your administrator credentials to proceed.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin username"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-2 text-sm"
            >
              {loading ? "Authenticating..." : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
