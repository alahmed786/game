
import React from 'react';
import { Player, Theme } from '../types';
import { LEVEL_BALANCE_REQUIREMENTS, getRankName } from '../constants';

interface StatsHeaderProps {
  player: Player;
  animateBalance: boolean;
  theme: Theme;
  onOpenAdmin?: () => void;
  showAdminLock?: boolean;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ player, animateBalance, theme, onOpenAdmin, showAdminLock }) => {
  const currentLevel = player.level;
  
  // Logic: Calculate progress relative to the current level's bracket
  const prevLevelReq = LEVEL_BALANCE_REQUIREMENTS[currentLevel - 1] || 0;
  // Ensure we have a valid next level requirement.
  const nextLevelReq = LEVEL_BALANCE_REQUIREMENTS[currentLevel]; 
  
  let progress = 0;
  if (nextLevelReq === undefined) {
     progress = 100;
  } else {
      const totalReq = nextLevelReq - prevLevelReq;
      const currentProgress = player.balance - prevLevelReq;
      
      // Prevent division by zero
      if (totalReq > 0) {
        progress = (currentProgress / totalReq) * 100;
      }
  }

  // Cap at 0 and 100
  const balanceProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="pt-5 pb-3 px-4 flex flex-col gap-4 bg-transparent z-10">
      <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col shadow-lg">
        
        {/* Top Content (Profile & Currencies) */}
        <div className="px-4 py-3 flex items-center justify-between z-10">
          {/* Profile Section */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img 
                src={player.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`} 
                alt="Profile" 
                className={`w-10 h-10 rounded-full border-2 border-${theme}-500/30`}
              />
              <div className={`absolute -bottom-1 -right-1 bg-slate-950 text-${theme}-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-${theme}-500/30`}>
                {player.level}
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
               <p className="font-bold text-white text-base leading-tight flex items-center gap-2">
                 {player.username}
                 {/* Admin Trigger: Hidden unless authorized */}
                 {showAdminLock && (
                    <button onClick={onOpenAdmin} className="opacity-50 hover:opacity-100 transition-opacity">
                        <span className="text-[10px]">🔒</span>
                    </button>
                 )}
               </p>
               <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5 uppercase">
                  {getRankName(player.level)}
               </p>
            </div>
          </div>

          {/* Currencies Section */}
          <div className="flex items-center gap-2">
              {/* Stars Display */}
              <div className="bg-black/40 p-1.5 rounded-lg border border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.1)] flex items-center justify-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-bold tracking-tight text-white">
                  {player.stars.toLocaleString()}
                </span>
              </div>

             {/* Stardust Display */}
             <div className={`bg-black/40 p-1.5 rounded-lg border border-${theme}-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)] flex items-center justify-center gap-2 transition-all duration-300 ease-in-out ${animateBalance ? 'scale-110 border-green-400/50 shadow-green-400/20' : ''}`}>
                <span className="text-lg">🪐</span>
                <span className="text-sm font-bold tracking-tight text-white">
                  {player.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
          </div>
        </div>

        {/* Level Progress Bar Area - Floating Capsule Design with Curved Start */}
        <div className="px-4 pb-4 w-full">
             <div className="w-full h-2 bg-slate-900/80 rounded-full border border-white/5 relative overflow-hidden">
                 {/* Progress Bar Fill */}
                 <div 
                   className={`h-full bg-gradient-to-r from-${theme}-400 via-${theme}-500 to-white shadow-[0_0_10px_rgba(var(--theme-primary))] rounded-full transition-all duration-300 ease-out relative`} 
                   style={{ width: `${balanceProgress}%` }}
                 >
                    {/* Bright rounded tip */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60 shadow-[0_0_5px_white] rounded-full"></div>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default StatsHeader;
