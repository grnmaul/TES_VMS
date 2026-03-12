import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { ASSETS } from '../assets/images';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ensure auth context is ready
    setAuthReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-600">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/seed/madiun-night/1200/1200" 
            alt="Madiun Surveillance" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-emerald-700/80 to-black/40"></div>
        </div>
        
        <div className="relative z-10 w-full p-16 flex flex-col justify-between text-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <img src={ASSETS.logo} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-2xl p-1 shadow-2xl" referrerPolicy="no-referrer" />
            <span className="text-xl font-black tracking-tighter uppercase">VMS Madiun</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl font-black leading-tight mb-6 tracking-tighter">
              Secure Visual <br /> Monitoring System.
            </h1>
            <p className="text-emerald-50/80 text-lg max-w-md leading-relaxed font-medium">
              Sistem pengawasan terpadu Kota Madiun untuk keamanan dan kenyamanan publik yang lebih baik.
            </p>
          </motion.div>

          <div className="flex items-center gap-6 text-emerald-100/60 text-sm font-bold tracking-widest uppercase">
            <span>Real-time</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span>Secure</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span>Integrated</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-emerald-900/5 border border-gray-100">
            <div className="mb-10">
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <img src={ASSETS.logo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                <span className="text-lg font-black tracking-tighter uppercase text-gray-900">VMS Madiun</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Selamat Datang</h2>
              <p className="text-gray-500 font-medium">Silakan masuk ke akun Anda untuk melanjutkan.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Username</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Password</label>
                  <Link href="/forgot-password" title="Lupa Password" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Lupa Password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      MASUK SEKARANG
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 pt-10 border-t border-gray-50 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Belum punya akun? {' '}
                <Link href="/register" className="text-emerald-600 font-black hover:underline">Daftar di sini</Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sistem Terenkripsi & Aman</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
