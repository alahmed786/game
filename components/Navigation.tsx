
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

  return (
    <>
      {/* Gradient Blur Overlay - Reduced height to h-14 and lowered z-index to z-30. */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none z-30 backdrop-blur-[1px]" />

      {/* Floating Glass Dock with Dynamic Glow */}
      <nav className={`fixed bottom-6 left-4 right-4 bg-slate-950/80 backdrop-blur-2xl border border-${theme}-500/30 shadow-[0_0_20px_var(--bg-primary),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[2rem] z-50 h-20 overflow-hidden transition-all duration-300`}>
        
        {/* Animated Background Highlight */}
        <div className="absolute inset-0 p-2 pointer-events-none">
            <div 
                className="h-full w-1/5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
                {/* Main Glow Blob */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-${theme}-500/20 rounded-full blur-xl`}></div>
                
                {/* Secondary Core Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-${theme}-500/10 rounded-full blur-md`}></div>
                
                {/* Sharp Bottom Reflection/Highlight */}
                 <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-${theme}-400/50 rounded-t-full blur-[2px]`}></div>
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
                    className="relative flex flex-col items-center justify-center gap-1 h-full outline-none group rounded-[1.5rem]"
                >
                    {/* Icon Container */}
                    <div className={`relative z-10 transition-all duration-300 ${isActive ? '-translate-y-1.5 scale-110' : 'group-hover:scale-105'}`}>
                        <span className={`text-2xl filter drop-shadow-md transition-all duration-300 ${
                            isActive 
                                ? 'grayscale-0 opacity-100' 
                                : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80'
                        }`}>
                            {tab.icon}
                        </span>
                    </div>
                    
                    {/* Label */}
                    <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive 
                        ? `text-${theme}-300 translate-y-0 opacity-100` 
                        : 'text-slate-500 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}>
                        {tab.label}
                    </span>
                    
                    {/* Active Indicator Dot */}
                    <div className={`absolute bottom-2 w-1 h-1 rounded-full bg-${theme}-400 shadow-[0_0_5px_currentColor] transition-all duration-500 ${
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
