
import React from 'react';
import { View, Theme } from '../types';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  theme: Theme;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, theme }) => {
  const tabs: { id: View; label: string; icon: string }[] = [
    { id: 'Earn', label: 'Galaxy', icon: '👽' },
    { id: 'Upgrades', label: 'Fleet', icon: '🚀' },
    { id: 'Tasks', label: 'Missions', icon: '🎯' },
    { id: 'Leaderboard', label: 'Empire', icon: '🌌' },
    { id: 'Wallet', label: 'Wallet', icon: '🏦' },
  ];

  return (
    <>
      {/* Gradient Blur Overlay - Reduced height to h-14 and lowered z-index to z-30.
          This ensures it stays behind the Energy HUD and Booster Button (z-60) 
          but still provides a blur effect for scrolling content (z-0). */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none z-30 backdrop-blur-[1px]" />

      {/* Floating Glass Dock */}
      <nav className={`fixed bottom-6 left-4 right-4 bg-slate-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[2rem] flex justify-around items-center py-3 px-2 z-50 transition-all duration-300 ring-1 ring-white/5`}>
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-500 group outline-none ${
                isActive ? '' : 'hover:bg-white/5'
              }`}
            >
              {/* Active Glow Backdrop */}
              <div 
                className={`absolute inset-0 bg-${theme}-500/10 rounded-2xl blur-md transition-all duration-500 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              />

              {/* Icon Container */}
              <div className={`relative z-10 transition-transform duration-500 ${isActive ? '-translate-y-1 scale-110' : 'group-hover:scale-110'}`}>
                <span className={`text-2xl filter drop-shadow-lg ${isActive ? 'grayscale-0' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                    {tab.icon}
                </span>
              </div>
              
              {/* Label */}
              <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                isActive 
                  ? `text-${theme}-300 translate-y-0 opacity-100` 
                  : 'text-slate-500 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0'
              }`}>
                {tab.label}
              </span>
              
              {/* Active Indicator Dot */}
              <div className={`absolute bottom-1 w-1 h-1 rounded-full bg-${theme}-400 shadow-[0_0_5px_currentColor] transition-all duration-500 ${
                  isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}></div>
            </button>
          )
        })}
      </nav>
    </>
  );
};

export default Navigation;
