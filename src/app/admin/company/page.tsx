"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCompanies,
  getApplications,
  getProfile,
  decodeToken,
  createCompany,
  updateCompany,
  deleteCompany,
  deleteApplication,
  type Company,
  type Application
} from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

// ─── Helper Functions ──────────────────────────────────────────────────────────

/** Returns a representative icon symbol based on company business field. */
function getCompanyIconSymbol(field: string): string {
  const f = field.toLowerCase();
  if (f.includes("soft") || f.includes("dev") || f.includes("web") || f.includes("tech")) return "code";
  if (f.includes("konstruksi") || f.includes("sipil") || f.includes("bangun") || f.includes("karya")) return "architecture";
  if (f.includes("desain") || f.includes("kreatif") || f.includes("grafis") || f.includes("art")) return "draw";
  if (f.includes("jar") || f.includes("net") || f.includes("router") || f.includes("link")) return "router";
  if (f.includes("multi") || f.includes("media") || f.includes("video") || f.includes("film")) return "movie";
  return "business";
}

// ─── Main Admin Company Component ─────────────────────────────────────────────

export default function AdminCompanyPage() {
  const router = useRouter();

  // ── States ──
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin SiMagangku");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // CRUD Forms States
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formField, setFormField] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuota, setFormQuota] = useState(3);
  const [formStatus, setFormStatus] = useState(true);

  // Delete Confirm Dialog States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);
  const [deletingCompanyName, setDeletingCompanyName] = useState("");

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      })
      .catch((err) => {
        console.warn("Gagal memuat profil admin:", err);
      });
  }, [router]);

  // ── Fetch Data ──
  useEffect(() => {
    if (authorized) {
      setLoading(true);
      Promise.all([
        getCompanies(),
        getApplications().catch(() => [] as Application[])
      ])
        .then(([companiesData, applicationsData]) => {
          setApplications(applicationsData);
          setCompanies(companiesData);
          try {
            localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(companiesData));
          } catch (_) {}
        })
        .catch((err: any) => {
          console.error("Gagal memuat data perusahaan:", err);
          setFetchError(err?.message || "Gagal memuat data dari server.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [authorized]);

  // ── Handlers ──
  const handleLogout = () => {
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("SiMagangku_access_token");
    }
    router.push("/login");
  };

  const handleOpenCreate = () => {
    setFormName("");
    setFormAddress("");
    setFormField("");
    setFormDescription("");
    setFormQuota(3);
    setFormStatus(true);
    setEditingCompanyId(null);
    setCrudModalOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setFormName(company.name);
    setFormAddress(company.address);
    setFormField(company.field);
    setFormDescription(company.description || "");
    setFormQuota(company.quota || 1);
    setFormStatus(company.status);
    setEditingCompanyId(company.id);
    setCrudModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim() || !formField.trim()) {
      showToast("Silakan isi nama, alamat, dan bidang perusahaan!");
      return;
    }

    try {
      if (editingCompanyId !== null) {
        // EDIT existing - call backend
        const updatedCompany = await updateCompany(editingCompanyId, {
          name: formName.trim(),
          address: formAddress.trim(),
          field: formField.trim(),
          description: formDescription.trim(),
          quota: Number(formQuota),
          status: formStatus
        });
        
        const updatedList = companies.map((c) =>
          c.id === editingCompanyId ? updatedCompany : c
        );
        setCompanies(updatedList);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(updatedList));
        showToast(`Berhasil memperbarui data ${formName.trim()}!`);
      } else {
        // CREATE new - call backend
        const newCompany = await createCompany({
          name: formName.trim(),
          address: formAddress.trim(),
          field: formField.trim(),
          description: formDescription.trim(),
          quota: Number(formQuota),
          status: formStatus
        });
        
        const updatedList = [newCompany, ...companies];
        setCompanies(updatedList);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(updatedList));
        showToast(`Berhasil menambahkan mitra ${formName.trim()} baru!`);
      }
      setCrudModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menyimpan perusahaan:", err);
      showToast(`Error: ${err?.message || "Gagal menyimpan data ke database."}`);
    }
  };

  const handleOpenDelete = (company: Company) => {
    // Refresh latest applications before opening confirm dialog
    (async () => {
      try {
        const latest = await getApplications();
        setApplications(latest);
      } catch (err) {
        console.warn("Gagal memuat daftar lamaran saat membuka dialog hapus:", err);
      } finally {
        setDeletingCompanyId(company.id);
        setDeletingCompanyName(company.name);
        setDeleteConfirmOpen(true);
      }
    })();
  };

  const handleConfirmDelete = async () => {
    if (deletingCompanyId === null) return;
    // Only block delete if there are PENDING applications (menunggu review)
    const pendingApps = applications.filter((a) => a.companyId === deletingCompanyId && a.status === "PENDING");
    if (pendingApps.length > 0) {
      console.warn("Blocked delete: company has pending applications", { companyId: deletingCompanyId, pendingApps });
      showToast(`Tidak dapat menghapus: perusahaan masih memiliki ${pendingApps.length} lamaran yang menunggu review.`);
      setDeleteConfirmOpen(false);
      setDeletingCompanyId(null);
      return;
    }
    try {
      const res = await deleteCompany(deletingCompanyId);
      // If backend confirms deletion with id, proceed to remove from UI; otherwise refresh list
      const deletedId = (res && typeof res.id === "number") ? res.id : null;
      if (deletedId === deletingCompanyId) {
        const updatedList = companies.filter((c) => c.id !== deletingCompanyId);
        setCompanies(updatedList);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(updatedList));
        setDeleteConfirmOpen(false);
        setDeletingCompanyId(null);
        showToast(`Mitra ${deletingCompanyName} berhasil dihapus.`);
      } else {
        console.warn("Delete response didn't confirm deletion; refreshing list", res);
        showToast("Hapus tidak dikonfirmasi server. Memperbarui daftar...");
        const latestCompanies = await getCompanies();
        setCompanies(latestCompanies);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(latestCompanies));
        setDeleteConfirmOpen(false);
        setDeletingCompanyId(null);
      }
    } catch (err: any) {
      console.error("Gagal menghapus perusahaan:", err);
      // If server returned error object with data indicating why, show it
      const serverMsg = err?.message || (err?.data && err.data?.message) || "Gagal menghapus data.";
      showToast(`Error: ${serverMsg}`);
    }
  };

  const handleForceDelete = async () => {
    if (deletingCompanyId === null) return;
    try {
      const activeApps = applications.filter((a) => a.companyId === deletingCompanyId && a.status !== "REJECTED");
      if (activeApps.length > 0) {
        // delete all related applications first
        await Promise.all(activeApps.map((a) => deleteApplication(a.id)));
        // refresh applications state
        const latest = await getApplications();
        setApplications(latest);
      }

      // now delete company
      const res = await deleteCompany(deletingCompanyId);
      const deletedId = (res && typeof res.id === "number") ? res.id : null;
      if (deletedId === deletingCompanyId) {
        const updatedList = companies.filter((c) => c.id !== deletingCompanyId);
        setCompanies(updatedList);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(updatedList));
        setDeleteConfirmOpen(false);
        setDeletingCompanyId(null);
        showToast(`Mitra ${deletingCompanyName} berhasil dihapus (paksa).`);
      } else {
        console.warn("Force delete response didn't confirm deletion; refreshing list", res);
        showToast("Hapus paksa tidak dikonfirmasi server. Memperbarui daftar...");
        const latestCompanies = await getCompanies();
        setCompanies(latestCompanies);
        localStorage.setItem("SiMagangku_admin_companies", JSON.stringify(latestCompanies));
        setDeleteConfirmOpen(false);
        setDeletingCompanyId(null);
      }
    } catch (err: any) {
      console.error("Gagal menghapus paksa perusahaan:", err);
      showToast(`Error: ${err?.message || "Gagal menghapus data."}`);
    }
  };

  // ── Search & Filter Logic ──
  const filteredCompanies = useMemo(() => {
    setCurrentPage(1); // Reset page to 1 on search
    return companies.filter((c) => {
      const query = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.field.toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query)
      );
    });
  }, [companies, searchQuery]);

  // ── Pagination Calculation ──
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCompanies.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCompanies, currentPage]);

  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage) || 1;

  // ── Stat Calculations ──
  const stats = useMemo(() => {
    return {
      totalMitra: companies.length,
      aktifMenerima: companies.filter((c) => c.status === true).length,
      menungguReview: applications.filter((a) => a.status === "PENDING").length
    };
  }, [companies, applications]);

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
            className="flex items-center gap-3 px-4 py-3 text-surface-variant/70 hover:text-surface-variant hover:bg-surface-variant/10 transition-all duration-300 rounded-lg group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-105 transition-transform">
              dashboard
            </span>
            <span className="text-label-sm font-label-sm">Dashboard</span>
          </Link>

          <Link
            href="/admin/company"
            className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold translate-x-1 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              business
            </span>
            <span className="text-label-sm font-label-sm font-bold">Perusahaan</span>
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

        {/* CTA: Logout */}
        <button
          onClick={handleLogout}
          id="logout-company-btn"
          className="mt-auto w-full py-3 bg-gradient-to-r from-red-500/80 to-rose-600 text-white rounded-lg text-label-sm font-label-sm font-bold hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen relative overflow-x-hidden bg-background">
        
        {/* TopAppBar (Mobile Menu) */}
        <header className="md:hidden sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 shadow-sm px-margin-mobile py-4 flex justify-between items-center w-full">
          <div className="text-title-md font-title-md font-bold text-primary">SiMagangku</div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-on-surface-variant hover:bg-primary-container/10 rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Mobile Dropdown Menu Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-outline-variant/20 p-4 flex flex-col gap-2 animate-fade-in absolute top-[68px] w-full z-40 shadow-lg">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
            </Link>
            <Link
              href="/admin/company"
              className="px-4 py-2.5 bg-primary-container/15 text-primary text-sm font-bold rounded-lg flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                business
              </span>{" "}
              Perusahaan
            </Link>
            <Link
              href="/admin/verifikasi"
              className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[18px]">description</span> Pengajuan
            </Link>
            <Link
              href="/admin/siswa"
              className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3"
            >
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

        {/* Workspace Content */}
        <div className="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-8">
          
          {/* Page Header & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 md:pt-0 shrink-0">
            <div>
              <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
                Data Perusahaan
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant mt-1">
                Kelola daftar mitra industri untuk program magang.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari perusahaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="student-search"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md font-body-md focus:bg-surface-container-lowest focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleOpenCreate}
                id="tambah-mitra-btn"
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-on-primary font-label-sm text-label-sm font-semibold shrink-0 w-full sm:w-auto hover:glow-md cursor-pointer"
                style={{ background: 'linear-gradient(to right, #004AAD, #3B82F6)' }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tambah Mitra Baru</span>
              </button>
            </div>
          </div>

          {/* Bento Widget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            {/* Bento Card 1: Total Mitra */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  domain
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Total Mitra</p>
                <p className="text-headline-lg font-headline-lg text-on-surface mt-1">{stats.totalMitra}</p>
              </div>
            </div>

            {/* Bento Card 2: Aktif Menerima */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Aktif Menerima
                </p>
                <p className="text-headline-lg font-headline-lg text-on-surface mt-1">{stats.aktifMenerima}</p>
              </div>
            </div>

            {/* Bento Card 3: Menunggu Review */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pending_actions
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Menunggu Review
                </p>
                <p className="text-headline-lg font-headline-lg text-[#5157a6] mt-1 font-black">{stats.menungguReview}</p>
              </div>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="glass-panel soft-shadow rounded-xl overflow-hidden flex-1 flex flex-col min-h-[300px]">
            {loading ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                Memuat data perusahaan...
              </div>
            ) : fetchError ? (
              <div className="flex-grow flex flex-col items-center justify-center py-16 text-center text-error">
                <span className="material-symbols-outlined text-[48px] opacity-40 mb-3">error</span>
                <p className="font-semibold text-sm">{fetchError}</p>
                <button
                  onClick={() => router.refresh()}
                  className="mt-4 text-xs bg-primary text-white px-4 py-2 rounded-lg font-bold"
                >
                  Coba Lagi
                </button>
              </div>
            ) : paginatedCompanies.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-center text-outline">
                <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">inbox</span>
                <p className="text-sm font-semibold">Tidak ada data mitra perusahaan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-outline-variant/20">
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[40%]">
                        Nama Perusahaan
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap hidden sm:table-cell w-[35%]">
                        Alamat
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[15%]">
                        Bidang
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap text-right w-[10%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
                    {paginatedCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="table-row-hover transition-colors"
                      >
                        {/* Company Name column */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-surface-container-high flex items-center justify-center text-primary shrink-0 p-1 border border-slate-100 shadow-sm">
                              <span
                                className="material-symbols-outlined text-[22px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {getCompanyIconSymbol(company.field)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface leading-tight truncate max-w-[200px]" title={company.name}>
                                {company.name}
                              </p>
                              <p className="text-xs text-on-surface-variant sm:hidden truncate max-w-[150px] mt-0.5" title={company.address}>
                                {company.address}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Address column */}
                        <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-[250px] truncate" title={company.address}>
                          {company.address}
                        </td>

                        {/* Bidang column */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-primary-container/15 text-primary text-label-sm font-label-sm font-semibold truncate max-w-[130px]" title={company.field}>
                            {company.field}
                          </span>
                        </td>

                        {/* Action buttons column */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenEdit(company)}
                              className="w-8 h-8 rounded flex items-center justify-center text-primary hover:bg-primary-container/10 transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDelete(company)}
                              className="w-8 h-8 rounded flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!loading && !fetchError && filteredCompanies.length > 0 && (
              <div className="mt-auto p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/50 shrink-0">
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  Menampilkan {Math.min(filteredCompanies.length, (currentPage - 1) * rowsPerPage + 1)}-
                  {Math.min(filteredCompanies.length, currentPage * rowsPerPage)} dari {filteredCompanies.length} data
                </span>
                
                <div className="flex items-center gap-1">
                  {/* Prev Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded font-label-sm font-semibold flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-primary-container text-on-primary-container"
                            : "hover:bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
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

      {/* ── CREATE / EDIT MITRA MODAL OVERLAY ── */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center relative">
              <div>
                <h3 className="text-title-md font-bold leading-tight">
                  {editingCompanyId !== null ? "Edit Mitra Perusahaan" : "Tambah Mitra Baru"}
                </h3>
                <p className="text-[12px] opacity-80 mt-0.5">Lengkapi formulir kemitraan industri</p>
              </div>
              <button
                onClick={() => setCrudModalOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-full transition-all focus:outline-none shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCompany}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Nama Perusahaan */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="company-name" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    Nama Perusahaan *
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    placeholder="e.g. PT TechNusa Solusi"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                  />
                </div>

                {/* Bidang/Field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="company-field" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    Bidang Bisnis / Keahlian *
                  </label>
                  <input
                    id="company-field"
                    type="text"
                    required
                    placeholder="e.g. Software Development"
                    value={formField}
                    onChange={(e) => setFormField(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                  />
                </div>

                {/* Kuota & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="company-quota" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Kuota Magang
                    </label>
                    <input
                      id="company-quota"
                      type="number"
                      min="1"
                      value={formQuota}
                      onChange={(e) => setFormQuota(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="company-status" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Status Kemitraan
                    </label>
                    <select
                      id="company-status"
                      value={formStatus ? "true" : "false"}
                      onChange={(e) => setFormStatus(e.target.value === "true")}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    >
                      <option value="true">Aktif Menerima</option>
                      <option value="false">Tutup / Penuh</option>
                    </select>
                  </div>
                </div>

                {/* Alamat */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="company-address" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    Alamat Lengkap *
                  </label>
                  <input
                    id="company-address"
                    type="text"
                    required
                    placeholder="e.g. Jl. Soekarno Hatta No. 12, Malang"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                  />
                </div>

                {/* Deskripsi */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="company-desc" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    Deskripsi Profil Perusahaan
                  </label>
                  <textarea
                    id="company-desc"
                    placeholder="Masukkan gambaran profil, kualifikasi magang, dsb..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none resize-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCrudModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-cyan to-[#48cae4] hover:shadow-md text-white text-xs font-bold rounded-lg transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE DIALOG ── */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">delete</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface leading-tight mb-2">Hapus Mitra Perusahaan?</h3>
              <p className="text-xs text-outline leading-relaxed mb-4">
                Apakah Anda yakin ingin menghapus kemitraan <span className="font-bold text-on-surface">{deletingCompanyName}</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>

              {/* Show active applications if any */}
              {deletingCompanyId !== null && (
                (() => {
                  const pendingApps = applications.filter((a) => a.companyId === deletingCompanyId && a.status === "PENDING");
                  if (pendingApps.length > 0) {
                    return (
                      <div className="text-left bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">Terdapat {pendingApps.length} lamaran yang menunggu review terkait perusahaan ini:</p>
                        <ul className="text-xs text-on-surface-variant space-y-1 max-h-32 overflow-auto">
                          {pendingApps.map((a) => (
                            <li key={a.id} className="flex items-center justify-between">
                              <span>#{a.id} — {a.status}</span>
                              <span className="text-[11px] text-on-surface-variant/80">{a.note || "-"}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-on-surface-variant mt-2">Hapus perusahaan hanya bisa dilakukan jika tidak ada lamaran yang menunggu review. Anda dapat memperbarui status lamaran dari halaman <strong>Verifikasi</strong> terlebih dahulu.</p>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-outline text-xs font-bold rounded-lg transition-colors"
              >
                Batal
              </button>

              {/* If active apps exist, provide Refresh & Try Again; else normal delete */}
              {deletingCompanyId !== null && applications.filter((a) => a.companyId === deletingCompanyId && a.status === "PENDING").length > 0 ? (
                <>
                  <button
                    onClick={async () => {
                      // ask user to confirm force delete immediately
                      if (!confirm('Hapus paksa akan menghapus semua lamaran terkait lalu menghapus perusahaan. Lanjutkan?')) return;
                      await handleForceDelete();
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
                  >
                    Hapus Paksa
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
