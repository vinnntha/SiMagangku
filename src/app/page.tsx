import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="text-on-surface antialiased flex flex-col min-h-screen font-sans bg-background">
      {/* TopNavBar */}
      <header className="bg-surface/80 backdrop-blur-xl font-title-md text-title-md fixed top-0 w-full z-50 border-b border-white/20 dark:border-outline-variant/20 shadow-[0px_10px_30px_rgba(0,119,182,0.05)]">
        <div className="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop py-4">
          <Link
            href="/"
            className="font-display-lg text-title-md font-bold text-primary dark:text-primary-fixed-dim hover:opacity-80 transition-opacity"
          >
            SiMagangku
          </Link>
          
          <nav className="hidden md:flex gap-8 items-center">
            <a
              className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80 font-medium"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80 font-medium"
              href="#testimonials"
            >
              Catalog
            </a>
            <a
              className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80 font-medium"
              href="#about"
            >
              About
            </a>
          </nav>

          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="border-[1.5px] border-brand-cyan text-brand-cyan bg-transparent hover:bg-brand-cyan/5 font-label-sm text-label-sm px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-all duration-300 flex items-center justify-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-br from-brand-cyan to-[#48cae4] text-white hover:shadow-[0_4px_15px_rgba(0,180,216,0.4)] hover:-translate-y-0.5 font-label-sm text-label-sm px-6 py-2 rounded-lg font-medium hover:opacity-80 transition-all duration-300 flex items-center justify-center"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 sm:pt-24">
        {/* Hero Section with Tailwind Ambient Background */}
        <section className="relative w-full overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgba(0,180,216,0.15)_0%,transparent_40%),radial-gradient(circle_at_20%_80%,rgba(72,202,228,0.15)_0%,transparent_40%)] pt-16 pb-24 sm:pt-20 sm:pb-32">
          <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 text-left">
              <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">
                Mencari Tempat PKL di Malang? Lebih Mudah &amp; Terorganisir
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
                Temukan partner perusahaan terbaik untuk perjalanan karir profesionalmu melalui satu sistem informasi terpadu.
              </p>
              <div className="pt-4">
                <Link
                  href="/register"
                  className="bg-gradient-to-br from-brand-cyan to-[#48cae4] text-white hover:shadow-[0_4px_15px_rgba(0,180,216,0.4)] hover:-translate-y-0.5 font-label-sm text-label-sm px-8 py-3.5 rounded-xl font-semibold inline-flex items-center justify-center transition-all duration-300"
                >
                  Mulai Eksplorasi
                </Link>
              </div>
            </div>
            
            {/* Hero Image in Tailwind Glass Panel */}
            <div className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-6 shadow-2xl transition-transform hover:scale-[1.01] duration-300">
              <Image
                alt="Laptop interface"
                src="/images/laptop_mockup.png"
                width={560}
                height={350}
                className="w-full h-auto rounded-lg object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-24 bg-surface border-t border-slate-100">
          <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop">
            <h2 className="font-headline-lg text-headline-lg text-center mb-12 sm:mb-16 text-on-surface">
              Fitur Unggulan SiMagangku
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 - Catalog */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-4 hover:shadow-[0px_15px_40px_rgba(0,180,216,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-sm">
                  {/* Search Icon SVG */}
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  Katalog Perusahaan
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Cari puluhan perusahaan mitra dengan berbagai bidang keahlian.
                </p>
              </div>

              {/* Feature 2 - Document */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-4 hover:shadow-[0px_15px_40px_rgba(0,180,216,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-sm">
                  {/* Document Icon SVG */}
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  Pengajuan Mudah
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Proses pendaftaran PKL yang cepat dan paperless langsung dari dashboard.
                </p>
              </div>

              {/* Feature 3 - Tracking */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-4 hover:shadow-[0px_15px_40px_rgba(0,180,216,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-sm">
                  {/* Target/Tracker SVG Icon */}
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  Pantau Status
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Cek status penerimaan dan verifikasi secara real-time kapan saja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 sm:py-24 bg-[radial-gradient(circle_at_80%_20%,rgba(0,180,216,0.15)_0%,transparent_40%),radial-gradient(circle_at_20%_80%,rgba(72,202,228,0.15)_0%,transparent_40%)] border-t border-slate-100">
          <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop">
            <h2 className="font-headline-lg text-headline-lg text-center mb-12 sm:mb-16 text-on-surface">
              Apa Kata Mereka?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary overflow-hidden shadow-inner">
                    {/* User profile SVG */}
                    <svg className="w-8 h-8 text-primary/80" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a3 3 0 11-6 0 3 3 0 016 0zm-2.293 4.146A5.965 5.965 0 0010 11a5.965 5.965 0 00-5.707.854 1 1 0 00.293 1.743L10 14l5.414-.403a1 1 0 00.293-1.743 5.965 5.965 0 00-5.707-.854z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-on-surface">Budi Santoso</h4>
                    <p className="font-label-sm text-xs text-on-surface-variant">SMKN 4 Malang</p>
                  </div>
                </div>
                <p className="font-body-md text-on-surface-variant italic text-sm leading-relaxed">
                  "SiMagangku sangat membantu saya mencari tempat PKL. Prosesnya cepat dan saya langsung diterima di perusahaan impian!"
                </p>
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary overflow-hidden shadow-inner">
                    <svg className="w-8 h-8 text-primary/80" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a3 3 0 11-6 0 3 3 0 016 0zm-2.293 4.146A5.965 5.965 0 0010 11a5.965 5.965 0 00-5.707.854 1 1 0 00.293 1.743L10 14l5.414-.403a1 1 0 00.293-1.743 5.965 5.965 0 00-5.707-.854z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-on-surface">Siti Aminah</h4>
                    <p className="font-label-sm text-xs text-on-surface-variant">Universitas Negeri Malang</p>
                  </div>
                </div>
                <p className="font-body-md text-on-surface-variant italic text-sm leading-relaxed">
                  "Fitur pelacakan statusnya sangat berguna. Tidak perlu bingung lagi bertanya-tanya apakah lamaran sudah dibaca atau belum."
                </p>
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white/70 backdrop-blur-xl border border-brand-cyan/10 p-8 rounded-2xl flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary overflow-hidden shadow-inner">
                    <svg className="w-8 h-8 text-primary/80" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a3 3 0 11-6 0 3 3 0 016 0zm-2.293 4.146A5.965 5.965 0 0010 11a5.965 5.965 0 00-5.707.854 1 1 0 00.293 1.743L10 14l5.414-.403a1 1 0 00.293-1.743 5.965 5.965 0 00-5.707-.854z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-on-surface">Rizky Pratama</h4>
                    <p className="font-label-sm text-xs text-on-surface-variant">Politeknik Negeri Malang</p>
                  </div>
                </div>
                <p className="font-body-md text-on-surface-variant italic text-sm leading-relaxed">
                  "Katalog perusahaannya sangat lengkap dan relevan dengan jurusan saya. Sangat direkomendasikan untuk teman-teman!"
                </p>
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 sm:py-24 bg-surface-container-low border-t border-slate-100">
          <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop grid md:grid-cols-2 gap-16 items-center">
            <div className="relative flex justify-center">
              <div className="w-full max-w-[400px] aspect-square rounded-3xl bg-primary/5 flex items-center justify-center p-8 sm:p-12">
                <div className="relative w-full h-full bg-white/70 backdrop-blur-xl border border-brand-cyan/10 rounded-2xl flex items-center justify-center shadow-xl">
                  
                  {/* Building office SVG icon */}
                  <svg className="w-24 h-24 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>

                  {/* Mitra Badge rotating card */}
                  <div className="absolute -bottom-4 -right-4 w-28 h-28 sm:w-32 sm:h-32 bg-secondary-container border border-brand-cyan/20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-0 transition-all duration-300">
                    {/* Handshake/Partnership SVG icon */}
                    <svg className="w-12 h-12 text-on-secondary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 text-left">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Tentang SiMagangku
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                SiMagangku didirikan pada tahun 2024 dengan misi utama untuk menjembatani kesenjangan antara dunia pendidikan dan industri di Malang melalui sistem manajemen profesional yang berbasis teknologi.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Kami berkomitmen penuh untuk mendukung pengembangan karir setiap siswa dan mahasiswa dengan menyediakan platform yang transparan, efisien, dan mudah diakses untuk menemukan pengalaman kerja nyata yang berkualitas.
              </p>
              
              <div className="flex items-center gap-6 pt-2">
                <div className="flex flex-col">
                  <span className="text-primary font-bold text-2xl sm:text-3xl">50+</span>
                  <span className="text-on-surface-variant text-xs sm:text-sm font-medium">Mitra Perusahaan</span>
                </div>
                <div className="w-[1px] h-10 bg-outline-variant" />
                <div className="flex flex-col">
                  <span className="text-primary font-bold text-2xl sm:text-3xl">1000+</span>
                  <span className="text-on-surface-variant text-xs sm:text-sm font-medium">Siswa Terdaftar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 bg-gradient-to-br from-primary-fixed to-secondary-fixed-dim">
          <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop text-center flex flex-col items-center gap-8">
            <h2 className="font-display-lg text-display-lg text-on-primary-container leading-tight">
              Siap Cari Tempat PKL? Mulai Sekarang
            </h2>
            <p className="font-body-md text-body-md text-on-primary-container max-w-2xl">
              Bergabunglah dengan ratusan siswa lainnya yang telah menemukan tempat magang impian mereka melalui platform kami.
            </p>
            <Link
              href="/register"
              className="bg-gradient-to-br from-brand-cyan to-[#48cae4] text-white hover:shadow-[0_8px_25px_rgba(0,180,216,0.35)] hover:-translate-y-0.5 font-title-md text-title-md px-10 py-5 rounded-xl font-bold mt-4 shadow-xl transition-all duration-300"
            >
              Buat Akun Siswa
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest font-body-md text-body-md w-full border-t border-outline-variant/30 py-4 sm:py-6">
        <div className="max-w-container-max mx-auto px-margin-mobile sm:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 py-6">
          <Link
            href="/"
            className="font-title-md text-title-md font-semibold text-primary dark:text-primary-fixed-dim hover:opacity-80 transition-opacity"
          >
            SiMagangku
          </Link>
          <div className="text-on-surface text-center md:text-left text-xs sm:text-sm opacity-70">
            © 2026 SiMagangku. Professional Internship Information System.
          </div>
          <nav className="flex gap-6 flex-wrap justify-center">
            <a className="text-on-surface-variant hover:text-primary transition-colors text-xs sm:text-sm" href="#privacy">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-xs sm:text-sm" href="#terms">
              Terms of Service
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-xs sm:text-sm" href="#help">
              Help Center
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-xs sm:text-sm" href="#contact">
              Contact Us
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
