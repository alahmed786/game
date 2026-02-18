
import React, { useMemo } from 'react';
import { View, Theme } from '../types';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  theme: Theme;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, theme }) => {
  const tabs: { id: View; label: string; icon: string }[] = useMemo(() => [
    { id: 'Earn', label: 'Galaxy', icon: '👽' },
    { id: 'Upgrades', label: 'Fleet', icon: '🚀' },
    { id: 'Tasks', label: 'Missions', icon: '🎯' },
    { id: 'Leaderboard', label: 'Empire', icon: '🌌' },
    { id: 'Wallet', label: 'Wallet', icon: '🏦' },
  ], []);

  const activeIndex = tabs.findIndex(tab => tab.id === currentView);

  // Helper to get hex color for drop-shadow styles
  const getThemeColor = (t: Theme) => {
      switch(t) {
          case 'purple': return '#a855f7';
          case 'orange': return '#f97316';
          case 'rose': return '#f43f5e';
          case 'emerald': return '#10b981';
          default: return '#06b6d4'; // cyan
      }
  };
  const glowColor = getThemeColor(theme);

  return (
    <>
      <style>{`
        @keyframes float-icon {
            0%, 100% { transform: translateY(0px) scale(1.2); }
            50% { transform: translateY(-3px) scale(1.2); }
        }
        .animate-float-icon {
            animation: float-icon 2s ease-in-out infinite;
        }
      `}</style>

      {/* Gradient Blur Overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#030712] dark:via-[#030712]/90 dark:to-transparent pointer-events-none z-30 backdrop-blur-[1px]" />

      {/* Floating Glass Dock */}
      <nav className={`fixed bottom-6 left-4 right-4 bg-white/85 dark:bg-slate-950/80 backdrop-blur-2xl dark:backdrop-blur-xl border-2 dark:border border-${theme}-500/40 dark:border-white/10 shadow-[0_0_30px_rgba(var(--bg-primary),0.8)] dark:shadow-lg rounded-[2rem] z-50 h-20 overflow-hidden transition-all duration-300`}>
        
        {/* Animated Background Highlight */}
        <div className="absolute inset-0 p-2 pointer-events-none">
            <div 
                className="h-full w-1/5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
                {/* Main Glow Blob */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-${theme}-400/50 dark:bg-${theme}-500/40 rounded-full blur-xl`}></div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-${theme}-300/40 dark:bg-${theme}-500/30 rounded-full blur-md`}></div>
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-${theme}-500/80 dark:bg-${theme}-400/80 rounded-t-full blur-[2px]`}></div>
            </div>
        </div>

        {/* Tab Buttons Grid */}
        <div className="relative w-full h-full grid grid-cols-5">
            {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className="relative flex flex-col items-center justify-center gap-1.5 h-full outline-none group rounded-[1.5rem] active:scale-95 transition-transform duration-100"
                >
                    {/* Icon Container */}
                    <div className={`relative z-10 transition-all duration-300 ${isActive ? '-translate-y-1.5' : ''}`}>
                        <span 
                            className={`text-2xl transition-all duration-300 block select-none transform ${isActive ? 'animate-float-icon' : ''}`}
                            style={{
                                filter: isActive 
                                    ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor}) brightness(1.2)` 
                                    : 'grayscale(0) brightness(1)', // Kept grayscale(0) to avoid dullness
                                opacity: isActive ? 1 : 0.7, 
                                transform: isActive ? 'scale(1.2)' : 'scale(1)',
                            }}
                        >
                            {tab.icon}
                        </span>
                    </div>
                    
                    {/* Label */}
                    <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive 
                        ? `text-${theme}-600 dark:text-${theme}-300 translate-y-0 opacity-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]` 
                        : 'text-slate-500 translate-y-2 opacity-0'
                    }`}>
                        {tab.label}
                    </span>
                    
                    {/* Active Indicator Dot */}
                    <div className={`absolute bottom-2.5 w-1 h-1 rounded-full bg-${theme}-500 dark:bg-${theme}-400 shadow-[0_0_8px_currentColor] transition-all duration-500 ${
                        isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}></div>
                </button>
            )
            })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
