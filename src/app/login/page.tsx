"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login as loginApi, saveToken, decodeToken } from "@/lib/api";
import { setAuthToken } from "@/helpers/cookies";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi({ email, password });
      saveToken(res.access_token);
      setAuthToken(res.access_token, keepLoggedIn);

      // Differentiate role redirection
      const payload = decodeToken(res.access_token);
      if (payload?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/homepage");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-x-hidden">
      {/* Background glow effects matching mockup */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#e0f7fa]/50 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[#00b4d8]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* HEADER & NAVIGATION */}
      <header className="sticky top-0 left-0 w-full h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 sm:px-12">
        <Link href="/" className="text-xl font-bold text-brand-cyan tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity">
          SiMagangku
        </Link>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 z-10">
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,180,216,0.06)] transition-all duration-300 p-8 sm:p-10 flex flex-col items-center">

          {/* Logo/Icon Header */}
          <div className="w-16 h-16 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-5 shadow-inner">
            {/* Student Cap SVG Icon */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-1">
            Welcome Back
          </h2>
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase mb-8 text-center">
            tech-forward internship management
          </p>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="student@studentmalang.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {/* Mail icon */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <a href="#forgot" className="text-[11px] font-medium text-brand-cyan hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {/* Lock icon */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? (
                    // Eye slash icon
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Keep me logged in Checkbox */}
            <div className="flex items-center gap-2 mt-1">
              <input
                id="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan cursor-pointer transition-colors"
              />
              <label htmlFor="keep-logged-in" className="text-xs text-slate-500 font-medium cursor-pointer selection:bg-transparent">
                Keep me logged in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-11 bg-brand-cyan hover:bg-brand-cyan-hover text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,180,216,0.15)] hover:shadow-[0_6px_16px_rgba(0,180,216,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
            >
              <span>Login</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform">
                <line x1="5" x2="19" y1="12" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          {/* Footer Card */}
          <p className="text-xs text-slate-500 font-medium mt-8">
            Don't have an account?{" "}
            <Link href="/register" className="text-brand-cyan hover:underline font-bold">
              Register here
            </Link>
          </p>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
          <span className="text-sm font-bold text-brand-cyan">SiMagangku</span>
          <span className="text-xs text-slate-400 self-center">
            © 2024 SiMagangku. Tech-forward professionalism.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#privacy" className="text-xs text-slate-500 hover:text-brand-cyan transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-xs text-slate-500 hover:text-brand-cyan transition-colors">Terms of Service</a>
          <a href="#help" className="text-xs text-slate-500 hover:text-brand-cyan transition-colors">Help Centre</a>
          <a href="#career" className="text-xs text-slate-500 hover:text-brand-cyan transition-colors">Career Advice</a>
        </div>
      </footer>
    </div>
  );
}
