"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApplications, getCompanies, getProfile, type Application, type Company, type User } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

interface DocumentItem {
    name: string;
    type: string;
    size: string;
    date: string;
    icon: string;
    colorClass: string;
}

const defaultDocuments: DocumentItem[] = [
    { name: "Curriculum_Vitae_2026.pdf", type: "PDF", size: "2.4 MB", date: "30 Mei", icon: "description", colorClass: "bg-red-50 text-red-600" },
    { name: "Portfolio_Design_Web.zip", type: "ZIP", size: "45 MB", date: "28 Mei", icon: "link", colorClass: "bg-blue-50 text-blue-600" },
    { name: "Transkrip_Akademik_S5.pdf", type: "PDF", size: "1.1 MB", date: "30 Mei", icon: "school", colorClass: "bg-teal-50 text-teal-600" }
];

export default function StudentApplicationsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States
    const [applications, setApplications] = useState<Application[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTabOpen, setActiveTabOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [notifOpen, setNotifOpen] = useState(false);

    // Modal and active items
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const navLinks = [
        { label: "Beranda", href: "/student/homepage", active: false },
        { label: "Perusahaan", href: "/student/perusahaan", active: false },
        { label: "Pengajuan Saya", href: "/student/pengajuan", active: true },
    ];

    // Auth guard check
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.replace("/login");
        }
    }, [router]);

    // Load API data
    useEffect(() => {
        async function loadData() {
            try {
                const [appRes, compRes, profileRes] = await Promise.all([
                    getApplications(),
                    getCompanies(),
                    getProfile().catch(() => null)
                ]);

                setApplications(appRes);
                setCompanies(compRes);
                if (profileRes) {
                    setUser((profileRes as any).data || profileRes);
                }
            } catch (err) {
                console.error("Error loading applications data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Load documents from localStorage
        if (typeof window !== "undefined") {
            const storedDocs = localStorage.getItem("student_documents");
            if (storedDocs) {
                setDocuments(JSON.parse(storedDocs));
            } else {
                setDocuments(defaultDocuments);
                localStorage.setItem("student_documents", JSON.stringify(defaultDocuments));
            }
        }
    }, []);

    const pending = applications.filter((a) => a.status === "PENDING").length;
    const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;

    // Handle Logout
    const handleLogout = () => {
        removeAuthToken();
        router.push("/login");
    };

    // Helper: Logo Initial
    const getLogoInitial = (name: string): string => {
        if (!name) return "CP";
        const words = name.replace(/^(PT\.?|CV\.?)\s*/i, "").trim().split(/\s+/);
        return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
    };

    // Helper: Format Date
    const getFormattedDate = (app: Application): string => {
        const rawApp = app as any;
        const dateStr = rawApp.createdAt || rawApp.created_at || rawApp.date;
        if (dateStr) {
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    });
                }
            } catch (_) { }
        }
        // Stable mockup date based on app ID
        const baseDate = new Date("2026-05-30");
        const diffDays = Math.max(0, 15 - (app.id % 15));
        baseDate.setDate(baseDate.getDate() - diffDays);
        return baseDate.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // Document upload trigger
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Handle Document upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        const dateStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        const extension = file.name.split(".").pop()?.toUpperCase() || "PDF";

        let icon = "description";
        let colorClass = "bg-red-50 text-red-600";

        if (["ZIP", "RAR", "7Z"].includes(extension)) {
            icon = "link";
            colorClass = "bg-blue-50 text-blue-600";
        } else if (["PNG", "JPG", "JPEG", "WEBP"].includes(extension)) {
            icon = "image";
            colorClass = "bg-purple-50 text-purple-600";
        } else if (["DOC", "DOCX", "PDF"].includes(extension)) {
            icon = "description";
            colorClass = "bg-red-50 text-red-600";
        } else {
            icon = "folder";
            colorClass = "bg-gray-50 text-gray-600";
        }

        const newDoc: DocumentItem = {
            name: file.name,
            type: extension,
            size: `${sizeInMB} MB`,
            date: `Diunggah ${dateStr}`,
            icon,
            colorClass
        };

        const updated = [newDoc, ...documents];
        setDocuments(updated);
        localStorage.setItem("student_documents", JSON.stringify(updated));
        showToast(`Berhasil mengunggah ${file.name}`);
    };

    // Toast trigger
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    // Mock download document
    const handleDownloadDoc = (docName: string) => {
        showToast(`Mengunduh berkas: ${docName}`);
    };

    // Status mapping configs
    const statusMapping = {
        PENDING: { text: "Menunggu", className: "bg-[#b3ebff] text-[#00414f]" },
        ACCEPTED: { text: "Diterima", className: "bg-[#e8f5e9] text-[#2e7d32]" },
        REJECTED: { text: "Ditolak", className: "bg-[#ffebee] text-[#c62828]" }
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8] font-[var(--font-be-vietnam)] text-on-surface antialiased">

            {/* Hidden File Input for Document Upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#191c1e] text-white text-[14px] font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[#4cd6fb] text-[20px]">info</span>
                    {toastMessage}
                </div>
            )}

            {/* TopNavBar */}
            <header className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-slate-100 shadow-[0_2px_20px_rgba(0,119,182,0.06)]">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-10 py-3.5">
                    {/* Brand */}
                    <Link href="/" className="font-bold text-lg text-primary hover:opacity-80 transition-opacity tracking-tight">
                        SITP Malang
                    </Link>

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
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-28 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                <header className="mb-10">
                    <h1 className="font-headline-lg text-headline-lg text-[#191c1e] mb-2">Status Pengajuan Magang</h1>
                    <p className="text-on-surface-variant max-w-2xl">
                        Pantau perkembangan aplikasi magang Anda dan kelola dokumen persyaratan profesional Anda di sini.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                    {/* Left Column: Application History Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
                            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-white">
                                <h2 className="font-title-md text-title-md text-primary">Riwayat Pengajuan</h2>
                                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                    <span className="text-label-sm">Filter</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-white">
                                {loading ? (
                                    <div className="p-12 text-center text-[#6d797e]">
                                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        Memuat riwayat pengajuan...
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="p-12 text-center text-[#6d797e]">
                                        <span className="material-symbols-outlined text-[48px] opacity-40 mb-3">assignment_late</span>
                                        <p>Anda belum mengirim pengajuan magang.</p>
                                        <Link href="/student/perusahaan" className="mt-4 inline-block text-primary hover:underline font-semibold text-sm">
                                            Cari Perusahaan Sekarang
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-surface-container-low">
                                            <tr>
                                                <th className="px-6 py-4 text-label-sm font-semibold text-primary uppercase tracking-wider">Perusahaan & Posisi</th>
                                                <th className="px-6 py-4 text-label-sm font-semibold text-primary uppercase tracking-wider">Tanggal</th>
                                                <th className="px-6 py-4 text-label-sm font-semibold text-primary uppercase tracking-wider text-center">Status</th>
                                                <th className="px-6 py-4 text-label-sm font-semibold text-primary uppercase tracking-wider text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/10">
                                            {applications.map((app) => {
                                                const company = companies.find((c) => c.id === app.companyId);
                                                const companyName = company?.name || `Perusahaan Mitra #${app.companyId}`;
                                                const fieldName = company?.field || "General Intern";
                                                const statusInfo = statusMapping[app.status] || { text: app.status, className: "bg-gray-100 text-gray-700" };

                                                return (
                                                    <tr key={app.id} className="hover:bg-primary/5 transition-colors group">
                                                        <td className="px-6 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center p-2 border border-outline-variant/20 shadow-sm shrink-0">
                                                                    <div className="w-full h-full rounded bg-gradient-to-br from-[#00b4d8]/10 to-[#00414f]/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                        {getLogoInitial(companyName)}
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-title-md text-[16px] text-on-surface truncate font-semibold">
                                                                        {companyName}
                                                                    </div>
                                                                    <div className="text-label-sm text-on-surface-variant truncate">
                                                                        {fieldName}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-on-surface-variant text-body-md whitespace-nowrap">
                                                            {getFormattedDate(app)}
                                                        </td>
                                                        <td className="px-6 py-6 text-center whitespace-nowrap">
                                                            <span className={`status-badge transition-transform duration-200 inline-block text-[12px] font-semibold px-3 py-1 rounded-full cursor-default ${statusInfo.className}`}>
                                                                {statusInfo.text}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => setSelectedApp(app)}
                                                                className="text-primary hover:underline font-semibold text-label-sm"
                                                            >
                                                                Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Dokumen & Profil Status) */}
                    <div className="space-y-gutter">

                        {/* Documents Card */}
                        <div className="glass-card rounded-xl p-6 bg-white border border-[#00b4d8]/10 shadow-[0px_10px_30px_rgba(0,119,182,0.05)]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-title-md text-title-md text-on-surface font-bold text-[#191c1e]">Dokumen Persyaratan</h3>
                                <button
                                    onClick={triggerFileInput}
                                    className="text-primary hover:bg-primary/5 p-1 rounded-full transition-all active:scale-90"
                                    title="Unggah Dokumen Baru"
                                >
                                    <span className="material-symbols-outlined text-[28px]">add_circle</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {documents.map((doc, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleDownloadDoc(doc.name)}
                                        className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group"
                                    >
                                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold ${doc.colorClass} shrink-0`}>
                                            <span className="material-symbols-outlined">{doc.icon}</span>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-label-sm font-semibold text-on-surface truncate">{doc.name}</p>
                                            <p className="text-[11px] text-on-surface-variant">{doc.type} • {doc.size} • {doc.date}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px] shrink-0">
                                            download
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile Progress Card */}
                        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="text-label-sm opacity-85 mb-1 font-medium">Status Profil Mahasiswa</div>
                                <div className="text-headline-lg-mobile font-bold mb-3">Sangat Bagus!</div>
                                <p className="text-body-md opacity-90 mb-5 text-[14px] leading-relaxed">
                                    Profil Anda telah lengkap 95%. Perusahaan lebih menyukai kandidat dengan profil lengkap.
                                </p>
                                <Link
                                    href="/student/homepage"
                                    className="bg-white text-primary px-6 py-2 rounded-full font-bold text-label-sm hover:bg-opacity-90 transition-all shadow-sm active:scale-95 inline-block text-center"
                                >
                                    Lihat Profil
                                </Link>
                            </div>
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-low border-t border-outline-variant/10 mt-auto bg-[#f2f4f6]">
                <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop py-8 max-w-container-max mx-auto gap-4">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="font-title-md text-title-md font-semibold text-primary mb-2">SITP Malang</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-center md:text-left">
                            © 2026 SITP Malang. Tech-Forward Professionalism for Future Careers.
                        </span>
                    </div>
                    <div className="flex gap-6">
                        <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
                        <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
                        <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Us</a>
                    </div>
                </div>
            </footer>

            {/* Detail Modal Overlay */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-title-md font-bold">Detail Pengajuan Magang</h3>
                                <p className="text-[12px] opacity-80 mt-0.5">ID Pengajuan: #{selectedApp.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="hover:bg-white/10 p-1.5 rounded-full transition-all focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {(() => {
                                const company = companies.find(c => c.id === selectedApp.companyId);
                                const companyName = company?.name || `Perusahaan Mitra #${selectedApp.companyId}`;
                                const fieldName = company?.field || "General Intern";
                                const statusInfo = statusMapping[selectedApp.status] || { text: selectedApp.status, className: "bg-gray-100 text-gray-700" };

                                return (
                                    <>
                                        {/* Company Info */}
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center p-2 border border-slate-200 shadow-sm font-bold text-primary text-lg">
                                                {getLogoInitial(companyName)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#191c1e] text-[16px]">{companyName}</h4>
                                                <p className="text-xs text-[#6d797e]">{fieldName}</p>
                                                {company?.address && (
                                                    <p className="text-xs text-[#3d494d] mt-1 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                        {company.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Meta Status Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[11px] text-[#6d797e] font-semibold uppercase">Tanggal Pengajuan</p>
                                                <p className="text-sm font-semibold text-[#191c1e] mt-0.5">{getFormattedDate(selectedApp)}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[11px] text-[#6d797e] font-semibold uppercase">Status Saat Ini</p>
                                                <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 mt-1 rounded-full ${statusInfo.className}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Admin Note Section */}
                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-[#191c1e] flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-primary text-[18px]">sticky_note_2</span>
                                                Catatan dari Perusahaan / Admin
                                            </h5>
                                            <div className="p-4 rounded-xl text-sm leading-relaxed min-h-[70px] bg-amber-50 border border-amber-100 text-amber-900">
                                                {selectedApp.note ? (
                                                    selectedApp.note
                                                ) : (
                                                    <span className="italic text-amber-700/60">Tidak ada catatan yang dilampirkan.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons inside Modal */}
                                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                                            <button
                                                onClick={() => setSelectedApp(null)}
                                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-xs font-bold rounded-lg transition-colors"
                                            >
                                                Tutup
                                            </button>
                                            <Link
                                                href={`/student/perusahaan/${selectedApp.companyId}`}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-container hover:shadow-md text-white text-xs font-bold rounded-lg text-center transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                Halaman Perusahaan
                                            </Link>
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
