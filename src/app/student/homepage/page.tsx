"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCompanies, getMyApplications, type Company, type Application } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";
import router from "next/router";

// ─── Constants ────────────────────────────────────────────────────────────────

const popularTags = ["Web Development", "UI/UX Design", "Jaringan", "Multimedia", "Network"];

const navLinks = [
  { label: "Beranda", href: "/student/homepage", active: true },
  { label: "Perusahaan", href: "/student/perusahaan" },
  { label: "Pengajuan Saya", href: "/student/pengajuan" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Assign a quota color based on remaining slots. */
function quotaColor(quota: number): "green" | "red" | "blue" {
  if (quota <= 1) return "red";
  if (quota <= 3) return "green";
  return "blue";
}

/** Return the first letter(s) of a company name as a logo abbreviation. */
function logoInitial(name: string): string {
  const words = name.replace(/^(PT\.?|CV\.?)\s*/i, "").trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function QuotaBadge({ quota, color }: { quota: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
    red: "bg-red-50 text-red-500 border-red-200",
    blue: "bg-cyan-50 text-cyan-600 border-cyan-200",
  };
  const arrowColor: Record<string, string> = {
    green: "text-emerald-500",
    red: "text-red-400",
    blue: "text-cyan-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[color]}`}
    >
      <span className={arrowColor[color]}>↑</span> Sisa {quota}
    </span>
  );
}
function CompanyCard({ company, onApply }: { company: Company & { appCount?: number }; onApply: (id: number) => void }) {
  const color = quotaColor(company.quota);
  const initials = logoInitial(company.name);

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3 hover:shadow-[0_8px_30px_rgba(0,180,216,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-cyan/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 border border-brand-cyan/10">
          {initials}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <QuotaBadge quota={company.quota} color={color} />
          {company.appCount !== undefined && company.appCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              🔥 {company.appCount} Pendaftar
            </span>
          )}
        </div>
      </div>

      {/* Name & category */}
      <div>
        <h3 className="font-semibold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {company.name}
        </h3>
        <p className="text-on-surface-variant text-xs mt-0.5 line-clamp-1">{company.field}</p>
      </div>

      {/* Description snippet */}
      {company.description && (
        <p className="text-on-surface-variant text-[11px] leading-relaxed line-clamp-2">
          {company.description}
        </p>
      )}

      {/* CTA */}
      <Link href={`/student/perusahaan/${company.id}`}>
        <button
          onClick={() => onApply(company.id)}
          disabled={company.quota === 0 || !company.status}
          className="mt-auto w-full bg-gradient-to-r from-brand-cyan to-[#48cae4] text-white text-xs font-bold py-2 rounded-lg hover:shadow-[0_4px_15px_rgba(0,180,216,0.4)] hover:opacity-90 transition-all duration-200 tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          id={`ajukan-pkl-${company.id}`}
        >
          {company.quota === 0 ? "Penuh" : !company.status ? "Tutup" : "Ajukan PKL"}
        </button>
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 bg-slate-100 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-3/5" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-8 bg-slate-100 rounded-lg mt-auto" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const router = useRouter();

  // ── State ──
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // ── Auth guard + token sync ──
  useEffect(() => {
    const cookieToken = getAuthToken();
    if (!cookieToken) {
      router.replace("/login");
      return;
    }
    if (typeof window !== "undefined") {
      const lsToken = localStorage.getItem("SiMagangku_access_token");
      if (!lsToken) {
        localStorage.setItem("SiMagangku_access_token", cookieToken);
      }
    }
  }, [router]);

  // ── Fetch data ──
  useEffect(() => {
    async function load() {
      try {
        setLoadingCompanies(true);
        const [companiesData, applicationsData] = await Promise.all([
          getCompanies(),
          getMyApplications().catch((err) => {
            console.warn("Gagal memuat data pengajuan:", err);
            return [] as Application[];
          }),
        ]);
        setCompanies(companiesData);
        setApplications(applicationsData);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setFetchError("Gagal memuat data perusahaan. Silakan refresh halaman.");
      } finally {
        setLoadingCompanies(false);
      }
    }
    load();
  }, []);

  // ── Sort companies by application count (descending) ──
  const sortedCompanies = React.useMemo(() => {
    const counts: Record<number, number> = {};
    // Calculate application count for each company
    applications.forEach((app) => {
      if (app.companyId) {
        counts[app.companyId] = (counts[app.companyId] || 0) + 1;
      }
    });

    return [...companies].map((c) => ({
      ...c,
      appCount: counts[c.id] || 0,
    })).sort((a, b) => b.appCount - a.appCount);
  }, [companies, applications]);

  // ── Filtered companies ──
  const filteredCompanies = sortedCompanies.filter((c) => {
    const matchSearch =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchTag =
      activeTag === null ||
      c.field.toLowerCase().includes(activeTag.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(activeTag.toLowerCase());

    return matchSearch && matchTag;
  });

  // ── Handlers ──
  function handleLogout() {
    removeAuthToken();
    router.push("/login");
  }

  async function handleApply(companyId: number) {
    router.push(`/student/pengajuan/form/${companyId}`);
  }

  const pending = applications.filter((a) => a.status === "PENDING").length;
  const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-[var(--font-be-vietnam)] text-on-surface antialiased">

      {/* ── Toast ── */}
      {applySuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-on-surface text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {applySuccess}
        </div>
      )}

      {/* ── TopNav ── */}
      <header className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-slate-100 shadow-[0_2px_20px_rgba(0,119,182,0.06)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-10 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-lg text-primary hover:opacity-80 transition-opacity tracking-tight">
              SiMagangku
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-on-surface-variant hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileNavOpen ? "close" : "menu"}
              </span>
            </button>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex gap-7 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors pb-0.5 ${link.active
                  ? "text-primary border-b-2 border-brand-cyan"
                  : "text-on-surface-variant hover:text-primary"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notif-bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 transition-colors relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pending > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
              </button>

              {/* Notif Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
                  <h4 className="font-semibold text-sm text-on-surface mb-3">Notifikasi</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-brand-cyan mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-on-surface">Pendaftaran PKL Semester Ganjil Telah Dibuka</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">2 jam lalu</p>
                      </div>
                    </div>
                    {pending > 0 && (
                      <div className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-on-surface">{pending} Lamaran Sedang Diproses</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Cek status pengajuan Anda</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + logout */}
            <div className="relative group">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cyan to-primary flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
                id="student-avatar"
              >
                S
              </div>
              <div className="absolute right-0 top-9 hidden group-hover:flex flex-col bg-white rounded-xl shadow-xl border border-slate-100 py-2 min-w-[140px] z-50">
                <Link href="/student/profil" className="text-xs text-on-surface px-4 py-2 hover:bg-slate-50 transition-colors">
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-500 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                  id="logout-btn"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-sm">
            <div className="flex flex-col gap-2 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-10">

        {/* ── Banner ── */}
        <div className="mt-6 mb-8 rounded-2xl bg-gradient-to-r from-brand-cyan/10 via-primary/5 to-brand-cyan/10 border border-brand-cyan/20 px-5 py-3 flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-brand-cyan flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-primary font-medium">
            ✦ Pendaftaran PKL Semester Ganjil Telah Dibuka
          </p>
        </div>

        {/* ── Hero Search ── */}
        <section className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface leading-tight mb-3">
            Temukan Tempat PKL
            <br />
            Terbaik di{" "}
            <span className="text-brand-cyan">Malang</span>
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Eksplorasi puluhan perusahaan terkemuka. Mulai karir profesional Anda
            dengan pengalaman magang yang berarti.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-5">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-on-surface-variant/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              id="search-company-input"
              type="text"
              placeholder="Cari Perusahaan PKL di Malang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-28 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 shadow-sm transition-all"
            />
            <button
              id="search-btn"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-cyan text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-brand-cyan-hover transition-colors"
            >
              Cari
            </button>
          </div>

          {/* Popular tags */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium self-center">Populer:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                id={`tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${activeTag === tag
                  ? "bg-brand-cyan text-white border-brand-cyan shadow-sm"
                  : "bg-white text-on-surface-variant border-slate-200 hover:border-brand-cyan hover:text-primary"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── Recommended Companies ── */}
        <section id="rekomendasi" className="mb-10">
          <div className="flex justify-between items-baseline mb-5">
            <div>
              <h2 className="font-bold text-lg text-on-surface">Rekomendasi Perusahaan</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Berdasarkan program studi Anda</p>
            </div>
            <Link
              href="/student/perusahaan"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              id="lihat-semua-link"
            >
              Lihat Semua
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : fetchError ? (
            <div className="text-center py-16 text-on-surface-variant">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-medium text-red-500 mb-2">{fetchError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs bg-brand-cyan text-white px-4 py-2 rounded-lg hover:bg-brand-cyan-hover transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm">Tidak ada perusahaan ditemukan untuk pencarian ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="relative">
                  {applyingId === company.id && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <CompanyCard company={company} onApply={handleApply} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-bold text-base text-primary hover:opacity-80 transition-opacity">
            SiMagangku
          </Link>
          <p className="text-xs text-on-surface-variant text-center">
            © 2026 SiMagangku Internship Information System. All rights reserved.
          </p>
          <nav className="flex gap-5 flex-wrap justify-center">
            {["Privacy Policy", "Terms of Service", "Contact Us", "About SiMagangku"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
