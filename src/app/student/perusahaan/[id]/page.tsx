"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCompanyById, getProfile, type Company, type User } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

export default function CompanyDetail() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const [compRes, profRes] = await Promise.all([
          getCompanyById(id),
          getProfile().catch(() => null)
        ]);
        setCompany(compRes);
        if (profRes) {
          setUser((profRes as any).data || profRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const navLinks = [
    { label: "Beranda", href: "/student/homepage", active: false },
    { label: "Perusahaan", href: "/student/perusahaan", active: true },
    { label: "Pengajuan Saya", href: "/student/pengajuan", active: false },
  ];

  // State notification
  const [notifOpen, setNotifOpen] = useState(false);
  
  // ── Handlers ──
  const handleApply = async () => {
    // Navigate to the application form with company ID
    router.push(`/student/pengajuan/form/${id}`);
  };

  // ── Handlers ──
    function handleLogout() {
      removeAuthToken();
      router.push("/login");
    }

  function logoInitial(name: string): string {
    if (!name) return "CP";
    const words = name.replace(/^(PT\.?|CV\.?)\s*/i, "").trim().split(/\s+/);
    return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-10 h-10 border-4 border-[#00b4d8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fb] text-[#191c1e]">
        <span className="material-symbols-outlined text-[64px] text-[#bcc9ce] mb-4">business_center</span>
        <h1 className="text-[24px] font-bold">Perusahaan tidak ditemukan</h1>
        <Link href="/student/perusahaan" className="mt-4 text-[#00677d] hover:underline">Kembali ke Daftar Perusahaan</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-['Be_Vietnam_Pro'] selection:bg-[#00b4d8] selection:text-[#00414f]">

      {/* TopNavBar */}
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
                className={`text-sm font-medium transition-colors pb-0.5 ${
                  link.active
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
        </div>
      </header>

      <main className="flex-grow pt-24 pb-12">
        {/* Back Button */}
        <div className="max-w-[1280px] mx-auto px-[40px] mb-6">
          <Link href="/student/perusahaan" className="inline-flex items-center gap-2 text-[14px] text-[#3d494d] hover:text-[#00677d] transition-colors font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Daftar Perusahaan
          </Link>
        </div>

        {/* Hero Section */}
        <header className="max-w-[1280px] mx-auto px-[40px] mb-12">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-10 group bg-gradient-to-br from-[#00677d] to-[#00b4d8]">
            {/* Abstract Background for Hero */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#001f27] rounded-full blur-3xl"></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center gap-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#00b4d8]/10 flex items-center justify-center shrink-0">
                <span className="text-[#00677d] font-bold text-6xl">{logoInitial(company.name)}</span>
              </div>
              <div className="flex-1 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="px-4 py-1 rounded-full bg-[#69e5ff]/30 backdrop-blur-md text-[#a7edff] text-[13px] font-semibold uppercase tracking-wider border border-white/20">
                    {company.field}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] text-[#b3ebff]">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    {company.address}
                  </span>
                </div>
                <h1 className="text-[32px] md:text-[48px] font-bold mb-2 leading-tight tracking-tight">{company.name}</h1>
                <p className="text-white/80 max-w-2xl text-[16px] italic line-clamp-2">{company.description}</p>
              </div>
              <button 
                onClick={handleApply}
                disabled={company.quota <= 0 || !company.status}
                className={`bg-gradient-to-r from-[#00B4D8] to-[#48CAE4] px-8 py-4 rounded-xl text-white text-[20px] font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  company.quota <= 0 || !company.status ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(0,180,216,0.4)] active:scale-95"
                }`}
              >
                {company.quota <= 0 ? (
                  "Kuota Penuh"
                ) : !company.status ? (
                  "Tutup"
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    Ajukan PKL
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="max-w-[1280px] mx-auto px-[40px] grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-12">
            {/* Tentang Perusahaan */}
            <section className="bg-white p-10 rounded-3xl shadow-sm border border-[#bcc9ce]/10" id="tentang">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00677d]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#00677d]">corporate_fare</span>
                </div>
                <h2 className="text-[32px] font-semibold text-[#191c1e]">Tentang Perusahaan</h2>
              </div>
              <div className="space-y-4 text-[#3d494d] text-[16px] leading-relaxed">
                <p>{company.description || "Perusahaan ini belum menambahkan deskripsi."}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                  <div className="p-4 rounded-2xl bg-[#f2f4f6] text-center">
                    <div className="text-[#00677d] text-[32px] font-bold mb-1">Aktif</div>
                    <div className="text-[13px] uppercase tracking-tighter opacity-70">Status Mitra</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f2f4f6] text-center">
                    <div className="text-[#00677d] text-[32px] font-bold mb-1">{company.quota}</div>
                    <div className="text-[13px] uppercase tracking-tighter opacity-70">Total Kuota</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Informasi Magang */}
            <section className="space-y-6" id="magang">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#006878]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#006878]">work</span>
                </div>
                <h2 className="text-[32px] font-semibold text-[#191c1e]">Informasi Magang</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic General Internship Card */}
                <div className="bg-white p-8 rounded-3xl border border-[#bcc9ce]/10 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-[#00b4d8]/20 text-[#00414f]">
                      <span className="material-symbols-outlined">code</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#eceef0] text-[#3d494d] text-[13px]">
                      {company.quota > 0 ? "Tersedia" : "Penuh"}
                    </span>
                  </div>
                  <h3 className="text-[20px] font-semibold mb-2 group-hover:text-[#00677d] transition-colors">
                    Magang {company.field}
                  </h3>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[#3d494d] text-[16px]">
                      <span className="material-symbols-outlined text-[20px] opacity-60">schedule</span>
                      Berdasarkan Program Sekolah
                    </div>
                    <div className="flex items-center gap-2 text-[#3d494d] text-[16px]">
                      <span className="material-symbols-outlined text-[20px] opacity-60">map</span>
                      {company.address}
                    </div>
                  </div>
                  <ul className="text-[13px] text-[#3d494d] space-y-2 mb-6 opacity-80">
                    <li>• Bersedia mengikuti aturan perusahaan</li>
                    <li>• Membawa surat pengantar dari sekolah</li>
                    <li>• Kuota tersedia: <strong>{company.quota}</strong> peserta</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Contact Card */}
            <div className="bg-white p-8 rounded-3xl border border-[#bcc9ce]/10 shadow-sm sticky top-32">
              <h3 className="text-[20px] font-semibold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00677d]">contact_page</span>
                Info Lokasi
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-[#e6e8ea] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#3d494d]">map</span>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#6d797e] font-semibold uppercase">Alamat</div>
                    <div className="text-[16px] text-[#191c1e] font-medium leading-tight">{company.address}</div>
                  </div>
                </div>
                <hr className="border-[#bcc9ce]/20" />
                <div className="pt-4">
                  <div className="p-4 rounded-2xl bg-[#00677d]/5 border border-[#00677d]/10">
                    <p className="text-[13px] text-[#3d494d] leading-relaxed mb-4">
                      Pastikan Anda mengetahui lokasi perusahaan sebelum mengajukan PKL untuk memperkirakan jarak dan transportasi.
                    </p>
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-[#e6e8ea] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-[#bcc9ce]">map</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-[#f2f4f6] border-t border-[#bcc9ce]/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-[40px] py-8 max-w-[1280px] mx-auto gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[20px] font-semibold text-[#00677d]">SiMagangku</div>
            <p className="text-[13px] text-[#3d494d]">
              © 2024 SiMagangku. Professional Internship Information System.
            </p>
          </div>
          <div className="flex gap-6">
            <a className="text-[13px] text-[#3d494d] hover:text-[#00677d] transition-colors hover:underline" href="#">Privacy Policy</a>
            <a className="text-[13px] text-[#3d494d] hover:text-[#00677d] transition-colors hover:underline" href="#">Terms of Service</a>
            <a className="text-[13px] text-[#3d494d] hover:text-[#00677d] transition-colors hover:underline" href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
