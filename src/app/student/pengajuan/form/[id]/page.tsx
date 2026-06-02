"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getCompanyById, getProfile, createApplication, updateProfile, type Company, type User } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/helpers/cookies";

export default function StudentApplicationFormPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id ? String(params.id) : null;

  // State for authorization and loading
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Stepper state
  const [step, setStep] = useState<number>(1);

  // Step 1: Data Diri Form State
  const [fullName, setFullName] = useState("");
  const [nis, setNis] = useState("");
  const [gender, setGender] = useState<"LAKI_LAKI" | "PEREMPUAN" | "">("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Upload Files State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // Drag over states
  const [dragCv, setDragCv] = useState(false);
  const [dragPortfolio, setDragPortfolio] = useState(false);
  const [dragTranscript, setDragTranscript] = useState(false);

  // Refs for hidden inputs
  const cvInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  // Profile Dropdown
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Auth & Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);

    async function loadData() {
      try {
        // Load user profile
        const profileRes = await getProfile().catch(() => null);
        if (profileRes) {
          const p = (profileRes as any).data || profileRes;
          setUser(p);
          setFullName(p.name || "");
          setNis(p.nis || String(p.id || ""));
          setGender(p.gender || "");
          setBirthPlace(p.birthPlace || "");
          setBirthDate(p.birthDate ? p.birthDate.split("T")[0] : "");
          setPhone(p.phone || "");
          setAddress(p.address || "");
        }

        // Load company details
        if (companyId) {
          const compRes = await getCompanyById(Number(companyId)).catch(() => null);
          if (compRes) {
            setCompany(compRes);
          }
        }
      } catch (err) {
        console.error("Failed to load initial form data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [companyId, router]);

  // Log out handler
  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!fullName.trim()) return "Nama Lengkap wajib diisi.";
    if (!nis.trim()) return "NIM/NIS wajib diisi.";
    if (!gender) return "Jenis Kelamin wajib dipilih.";
    if (!birthPlace.trim()) return "Tempat Lahir wajib diisi.";
    if (!birthDate) return "Tanggal Lahir wajib diisi.";
    if (!phone.trim()) return "Nomor HP wajib diisi.";
    if (!address.trim()) return "Alamat wajib diisi.";
    return null;
  };

  // File change handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cv" | "portfolio" | "transcript") => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal 5MB.");
      return;
    }

    if (type === "cv") setCvFile(file);
    if (type === "portfolio") setPortfolioFile(file);
    if (type === "transcript") setTranscriptFile(file);
  };

  // Drag and Drop events
  const handleDragOver = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    setDrag(true);
  };

  const handleDragLeave = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    setDrag(false);
  };

  const handleDrop = (e: React.DragEvent, type: "cv" | "portfolio" | "transcript", setDrag: (val: boolean) => void) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal 5MB.");
      return;
    }

    if (type === "cv") setCvFile(file);
    if (type === "portfolio") setPortfolioFile(file);
    if (type === "transcript") setTranscriptFile(file);
  };

  // Final submit handler
  const handleSubmit = async () => {
    if (!companyId) {
      setErrorMsg("ID Perusahaan tidak valid.");
      return;
    }

    if (!cvFile || !portfolioFile || !transcriptFile) {
      setErrorMsg("Semua berkas wajib diunggah (CV, Portofolio, Transkrip Nilai).");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Lengkapi Data Diri (PATCH /users/profile)
      await updateProfile({
        gender,
        birthPlace,
        birthDate,
        phone,
        address
      });

      // 2. Submit Pengajuan PKL (POST /applications)
      const formData = new FormData();
      formData.append("companyId", String(companyId));
      formData.append("cvFile", cvFile);
      formData.append("portfolioFile", portfolioFile);
      formData.append("transcriptFile", transcriptFile);

      await createApplication(formData);
      setSuccess(true);
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || "Gagal mengirim pengajuan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#f0f4f8] font-sans">
        <div className="w-12 h-12 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#3d494d] font-semibold text-sm">Memuat data pengisian...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans text-on-surface antialiased flex flex-col pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#191c1e] text-white text-[14px] font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[#4cd6fb] text-[20px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* Header (Sticky Glassmorphism) */}
      <header className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-slate-100 shadow-[0_2px_20px_rgba(0,119,182,0.06)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-10 py-3.5">
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

          <nav className="hidden md:flex gap-7 items-center">
            <Link href="/student/homepage" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              Beranda
            </Link>
            <Link href="/student/perusahaan" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              Perusahaan
            </Link>
            <Link href="/student/pengajuan" className="text-sm font-medium text-primary border-b-2 border-brand-cyan transition-colors pb-0.5 font-bold">
              Pengajuan Saya
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[24px] cursor-pointer hover:text-primary transition-colors">
              notifications
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary-container text-primary font-bold text-sm flex items-center justify-center cursor-pointer border border-[#00B4D8]/20 hover:ring-2 hover:ring-[#00B4D8]/20 transition-all"
              >
                {user?.name ? user.name[0]?.toUpperCase() : "S"}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-xl border border-outline-variant/10 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-label-sm font-bold text-on-surface truncate">{user?.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-label-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Keluar Sesi
                  </button>
                </div>
              )}
            </div>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden bg-white border-t border-slate-200 shadow-sm">
              <div className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href="/student/homepage"
                  onClick={() => setMobileNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-slate-100"
                >
                  Beranda
                </Link>
                <Link
                  href="/student/perusahaan"
                  onClick={() => setMobileNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-slate-100"
                >
                  Perusahaan
                </Link>
                <Link
                  href="/student/pengajuan"
                  onClick={() => setMobileNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-slate-100"
                >
                  Pengajuan Saya
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 mt-28">
        
        {/* Stepper Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-8 mb-8">
          
          {/* Top Title */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-bold text-[#191c1e] tracking-tight leading-tight">
              {step === 1 ? "Formulir Pengajuan PKL" : step === 2 ? "Unggah Dokumen Pendukung" : "Konfirmasi Pengajuan"}
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-2 max-w-lg mx-auto">
              {step === 1 
                ? "Lengkapi data diri dan posisi magang untuk memulai karir impian Anda." 
                : step === 2 
                ? "Pastikan semua dokumen dalam format PDF/ZIP dengan ukuran maksimal 5MB per file." 
                : "Mohon periksa kembali data yang telah Anda masukkan sebelum mengirim pengajuan."}
            </p>
          </div>

          {/* Steps Progress Visualizer */}
          <div className="flex items-center justify-center max-w-md mx-auto mb-10 relative">
            <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-slate-100 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-[#00B4D8] to-[#48CAE4] transition-all duration-300"
                style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
              ></div>
            </div>

            <div className="flex justify-between w-full relative z-10">
              {/* Step 1 */}
              <button 
                onClick={() => step > 1 && setStep(1)}
                className="flex flex-col items-center gap-2 group outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${
                  step >= 1 
                    ? "bg-[#00B4D8] text-white shadow-[0_0_12px_rgba(0,180,216,0.3)]" 
                    : "bg-white text-on-surface-variant border-2 border-slate-200"
                }`}>
                  {step > 1 ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : "1"}
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${step >= 1 ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                  Isi Data
                </span>
              </button>

              {/* Step 2 */}
              <button 
                onClick={() => step > 2 && setStep(2)}
                disabled={step < 2}
                className="flex flex-col items-center gap-2 group outline-none disabled:cursor-not-allowed"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${
                  step >= 2 
                    ? "bg-[#00B4D8] text-white shadow-[0_0_12px_rgba(0,180,216,0.3)]" 
                    : "bg-white text-on-surface-variant border-2 border-slate-200"
                }`}>
                  {step > 2 ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : "2"}
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${step >= 2 ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                  Unggah Dokumen
                </span>
              </button>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${
                  step === 3 
                    ? "bg-[#00B4D8] text-white shadow-[0_0_12px_rgba(0,180,216,0.3)]" 
                    : "bg-white text-on-surface-variant border-2 border-slate-200"
                }`}>
                  3
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${step === 3 ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                  Konfirmasi
                </span>
              </div>
            </div>
          </div>

          {/* Form Content Steps */}
          <div className="mt-4">
            
            {/* Step 1: Data Diri */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-title-md font-bold text-[#191c1e] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">person_outline</span>
                  Data Diri Mahasiswa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama Lengkap */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap sesuai KTM"
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>

                  {/* NIM */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">NIS / NIM</label>
                    <input 
                      type="text" 
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Contoh: 2141720000"
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="LAKI_LAKI">Laki-Laki</option>
                      <option value="PEREMPUAN">Perempuan</option>
                    </select>
                  </div>

                  {/* Nomor Telepon */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">Nomor HP / WhatsApp</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Tempat Lahir */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">Tempat Lahir</label>
                    <input 
                      type="text" 
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="Contoh: Malang"
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-semibold text-on-surface">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-label-sm font-semibold text-on-surface">Alamat Lengkap</label>
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masukkan alamat domisili lengkap Anda..."
                      rows={3}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-body-md focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/10 transition-all outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload Files */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-title-md font-bold text-[#191c1e] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">upload_file</span>
                  Dokumen Persyaratan
                </h3>

                {/* Upload Fields Stack */}
                <div className="space-y-6">
                  {/* CV File Dropzone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-bold text-on-surface uppercase tracking-wider text-[11px] text-slate-500">
                      Curriculum Vitae (PDF/JPG) <span className="text-red-500">*Wajib</span>
                    </label>
                    <input 
                      type="file"
                      ref={cvInputRef}
                      onChange={(e) => handleFileChange(e, "cv")}
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                    />
                    
                    {!cvFile ? (
                      <div 
                        onDragOver={(e) => handleDragOver(e, setDragCv)}
                        onDragLeave={(e) => handleDragLeave(e, setDragCv)}
                        onDrop={(e) => handleDrop(e, "cv", setDragCv)}
                        onClick={() => cvInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-slate-50 ${
                          dragCv ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[#00B4D8] text-[36px]">cloud_upload</span>
                        <div className="text-center">
                          <p className="text-body-md font-semibold text-on-surface text-[14px]">Klik untuk unggah atau seret file ke sini</p>
                          <p className="text-[12px] text-on-surface-variant mt-1">Hanya file PDF, JPG, atau PNG yang diperkenankan (Maks 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-sm font-semibold text-on-surface truncate">{cvFile.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{(cvFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setCvFile(null)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center shrink-0"
                          title="Hapus Berkas"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Portfolio File Dropzone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-bold text-on-surface uppercase tracking-wider text-[11px] text-slate-500">
                      Portofolio (PDF/ZIP) <span className="text-red-500">*Wajib</span>
                    </label>
                    <input 
                      type="file"
                      ref={portfolioInputRef}
                      onChange={(e) => handleFileChange(e, "portfolio")}
                      accept=".pdf,.zip,image/jpeg,image/png"
                      className="hidden"
                    />
                    
                    {!portfolioFile ? (
                      <div 
                        onDragOver={(e) => handleDragOver(e, setDragPortfolio)}
                        onDragLeave={(e) => handleDragLeave(e, setDragPortfolio)}
                        onDrop={(e) => handleDrop(e, "portfolio", setDragPortfolio)}
                        onClick={() => portfolioInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-slate-50 ${
                          dragPortfolio ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[#00B4D8] text-[36px]">emoji_events</span>
                        <div className="text-center">
                          <p className="text-body-md font-semibold text-on-surface text-[14px]">Tampilkan karya terbaik Anda di sini</p>
                          <p className="text-[12px] text-on-surface-variant mt-1">Format PDF, ZIP, JPG, atau PNG (Maks 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <span className="material-symbols-outlined">link</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-sm font-semibold text-on-surface truncate">{portfolioFile.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{(portfolioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setPortfolioFile(null)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center shrink-0"
                          title="Hapus Berkas"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transcript File Dropzone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-bold text-on-surface uppercase tracking-wider text-[11px] text-slate-500">
                      Transkrip Nilai (PDF) <span className="text-red-500">*Wajib</span>
                    </label>
                    <input 
                      type="file"
                      ref={transcriptInputRef}
                      onChange={(e) => handleFileChange(e, "transcript")}
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                    />
                    
                    {!transcriptFile ? (
                      <div 
                        onDragOver={(e) => handleDragOver(e, setDragTranscript)}
                        onDragLeave={(e) => handleDragLeave(e, setDragTranscript)}
                        onDrop={(e) => handleDrop(e, "transcript", setDragTranscript)}
                        onClick={() => transcriptInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-slate-50 ${
                          dragTranscript ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[#00B4D8] text-[36px]">school</span>
                        <div className="text-center">
                          <p className="text-body-md font-semibold text-on-surface text-[14px]">Unggah transkrip nilai akademik terbaru</p>
                          <p className="text-[12px] text-on-surface-variant mt-1">Hanya file PDF, JPG, atau PNG dari portal kampus (Maks 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <span className="material-symbols-outlined">assignment</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-sm font-semibold text-on-surface truncate">{transcriptFile.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{(transcriptFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setTranscriptFile(null)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center shrink-0"
                          title="Hapus Berkas"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation Summary */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Visual Grid for Summary Recap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left block: Student details */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col gap-4">
                    <h4 className="font-bold text-[#191c1e] text-[14px] flex items-center gap-2 uppercase tracking-wider text-slate-500 mb-1">
                      <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                      Data Siswa
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-y-3.5 text-[13px] text-on-surface">
                      <div className="text-on-surface-variant font-medium col-span-1">Nama Lengkap</div>
                      <div className="col-span-2 font-semibold truncate">{fullName}</div>

                      <div className="text-on-surface-variant font-medium col-span-1">NIM / NIS</div>
                      <div className="col-span-2 font-mono font-semibold">{nis}</div>

                      <div className="text-on-surface-variant font-medium col-span-1">Gender</div>
                      <div className="col-span-2 font-medium">{gender === "LAKI_LAKI" ? "Laki-Laki" : "Perempuan"}</div>

                      <div className="text-on-surface-variant font-medium col-span-1">TTL</div>
                      <div className="col-span-2 font-medium">{birthPlace}, {birthDate}</div>

                      <div className="text-on-surface-variant font-medium col-span-1">Nomor HP</div>
                      <div className="col-span-2 font-medium">{phone}</div>

                      <div className="text-on-surface-variant font-medium col-span-1">Alamat</div>
                      <div className="col-span-2 font-medium break-words">{address}</div>
                    </div>
                  </div>

                  {/* Right block: Position and Company */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col gap-4">
                    <h4 className="font-bold text-[#191c1e] text-[14px] flex items-center gap-2 uppercase tracking-wider text-slate-500 mb-1">
                      <span className="material-symbols-outlined text-primary text-[20px]">business</span>
                      Detail Pengajuan
                    </h4>

                    <div className="grid grid-cols-3 gap-y-3.5 text-[13px] text-on-surface">
                      <div className="text-on-surface-variant font-medium col-span-1">Mitra Tujuan</div>
                      <div className="col-span-2 font-bold text-primary truncate">
                        {company ? company.name : "Loading..."}
                      </div>

                      <div className="text-on-surface-variant font-medium col-span-1">Departemen</div>
                      <div className="col-span-2 font-medium truncate">{company?.field || "Loading..."}</div>

                    </div>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col gap-4">
                  <h4 className="font-bold text-[#191c1e] text-[14px] flex items-center gap-2 uppercase tracking-wider text-slate-500 mb-1">
                    <span className="material-symbols-outlined text-primary text-[20px]">folder_zip</span>
                    Dokumen Terunggah
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* CV file box */}
                    {cvFile && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/60 flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-red-500 text-[24px] shrink-0">description</span>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[12px] font-bold text-on-surface truncate">{cvFile.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{(cvFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}

                    {/* Portfolio file box */}
                    {portfolioFile && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/60 flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-blue-500 text-[24px] shrink-0">link</span>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[12px] font-bold text-on-surface truncate">{portfolioFile.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{(portfolioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}

                    {/* Transcript file box */}
                    {transcriptFile && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/60 flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-teal-500 text-[24px] shrink-0">assignment</span>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[12px] font-bold text-on-surface truncate">{transcriptFile.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{(transcriptFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* API Error Notification */}
                {errorMsg && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] shrink-0">error</span>
                    <div>{errorMsg}</div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Card Footer Actions */}
          <div className="border-t border-slate-100 pt-6 flex justify-between items-center mt-8">
            <div>
              {step > 1 && (
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(step - 1);
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#3d494d] text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Kembali
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link 
                href={companyId ? `/student/perusahaan/${companyId}` : "/student/perusahaan"}
                className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
              >
                Batal
              </Link>

              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1) {
                      const validationError = validateStep1();
                      if (validationError) {
                        showToast(validationError);
                        return;
                      }
                    }
                    if (step === 2) {
                      if (!cvFile || !portfolioFile || !transcriptFile) {
                        showToast("Mohon unggah semua dokumen wajib (CV, Portofolio, Transkrip).");
                        return;
                      }
                    }
                    setStep(step + 1);
                  }}
                  className="px-8 py-2.5 bg-gradient-to-br from-[#00B4D8] to-[#48CAE4] hover:shadow-[0_0_15px_rgba(0,180,216,0.3)] text-white text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  Lanjutkan
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`px-8 py-2.5 bg-gradient-to-br from-[#00B4D8] to-[#48CAE4] hover:shadow-[0_0_15px_rgba(0,180,216,0.3)] text-white text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 ${
                    submitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Pengajuan
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 mt-auto border-t border-slate-100 bg-white flex flex-col items-center gap-3 shrink-0">
        <div className="text-[#191c1e] font-black text-sm">SiMagangku</div>
        <div className="flex gap-6 text-[12px] text-slate-500 font-semibold">
          <a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact Us</a>
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          © 2026 SiMagangku, Task-Forward Professionalism for Future Careers.
        </p>
      </footer>

      {/* Success ModalOverlay */}
      {success && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[36px] animate-scale-up">check_circle</span>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[#191c1e]">Pengajuan Terkirim!</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Pengajuan PKL Anda ke <strong className="text-primary">{company?.name}</strong> berhasil dikirim dan sedang menunggu verifikasi dari admin.
              </p>
            </div>

            <button
              onClick={() => router.push("/student/pengajuan")}
              className="w-full py-3 bg-gradient-to-br from-[#00B4D8] to-[#48CAE4] text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-200 transition-all active:scale-95"
            >
              Lihat Daftar Pengajuan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
