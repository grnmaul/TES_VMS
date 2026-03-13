import { useState } from 'react';
import Link from 'next/link';
import { Shield, Camera, Globe, Activity, ArrowRight, Play, CheckCircle, Clock, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../assets/images';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "#beranda", label: "Beranda" },
    { href: "#stream-cctv", label: "Stream CCTV" },
    { href: "#tentang", label: "Tentang" },
    { href: "#sistem-terintegrasi", label: "Sistem Terintegrasi" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ASSETS.logo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-lg font-bold tracking-tight">VMS Kota Madiun</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-emerald-600 transition-colors">{link.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors">Login</Link>
            <Link href="/register" className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
              Daftar Sekarang
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    className="text-lg font-bold text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                  <Link href="/login" className="text-center py-3 font-bold text-gray-900 border border-gray-200 rounded-xl">Login</Link>
                  <Link href="/register" className="text-center py-3 font-bold text-white bg-emerald-500 rounded-xl">Daftar Sekarang</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="pt-32 md:pt-40 pb-12 md:pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Madiun Smart City
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              <span className="text-emerald-500">VMS</span> Visual Monitoring System
            </h1>
            <p className="text-base md:text-lg text-gray-500 mb-8 md:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Menghadirkan pemantauan visual berbasis web secara real-time melalui CCTV terintegrasi untuk mendukung pengawasan yang cepat, akurat, dan efisien di seluruh sudut Kota Madiun.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <button className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2">
                Pantau Sekarang <Play className="w-4 h-4" />
              </button>
              <button className="px-8 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                Pelajari Lebih Lanjut
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative z-10 rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl border-4 md:border-8 border-white bg-emerald-500">
              <img 
                src={ASSETS.dashboardBanner} 
                alt="VMS Dashboard" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
                <div className="flex items-center gap-4 text-white">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold">Live Streaming CCTV</p>
                    <p className="text-[10px] md:text-xs opacity-80">Pahlawan Street Center, Madiun</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-48 md:w-60 h-48 md:h-60 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Live Preview Section (Stream CCTV) */}
      <section id="stream-cctv" className="py-16 md:py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Live Streaming CCTV</h2>
              <p className="text-sm md:text-gray-500">Pantau kondisi lalu lintas dan fasilitas publik secara real-time</p>
            </div>
            <Link href="/login" className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors">
              Lihat Semua CCTV <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-video bg-gray-900">
                <img 
                  src={`https://picsum.photos/seed/cctv-${i}/400/225`} 
                  alt={`CCTV ${i}`} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute bottom-3 left-3">
                  <p className="text-white text-[10px] font-bold uppercase tracking-wider">Kamera 0{i}</p>
                  <p className="text-white/80 text-[8px]">Jl. Pahlawan Madiun</p>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-red-500 text-white text-[8px] font-bold rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A2B3C]">About VMS Kota Madiun</h2>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm">
              Visual Monitoring System (VMS) Adalah Sistem Pengawasan Berbasis Teknologi Informasi Yang Memanfaatkan Jaringan Closed Circuit Television (CCTV) Sebagai Sumber Data Visual Untuk Memantau Kondisi Lingkungan Secara Real Time Maupun Rekaman Historis Melalui Sebuah Platform Berbasis Web.
            </p>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">
              VMS Dirancang Untuk Membantu Proses Perencanaan, Pengawasan, Dan Pengambilan Keputusan Dengan Menyediakan Infrastruktur Visual Yang Akurat, Terpusat, Dan Mudah Diakses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Real Time</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Pemantauan Jalur Real Time Dan Integrasi Sensor Terkini.</p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Terintegrasi</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Satu Platform Untuk Seluruh Kebutuhan Pemantauan Yang Terpusat.</p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Transport Center</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Memantau Dan Pengelolaan Lalu Lintas Secara Efektif.</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative mt-8 md:mt-0"
          >
            <div className="bg-white p-3 rounded-2xl md:rounded-[32px] shadow-xl transform md:rotate-2">
              <img 
                src={ASSETS.aboutVms} 
                alt="About VMS Madiun" 
                className="rounded-xl md:rounded-[24px] w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="sistem-terintegrasi" className="py-24 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Sistem Terintegrasi</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">VMS Mengintegrasikan Berbagai Layanan Kota Cerdas Untuk Kenyamanan Dan Keamanan Warga</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Globe, title: 'Traffic Management', desc: 'Sistem Manajemen Lalu Lintas Berbasis Teknologi Cerdas Untuk Meningkatkan Kelancaran Dan Efisiensi Pergerakan Kendaraan.' },
              { icon: Shield, title: 'Incident Management', desc: 'Sistem Penanganan Insiden Lalu Lintas Yang Responsif Dan Terkoordinasi Untuk Menjaga Kelancaran Transportasi.' },
              { icon: Activity, title: 'Air Quality Monitoring', desc: 'Sistem Pemantauan Kualitas Udara Secara Real-Time Di Berbagai Titik Strategis Kota.' },
              { icon: Camera, title: 'Live Streaming CCTV', desc: 'Layanan Live Streaming CCTV Untuk Mendukung Pengawasan Dan Keamanan Lalu Lintas Secara Real-Time.' },
            ].map((feature, i) => (
              <motion.div
                whileHover={{ y: -10 }}
                key={i}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="keuntungan" className="py-24 bg-emerald-600 text-white px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-12">Keuntungan Menggunakan VMS</h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { title: 'Memantau Lalu Lintas', desc: 'Pemantauan Lalu Lintas Real-Time Untuk Membantu Perjalanan Yang Lebih Aman Dan Terencana.' },
                { title: 'Menghindari Kemacetan', desc: 'Panduan Rute Cerdas Yang Membantu Menghindari Kemacetan Dan Mengoptimalkan Waktu Tempuh.' },
                { title: 'Transparansi Publik', desc: 'Transparansi Data Transportasi Kota Melalui Akses Terbuka Yang Dapat Dimanfaatkan Oleh Seluruh Warga.' },
                { title: 'Mendukung Smart City', desc: 'Solusi Berbasis Teknologi Yang Mendorong Terwujudnya Madiun Sebagai Kota Pintar Dan Berkelanjutan.' },
              ].map((benefit, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold">{benefit.title}</h4>
                  <p className="text-sm text-emerald-50 leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <img 
              src={ASSETS.benefitsVms} 
              alt="Smart City Benefits" 
              className="rounded-[40px] shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Left Column - Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src={ASSETS.logo} alt="Kominfo Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                <span className="text-lg font-bold tracking-tight">Kominfo Kota Madiun</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                Layanan pemantauan visual berbasis web untuk meningkatkan keamanan dan kenyamanan warga Kota Madiun.
              </p>
            </div>

            {/* Middle Column - Contact Info */}
            <div className="col-span-1">
              <h4 className="text-base font-bold mb-6 tracking-tight">Kontak Kami</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-emerald-500 flex-shrink-0">📍</span>
                  <span>Jl. Perintis Kemerdekaan No. 32 Kel. Kartoharjo, Kecamatan Kartoharjo, Kota Madiun, Jawa Timur.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 flex-shrink-0">📞</span>
                  <span>(0351) 467327</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 flex-shrink-0">✉️</span>
                  <span>kominfo@madiunkota.go.id</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500 flex-shrink-0">⏰</span>
                  <span>Senin - Kamis, 07:00 - 15:30</span>
                  <span>Jumat, 06:30 - 14:30</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Links */}
            <div className="col-span-1">
              <h4 className="text-base font-bold mb-6 tracking-tight">Tautan</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>
                  <a href="#beranda" className="hover:text-emerald-500 transition-colors font-medium">Beranda</a>
                </li>
                <li>
                  <a href="#stream-cctv" className="hover:text-emerald-500 transition-colors font-medium">Stream CCTV</a>
                </li>
                <li>
                  <a href="#tentang" className="hover:text-emerald-500 transition-colors font-medium">Tentang VMS</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700"></div>

          {/* Copyright */}
          <div className="pt-8 text-center text-sm text-gray-400">
            <p>Copyright 2026 Diskominfo Kota Madiun. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
