'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Bot, Navigation, ExternalLink, Loader2, Map as MapIcon, Send, User } from 'lucide-react';
import Markdown from 'react-markdown';

interface Place {
  uri: string;
  title: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function SmartMap() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // helper to provide a fallback mock response if AI API fails
  const generateMock = (q: string) => {
    const queryLower = q.toLowerCase();
    let mockResponse = '';
    let mockPlaces: Place[] = [];

    // More intelligent query parsing
    if (queryLower.includes('rumah sakit') || queryLower.includes('hospital') || queryLower.includes('rs') || queryLower.includes('klinik')) {
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah informasi rumah sakit dan fasilitas kesehatan di Kota Madiun:

**Rumah Sakit Terdekat:**
- **RSUD Kota Madiun**: Rumah sakit umum daerah dengan layanan lengkap (Jl. Pahlawan)
- **RS Islam Madiun**: Rumah sakit swasta dengan spesialisasi jantung (Jl. Ahmad Yani)
- **RS Panti Waluya Sawahan**: Rumah sakit khusus ibu dan anak (Jl. Sawahan)

**Fasilitas Kesehatan Lainnya:**
- **Puskesmas Madiun**: Pusat kesehatan masyarakat dengan layanan umum
- **Klinik Pratama**: Berbagai klinik swasta di berbagai lokasi

**Rekomendasi rute:**
1. Dari pusat kota, gunakan Jl. Pahlawan menuju RSUD Kota Madiun
2. Untuk RS Islam, ambil Jl. Ahmad Yani ke arah timur
3. Hindari jam sibuk pagi hari untuk akses lebih cepat

**Tips:** Pastikan membawa kartu identitas dan informasi medis penting saat berkunjung. Untuk layanan darurat, hubungi 119.`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=RSUD+Madiun', title: 'RSUD Kota Madiun' },
        { uri: 'https://maps.google.com/?q=RS+Islam+Madiun', title: 'RS Islam Madiun' },
        { uri: 'https://maps.google.com/?q=RS+Panti+Waluya+Madiun', title: 'RS Panti Waluya Sawahan' },
        { uri: 'https://maps.google.com/?q=Puskesmas+Madiun', title: 'Puskesmas Madiun' }
      ];
    } else if (queryLower.includes('polisi') || queryLower.includes('police') || queryLower.includes('kepolisian')) {
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah informasi kantor polisi dan layanan keamanan di Kota Madiun:

**Kantor Polisi:**
- **Polres Kota Madiun**: Kantor kepolisian utama kota (Jl. Pahlawan)
- **Polsek Madiun**: Kantor polisi sektor pusat kota
- **Polsek Sawahan**: Kantor polisi sektor Sawahan

**Layanan Darurat:**
- **Polisi**: 110
- **Ambulans**: 119
- **Pemadam Kebakaran**: 113

**Lokasi strategis:** Polres Kota Madiun terletak di Jl. Pahlawan, mudah diakses dari berbagai penjuru kota. Tersedia layanan 24 jam untuk keadaan darurat.`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=Polres+Madiun', title: 'Polres Kota Madiun' },
        { uri: 'https://maps.google.com/?q=Polsek+Madiun', title: 'Polsek Madiun' },
        { uri: 'https://maps.google.com/?q=Polsek+Sawahan+Madiun', title: 'Polsek Sawahan' }
      ];
    } else if (queryLower.includes('bank') || queryLower.includes('atm') || queryLower.includes('bri') || queryLower.includes('bni') || queryLower.includes('mandiri')) {
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah informasi bank dan layanan keuangan di Kota Madiun:

**Bank Utama:**
- **Bank BRI**: Cabang utama di Jl. Pahlawan
- **Bank Mandiri**: Cabang di Jl. Ahmad Yani
- **BNI**: Cabang di pusat kota Madiun
- **BCA**: Cabang di Jl. Kartini

**ATM Terdekat:**
- Tersedia di berbagai lokasi strategis di pusat kota
- ATM BRI: Di depan alun-alun kota
- ATM Mandiri: Di Jl. Pahlawan

**Jam Operasional:** Senin-Jumat 08:00-15:00 WIB, Sabtu 08:00-12:00 WIB.`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=Bank+BRI+Madiun', title: 'Bank BRI Madiun' },
        { uri: 'https://maps.google.com/?q=Bank+Mandiri+Madiun', title: 'Bank Mandiri Madiun' },
        { uri: 'https://maps.google.com/?q=BNI+Madiun', title: 'BNI Madiun' }
      ];
    } else if (queryLower.includes('terminal') || queryLower.includes('bus') || queryLower.includes('transportasi')) {
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah informasi transportasi umum di Kota Madiun:

**Terminal Bus:**
- **Terminal Bus Madiun**: Terminal utama untuk transportasi antar kota
- **Terminal Tiron**: Terminal untuk angkutan kota

**Stasiun Kereta:**
- **Stasiun Madiun**: Stasiun kereta api yang melayani berbagai tujuan

**Angkutan Kota:**
- Angkot berbagai rute tersedia di berbagai titik kota
- Trayek utama: Terminal - Alun-alun - Stasiun

**Informasi Tambahan:**
- Terminal beroperasi 24 jam
- Tersedia layanan taksi dan ojek online
- Parkir tersedia dengan tarif terjangkau`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=Terminal+Bus+Madiun', title: 'Terminal Bus Madiun' },
        { uri: 'https://maps.google.com/?q=Stasiun+Madiun', title: 'Stasiun Kereta Madiun' },
        { uri: 'https://maps.google.com/?q=Terminal+Tiron+Madiun', title: 'Terminal Tiron' }
      ];
    } else if (queryLower.includes('kuliner') || queryLower.includes('makan') || queryLower.includes('restoran') || queryLower.includes('warung')) {
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah rekomendasi kuliner di Kota Madiun:

**Kuliner Terkenal:**
- **Nasi Liwet Madiun**: Hidangan khas dengan cita rasa unik
- **Soto Ayam Madiun**: Soto dengan kuah bening dan gurih
- **Bakso Malang**: Bakso dengan berbagai varian

**Tempat Makan Populer:**
- **Warung Nasi Liwet**: Di sekitar alun-alun kota
- **RM Soto Pak Man**: Soto ayam terenak di kota
- **Bakso President**: Bakso malang legendaris

**Rekomendasi:** Coba kuliner khas Madiun di warung-warung tradisional untuk pengalaman autentik. Harga terjangkau mulai dari Rp 15.000 - Rp 50.000 per porsi.`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=Nasi+Liwet+Madiun', title: 'Warung Nasi Liwet Madiun' },
        { uri: 'https://maps.google.com/?q=Soto+Ayam+Madiun', title: 'RM Soto Pak Man' },
        { uri: 'https://maps.google.com/?q=Bakso+Malang+Madiun', title: 'Bakso President' }
      ];
    } else {
      // Generic response for unrecognized queries
      mockResponse = `Berdasarkan pencarian Anda tentang "${q}", berikut adalah informasi umum yang mungkin berguna di Kota Madiun:

**Lokasi Populer:**
- **Jl. Pahlawan**: Jalan utama pusat kota dengan berbagai fasilitas
- **Alun-alun Kota Madiun**: Pusat aktivitas kota dan tempat berkumpul
- **Pasar Besar Madiun**: Pusat perdagangan tradisional

**Fasilitas Umum:**
- **Kantor Pos**: Layanan pengiriman dan komunikasi
- **PDAM**: Layanan air bersih
- **PLN**: Layanan listrik

**Rekomendasi:** Untuk informasi lebih spesifik, coba sebutkan jenis tempat yang Anda cari (contoh: rumah sakit, polisi, bank, terminal, kuliner, dll).`;

      mockPlaces = [
        { uri: 'https://maps.google.com/?q=Madiun+City+Center', title: 'Pusat Kota Madiun - Jl. Pahlawan' },
        { uri: 'https://maps.google.com/?q=Alun+Alun+Madiun', title: 'Alun-alun Kota Madiun' },
        { uri: 'https://maps.google.com/?q=Pasar+Besar+Madiun', title: 'Pasar Besar Madiun' }
      ];
    }

    return { mockResponse, mockPlaces };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    // Add user message to conversation
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setQuery('');
    setLoading(true);
    setPlaces([]);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();
      if (data && data.text) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.text,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setPlaces(Array.isArray(data.places) ? data.places : []);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.warn('AI API failed, falling back to mock', error);
      const { mockResponse, mockPlaces } = generateMock(query);
      
      const errorMessage = error.message ? `*(Sistem: ${error.message}. Beralih ke Offline Mode)*\n\n` : `*(Sistem: Beralih ke Offline Mode)*\n\n`;
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: errorMessage + mockResponse,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setPlaces(mockPlaces);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setPlaces([]);
    setQuery('');
  };

  return (
    <div className="p-4 md:p-8 h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">💬</span> AI Chat Madiun
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Asisten AI yang responsif dan fleksibel siap ngobrol denganmu</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
            >
              Mulai Baru
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Bot className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Halo! 👋</h3>
                <p className="text-sm md:text-base text-gray-600 max-w-sm mb-4">Aku adalah asisten AI Madiun yang bisa diajak ngobrol santai dan responsif. Tanyakan apapun tentang kota, lokasi, atau topik lainnya!</p>
                <div className="text-xs text-gray-500 space-y-2">
                  <p>Contoh pertanyaan:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">\"Rumah sakit apa di Madiun?\"</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">\"Kuliner apa yang enak?\"</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">\"Cerita tentang Madiun yuk\"</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 md:gap-3 animate-fadeIn ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl text-sm md:text-base leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-emerald-500 text-white rounded-br-sm shadow-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm shadow-sm hover:shadow-md transition-shadow'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 md:gap-3 animate-fadeIn">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 animate-spin" />
                    </div>
                    <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-500 rounded-bl-sm shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 bg-white p-3 md:p-4">
            <form onSubmit={handleSearch} className="flex gap-2 md:gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tanya apapun...💬"
                className="flex-1 px-4 py-2 md:py-3 bg-gray-50 border border-gray-200 rounded-full text-sm md:text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Kirim pesan"
              >
                <Send className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: Places */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-md max-h-fit sticky top-0 md:top-4">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" /> Lokasi
          </h3>

          {places.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {places.map((place, i) => (
                <a
                  key={i}
                  href={place.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 mb-1 line-clamp-2">{place.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    Buka Maps <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Mulai ngobrol untuk melihat lokasi!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
