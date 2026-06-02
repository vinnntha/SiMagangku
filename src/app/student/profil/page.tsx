"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile, decodeToken } from "@/lib/api";
import { getAuthToken as getCookieToken, removeAuthToken as removeCookieToken } from "@/helpers/cookies";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  nis?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  program_study?: string;
  status?: string;
}

interface EditFormData {
  gender: string;
  birthPlace: string;
  birthDate: string;
  phone: string;
  address: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    gender: profile?.gender || "",
    birthPlace: profile?.birthPlace || "",
    birthDate: profile?.birthDate ? new Date(profile.birthDate).toISOString().split("T")[0] : "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  // Auth guard
  useEffect(() => {
    const token = getCookieToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== "SISWA") {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
  if (!authorized) return;

  async function loadProfile() {
    try {
      const profileRes = await getProfile();
      const raw = (profileRes as any);
      
      // Response adalah { message, total, data: [...] }
      // Ambil user yang login berdasarkan id dari token
      const token = getCookieToken();
      const decoded = decodeToken(token!);
      
      let userData;
      if (Array.isArray(raw.data)) {
        // Cari user berdasarkan id dari token
        userData = raw.data.find((u: any) => u.id === decoded?.sub) || raw.data[0];
      } else {
        userData = raw.data || raw;
      }

      setProfile({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        nis: userData.nis,
        gender: userData.gender,
        birthPlace: userData.birthPlace,
        birthDate: userData.birthDate,
        phone: userData.phone,
        address: userData.address,
        program_study: userData.program_study,
        status: userData.status,
      });
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setLoading(false);
    }
  }

  loadProfile();
}, [authorized]);

  const handleLogout = () => {
    removeCookieToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("SiMagangku_access_token");
    }
    router.push("/login");
  };

  const handleOpenEdit = () => {
    setFormData({
      gender: profile?.gender || "",
      birthPlace: profile?.birthPlace || "",
      birthDate: profile?.birthDate
        ? new Date(profile.birthDate).toISOString().split("T")[0]
        : "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
    setEditError(null);
    setEditSuccess(false);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    if (editLoading) return;
    setEditModalOpen(false);
    setEditError(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const payload: Record<string, any> = {
        gender: formData.gender,
        birthPlace: formData.birthPlace,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        phone: formData.phone,
        address: formData.address,
      };
      // Remove empty fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") delete payload[key];
      });


      
      await updateProfile(payload);

      // Refresh profile data
      const profileRes = await getProfile();
      const data = (profileRes as any).data || profileRes;
      setProfile(data);

      setEditSuccess(true);
      setTimeout(() => {
        setEditModalOpen(false);
        setEditSuccess(false);
      }, 1200);
    } catch (err: any) {
      setEditError(err?.message || "Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setEditLoading(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-background font-sans">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-semibold text-sm">Memuat profil...</p>
      </div>
    );
  }

  const navLinks = [
    { label: "Beranda", href: "/student/homepage", active: false },
    { label: "Perusahaan", href: "/student/perusahaan", active: false },
    { label: "Pengajuan Saya", href: "/student/pengajuan", active: false },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-center h-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="font-bold text-title-md text-primary">SiMagangku</span>
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

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[24px] cursor-pointer hover:text-primary transition-colors">
              notifications
            </span>
            <div className="relative">
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || "S"}
                </div>
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/20 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface">{profile?.name}</p>
                    <p className="text-xs text-on-surface-variant">{profile?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-sm">
            <div className="flex flex-col gap-2 px-4 py-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileNavOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-slate-100">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-8 border border-outline-variant/20">
            <div className="h-48 bg-gradient-to-r from-primary-container to-primary relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
            </div>
            <div className="px-8 pb-8 -mt-16 relative flex flex-col md:flex-row items-end gap-6">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-primary-container/20 border-4 border-surface-container-lowest shadow-lg flex items-center justify-center text-primary text-6xl font-bold">
                {profile?.name?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="flex-1 pb-2 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-1">{profile?.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Status Aktif
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Info Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Informasi Akademik</h2>
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profil
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Nama Lengkap</label>
                  <p className="text-base font-medium text-on-surface">{profile?.name || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Email</label>
                  <p className="text-base font-medium text-on-surface">{profile?.email || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Jenis Kelamin</label>
                  <p className="text-base font-medium text-on-surface">{profile?.gender || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Tempat Lahir</label>
                  <p className="text-base font-medium text-on-surface">{profile?.birthPlace || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Tanggal Lahir</label>
                  <p className="text-base font-medium text-on-surface">
                    {profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString("id-ID") : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Nomor HP</label>
                  <p className="text-base font-medium text-on-surface">{profile?.phone || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Alamat</label>
                  <p className="text-base font-medium text-on-surface">{profile?.address || "-"}</p>
                </div>
              </div>

              <div className="bg-surface-bright rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Data Terlengkap</p>
                    <p className="text-xs text-on-surface-variant">Profil Anda telah lengkap dan siap untuk mendaftar.</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseEdit(); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">edit</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Edit Profil</h3>
              </div>
              <button
                onClick={handleCloseEdit}
                disabled={editLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="px-6 py-6 space-y-5">
              {editError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <span className="material-symbols-outlined text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Profil berhasil diperbarui!
                </div>
              )}

              {/* Jenis Kelamin */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Jenis Kelamin
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleFormChange}
                  placeholder="Contoh: Malang"
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Contoh: 08123456789"
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Alamat
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Masukkan alamat lengkap..."
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={editLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/40 text-sm font-medium text-on-surface-variant hover:bg-surface-variant/50 transition-all disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-8 bg-white border-t border-[#bcc9ce]/30">
        <div className="max-w-[1280px] mx-auto px-[40px] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[16px] font-semibold text-[#00677d]">SiMagangku</span>
            <p className="text-[14px] text-[#3d494d]">© 2026 SiMagangku. Professional Internship Information System.</p>
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