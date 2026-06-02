"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getApplications,
  getProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  decodeToken,
  type Company,
  type Application,
} from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Student {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  status_pkl: "Belum Magang" | "Sedang Magang" | "Selesai";
  perusahaan?: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function getStatusConfig(status: Student["status_pkl"]) {
  switch (status) {
    case "Sedang Magang":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "work" };
    case "Selesai":
      return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", icon: "check_circle" };
    default:
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", icon: "schedule" };
  }
}

function mapApplicationStatus(status: string): Student["status_pkl"] {
  switch (status) {
    case "ACCEPTED":
      return "Sedang Magang";
    case "REJECTED":
      return "Belum Magang";
    case "PENDING":
      return "Belum Magang";
    default:
      return status === "Selesai" || status === "FINISHED" ? "Selesai" : "Belum Magang";
  }
}

function normalizeStudentsFromApplications(applications: Application[]): Student[] {
  const studentMap = new Map<number, Student>();

  applications.forEach((app) => {
    const user = app.user || ({} as any);
    const company = app.company || ({} as any);
    const id = Number(user.id ?? app.userId ?? app.id);
    if (Number.isNaN(id)) return;

    const student: Student = {
      id,
      nis: String(user.nis ?? user.nis_number ?? ""),
      nama: String(user.nama ?? user.name ?? user.fullname ?? "") || "-",
      kelas: String(user.kelas ?? user.class ?? ""),
      jurusan: String(user.jurusan ?? user.major ?? ""),
      status_pkl: mapApplicationStatus(String(app.status ?? user.status_pkl ?? "")),
      perusahaan: String(company.name ?? user.perusahaan ?? "") || undefined,
    };

    if (!studentMap.has(id)) {
      studentMap.set(id, student);
    } else {
      const existing = studentMap.get(id)!;
      if (existing.status_pkl === "Belum Magang" && student.status_pkl !== "Belum Magang") {
        existing.status_pkl = student.status_pkl;
      }
      if (!existing.perusahaan && student.perusahaan) {
        existing.perusahaan = student.perusahaan;
      }
    }
  });

  return Array.from(studentMap.values());
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminSiswaPage() {
  const router = useRouter();

  // ── States ──
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin SiMagangku");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // CRUD Modal
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [formNis, setFormNis] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKelas, setFormKelas] = useState("");
  const [formJurusan, setFormJurusan] = useState("");
  const [formStatus, setFormStatus] = useState<Student["status_pkl"]>("Belum Magang");
  const [formPerusahaan, setFormPerusahaan] = useState("");

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // Delete Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [deletingStudentName, setDeletingStudentName] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Toast Trigger ──
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };



  // --- Load students from backend (dashboard-style) ---
  const loadStudents = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getApplications();
      const data = (res as any)?.data ?? res ?? [];
      const normalized: Student[] = normalizeStudentsFromApplications(data as Application[]);
      setStudents(normalized);
    } catch (err: any) {
      console.error("Gagal memuat data siswa:", err);
      setStudents([]);
      setFetchError(err?.message || "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadStudents();
    }
  }, [authorized]);

  // ── Auth Guard ──
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

    if (typeof window !== "undefined") {
      const lsToken = localStorage.getItem("SiMagangku_access_token");
      if (!lsToken) {
        localStorage.setItem("SiMagangku_access_token", token);
      }
    }

    getProfile()
      .then((profileRes) => {
        const data = (profileRes as any).data || profileRes;
        if (data?.name) setAdminName(data.name);
      })
      .catch((err) => {
        console.warn("Gagal memuat profil admin:", err);
      });
  }, [router]);

  // ── Handlers ──
  const handleLogout = () => {
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("SiMagangku_access_token");
    }
    router.push("/login");
  };

  const handleOpenCreate = () => {
    setFormNis("");
    setFormNama("");
    setFormKelas("");
    setFormJurusan("");
    setFormStatus("Belum Magang");
    setFormPerusahaan("");
    setEditingStudentId(null);
    setCrudModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setFormNis(student.nis);
    setFormNama(student.nama);
    setFormKelas(student.kelas);
    setFormJurusan(student.jurusan);
    setFormStatus(student.status_pkl);
    setFormPerusahaan(student.perusahaan || "");
    setEditingStudentId(student.id);
    setCrudModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNis.trim() || !formNama.trim() || !formKelas.trim() || !formJurusan.trim()) {
      showToast("Silakan isi semua field yang wajib diisi!");
      return;
    }

    const payload = {
      nis: formNis.trim(),
      nama: formNama.trim(),
      kelas: formKelas.trim(),
      jurusan: formJurusan.trim(),
      status_pkl: formStatus,
      perusahaan: formPerusahaan.trim() || undefined,
    };

    (async () => {
      try {
        if (editingStudentId !== null) {
          await updateStudent(editingStudentId, payload);
          showToast(`Data siswa ${formNama.trim()} berhasil diperbarui!`);
        } else {
          await createStudent(payload);
          showToast(`Siswa ${formNama.trim()} berhasil ditambahkan!`);
        }
        // Reload list from backend application records
        const res = await getApplications();
        const data = (res as any)?.data ?? res ?? [];
        const normalized: Student[] = normalizeStudentsFromApplications(data as Application[]);
        setStudents(normalized);
      } catch (err: any) {
        console.error("Gagal menyimpan data siswa:", err);
        showToast(`Error: ${err?.message || "Gagal menyimpan data."}`);
      } finally {
        setCrudModalOpen(false);
      }
    })();
  };

  const handleOpenDelete = (student: Student) => {
    setDeletingStudentId(student.id);
    setDeletingStudentName(student.nama);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingStudentId === null) return;
    (async () => {
      try {
        await deleteStudent(deletingStudentId);
        showToast(`Siswa ${deletingStudentName} berhasil dihapus!`);
        // Reload list from backend application records
        const res = await getApplications();
        const data = (res as any)?.data ?? res ?? [];
        const normalized: Student[] = normalizeStudentsFromApplications(data as Application[]);
        setStudents(normalized);
      } catch (err: any) {
        console.error("Gagal menghapus siswa:", err);
        showToast(`Error: ${err?.message || "Gagal menghapus siswa."}`);
      } finally {
        setDeleteConfirmOpen(false);
        setDeletingStudentId(null);
      }
    })();
  };

  const handleOpenDetail = (student: Student) => {
    setDetailStudent(student);
    setDetailModalOpen(true);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const imported: Student[] = [];
      let nextId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
      // Skip header line if it starts with "nis" or "NIS"
      const startIdx = lines[0]?.toLowerCase().startsWith("nis") ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length >= 4) {
          imported.push({
            id: nextId++,
            nis: cols[0],
            nama: cols[1],
            kelas: cols[2],
            jurusan: cols[3],
            status_pkl: (cols[4] as Student["status_pkl"]) || "Belum Magang",
            perusahaan: cols[5] || undefined,
          });
        }
      }
      if (imported.length > 0) {
        const updated = [...imported, ...students];
        showToast(`${imported.length} data siswa berhasil diimpor!`);
      } else {
        showToast("Tidak ada data valid dalam file CSV.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  };

  // ── Search & Filter ──
  const filteredStudents = useMemo(() => {
    setCurrentPage(1);
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.nis.toLowerCase().includes(q) ||
        s.nama.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q) ||
        s.jurusan.toLowerCase().includes(q) ||
        s.status_pkl.toLowerCase().includes(q) ||
        (s.perusahaan || "").toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  // ── Pagination ──
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;

  // ── Stats ──
  const stats = useMemo(() => {
    return {
      totalSiswa: students.length,
      sedangMagang: students.filter((s) => s.status_pkl === "Sedang Magang").length,
      belumMagang: students.filter((s) => s.status_pkl === "Belum Magang").length,
      selesai: students.filter((s) => s.status_pkl === "Selesai").length,
    };
  }, [students]);

  // ── Loading State ──
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
            className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold translate-x-1 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              group
            </span>
            <span className="text-label-sm font-label-sm font-bold">Siswa</span>
          </Link>
        </div>

        {/* CTA: Logout */}
        <button
          onClick={handleLogout}
          id="logout-siswa-btn"
          className="mt-auto w-full py-3 bg-gradient-to-r from-red-500/80 to-rose-600 text-white rounded-lg text-label-sm font-label-sm font-bold hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen relative overflow-x-hidden bg-background">

        {/* TopAppBar (Mobile) */}
        <header className="md:hidden sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 shadow-sm px-margin-mobile py-4 flex justify-between items-center w-full">
          <div className="text-title-md font-title-md font-bold text-primary">SiMagangku</div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-on-surface-variant hover:bg-primary-container/10 rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-outline-variant/20 p-4 flex flex-col gap-2 animate-fade-in absolute top-[68px] w-full z-40 shadow-lg">
            <Link href="/admin/dashboard" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
            </Link>
            <Link href="/admin/company" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">business</span> Perusahaan
            </Link>
            <Link href="/admin/verifikasi" className="px-4 py-2.5 hover:bg-slate-50 text-sm font-medium rounded-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">description</span> Pengajuan
            </Link>
            <Link href="/admin/siswa" className="px-4 py-2.5 bg-primary-container/15 text-primary text-sm font-bold rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span> Siswa
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
                Data Siswa
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant mt-1">
                Kelola data siswa peserta program magang industri.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              {/* Search Input */}
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

              {/* Import CSV */}
              <label
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-label-sm text-label-sm font-semibold cursor-pointer hover:bg-surface-container-low transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Import CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
            </div>
          </div>

          {/* Bento Widget Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
            {/* Total Siswa */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  groups
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Total Siswa</p>
                <p className="text-headline-lg font-headline-lg text-on-surface mt-1">{stats.totalSiswa}</p>
              </div>
            </div>

            {/* Sedang Magang */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  work
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Sedang Magang</p>
                <p className="text-headline-lg font-headline-lg text-emerald-700 mt-1">{stats.sedangMagang}</p>
              </div>
            </div>

            {/* Belum Magang */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  schedule
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Belum Magang</p>
                <p className="text-headline-lg font-headline-lg text-amber-700 mt-1">{stats.belumMagang}</p>
              </div>
            </div>

            {/* Selesai */}
            <div className="glass-panel soft-shadow rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Selesai</p>
                <p className="text-headline-lg font-headline-lg text-blue-700 mt-1">{stats.selesai}</p>
              </div>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="glass-panel soft-shadow rounded-xl overflow-hidden flex-1 flex flex-col min-h-[300px]">
            {loading ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                Memuat data siswa...
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-center text-outline">
                <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">person_off</span>
                <p className="text-sm font-semibold">
                  {searchQuery ? "Tidak ada siswa yang cocok dengan pencarian." : "Belum ada data siswa."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-outline-variant/20">
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[5%]">
                        No
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[30%]">
                        Nama Siswa
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap hidden sm:table-cell w-[15%]">
                        NIS
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[15%]">
                        Kelas
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap w-[20%]">
                        Status PKL
                      </th>
                      <th className="py-4 px-6 text-label-sm font-label-sm text-on-tertiary-container uppercase tracking-wider font-semibold whitespace-nowrap text-right w-[15%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
                    {paginatedStudents.map((student, idx) => {
                      const statusCfg = getStatusConfig(student.status_pkl);
                      return (
                        <tr key={student.id} className="table-row-hover transition-colors">
                          {/* No */}
                          <td className="py-4 px-6 text-on-surface-variant">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>

                          {/* Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary shrink-0 font-bold text-sm">
                                {student.nama.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface leading-tight truncate max-w-[200px]" title={student.nama}>
                                  {student.nama}
                                </p>
                                <p className="text-xs text-on-surface-variant truncate max-w-[180px] mt-0.5" title={student.jurusan}>
                                  {student.jurusan}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* NIS */}
                          <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant font-mono text-sm">
                            {student.nis}
                          </td>

                          {/* Kelas */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-primary-container/15 text-primary text-label-sm font-label-sm font-semibold">
                              {student.kelas}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                              {student.status_pkl}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenDetail(student)}
                                className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                                title="Detail"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="w-8 h-8 rounded flex items-center justify-center text-primary hover:bg-primary-container/10 transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenDelete(student)}
                                className="w-8 h-8 rounded flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!loading && filteredStudents.length > 0 && (
              <div className="mt-auto p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/50 shrink-0">
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  Menampilkan {Math.min(filteredStudents.length, (currentPage - 1) * rowsPerPage + 1)}-
                  {Math.min(filteredStudents.length, currentPage * rowsPerPage)} dari {filteredStudents.length} data
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded font-label-sm font-semibold flex items-center justify-center transition-colors ${isActive
                            ? "bg-primary-container text-on-primary-container"
                            : "hover:bg-surface-container text-on-surface-variant"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

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

      {/* ── CREATE / EDIT STUDENT MODAL ── */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center relative">
              <div>
                <h3 className="text-title-md font-bold leading-tight">
                  {editingStudentId !== null ? "Edit Data Siswa" : "Tambah Siswa Baru"}
                </h3>
                <p className="text-[12px] opacity-80 mt-0.5">Lengkapi data siswa peserta PKL</p>
              </div>
              <button
                onClick={() => setCrudModalOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-full transition-all focus:outline-none shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* NIS */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="student-nis" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    NIS *
                  </label>
                  <input
                    id="student-nis"
                    type="text"
                    required
                    placeholder="e.g. 20250001"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                  />
                </div>

                {/* Nama */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="student-nama" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    Nama Lengkap *
                  </label>
                  <input
                    id="student-nama"
                    type="text"
                    required
                    placeholder="e.g. Ahmad Fadhil Rizky"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                  />
                </div>

                {/* Kelas & Jurusan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="student-kelas" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Kelas *
                    </label>
                    <input
                      id="student-kelas"
                      type="text"
                      required
                      placeholder="e.g. XII RPL 1"
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="student-jurusan" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Jurusan *
                    </label>
                    <input
                      id="student-jurusan"
                      type="text"
                      required
                      placeholder="e.g. RPL"
                      value={formJurusan}
                      onChange={(e) => setFormJurusan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status & Perusahaan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="student-status" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Status PKL
                    </label>
                    <select
                      id="student-status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as Student["status_pkl"])}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    >
                      <option value="Belum Magang">Belum Magang</option>
                      <option value="Sedang Magang">Sedang Magang</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="student-perusahaan" className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Perusahaan
                    </label>
                    <input
                      id="student-perusahaan"
                      type="text"
                      placeholder="(opsional)"
                      value={formPerusahaan}
                      onChange={(e) => setFormPerusahaan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-cyan focus:bg-white rounded-lg p-2.5 text-sm text-[#191c1e] outline-none transition-all"
                    />
                  </div>
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

      {/* ── DETAIL STUDENT MODAL ── */}
      {detailModalOpen && detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">

            {/* Detail Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="absolute top-4 right-4 hover:bg-white/10 p-1.5 rounded-full transition-all focus:outline-none"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {detailStudent.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-title-md font-bold leading-tight">{detailStudent.nama}</h3>
                  <p className="text-[12px] opacity-80 mt-0.5">NIS: {detailStudent.nis}</p>
                </div>
              </div>
            </div>

            {/* Detail Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Kelas</p>
                  <p className="text-sm font-semibold text-on-surface">{detailStudent.kelas}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Jurusan</p>
                  <p className="text-sm font-semibold text-on-surface">{detailStudent.jurusan}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Status PKL</p>
                  {(() => {
                    const cfg = getStatusConfig(detailStudent.status_pkl);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                        {detailStudent.status_pkl}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Perusahaan</p>
                  <p className="text-sm font-semibold text-on-surface">{detailStudent.perusahaan || "—"}</p>
                </div>
              </div>
            </div>

            {/* Detail Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEdit(detailStudent);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-brand-cyan to-[#48cae4] hover:shadow-md text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Data
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
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
              <h3 className="text-lg font-bold text-on-surface leading-tight mb-2">Hapus Data Siswa?</h3>
              <p className="text-xs text-outline leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus data <span className="font-bold text-on-surface">{deletingStudentName}</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-outline text-xs font-bold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
