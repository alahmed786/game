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
        @keyframes subtle-bounce {
            0%, 100% { transform: translateY(0px) scale(1.1); }
            50% { transform: translateY(-2px) scale(1.1); }
        }
        .animate-subtle-bounce {
            animation: subtle-bounce 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle Gradient Overlay to blend the bottom edge */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/60 dark:from-[#030712]/80 to-transparent pointer-events-none z-30" />

      {/* 100% Glassmorphic Floating Dock */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 h-16 rounded-2xl bg-white/20 dark:bg-[#0f172a]/30 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center overflow-hidden transition-all duration-500">
        
        {/* Sleek Sliding Glass Highlight */}
        <div className="absolute inset-0 pointer-events-none">
            <div 
                className="h-full w-1/5 transition-transform duration-400 ease-[cubic-bezier(0.3,0,0.1,1)] p-1.5"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
                {/* Inner Frosted Pill */}
                <div className={`w-full h-full rounded-xl bg-white/40 dark:bg-white/10 border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden`}>
                    {/* Glowing Theme Indicator Line at the bottom */}
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px] rounded-t-md bg-${theme}-400 dark:bg-${theme}-500 shadow-[0_0_10px_currentColor]`}></div>
                </div>
            </div>
        </div>

        {/* Tab Buttons Grid */}
        <div className="relative w-full h-full grid grid-cols-5 z-10">
            {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className="relative flex flex-col items-center justify-center h-full outline-none group rounded-xl active:scale-90 transition-transform duration-200"
                >
                    {/* Icon Container */}
                    <div className={`relative transition-all duration-400 flex items-center justify-center ${isActive ? '-translate-y-1.5' : 'translate-y-0.5'}`}>
                        <span 
                            className={`text-[22px] transition-all duration-400 block select-none transform ${isActive ? 'animate-subtle-bounce' : ''}`}
                            style={{
                                filter: isActive 
                                    ? `drop-shadow(0 0 6px ${glowColor}) brightness(1.1)` 
                                    : 'grayscale(0.4) brightness(0.9)', 
                                opacity: isActive ? 1 : 0.6, 
                                transform: isActive ? 'scale(1.1)' : 'scale(0.9)',
                            }}
                        >
                            {tab.icon}
                        </span>
                    </div>
                    
                    {/* Label - Absolute Positioned below icon */}
                    <span className={`absolute bottom-2 text-[9px] font-bold uppercase tracking-widest transition-all duration-400 ${
                        isActive 
                        ? `text-slate-800 dark:text-white opacity-100 translate-y-0` 
                        : 'text-slate-500 opacity-0 translate-y-2 scale-75'
                    }`}>
                        {tab.label}
                    </span>
                    
                </button>
            )
            })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
