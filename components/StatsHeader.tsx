import React from 'react';
import { Player } from '../types';
import { LEVEL_BALANCE_REQUIREMENTS } from '../constants';

const RANKS = [
  "Novice", "Space Cadet", "Explorer", "Commander", "Captain", 
  "Admiral", "Warlord", "Conqueror", "Overlord", "Celestial"
];

// Smart formatter to prevent huge numbers from breaking the UI layout
const formatBalance = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return Math.floor(num).toLocaleString();
};

interface StatsHeaderProps {
  player: Player | null;
  animateBalance: boolean;
  theme: string;
  onOpenAdmin?: () => void;
  showAdminLock?: boolean;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ player, animateBalance, theme, onOpenAdmin, showAdminLock }) => {
  if (!player) return null;

  const currentLevelIndex = Math.max(0, player.level - 1);
  const rankName = RANKS[currentLevelIndex] || 'Galactic Legend';
  
  const nextLevelReq = LEVEL_BALANCE_REQUIREMENTS[player.level];
  const prevLevelReq = player.level === 1 ? 0 : LEVEL_BALANCE_REQUIREMENTS[player.level - 1];
  
  let progressPercent = 100;
  if (nextLevelReq) {
      const levelTotal = nextLevelReq - prevLevelReq;
      const currentProgress = player.balance - prevLevelReq;
      progressPercent = Math.min(100, Math.max(0, (currentProgress / levelTotal) * 100));
  }

  return (
    <div className="w-full px-4 pt-3 pb-1 z-50 shrink-0">
      {/* Sleek, Compact Glassmorphic Container */}
      <div className={`relative w-full backdrop-blur-2xl bg-white/60 dark:bg-[#0f172a]/80 border border-white/50 dark:border-slate-800/80 rounded-2xl px-3 py-2 flex flex-col gap-2 shadow-sm dark:shadow-[0_5px_20px_rgba(0,0,0,0.3)]`}>
        
        <div className="flex items-center justify-between min-w-0">
          
          {/* Left: Profile & Level Section */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="relative shrink-0">
              {/* Compact Gradient Avatar Border */}
              <div className={`w-10 h-10 rounded-xl p-[1px] bg-gradient-to-br from-${theme}-400 to-purple-500 shadow-sm`}>
                <img 
                   src={player.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} 
                   alt="avatar" 
                   className="w-full h-full rounded-[10px] bg-slate-100 dark:bg-slate-900 object-cover"
                />
              </div>
              {/* Crisp Level Badge */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-[6px] text-[8px] font-black text-white shadow-md border border-white dark:border-[#0f172a] bg-gradient-to-br from-${theme}-400 to-${theme}-600`}>
                {player.level}
              </div>
            </div>

            {/* Truncated texts prevent breaking on small screens */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-wide truncate max-w-[90px] sm:max-w-[140px]">
                    {player.username}
                </span>
                {showAdminLock && (
                   <button onClick={onOpenAdmin} className="text-yellow-500 text-xs drop-shadow-md hover:scale-110 transition-transform shrink-0">
                     👑
                   </button>
                )}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-[0.15em] text-${theme}-500 dark:text-${theme}-400 truncate`}>
                {rankName}
              </span>
            </div>
          </div>

          {/* Right: Balances Section */}
          <div className="flex flex-col items-end gap-0.5 shrink-0 pl-2">
             {/* Primary Currency Pill - Tighter Padding */}
             <div className={`flex items-center gap-1.5 bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-lg shadow-sm ${animateBalance ? 'scale-105' : 'scale-100'} transition-transform duration-200`}>
                <span className="text-sm drop-shadow-sm">🪐</span>
                <span className={`font-mono font-black text-sm tracking-wider text-slate-900 dark:text-white ${animateBalance ? `text-${theme}-500 drop-shadow-[0_0_8px_rgba(var(--bg-primary),0.8)]` : ''}`}>
                   {formatBalance(player.balance)}
                </span>
             </div>
             
             {/* Premium Currency (Stars) */}
             <div className="flex items-center gap-1 px-1 opacity-90">
                 <span className="text-[9px]">⭐</span>
                 <span className="font-mono text-[10px] font-bold text-yellow-600 dark:text-yellow-500">
                     {formatBalance(player.stars)}
                 </span>
             </div>
          </div>
        </div>

        {/* Bottom: Ultra-Thin Progress Bar */}
        <div className="w-full">
            <div className="w-full h-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
               <div 
                 className={`h-full bg-gradient-to-r from-${theme}-400 via-${theme}-500 to-indigo-500 relative`}
                 style={{ width: `${progressPercent}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
               >
                 {/* Shiny Glint on the progress bar */}
                 <div className="absolute top-0 right-0 bottom-0 w-3 bg-white/40 blur-[1px]"></div>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StatsHeader;
