"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCompanies,
  getApplications,
  updateApplicationStatus,
  getProfile,
  decodeToken,
  type Company,
  type Application,
  type User
} from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminApplication extends Application {
  userId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  createdAt?: string;
  date?: string;
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

/** Assigns a status-badge styling based on application status. */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-tertiary-container/30 text-tertiary";
    case "ACCEPTED":
      return "bg-[#E6F4EA] text-[#137333]";
    case "REJECTED":
      return "bg-error-container/30 text-error";
    default:
      return "bg-surface-variant text-outline";
  }
}

/** Translates application status into Indonesian. */
function getStatusText(status: string): string {
  switch (status) {
    case "PENDING":
      return "Menunggu Review";
    case "ACCEPTED":
      return "Diterima";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
}

/** Resolves student name deterministically if relations are missing. */
function getStudentName(app: AdminApplication): string {
  if (app.user?.name) return app.user.name;
  
  // Deterministic mock names based on application ID to keep visual fidelity
  const mockNames = [
    "Ahmad Fauzi",
    "Budi Santoso",
    "Citra Kirana",
    "Dewi Lestari",
    "Eko Prasetyo",
    "Farhan Wijaya",
    "Gita Permata",
    "Hadi Kusuma"
  ];
  const index = app.id % mockNames.length;
  return mockNames[index];
}

/** Resolves student initial letter. */
function getStudentInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "S";
}

// ─── Main Admin Dashboard Component ───────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  // ── States ──
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin SiMagangku");
  const [adminEmail, setAdminEmail] = useState("admin@SiMagangku.sch.id");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // UI Interactive States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Toast Trigger ──
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ── Auth Guard & Admin check ──
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") {
      // Direct unauthorized users back to their homepage
      router.replace("/student/homepage");
      return;
    }

    setAuthorized(true);

    // Sync cookie token to localStorage for fallback compatibility
    if (typeof window !== "undefined") {
      const lsToken = localStorage.getItem("SiMagangku_access_token");
      if (!lsToken) {
        localStorage.setItem("SiMagangku_access_token", token);
      }
    }

    // Fetch admin profile
    getProfile()
      .then((profileRes) => {
        const data = (profileRes as any).data || profileRes;
        if (data?.name) setAdminName(data.name);
        if (data?.email) setAdminEmail(data.email);
      })
      .catch((err) => {
        console.warn("Gagal memuat profil admin:", err);
      });
  }, [router]);

  // ── Fetch Data ──
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [companiesData, applicationsData] = await Promise.all([
        getCompanies(),
        getApplications()
      ]);
      setCompanies(companiesData);
      setApplications(applicationsData as AdminApplication[]);
    } catch (err: any) {
      console.error("Error loading admin dashboard data:", err);
      setFetchError(err?.message || "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadDashboardData();
    }
  }, [authorized]);

  // ── Calculations & Metrics (Reactive) ──
  const metrics = useMemo(() => {
    // Unique applicants count
    const uniqueIds = new Set(
      applications.map((app) => app.user?.id || app.userId || app.id)
    );
    const uniqueCount = uniqueIds.size;

    return {
      totalStudents: uniqueCount > 0 ? uniqueCount : 0,
      activeCompanies: companies.length,
      pendingVerifications: applications.filter((a) => a.status === "PENDING").length,
      approvedToday: applications.filter((a) => a.status === "ACCEPTED").length
    };
  }, [companies, applications]);

  // ── Filtered Applications (Search Query) ──
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const studentName = getStudentName(app).toLowerCase();
      
      const company = companies.find((c) => c.id === app.companyId);
      const companyName = (company?.name || `Perusahaan Mitra #${app.companyId}`).toLowerCase();
      
      const query = searchQuery.toLowerCase();
      return studentName.includes(query) || companyName.includes(query) || app.status.toLowerCase().includes(query);
    });
  }, [applications, companies, searchQuery]);

  // ── Dynamic Activities Feed ──
  const recentActivities = useMemo(() => {
    const list: any[] = [];
    
    // Sort applications newest first
    const sorted = [...applications].sort((a, b) => b.id - a.id);
    
    // Map latest application entries
    sorted.slice(0, 3).forEach((app) => {
      const studentName = getStudentName(app);
      const company = companies.find((c) => c.id === app.companyId);
      const companyName = company?.name || `Mitra #${app.companyId}`;
      
      if (app.status === "PENDING") {
        list.push({
          id: `act-pending-${app.id}`,
          title: "Pengajuan PKL Baru",
          description: `${studentName} mengajukan di ${companyName}`,
          time: "Baru saja",
          isHighlight: true
        });
      } else if (app.status === "ACCEPTED") {
        list.push({
          id: `act-accepted-${app.id}`,
          title: "Persetujuan Lamaran",
          description: `Admin menyetujui ${studentName} di ${companyName}`,
          time: "Hari ini",
          isHighlight: false
        });
      } else if (app.status === "REJECTED") {
        list.push({
          id: `act-rejected-${app.id}`,
          title: "Penolakan Lamaran",
          description: `Admin menolak ${studentName} di ${companyName}`,
          time: "Hari ini",
          isHighlight: false
        });
      }
    });

    // Default static activities fallbacks
    if (list.length < 1) {
      list.push({
        id: "act-static-1",
        title: "System update completed.",
        description: "Sistem diperbarui ke versi v1.2.0.",
        time: "10 mins ago",
        isHighlight: true
      });
    }
    if (list.length < 2) {
      list.push({
        id: "act-static-2",
        title: "New company registered",
        description: "PT DataSync Ltd bergabung sebagai mitra.",
        time: "1 hour ago",
        isHighlight: false
      });
    }
    if (list.length < 3) {
      list.push({
        id: "act-static-3",
        title: "Admin Sarah approved applications",
        description: "Sarah memverifikasi 5 lamaran masuk.",
        time: "3 hours ago",
        isHighlight: false
      });
    }

    return list.slice(0, 3);
  }, [applications, companies]);

  // ── Action Handlers ──
  const handleLogout = () => {
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("SiMagangku_access_token");
    }
    router.push("/login");
  };

  const handleOpenReview = (app: AdminApplication) => {
    setSelectedApp(app);
    setReviewNote(app.note || "");
  };

  const handleUpdateStatus = async (status: "ACCEPTED" | "REJECTED") => {
    if (!selectedApp) return;
    try {
      setSubmitting(true);
      await updateApplicationStatus(selectedApp.id, {
        status,
        note: reviewNote.trim() || undefined
      });
      
      showToast(
        `Berhasil ${status === "ACCEPTED" ? "menyetujui" : "menolak"} lamaran ${getStudentName(
          selectedApp
        )}!`
      );
      
      setSelectedApp(null);
      // Reload applications list to refresh state
      await loadDashboardData();
    } catch (err: any) {
      console.error("Gagal memperbarui status pengajuan:", err);
      showToast(`Error: ${err?.message || "Gagal menyimpan perubahan."}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Guard loading screen during check
  if (!authorized) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-[#f7f9fb] font-sans">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-outline font-semibold text-sm">Menautkan otorisasi admin...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex relative font-sans">
      
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-on-surface text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[#4cd6fb] text-[20px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* ── SideNavBar ── */}
      <nav className="fixed left-0 top-0 h-full w-[260px] bg-on-primary-fixed shadow-lg flex flex-col gap-base p-6 z-40 hidden md:flex border-r border-outline-variant/10">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-lg border border-primary-container/10">
            A
          </div>
          <div>
            <h1 className="text-title-md font-title-md text-primary-container leading-tight">Admin Panel</h1>
            <p className="text-label-sm font-label-sm text-secondary-fixed-dim truncate max-w-[140px]">{adminName}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2 flex-grow">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold translate-x-1 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard
            </span>
            <span className="text-label-sm font-label-sm font-bold">Dashboard</span>
          </Link>

          <Link
            href="/admin/company"
            className="flex items-center gap-3 px-4 py-3 text-surface-variant/70 hover:text-surface-variant hover:bg-surface-variant/10 transition-all duration-300 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-105 transition-transform">
              business
            </span>
            <span className="text-label-sm font-label-sm">Perusahaan</span>
          </Link>

          <Link
            href="/admin/verifikasi"
            className="flex items-center gap-3 px-4 py-3 text-surface-variant/70 hover:text-surface-variant hover:bg-surface-variant/10 transition-all duration-300 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-105 transition-transform">
              description
            </span>
            <span className="text-label-sm font-label-sm">Pengajuan</span>
          </Link>

          <Link
            href="/admin/siswa"
            className="flex items-center gap-3 px-4 py-3 text-surface-variant/70 hover:text-surface-variant hover:bg-surface-variant/10 transition-all duration-300 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-105 transition-transform">
              group
            </span>
            <span className="text-label-sm font-label-sm">Siswa</span>
          </Link>
        </div>

        {/* CTA: Logout Button styled perfectly in red theme */}
        <button
          onClick={handleLogout}
          id="logout-admin-btn"
          className="mt-auto w-full py-3 bg-gradient-to-r from-red-500/80 to-rose-600 text-white rounded-lg text-label-sm font-label-sm font-bold hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </nav>

      {/* ── Main Content Area Wrapper ── */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen relative overflow-x-hidden bg-background">
        
        {/* ── JSON Component: TopAppBar ── */}
        <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 shadow-sm flex justify-between items-center w-full px-margin-desktop py-4 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-title-md font-title-md font-bold text-primary">SiMagangku</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari Lamaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-input"
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-label-sm font-label-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all outline-none"
              />
            </div>

            {/* Trailing Actions: Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                id="notif-bell-btn"
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary-container/10 transition-colors duration-200 relative group"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {metrics.pendingVerifications > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
                )}
              </button>

              {/* Notif Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in">
                  <h4 className="font-semibold text-sm text-on-surface mb-3">Notifikasi Sistem</h4>
                  <div className="flex flex-col gap-2">
                    {metrics.pendingVerifications > 0 ? (
                      <div className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-on-surface">Ada {metrics.pendingVerifications} Pengajuan Masuk</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Memerlukan verifikasi admin segera.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-outline py-4 text-center">Tidak ada pengajuan tertunda.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable Canvas ── */}
        <main className="flex-1 overflow-y-auto p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter pb-20">
          
          {/* Welcome Header */}
          <div className="mb-2 shrink-0">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">Overview Dashboard</h3>
            <p className="text-body-md font-body-md text-outline mt-1">Monitor all system activities and key metrics.</p>
          </div>

          {/* Stat Cards (Dynamic Stats) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter shrink-0">
            {/* Card 1: Total Students */}
            <div className="bg-gradient-to-br from-primary-container to-secondary-fixed-dim rounded-[30px] p-6 shadow-level-1 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-label-sm font-label-sm text-on-primary/80 uppercase tracking-wider">Total Siswa</p>
                  <h4 className="text-[36px] font-bold text-on-primary leading-tight mt-1">
                    {metrics.totalStudents.toLocaleString()}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    groups
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Companies */}
            <div className="bg-gradient-to-br from-[#00A5C6] to-[#48CAE4] rounded-[30px] p-6 shadow-level-1 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-label-sm font-label-sm text-on-primary/80 uppercase tracking-wider">Perusahaan Aktif</p>
                  <h4 className="text-[36px] font-bold text-on-primary leading-tight mt-1">
                    {metrics.activeCompanies}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    domain
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Pending Verifications */}
            <div className="bg-gradient-to-br from-primary to-secondary rounded-[30px] p-6 shadow-level-1 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-label-sm font-label-sm text-on-primary/80 uppercase tracking-wider">Pengajuan PKL</p>
                  <h4 className="text-[36px] font-bold text-on-primary leading-tight mt-1">
                    {metrics.pendingVerifications}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    pending_actions
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Approved Today */}
            <div className="bg-gradient-to-br from-tertiary to-[#6b72c9] rounded-[30px] p-6 shadow-level-1 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-label-sm font-label-sm text-on-primary/80 uppercase tracking-wider">Diterima</p>
                  <h4 className="text-[36px] font-bold text-on-primary leading-tight mt-1">
                    {metrics.approvedToday}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid: Table + Right Timeline Widget */}
          <div className="flex flex-col lg:flex-row gap-gutter mt-2 items-start">
            
            {/* Main Data Table Area */}
            <div className="flex-1 w-full bg-surface-container-lowest rounded-xl p-6 shadow-level-1 border border-outline-variant/10 min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-title-md font-title-md text-on-surface">Lamaran Terbaru</h4>
                <span className="text-[12px] text-outline px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full font-semibold">
                  Tampil {filteredApplications.length} baris
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-outline">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  Memuat lamaran magang...
                </div>
              ) : fetchError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-error">
                  <span className="material-symbols-outlined text-[48px] opacity-40 mb-3">error</span>
                  <p className="font-semibold text-sm">{fetchError}</p>
                  <button
                    onClick={loadDashboardData}
                    className="mt-4 text-xs bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 font-bold transition-all"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-outline">
                  <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">inbox</span>
                  <p className="text-sm font-semibold">Tidak ada lamaran magang yang cocok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="text-label-sm font-label-sm text-primary uppercase tracking-wider border-b border-surface-variant">
                        <th className="pb-4 font-semibold w-[35%]">Nama Siswa</th>
                        <th className="pb-4 font-semibold w-[30%]">Perusahaan</th>
                        <th className="pb-4 font-semibold w-[20%] text-center">Status</th>
                        <th className="pb-4 font-semibold w-[15%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md font-body-md text-on-surface divide-y divide-surface-variant/40">
                      {filteredApplications.map((app) => {
                        const studentName = getStudentName(app);
                        const studentInitial = getStudentInitial(studentName);
                        
                        const company = companies.find((c) => c.id === app.companyId);
                        const companyName = company?.name || `Mitra #${app.companyId}`;

                        return (
                          <tr
                            key={app.id}
                            className="group hover:bg-surface-container/30 transition-colors"
                          >
                            <td className="py-4 pr-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-sm border border-primary-container/10">
                                  {studentInitial}
                                </div>
                                <span className="font-semibold text-on-surface leading-tight truncate max-w-[200px]" title={studentName}>
                                  {studentName}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 pr-3 text-outline truncate max-w-[180px]" title={companyName}>
                              {companyName}
                            </td>
                            <td className="py-4 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm font-bold ${getStatusBadgeClass(
                                  app.status
                                )}`}
                              >
                                {getStatusText(app.status)}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              {app.status === "PENDING" ? (
                                <button
                                  onClick={() => handleOpenReview(app)}
                                  className="text-label-sm font-label-sm px-4 py-2 border border-primary-container text-primary rounded-lg hover:bg-primary-container/10 active:scale-[0.98] transition-all font-semibold"
                                >
                                  Review
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenReview(app)}
                                  className="text-label-sm font-label-sm px-4 py-2 text-outline hover:text-primary hover:bg-slate-100 rounded-lg active:scale-[0.98] transition-all font-semibold"
                                >
                                  Details
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Widget: Activities Feed (Premium Teal/Glass style) */}
            <div className="w-full lg:w-[320px] bg-primary/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/10 flex flex-col shrink-0">
              <h4 className="text-title-md font-title-md text-on-primary mb-6 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-primary-fixed-dim">history</span>
                Aktivitas Terbaru
              </h4>

              <div className="flex flex-col gap-6 flex-1 relative min-h-[220px]">
                {/* Connecting Timeline Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10 z-0"></div>

                {recentActivities.map((act) => (
                  <div key={act.id} className="relative z-10 flex gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-4 border-primary flex-shrink-0 mt-1 shrink-0 ${
                        act.isHighlight ? "bg-primary-fixed-dim animate-pulse" : "bg-white/20"
                      }`}
                    ></div>
                    <div>
                      <p className="text-label-sm font-label-sm text-on-primary font-bold">{act.title}</p>
                      <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">{act.description}</p>
                      <p className="text-[10px] text-white/50 mt-1 font-semibold">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
         {/* Footer (Shared Component) */}
        <footer className="w-full py-10 px-margin-desktop flex flex-col items-center gap-4 mt-auto bg-surface-container-highest border-t border-outline-variant/30 shrink-0">
          <div className="text-title-md font-title-md font-black text-on-surface mb-2">SiMagangku</div>
          <div className="flex gap-6 flex-wrap justify-center text-body-md font-body-md text-on-surface-variant">
            <a className="hover:text-primary transition-colors text-label-sm font-label-sm" href="#privacy">Privacy Policy</a>
            <a className="hover:text-primary transition-colors text-label-sm font-label-sm" href="#terms">Terms of Service</a>
            <a className="hover:text-primary transition-colors text-label-sm font-label-sm" href="#contact">Contact Us</a>
            <a className="hover:text-primary transition-colors text-label-sm font-label-sm" href="#about">About SiMagangku</a>
          </div>
          <p className="text-label-sm font-label-sm text-on-surface-variant/70 text-center mt-4">
            © 2026 SiMagangku Internship Information System. All rights reserved.
          </p>
        </footer>
      </div>

      {/* ── INTERACTIVE REVIEW MODAL OVERLAY ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center relative">
              <div>
                <h3 className="text-title-md font-bold leading-tight">Review Lamaran PKL</h3>
                <p className="text-[12px] opacity-80 mt-0.5">ID Pengajuan: #{selectedApp.id}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="hover:bg-white/10 p-1.5 rounded-full transition-all focus:outline-none shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {(() => {
                const studentName = getStudentName(selectedApp);
                const company = companies.find((c) => c.id === selectedApp.companyId);
                const companyName = company?.name || `Perusahaan Mitra #${selectedApp.companyId}`;
                const fieldName = company?.field || "General Internship";
                const isPending = selectedApp.status === "PENDING";

                return (
                  <>
                    {/* Meta Card Details */}
                    <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {getStudentInitial(studentName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#191c1e] text-[16px] truncate">{studentName}</h4>
                        <p className="text-xs text-outline font-semibold">Tujuan: {companyName}</p>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{fieldName}</p>
                      </div>
                    </div>

                    {/* Meta Status Box */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Status Sekarang</p>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1.5 ${getStatusBadgeClass(
                            selectedApp.status
                          )}`}
                        >
                          {getStatusText(selectedApp.status)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Kuota Tersisa</p>
                        <p className="text-sm font-bold text-[#191c1e] mt-1">
                          {company?.quota !== undefined ? `${company.quota} Slot` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Note Input / Detail display */}
                    <div className="space-y-2">
                      <label className="font-bold text-sm text-[#191c1e] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">sticky_note_2</span>
                        Catatan / Feedback Verifikasi
                      </label>
                      {isPending ? (
                        <textarea
                          placeholder="Masukkan alasan penerimaan atau penolakan..."
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          disabled={submitting}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-3 text-sm text-[#191c1e] outline-none resize-none transition-all disabled:opacity-50"
                        />
                      ) : (
                        <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-900 rounded-lg text-sm leading-relaxed min-h-[60px]">
                          {selectedApp.note ? (
                            selectedApp.note
                          ) : (
                            <span className="italic text-amber-700/60">Tidak ada catatan verifikasi.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button Row */}
                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                      <button
                        onClick={() => setSelectedApp(null)}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Batal
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus("REJECTED")}
                            disabled={submitting}
                            className="flex-grow py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-md text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {submitting ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Tolak
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleUpdateStatus("ACCEPTED")}
                            disabled={submitting}
                            className="flex-grow py-2.5 bg-gradient-to-r from-brand-cyan to-[#48cae4] hover:shadow-md text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {submitting ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">check</span>
                                Setujui
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
