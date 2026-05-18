import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Camera, Globe, Activity, ArrowRight, Play, CheckCircle, Clock, Menu, X, Sun, Moon, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { ASSETS } from '../assets/images';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    
    // Default to light mode unless explicitly saved as dark
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Fetch dynamic cameras
    const fetchCameras = async () => {
      try {
        const res = await fetch('/api/cameras');
        if (res.ok) {
          const data = await res.json();
          setCameras(data.slice(0, 8)); // Display up to 8 cameras
        }
      } catch (error) {
        console.error('Failed to fetch cameras:', error);
      }
    };
    fetchCameras();

    // Scroll state for Navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { href: "#beranda", label: "Beranda" },
    { href: "#stream-cctv", label: "Stream CCTV" },
    { href: "#tentang", label: "Tentang" },
    { href: "#sistem-terintegrasi", label: "Sistem Terintegrasi" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Scroll Progress Bar — sits just below the navbar */}
      <motion.div
        className="fixed top-[80px] left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 origin-left z-40"
        style={{ scaleX }}
      />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white dark:bg-slate-900 border-b ${
        isScrolled 
          ? 'border-gray-200 dark:border-slate-800 shadow-md' 
          : 'border-transparent shadow-none'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ASSETS.logo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">VMS Kota Madiun</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/login" className="text-sm font-bold text-gray-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30">
              Daftar Sekarang
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              className="p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    className="text-lg font-bold text-gray-900 dark:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-4">
                  <Link href="/login" className="text-center py-3 font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl">Login</Link>
                  <Link href="/register" className="text-center py-3 font-bold text-white bg-emerald-500 rounded-xl">Daftar Sekarang</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative pt-32 md:pt-40 pb-12 md:pb-20 px-6 overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-600/20 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 dark:bg-teal-600/20 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold mb-6 border border-emerald-100 dark:border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Madiun Smart City
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">VMS</span> Visual Monitoring System
            </h1>
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 md:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Menghadirkan pemantauan visual berbasis web secara real-time melalui CCTV terintegrasi untuk mendukung pengawasan yang cepat, akurat, dan efisien di seluruh sudut Kota Madiun.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <a href="#stream-cctv" className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
                Pantau Sekarang <Play className="w-4 h-4" />
              </a>
              <a href="#tentang" className="px-8 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-1 text-center">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative z-10 rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-slate-800 bg-emerald-500 group">
              <img 
                src={ASSETS.dashboardBanner} 
                alt="VMS Dashboard" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/50">
                      <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-bold">Live Streaming CCTV</p>
                      <p className="text-[10px] md:text-xs opacity-80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        Pahlawan Street Center, Madiun
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Preview Section (Stream CCTV) */}
      <section id="stream-cctv" className="py-16 md:py-24 px-6 bg-gray-50 dark:bg-slate-900/50 relative border-y border-gray-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 dark:text-white">Live Streaming CCTV</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pantau kondisi lalu lintas dan fasilitas publik secara real-time</p>
            </div>
            <Link href="/login" className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5">
              Lihat Semua CCTV <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {cameras.length > 0 ? cameras.map((camera, idx) => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={camera.id || idx} 
                className="group relative rounded-2xl overflow-hidden aspect-video bg-gray-900 shadow-sm hover:shadow-xl dark:shadow-none transition-all border border-transparent dark:border-slate-800"
              >
                {/* Modern Tech Placeholder */}
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/40 transition-colors duration-500"></div>
                  <Camera className="w-12 h-12 text-emerald-500/50 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div>
                    <p className="text-white text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate max-w-[150px]">{camera.name}</p>
                    <p className="text-white/70 text-[9px] truncate max-w-[150px]">{camera.location}</p>
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 backdrop-blur-sm text-white text-[8px] font-bold rounded flex items-center gap-1.5 shadow-lg ${camera.status === 'online' ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    {camera.status.toUpperCase()}
                  </span>
                </div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-500/50 rounded-2xl transition-colors duration-300 pointer-events-none"></div>
              </motion.div>
            )) : (
              // Skeletons while loading
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-video bg-gray-100 dark:bg-slate-800 animate-pulse border border-gray-200 dark:border-slate-700"></div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-16 md:py-24 px-6 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">About VMS Kota Madiun</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
              Visual Monitoring System (VMS) Adalah Sistem Pengawasan Berbasis Teknologi Informasi Yang Memanfaatkan Jaringan Closed Circuit Television (CCTV) Sebagai Sumber Data Visual Untuk Memantau Kondisi Lingkungan Secara Real Time Maupun Rekaman Historis Melalui Sebuah Platform Berbasis Web.
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-sm">
              VMS Dirancang Untuk Membantu Proses Perencanaan, Pengawasan, Dan Pengambilan Keputusan Dengan Menyediakan Infrastruktur Visual Yang Akurat, Terpusat, Dan Mudah Diakses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Clock, title: 'Real Time', desc: 'Pemantauan Jalur Real Time Dan Integrasi Sensor Terkini.' },
                { icon: Shield, title: 'Terintegrasi', desc: 'Satu Platform Untuk Seluruh Kebutuhan Pemantauan Yang Terpusat.' },
                { icon: Activity, title: 'Transport Center', desc: 'Memantau Dan Pengelolaan Lalu Lintas Secara Efektif.' }
              ].map((item, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md dark:hover:bg-slate-800 transition-all group">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative mt-8 md:mt-0"
          >
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl md:rounded-[32px] shadow-xl transform md:rotate-2 hover:rotate-0 transition-transform duration-500 border border-gray-100 dark:border-slate-700">
              <img 
                src={ASSETS.aboutVms} 
                alt="About VMS Madiun" 
                className="rounded-xl md:rounded-[24px] w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative dots */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20 -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="sistem-terintegrasi" className="py-24 bg-white dark:bg-slate-900 px-6 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Sistem Terintegrasi</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">VMS Mengintegrasikan Berbagai Layanan Kota Cerdas Untuk Kenyamanan Dan Keamanan Warga</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Globe, title: 'Traffic Management', desc: 'Sistem Manajemen Lalu Lintas Berbasis Teknologi Cerdas Untuk Meningkatkan Kelancaran Dan Efisiensi Pergerakan Kendaraan.' },
              { icon: Shield, title: 'Incident Management', desc: 'Sistem Penanganan Insiden Lalu Lintas Yang Responsif Dan Terkoordinasi Untuk Menjaga Kelancaran Transportasi.' },
              { icon: Activity, title: 'Air Quality Monitoring', desc: 'Sistem Pemantauan Kualitas Udara Secara Real-Time Di Berbagai Titik Strategis Kota.' },
              { icon: Camera, title: 'Live Streaming CCTV', desc: 'Layanan Live Streaming CCTV Untuk Mendukung Pengawasan Dan Keamanan Lalu Lintas Secara Real-Time.' },
            ].map((feature, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                key={i}
                className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-none border border-gray-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="keuntungan" className="py-24 bg-emerald-50 dark:bg-slate-900 text-gray-900 dark:text-white px-6 overflow-hidden relative transition-colors duration-300">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-4xl font-bold mb-12 text-gray-900 dark:text-white">
              Keuntungan Menggunakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">VMS</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { title: 'Memantau Lalu Lintas', desc: 'Pemantauan Lalu Lintas Real-Time Untuk Membantu Perjalanan Yang Lebih Aman Dan Terencana.' },
                { title: 'Menghindari Kemacetan', desc: 'Panduan Rute Cerdas Yang Membantu Menghindari Kemacetan Dan Mengoptimalkan Waktu Tempuh.' },
                { title: 'Transparansi Publik', desc: 'Transparansi Data Transportasi Kota Melalui Akses Terbuka Yang Dapat Dimanfaatkan Oleh Seluruh Warga.' },
                { title: 'Mendukung Smart City', desc: 'Solusi Berbasis Teknologi Yang Mendorong Terwujudnya Madiun Sebagai Kota Pintar Dan Berkelanjutan.' },
              ].map((benefit, i) => (
                <div key={i} className="space-y-3 group">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30 transition-all shadow-sm dark:shadow-none">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{benefit.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
             >
               <img 
                src={ASSETS.benefitsVms} 
                alt="Smart City Benefits" 
                className="rounded-[40px] shadow-2xl border-4 border-white dark:border-white/10"
                referrerPolicy="no-referrer"
              />
              {/* Floating Badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Real-Time</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">24/7 Active</p>
                </div>
              </motion.div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Left Column - Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src={ASSETS.logo} alt="Kominfo Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                <span className="text-lg font-bold tracking-tight">Kominfo Kota Madiun</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Layanan pemantauan visual berbasis web untuk meningkatkan keamanan dan kenyamanan warga Kota Madiun.
              </p>
            </div>

            {/* Middle Column - Contact Info */}
            <div className="col-span-1">
              <h4 className="text-base font-bold mb-6 tracking-tight text-gray-100">Kontak Kami</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-400 mt-0.5">📍</span>
                  <span>Jl. Perintis Kemerdekaan No. 32 Kel. Kartoharjo, Kecamatan Kartoharjo, Kota Madiun, Jawa Timur.</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="text-emerald-400">📞</span>
                  <span>(0351) 467327</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="text-emerald-400">✉️</span>
                  <span>kominfo@madiunkota.go.id</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Links */}
            <div className="col-span-1">
              <h4 className="text-base font-bold mb-6 tracking-tight text-gray-100">Tautan Penting</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#beranda" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> Beranda
                  </a>
                </li>
                <li>
                  <a href="#stream-cctv" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> Stream CCTV
                  </a>
                </li>
                <li>
                  <a href="#tentang" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> Tentang VMS
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10"></div>

          {/* Copyright */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>Copyright &copy; 2026 Diskominfo Kota Madiun. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setModalContent('privacy')} className="hover:text-white transition-colors">Kebijakan Privasi</button>
              <button onClick={() => setModalContent('terms')} className="hover:text-white transition-colors">Syarat & Ketentuan</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  {modalContent === 'privacy' ? 'Kebijakan Privasi' : 'Syarat & Ketentuan'}
                </h3>
                <button onClick={() => setModalContent(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-4">
                {modalContent === 'privacy' ? (
                  <>
                    <p><strong>1. Pengumpulan Data:</strong> Kami mengumpulkan data visual dari CCTV publik untuk keperluan pemantauan lalu lintas dan keamanan kota. Data tidak disebarluaskan untuk kepentingan komersial.</p>
                    <p><strong>2. Penggunaan Cookie:</strong> Kami menggunakan cookie untuk menyimpan preferensi tema dan sesi login pengguna untuk kenyamanan navigasi di platform VMS ini.</p>
                    <p><strong>3. Keamanan Informasi:</strong> Akses ke streaming langsung diamankan melalui protokol terenkripsi dan hanya dapat diakses melalui server terpusat yang diawasi penuh oleh Diskominfo Madiun.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Penggunaan Layanan:</strong> Layanan VMS disediakan oleh Diskominfo Kota Madiun secara gratis untuk warga. Dilarang keras menggunakan sistem ini untuk tindakan melawan hukum.</p>
                    <p><strong>2. Hak Cipta & Kepemilikan:</strong> Seluruh tayangan visual dan infrastruktur adalah milik Pemerintah Kota Madiun. Modifikasi atau distribusi ulang siaran dilarang tanpa izin resmi.</p>
                    <p><strong>3. Ketersediaan Layanan:</strong> Kami berusaha menjaga uptime 24/7, namun sistem dapat mengalami jeda (downtime) sewaktu-waktu tanpa pemberitahuan untuk keperluan pemeliharaan server.</p>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
                <button onClick={() => setModalContent(null)} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
