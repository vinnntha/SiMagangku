"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await register({ name: fullName, email, password });
      setSuccess(res.message || "Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 z-10">
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

          {/* Title and Subtitle */}
          <span className="text-base font-bold text-brand-cyan tracking-tight mb-0.5">
            SiMagangku
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center mb-1">
            Create Account
          </h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide mb-6 text-center">
            Start your professional journey today
          </p>

          {/* Error / Success Messages */}
          {error && (
            <div className="w-full px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-center animate-[fadeIn_0.2s_ease-out]">
              {error}
            </div>
          )}
          {success && (
            <div className="w-full px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium text-center animate-[fadeIn_0.2s_ease-out]">
              {success}
            </div>
          )}

          {/* REGISTER FORM */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullname" className="text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="fullname"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {/* User icon */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@university.ac.id"
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {/* Lock icon */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {/* Lock icon */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start gap-2 mt-1">
              <input
                id="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan cursor-pointer transition-colors mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-[11px] text-slate-500 font-medium leading-relaxed selection:bg-transparent cursor-pointer">
                I agree to the{" "}
                <a href="#terms" className="text-brand-cyan font-bold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" className="text-brand-cyan font-bold hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_12_rgba(0,180,216,0.15)] hover:shadow-[0_6px_16px_rgba(0,180,216,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          {/* Footer Card */}
          <p className="text-xs text-slate-500 font-medium mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-cyan hover:underline font-bold">
              Login here
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
