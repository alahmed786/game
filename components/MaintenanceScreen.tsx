import React, { useState, useEffect } from 'react';

interface MaintenanceScreenProps {
  endTime: number;
  onFinished: () => void;
  isDarkMode: boolean;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ endTime, onFinished, isDarkMode }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        clearInterval(timer);
        onFinished();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onFinished]);

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? 'bg-[#050B14] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <span className="text-5xl">🚧</span>
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-widest mb-3">System Offline</h1>
        <p className={`text-sm mb-8 max-w-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
           Our engineers are currently upgrading the quantum mainframe. Access will be automatically restored when the timer concludes.
        </p>
        
        <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${isDarkMode ? 'text-orange-500/70' : 'text-orange-600/70'}`}>Uplink Resumes In</span>
            <div className={`px-8 py-4 rounded-xl font-mono text-3xl font-black tracking-wider shadow-inner ${isDarkMode ? 'bg-black/50 border border-orange-500/30 text-orange-400' : 'bg-orange-50 border border-orange-200 text-orange-600'}`}>
                {timeLeft || "00:00:00"}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
