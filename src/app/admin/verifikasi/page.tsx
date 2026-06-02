"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCompanies,
  getApplications,
  getStudents,
  updateCompany,
  updateApplicationStatus,
  getProfile,
  decodeToken,
  type Company,
  type Application,
} from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminApplication extends Application {
  userId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    nis?: string;
  };
  created_at?: string;
  createdAt?: string;
  date?: string;
}

interface Student {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  status_pkl: "Belum Magang" | "Sedang Magang" | "Selesai";
  perusahaan?: string;
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

/** Resolves initial letter of a name. */
function getStudentInitial(name?: string | null): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed.charAt(0).toUpperCase() || "S";
}

/** Translates application status into Indonesian text. */
function getStatusText(status: string): string {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "ACCEPTED":
      return "DISETUJUI";
    case "REJECTED":
      return "DITOLAK";
    default:
      return status;
  }
}

/** Assigns a status-badge styling based on application status. */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
    case "ACCEPTED":
      return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20";
    case "REJECTED":
      return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
    default:
      return "bg-surface-variant text-outline border-outline-variant/25";
  }
}

/** Assigns a status dot styling. */
function getStatusDotClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-[#F59E0B] animate-pulse";
    case "ACCEPTED":
      return "bg-[#10B981]";
    case "REJECTED":
      return "bg-[#EF4444]";
    default:
      return "bg-outline";
  }
}

export default function AdminVerifikasiPage() {
  const router = useRouter();

  // ── States ──
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin SiMagangku");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Search & Pagination & Mobile
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rowsPerPage = 5;

  // Interactive Verification Modal
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [modalMode, setModalMode] = useState<"APPROVE" | "REJECT" | "DETAILS">("DETAILS");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Toast Trigger ──
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ── Auth Guard & Initialization ──
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") {
      router.replace("/student/homepage");
      return;
    }

    setAuthorized(true);

    // Sync localStorage
    if (typeof window !== "undefined") {
      const lsToken = localStorage.getItem("SiMagangku_access_token");
      if (!lsToken) {
        localStorage.setItem("SiMagangku_access_token", token);
      }
    }

    // Fetch Profile
    getProfile()
      .then((profileRes) => {
        const data = (profileRes as any).data || profileRes;
        if (data?.name) setAdminName(data.name);
      })
      .catch((err) => {
        console.warn("Gagal memuat profil admin:", err);
      });
  }, [router]);

  // ── Fetch Data ──
  const loadData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [companiesData, applicationsData, studentsData] = await Promise.all([
        getCompanies(),
        getApplications(),
        getStudents(),
      ]);
      setCompanies(companiesData);
      setApplications(applicationsData as AdminApplication[]);
      setStudents(studentsData);

      if (typeof window !== "undefined") {
        localStorage.setItem("SiMagangku_admin_students", JSON.stringify(studentsData));
      }
      // update last refreshed timestamp
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error loading verifikasi page data:", err);
      setFetchError(err?.message || "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    const INTERVAL_MS = 30_000; // 30 seconds
    let id: number | null = null;

    const startPolling = () => {
      id = window.setInterval(() => {
        try {
          if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
          loadData();
        } catch (e) {
          console.warn("Auto-refresh failed:", e);
        }
      }, INTERVAL_MS) as unknown as number;
    };

    startPolling();

    // also refresh immediately when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (id !== null) clearInterval(id as unknown as number);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [authorized]);

  // ── Action Handlers ──
  const handleLogout = () => {
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("SiMagangku_access_token");
    }
    router.push("/login");
  };

  const handleOpenActionModal = (app: AdminApplication, mode: "APPROVE" | "REJECT" | "DETAILS") => {
    setSelectedApp(app);
    setModalMode(mode);
    setReviewNote(app.note || "");
  };

  const handleConfirmStatusUpdate = async (status: "ACCEPTED" | "REJECTED") => {
    if (!selectedApp) return;
    try {
      setSubmitting(true);
      await updateApplicationStatus(selectedApp.id, {
        status,
        note: reviewNote.trim() || undefined,
      });

      showToast(
        `Berhasil ${status === "ACCEPTED" ? "menyetujui" : "menolak"} pengajuan ${
          getStudentInfo(selectedApp).name
        }!`
      );

      if (status === "ACCEPTED" && selectedApp.companyId) {
        const company = companies.find((c) => c.id === selectedApp.companyId);
        if (company) {
          const nextQuota = Math.max(0, company.quota - 1);
          try {
            await updateCompany(company.id, { quota: nextQuota });
          } catch (err: any) {
            console.warn("Gagal mengurangi kuota perusahaan:", err);
          }
        }
      }

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("SiMagangku_admin_students");
        if (cached && selectedApp.companyId) {
          try {
            const studentList: Student[] = JSON.parse(cached);
            const studentName = getStudentInfo(selectedApp).name;
            const company = companies.find((c) => c.id === selectedApp.companyId);
            
            const updated = studentList.map((s) => {
              if (s.nama.toLowerCase() === studentName.toLowerCase() || s.id === selectedApp.userId) {
                return {
                  ...s,
                  status_pkl: status === "ACCEPTED" ? ("Sedang Magang" as const) : ("Belum Magang" as const),
                  perusahaan: status === "ACCEPTED" ? company?.name : undefined,
                };
              }
              return s;
            });
            localStorage.setItem("SiMagangku_admin_students", JSON.stringify(updated));
            setStudents(updated);
          } catch (e) {
            console.warn("Failed to sync local student database status", e);
          }
        }
      }

      setSelectedApp(null);
      await loadData();
    } catch (err: any) {
      console.error("Gagal memproses verifikasi:", err);
      showToast(`Error: ${err?.message || "Gagal menyimpan perubahan."}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resolution Helpers ──
  const getStudentInfo = (app: AdminApplication) => {
    const getName = (student: Student) => student.nama || (student as any).name || "Siswa";

    if (app.userId) {
      const match = students.find((s) => s.id === app.userId);
      if (match) {
        const name = getName(match);
        return { name, kelas: match.kelas, initials: getStudentInitial(name) };
      }
    }

    const user = app.user;
    if (user?.name) {
      const match = students.find((s) => {
        const studentName = getName(s).toLowerCase();
        return studentName === user.name.toLowerCase();
      });
      if (match) {
        const name = getName(match);
        return { name, kelas: match.kelas, initials: getStudentInitial(name) };
      }

      return { name: user.name, kelas: user.nis ? "-" : "-", initials: getStudentInitial(user.name) };
    }

    return {
      name: "Siswa tidak diketahui",
      kelas: "-",
      initials: "S",
    };
  };

  const getCompanyInfo = (app: AdminApplication) => {
    const comp = companies.find((c) => c.id === app.companyId);
    if (comp) {
      return {
        name: comp.name,
        field: comp.field,
        quota: comp.quota,
      };
    }
    // Return safe fallback without mock data
    return {
      name: "Perusahaan tidak diketahui",
      field: "-",
      quota: 0,
    };
  };

  const getSubmissionDate = (app: AdminApplication): string => {
    const dateVal = app.createdAt || app.created_at || app.date;
    if (dateVal) {
      try {
        const date = new Date(dateVal);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      } catch {
        return "Tanggal tidak tersedia";
      }
    }
    return "Tanggal tidak tersedia";
  };

  // ── Metrics calculations ──
  const metrics = useMemo(() => {
    return {
      pendingCount: applications.filter((a) => a.status === "PENDING").length,
      approvedCount: applications.filter((a) => a.status === "ACCEPTED").length,
      rejectedCount: applications.filter((a) => a.status === "REJECTED").length,
    };
  }, [applications]);

  // ── Filtered & Paginated entries ──
  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((app) => {
      const student = getStudentInfo(app);
      const company = getCompanyInfo(app);
      const studentName = String(student.name || "").toLowerCase();
      const studentClass = String(student.kelas || "").toLowerCase();
      const companyName = String(company.name || "").toLowerCase();
      const companyField = String(company.field || "").toLowerCase();
      const status = String(app.status || "").toLowerCase();

      return (
        studentName.includes(q) ||
        studentClass.includes(q) ||
        companyName.includes(q) ||
        companyField.includes(q) ||
        status.includes(q) ||
        String(app.id || "").includes(q) ||
        String(app.companyId || "").includes(q)
      );
    });
  }, [applications, companies, students, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedApplications = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredApplications.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / rowsPerPage) || 1;

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
      {/* Dynamic Glass-Panel & Transitions Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 180, 216, 0.1);
            box-shadow: 0px 10px 30px rgba(0, 119, 182, 0.05);
        }
        
        .table-row-hover:hover {
            background-color: rgba(0, 180, 216, 0.05);
            transition: background-color 0.2s ease;
        }

        .gradient-text {
            background: linear-gradient(90deg, #00B4D8 0%, #48CAE4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />

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
            className="flex items-center gap-3 px-4 py-3 text-surface-variant/70 hover:text-surface-variant hover:bg-surface-variant/10 transition-all duration-300 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-105 transition-transform">
              dashboard
            </span>
            <span className="text-label-sm font-label-sm">Dashboard</span>
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
            className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold translate-x-1 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            <span className="text-label-sm font-label-sm font-bold">Pengajuan</span>
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

        {/* CTA: Logout */}
        <button
          onClick={handleLogout}
          id="logout-btn"
          className="mt-auto w-full py-3 bg-gradient-to-r from-red-500/80 to-rose-600 text-white rounded-lg text-label-sm font-label-sm font-bold hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen relative overflow-x-hidden bg-background">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* TopAppBar (Mobile Only) */}
        <header className="md:hidden sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-margin-mobile py-4 flex justify-between items-center w-full shadow-sm">
          <h1 className="text-title-md font-title-md font-bold text-primary">SiMagangku</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-primary hover:bg-primary-container/10 p-2 rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-outline-variant/20 p-4 flex flex-col gap-2 animate-fade-in absolute top-[68px] w-full z-40 shadow-lg">
            <Link href="/admin/dashboard" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
            </Link>
            <Link href="/admin/company" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">business</span> Perusahaan
            </Link>
            <Link href="/admin/verifikasi" className="px-4 py-2.5 bg-primary-container/15 text-primary text-sm font-bold rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span> Pengajuan
            </Link>
            <Link href="/admin/siswa" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">group</span> Siswa
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm font-bold rounded-lg flex items-center gap-3 text-left w-full mt-2 border-t border-slate-100 pt-3"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span> Logout
            </button>
          </div>
        )}

        {/* Content Canvas */}
        <div className="px-margin-mobile md:px-margin-desktop py-8 max-w-container-max mx-auto w-full flex-grow flex flex-col gap-8">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
                Verifikasi Pengajuan PKL
              </h1>
              <p className="text-body-md font-body-md text-outline">
                Tinjau dan proses pengajuan tempat magang siswa.
              </p>
            </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="student-search"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md font-body-md focus:bg-surface-container-lowest focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none"
                />
              </div>
            </div>

          {/* Dashboard Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Stat */}
            <div className="glass-panel rounded-xl p-6 flex items-center gap-4 border-l-4 border-l-[#F59E0B] hover:scale-[1.01] transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hourglass_empty
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-outline">Menunggu Verifikasi</p>
                <p className="text-title-md font-title-md font-bold text-on-surface">
                  {loading ? "..." : metrics.pendingCount}
                </p>
              </div>
            </div>

            {/* Approved Stat */}
            <div className="glass-panel rounded-xl p-6 flex items-center gap-4 border-l-4 border-l-[#10B981] hover:scale-[1.01] transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-outline">Disetujui</p>
                <p className="text-title-md font-title-md font-bold text-on-surface">
                  {loading ? "..." : metrics.approvedCount}
                </p>
              </div>
            </div>

            {/* Rejected Stat */}
            <div className="glass-panel rounded-xl p-6 flex items-center gap-4 border-l-4 border-l-[#EF4444] hover:scale-[1.01] transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cancel
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-outline">Ditolak</p>
                <p className="text-title-md font-title-md font-bold text-on-surface">
                  {loading ? "..." : metrics.rejectedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Data Table */}
          <div className="glass-panel rounded-xl overflow-hidden flex-grow flex flex-col min-h-[350px]">
            {loading ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                Memuat data pengajuan...
              </div>
            ) : fetchError ? (
              <div className="flex-grow flex flex-col items-center justify-center py-16 text-center text-error">
                <span className="material-symbols-outlined text-[48px] opacity-40 mb-3">error</span>
                <p className="font-semibold text-sm">{fetchError}</p>
                <button
                  onClick={loadData}
                  className="mt-4 text-xs bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 font-bold transition-all"
                >
                  Coba Lagi
                </button>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-center text-outline">
                <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">inbox</span>
                <p className="text-sm font-semibold">
                  {searchQuery ? "Tidak ada pengajuan yang cocok." : "Belum ada data pengajuan."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-outline-variant/20">
                      <th className="py-4 px-6 text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider">
                        Tanggal Pengajuan
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider">
                        Siswa &amp; Kelas
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider">
                        Perusahaan Tujuan
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md text-on-surface-variant divide-y divide-outline-variant/10">
                    {paginatedApplications.map((app) => {
                      const student = getStudentInfo(app);
                      const company = getCompanyInfo(app);
                      const isPending = app.status === "PENDING";

                      return (
                        <tr key={app.id} className="table-row-hover group">
                          {/* Submission Date */}
                          <td className="py-5 px-6 whitespace-nowrap text-outline">
                            {getSubmissionDate(app)}
                          </td>

                          {/* Student Info */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                {student.initials}
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface leading-tight">
                                  {student.name}
                                </p>
                                <p className="text-label-sm font-label-sm text-outline mt-0.5">
                                  {student.kelas}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Company Info */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-sm">business</span>
                              <span className="font-medium text-on-surface">{company.name}</span>
                            </div>
                            <p className="text-label-sm font-label-sm text-outline mt-1 truncate max-w-[200px]" title={company.field}>
                              {company.field}
                            </p>
                          </td>

                          {/* Status Badge */}
                          <td className="py-5 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(app.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClass(app.status)}`}></span>
                              {getStatusText(app.status)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-6 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleOpenActionModal(app, "APPROVE")}
                                  className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981] hover:text-white transition-colors duration-200 flex items-center gap-1 focus:outline-none"
                                  title="Terima"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                                  <span className="text-label-sm font-label-sm font-bold pr-1">TERIMA</span>
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(app, "REJECT")}
                                  className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors duration-200 flex items-center gap-1 focus:outline-none"
                                  title="Tolak"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                                  <span className="text-label-sm font-label-sm font-bold pr-1">TOLAK</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenActionModal(app, "DETAILS")}
                                className="px-4 py-2 border border-slate-200 text-outline rounded-lg text-label-sm font-label-sm font-semibold hover:text-primary hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                Detail
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

            {/* Pagination / Footer */}
            {!loading && filteredApplications.length > 0 && (
              <div className="bg-surface-container/30 px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between mt-auto shrink-0">
                <p className="text-label-sm font-label-sm text-outline">
                  Menampilkan {Math.min(filteredApplications.length, (currentPage - 1) * rowsPerPage + 1)}-
                  {Math.min(filteredApplications.length, currentPage * rowsPerPage)} dari {filteredApplications.length} pengajuan
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-outline hover:bg-surface-variant transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded text-primary hover:bg-surface-variant transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
      </main>

      {/* ── INTERACTIVE REVIEW / ACTION MODAL OVERLAY ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className={`p-6 text-white flex justify-between items-center relative ${
              modalMode === "APPROVE"
                ? "bg-gradient-to-r from-emerald-600 to-[#10B981]"
                : modalMode === "REJECT"
                ? "bg-gradient-to-r from-rose-600 to-[#EF4444]"
                : "bg-gradient-to-r from-primary to-primary-container"
            }`}>
              <div>
                <h3 className="text-title-md font-bold leading-tight">
                  {modalMode === "APPROVE"
                    ? "Setujui Pengajuan PKL"
                    : modalMode === "REJECT"
                    ? "Tolak Pengajuan PKL"
                    : "Detail Verifikasi Pengajuan"}
                </h3>
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
                const student = getStudentInfo(selectedApp);
                const company = getCompanyInfo(selectedApp);
                const isPending = selectedApp.status === "PENDING";

                return (
                  <>
                    {/* Meta Card Details */}
                    <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {student.initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#191c1e] text-[16px] truncate">{student.name}</h4>
                        <p className="text-xs text-outline font-semibold">Kelas: {student.kelas}</p>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          Tujuan: <span className="font-medium text-primary">{company.name}</span> ({company.field})
                        </p>
                      </div>
                    </div>

                    {/* Meta Status Box */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Status Sekarang</p>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1.5 border ${getStatusBadgeClass(selectedApp.status)}`}>
                          {getStatusText(selectedApp.status)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Slot Kuota Perusahaan</p>
                        <p className="text-sm font-bold text-[#191c1e] mt-1">
                          {company.quota !== undefined ? `${company.quota} Slot` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Note Input / Detail display */}
                    <div className="space-y-2">
                      <label className="font-bold text-sm text-[#191c1e] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">sticky_note_2</span>
                        Catatan / Feedback Verifikasi
                      </label>
                      {modalMode !== "DETAILS" ? (
                        <textarea
                          placeholder="Masukkan catatan pendukung (opsional)..."
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          disabled={submitting}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-primary-container focus:bg-white rounded-lg p-3 text-sm text-[#191c1e] outline-none resize-none transition-all disabled:opacity-50 focus:ring-1 focus:ring-primary-container"
                        />
                      ) : (
                        <div className="p-3.5 bg-slate-50 border border-slate-100 text-[#191c1e] rounded-lg text-sm leading-relaxed min-h-[60px]">
                          {selectedApp.note ? (
                            selectedApp.note
                          ) : (
                            <span className="italic text-[#191c1e]/60">Tidak ada catatan verifikasi.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button Row */}
                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                      {modalMode === "DETAILS" ? (
                        <button
                          onClick={() => setSelectedApp(null)}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors"
                        >
                          Tutup
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedApp(null)}
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            Batal
                          </button>
                          {modalMode === "APPROVE" ? (
                            <button
                              onClick={() => handleConfirmStatusUpdate("ACCEPTED")}
                              disabled={submitting}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {submitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  Setujui
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConfirmStatusUpdate("REJECTED")}
                              disabled={submitting}
                              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {submitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                  Tolak
                                </>
                              )}
                            </button>
                          )}
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
