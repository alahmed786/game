import React from 'react';
import { Player } from '../types';
import { LEVEL_BALANCE_REQUIREMENTS } from '../constants';

const RANKS = [
  "Novice", "Space Cadet", "Explorer", "Commander", "Captain", 
  "Admiral", "Warlord", "Conqueror", "Overlord", "Celestial"
];

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
    <div className="w-full px-4 pt-4 pb-2 z-50 shrink-0">
      {/* Sleek Glassmorphic Container */}
      <div className={`relative w-full backdrop-blur-2xl bg-white/60 dark:bg-[#0f172a]/80 border border-white/50 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)]`}>
        
        <div className="flex items-center justify-between">
          
          {/* Left: Profile & Level Section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Gradient Avatar Border */}
              <div className={`w-11 h-11 rounded-xl p-[1px] bg-gradient-to-br from-${theme}-400 to-purple-500 shadow-sm`}>
                <img 
                   src={player.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} 
                   alt="avatar" 
                   className="w-full h-full rounded-[10px] bg-slate-100 dark:bg-slate-900 object-cover"
                />
              </div>
              {/* Crisp Level Badge */}
              <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-lg text-[9px] font-black text-white shadow-md border-[1.5px] border-white dark:border-[#0f172a] bg-gradient-to-br from-${theme}-400 to-${theme}-600`}>
                {player.level}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-wide max-w-[100px] truncate">
                    {player.username}
                </span>
                {showAdminLock && (
                   <button onClick={onOpenAdmin} className="text-yellow-500 text-xs drop-shadow-md hover:scale-110 transition-transform">
                     👑
                   </button>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-${theme}-500 dark:text-${theme}-400`}>
                {rankName}
              </span>
            </div>
          </div>

          {/* Right: Balances Section */}
          <div className="flex flex-col items-end gap-1.5">
             {/* Primary Currency Pill */}
             <div className={`flex items-center gap-2 bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-xl shadow-sm ${animateBalance ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                <span className="text-lg drop-shadow-sm">🪐</span>
                <span className={`font-mono font-black text-sm tracking-wider text-slate-900 dark:text-white ${animateBalance ? `text-${theme}-500 drop-shadow-[0_0_8px_rgba(var(--bg-primary),0.8)]` : ''}`}>
                   {Math.floor(player.balance).toLocaleString()}
                </span>
             </div>
             
             {/* Premium Currency (Stars) */}
             <div className="flex items-center gap-1 px-2 opacity-80">
                 <span className="text-[10px]">⭐</span>
                 <span className="font-mono text-[10px] font-bold text-yellow-600 dark:text-yellow-500">
                     {player.stars.toLocaleString()}
                 </span>
             </div>
          </div>
        </div>

        {/* Bottom: Ultra-Thin Progress Bar */}
        <div className="w-full px-1">
            <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
               <div 
                 className={`h-full bg-gradient-to-r from-${theme}-400 via-${theme}-500 to-indigo-500 relative`}
                 style={{ width: `${progressPercent}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
               >
                 {/* Shiny Glint on the progress bar */}
                 <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px]"></div>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StatsHeader;
