/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Compass, 
  Clock, 
  Info, 
  ChevronRight, 
  MapPin, 
  Search,
  ChevronLeft,
  Volume2,
  Moon,
  Sun
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { getPrayerTimes, getQiblaDirection, fetchSurahs, fetchSurahDetail } from './services/islamicService';
import { Surah, SurahDetail, PrayerTime } from './types';
import { cn } from './lib/utils';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-stone-100", className)}>
    {children}
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 p-2 transition-all duration-300",
      active ? "text-emerald-600 scale-110" : "text-stone-400 hover:text-stone-600"
    )}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

// --- Sections ---

const Dashboard = ({ coords }: { coords: GeolocationCoordinates | null }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (coords) {
      setPrayerTimes(getPrayerTimes({ latitude: coords.latitude, longitude: coords.longitude }));
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [coords]);

  const nextPrayer = useMemo(() => {
    if (prayerTimes.length === 0) return null;
    const next = prayerTimes.find(p => isAfter(p.time, currentTime));
    return next || { ...prayerTimes[0], time: addDays(prayerTimes[0].time, 1) };
  }, [prayerTimes, currentTime]);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-stone-500 text-sm font-medium italic serif">Assalamu'alaikum,</p>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Selamat Datang</h1>
        </div>
        <div className="text-right">
          <p className="text-stone-900 font-mono font-medium">{format(currentTime, 'HH:mm:ss')}</p>
          <p className="text-stone-500 text-xs uppercase tracking-widest">{format(currentTime, 'EEEE, d MMMM', { locale: id })}</p>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-emerald-900 text-white p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Clock size={16} />
            <span className="text-xs uppercase tracking-widest font-semibold">Jadwal Berikutnya</span>
          </div>
          <h2 className="text-5xl font-serif font-bold mb-1">{nextPrayer?.name}</h2>
          <p className="text-emerald-200 text-lg font-mono">{nextPrayer ? format(nextPrayer.time, 'HH:mm') : '--:--'}</p>
          
          <div className="mt-8 flex items-center gap-2 text-xs bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <MapPin size={12} />
            <span>{coords ? `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}` : 'Mencari lokasi...'}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/30 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-700/20 rounded-full -ml-10 -mb-10 blur-2xl" />
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {prayerTimes.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={cn(
              "flex justify-between items-center",
              nextPrayer?.id === p.id ? "border-emerald-500 bg-emerald-50/50" : ""
            )}>
              <div>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mb-1">{p.name}</p>
                <p className="text-xl font-mono font-bold text-stone-800">{format(p.time, 'HH:mm')}</p>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                nextPrayer?.id === p.id ? "bg-emerald-100 text-emerald-600" : "bg-stone-50 text-stone-300"
              )}>
                {p.id === 'fajr' || p.id === 'maghrib' || p.id === 'isha' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const QuranReader = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSurahs().then(data => {
      setSurahs(data);
      setLoading(false);
    });
  }, []);

  const handleSurahClick = async (nomor: number) => {
    setLoading(true);
    const detail = await fetchSurahDetail(nomor);
    setSelectedSurah(detail);
    setLoading(false);
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
    s.nomor.toString().includes(search)
  );

  if (selectedSurah) {
    return (
      <div className="space-y-6 pb-24">
        <button 
          onClick={() => setSelectedSurah(null)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Kembali ke Daftar</span>
        </button>

        <div className="text-center py-8 bg-stone-50 rounded-[2rem] border border-stone-100">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-1">{selectedSurah.namaLatin}</h2>
          <p className="text-emerald-600 font-medium italic serif">{selectedSurah.arti}</p>
          <div className="mt-4 flex justify-center gap-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">
            <span>{selectedSurah.jumlahAyat} Ayat</span>
            <span>•</span>
            <span>{selectedSurah.tempatTurun}</span>
          </div>
        </div>

        <div className="space-y-8">
          {selectedSurah.ayat.map((a) => (
            <div key={a.nomorAyat} className="group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
                  {a.nomorAyat}
                </div>
                <div className="text-right flex-1 pl-8">
                  <p className="text-3xl font-serif leading-relaxed text-stone-900 mb-4" dir="rtl">
                    {a.teksArab}
                  </p>
                </div>
              </div>
              <div className="pl-12 space-y-2">
                <p className="text-sm text-stone-500 italic">{a.teksLatin}</p>
                <p className="text-stone-700 leading-relaxed">{a.teksIndonesia}</p>
              </div>
              <div className="mt-6 h-px bg-stone-100 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-serif font-bold text-stone-900">Al-Qur'an</h1>
        <p className="text-stone-500 text-sm italic serif">Baca dan pelajari kitab suci</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari surah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-stone-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredSurahs.map((s) => (
            <button 
              key={s.nomor}
              onClick={() => handleSurahClick(s.nomor)}
              className="group text-left"
            >
              <Card className="flex items-center gap-4 hover:bg-emerald-50 transition-colors group-hover:border-emerald-200">
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-sm font-bold text-stone-500 group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                  {s.nomor}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-stone-900">{s.namaLatin}</h3>
                  <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">{s.arti}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif text-stone-900 mb-1">{s.nama}</p>
                  <p className="text-[10px] text-stone-400 font-bold">{s.jumlahAyat} Ayat</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const QiblaCompass = ({ coords }: { coords: GeolocationCoordinates | null }) => {
  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (coords) {
      setQibla(getQiblaDirection({ latitude: coords.latitude, longitude: coords.longitude }));
    }

    const handleOrientation = (e: any) => {
      if (e.webkitCompassHeading) {
        setHeading(e.webkitCompassHeading);
      } else if (e.alpha) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [coords]);

  return (
    <div className="space-y-8 pb-24 text-center">
      <header>
        <h1 className="text-3xl font-serif font-bold text-stone-900">Kiblat</h1>
        <p className="text-stone-500 text-sm italic serif">Arah menuju Ka'bah</p>
      </header>

      <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
        <div className="absolute inset-4 border border-stone-100 rounded-full border-dashed" />
        
        {/* Compass Face */}
        <motion.div 
          className="relative w-full h-full flex items-center justify-center"
          animate={{ rotate: -heading }}
          transition={{ type: 'spring', stiffness: 50 }}
        >
          <div className="absolute top-4 font-bold text-stone-400 text-xs">U</div>
          <div className="absolute bottom-4 font-bold text-stone-400 text-xs">S</div>
          <div className="absolute left-4 font-bold text-stone-400 text-xs">B</div>
          <div className="absolute right-4 font-bold text-stone-400 text-xs">T</div>

          {/* Qibla Indicator */}
          {qibla !== null && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ rotate: qibla }}
            >
              <div className="w-1 h-32 bg-emerald-500 rounded-full -translate-y-16 relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rotate-45 rounded-sm" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Center Point */}
        <div className="absolute w-4 h-4 bg-stone-900 rounded-full border-4 border-white shadow-sm z-20" />
      </div>

      <div className="space-y-4">
        <Card className="bg-stone-50 border-none">
          <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mb-1">Sudut Kiblat</p>
          <p className="text-3xl font-mono font-bold text-stone-900">{qibla?.toFixed(1)}°</p>
        </Card>
        <p className="text-xs text-stone-400 px-8">
          Posisikan ponsel Anda mendatar untuk hasil yang lebih akurat. Arah hijau menunjukkan posisi Ka'bah.
        </p>
      </div>
    </div>
  );
};

const Guides = () => {
  const guides = [
    { title: 'Tata Cara Sholat', icon: Clock, content: 'Panduan lengkap langkah-langkah sholat fardhu dari niat hingga salam.' },
    { title: 'Wudhu & Tayammum', icon: Volume2, content: 'Cara mensucikan diri sebelum beribadah sesuai sunnah.' },
    { title: 'Kumpulan Doa', icon: Book, content: 'Doa-doa harian penting untuk berbagai aktivitas.' },
    { title: 'Zakat & Sedekah', icon: Info, content: 'Penjelasan mengenai kewajiban zakat dan keutamaan sedekah.' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-serif font-bold text-stone-900">Panduan</h1>
        <p className="text-stone-500 text-sm italic serif">Pelajari lebih dalam tentang Islam</p>
      </header>

      <div className="grid gap-4">
        {guides.map((g, idx) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="flex gap-4 items-start hover:bg-stone-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <g.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 mb-1">{g.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{g.content}</p>
              </div>
              <ChevronRight className="text-stone-300 self-center" size={20} />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'quran' | 'qibla' | 'guides'>('home');
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords(pos.coords),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-md mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <Dashboard coords={coords} />}
            {activeTab === 'quran' && <QuranReader />}
            {activeTab === 'qibla' && <QiblaCompass coords={coords} />}
            {activeTab === 'guides' && <Guides />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-100 px-6 py-3 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavItem 
            icon={Clock} 
            label="Jadwal" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={Book} 
            label="Qur'an" 
            active={activeTab === 'quran'} 
            onClick={() => setActiveTab('quran')} 
          />
          <NavItem 
            icon={Compass} 
            label="Kiblat" 
            active={activeTab === 'qibla'} 
            onClick={() => setActiveTab('qibla')} 
          />
          <NavItem 
            icon={Info} 
            label="Panduan" 
            active={activeTab === 'guides'} 
            onClick={() => setActiveTab('guides')} 
          />
        </div>
      </nav>
    </div>
  );
}
