"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCompanies, getProfile, type Company, type User, type Application } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

const popularTags = ["Web Development", "UI/UX Design", "Jaringan", "Multimedia", "Network"];

const navLinks = [
    { href: "/student/homepage", label: "Beranda", active: false },
    { href: "/student/perusahaan", label: "Perusahaan", active: true },
    { href: "/student/pengajuan", label: "Pengajuan Saya", active: false },
];

export default function InternshipPortal() {
    const router = useRouter();

    // State
    const [companyData, setCompanyData] = useState<Company[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [applications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeBtn, setActiveBtn] = useState<string | null>(null);
    const [notifOpen, setNotifOpen] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        async function load() {
            try {
                const [data, profileRes] = await Promise.all([
                    getCompanies(),
                    getProfile().catch(() => null)
                ]);
                setCompanyData(data);
                if (profileRes) {
                    // Handle potential { data: User } wrapper or just User
                    setUser((profileRes as any).data || profileRes);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    function handleLogout() {
        removeAuthToken();
        router.push("/login");
    }

    const pending = applications.filter((a) => a.status === "PENDING").length;
    const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;

    const handleMouseDown = (id: string) => setActiveBtn(id);
    const handleMouseUp = () => setActiveBtn(null);

    function logoInitial(name: string): string {
        if (!name) return "CP";
        const words = name.replace(/^(PT\.?|CV\.?)\s*/i, "").trim().split(/\s+/);
        return words
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("");
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] font-[var(--font-be-vietnam)] text-on-surface antialiased">
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

            <main className="pt-24 pb-20">
                {/* Hero / Search Section */}
                <section className="max-w-[1280px] mx-auto px-[40px] mb-12">
                    <div className="relative overflow-hidden rounded-xl bg-[#b3ebff]/20 p-12 md:p-16 flex flex-col items-center text-center">
                        {/* Abstract Background Elements */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00b4d8]/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#69e5ff]/10 rounded-full blur-3xl"></div>

                        <h1 className="text-[32px] md:text-[57px] text-[#00414f] mb-6 relative z-10 font-bold">Temukan Peluang Internship Terbaik</h1>
                        <p className="text-[14px] text-[#3d494d] mb-10 max-w-2xl relative z-10">
                            Eksplorasi ratusan mitra industri berkualitas di Malang dan sekitarnya. Bangun karir profesionalmu mulai hari ini.
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
                                placeholder="Cari Perusahaan"
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
                    </div>
                </section>

                {/* Main Content: Catalog Grid */}
                <section className="max-w-[1280px] mx-auto px-[40px]">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-[16px] text-[#191c1e] flex items-center gap-2 font-bold">
                            <span className="material-symbols-outlined text-[#00677d]" style={{ fontVariationSettings: "'FILL' 1" }}>business_center</span>
                            Daftar Perusahaan
                        </h2>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg bg-[#eceef0] text-[#3d494d] hover:text-[#00677d] transition-colors">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                            <button className="p-2 rounded-lg bg-[#eceef0] text-[#3d494d] hover:text-[#00677d] transition-colors">
                                <span className="material-symbols-outlined">grid_view</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-full text-center text-[#3d494d]">Memuat data perusahaan...</div>
                        ) : companyData.length === 0 ? (
                            <div className="col-span-full text-center text-[#3d494d]">Belum ada perusahaan.</div>
                        ) : companyData.map((company) => (
                            <div key={company.id} className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(0,119,182,0.05)] border border-[#bcc9ce]/10 hover:shadow-[0px_15px_40px_rgba(0,119,182,0.1)] transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#00b4d8]/20 to-[#00414f]/10 flex items-center justify-center p-2 border border-[#00b4d8]/10">
                                        <span className="text-[#00677d] font-bold text-xl">{logoInitial(company.name)}</span>
                                    </div>
                                    <span className={`${company.quota > 0 ? 'bg-[#00b4d8]/10 text-[#00677d]' : 'bg-[#ffdad6] text-[#93000a]'} px-3 py-1 rounded-full text-[14px]`}>
                                        Sisa: {company.quota} Slot
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-[16px] text-[#191c1e] mb-2 group-hover:text-[#00677d] transition-colors font-bold truncate">{company.name}</h3>
                                    <div className="flex flex-col gap-2 text-[#3d494d] text-[14px]">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="material-symbols-outlined text-[18px] shrink-0">category</span>
                                            <span className="truncate">{company.field}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="material-symbols-outlined text-[18px] shrink-0">location_on</span>
                                            <span className="truncate">{company.address}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[14px] text-[#3d494d] mb-6 line-clamp-2">{company.description}</p>

                                <div className="flex gap-3">
                                    <Link href={`/student/perusahaan/${company.id}`} className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-[14px] text-[#00677d] bg-[#00677d]/5 hover:bg-[#00677d]/10 transition-all font-bold">
                                        Lihat Detail
                                    </Link>
                                    {company.quota > 0 ? (
                                        <button
                                            className={`flex-1 px-4 py-2.5 rounded-lg text-[14px] text-white bg-gradient-to-br from-[#00B4D8] to-[#48CAE4] hover:shadow-[0_0_15px_rgba(0,180,216,0.4)] transition-all font-bold ${activeBtn === `apply-${company.id}` ? 'scale-95' : 'scale-100'}`}
                                            onMouseDown={() => handleMouseDown(`apply-${company.id}`)}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={handleMouseUp}
                                        >
                                            Ajukan PKL
                                        </button>
                                    ) : (
                                        <button className="flex-1 px-4 py-2.5 rounded-lg text-[14px] text-[#3d494d] bg-[#eceef0] cursor-not-allowed font-bold" disabled>
                                            Penuh
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-16 flex justify-center items-center gap-2">
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3d494d] hover:bg-[#00677d]/10 hover:text-[#00677d] transition-all">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00677d] text-white text-[16px] shadow-md font-bold">1</button>
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3d494d] hover:bg-[#00677d]/10 hover:text-[#00677d] text-[16px] transition-all font-bold">2</button>
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3d494d] hover:bg-[#00677d]/10 hover:text-[#00677d] text-[16px] transition-all font-bold">3</button>
                        <span className="px-2 text-[#bcc9ce]">...</span>
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3d494d] hover:bg-[#00677d]/10 hover:text-[#00677d] text-[16px] transition-all font-bold">12</button>
                        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3d494d] hover:bg-[#00677d]/10 hover:text-[#00677d] transition-all">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 bg-white border-t border-[#bcc9ce]/30">
                <div className="max-w-[1280px] mx-auto px-[40px] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col gap-2">
                        <span className="text-[16px] font-semibold text-[#00677d]">SITP Malang</span>
                        <p className="text-[14px] text-[#3d494d]">© 2024 SITP Malang. Professional Internship Information System.</p>
                    </div>
                    <div className="flex flex-wrap gap-8 justify-center">
                        <a className="text-[14px] text-[#3d494d] hover:text-[#00677d] transition-colors" href="#">Privacy Policy</a>
                        <a className="text-[14px] text-[#3d494d] hover:text-[#00677d] transition-colors" href="#">Terms of Service</a>
                        <a className="text-[14px] text-[#3d494d] hover:text-[#00677d] transition-colors" href="#">Help Center</a>
                        <a className="text-[14px] text-[#3d494d] hover:text-[#00677d] transition-colors" href="#">Contact Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}