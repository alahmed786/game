import React, { useState, useEffect } from 'react';
import { Player, DailyRewardViewProps, DailyReward } from '../types';

const CountdownTimer: React.FC<{ lastClaimed: number | null }> = ({ lastClaimed }) => {
  const calculateTimeLeft = () => {
    if (!lastClaimed) return null;
    const cooldown = 86400000; // 24 hours
    const timePassed = Date.now() - lastClaimed;
    const timeLeft = cooldown - timePassed;

    if (timeLeft <= 0) return null;

    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [lastClaimed]);

  if (!timeLeft) return null;

  return (
    <div className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-widest bg-white/50 dark:bg-black/40 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">{timeLeft}</div>
  );
};

// SVG Icon for a cleaner claimed state
const ClaimedCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-emerald-500 drop-shadow-sm opacity-90" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DailyRewardView: React.FC<DailyRewardViewProps> = ({ player, onClaim, onBack, isRewardAvailable, theme, rewards }) => {
  const currentStreakIndex = player.consecutiveDays % rewards.length;
  const progressPercent = Math.min(((currentStreakIndex + (isRewardAvailable ? 0 : 1)) / rewards.length) * 100, 100);

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-black/95 backdrop-blur-2xl animate-fade-in text-slate-900 dark:text-white">
        <div className={`relative w-full max-w-md bg-white/80 dark:bg-slate-950 border border-white/60 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto ring-1 ring-white/40 dark:ring-white/5`}>
            {/* Background Effects */}
            <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-${theme}-100/50 dark:from-${theme}-900/10 to-transparent pointer-events-none`}></div>
            <div className={`absolute -top-20 -right-20 w-80 h-80 bg-${theme}-300/20 dark:bg-${theme}-500/5 blur-[100px] rounded-full pointer-events-none`}></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-white to-${theme}-50 dark:from-${theme}-900/30 dark:to-slate-900/30 border border-white/50 dark:border-${theme}-500/20 mb-4 shadow-[0_0_30px_rgba(var(--bg-primary),0.2)]`}>
                    <span className="text-4xl drop-shadow-sm">📦</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest drop-shadow-sm text-slate-900 dark:text-white">Supply Drop</h2>
                <div className="flex items-center justify-center gap-2 mt-3">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Streak</p>
                    <div className={`px-3 py-1 bg-white/50 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-${theme}-600 dark:text-${theme}-400 border border-slate-200 dark:border-slate-800 shadow-sm`}>
                        {player.consecutiveDays} Days
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800/80 rounded-full mt-5 overflow-hidden relative border border-white/50 dark:border-white/5 shadow-inner">
                    <div 
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${theme}-400 via-${theme}-500 to-white shadow-[0_0_15px_rgba(var(--bg-primary),0.6)] transition-all duration-500 ease-out`} 
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="absolute right-0 top-0 h-full w-1 bg-white/50 blur-[1px]"></div>
                    </div>
                </div>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-4 gap-3 mb-8 relative z-10">
                {rewards.map((reward, index) => {
                    const day = index + 1;
                    const isClaimed = player.consecutiveDays > index;
                    const isCurrent = player.consecutiveDays === index;
                    const isMystery = index === 6; 
                    
                    const spanClass = isMystery ? "col-span-2 aspect-auto h-auto min-h-[5.5rem]" : "col-span-1 aspect-square";

                    let cardStyle = `relative rounded-xl flex flex-col items-center justify-center border transition-all duration-300 overflow-hidden group ${spanClass} `;
                    
                    if (isClaimed) {
                        cardStyle += `bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 shadow-inner`;
                    } else if (isCurrent) {
                        cardStyle += `bg-white/90 dark:bg-slate-800/90 border-${theme}-400 shadow-[0_0_20px_rgba(var(--bg-primary),0.2)] scale-[1.03] z-10 ring-2 ring-${theme}-400/30`;
                    } else { 
                        cardStyle += 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-60 grayscale-[0.8]';
                    }

                    if (isMystery) {
                        if (isCurrent) {
                             cardStyle = `relative rounded-xl flex flex-row items-center justify-between px-5 py-2 border transition-all duration-300 overflow-hidden group ${spanClass} bg-gradient-to-r from-purple-100/80 to-indigo-100/80 dark:from-purple-900/80 dark:to-indigo-900/80 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-[1.03] z-10`;
                        } else if (isClaimed) {
                             cardStyle = `relative rounded-xl flex flex-row items-center justify-between px-5 py-2 border transition-all duration-300 overflow-hidden group ${spanClass} bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-500/20`;
                        } else {
                             cardStyle = `relative rounded-xl flex flex-row items-center justify-between px-5 py-2 border transition-all duration-300 overflow-hidden group ${spanClass} bg-gradient-to-r from-purple-50/50 to-slate-50/50 dark:from-purple-900/20 dark:to-slate-900/20 border-purple-500/20 opacity-40`;
                        }
                    }

                    return (
                        <div key={day} className={cardStyle}>
                            <div className={`absolute top-1.5 left-2 text-[9px] font-bold uppercase tracking-wider 
                                ${isMystery ? (isCurrent ? 'text-purple-600 dark:text-purple-200' : isClaimed ? 'text-emerald-500/70 dark:text-emerald-500/50' : 'text-purple-400 dark:text-purple-500/70') : 
                                  (isCurrent ? `text-${theme}-600 dark:text-${theme}-200` : isClaimed ? 'text-emerald-500/70 dark:text-emerald-500/50' : 'text-slate-400 dark:text-slate-600')}`}>
                                {isMystery ? 'Day 7' : `Day ${day}`}
                            </div>

                            {isMystery ? (
                                <>
                                    <div className="flex flex-col items-start mt-3">
                                        <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900 dark:text-white' : isClaimed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {isClaimed ? 'Secured' : 'Mystery'}
                                        </span>
                                        {!isClaimed && <span className="text-[9px] text-purple-500 dark:text-purple-300 font-medium">Legendary</span>}
                                    </div>
                                    <div className={`flex items-center justify-center ${isCurrent ? 'animate-bounce text-3xl drop-shadow-md' : ''}`}>
                                        {isClaimed ? <ClaimedCheckIcon /> : '🎁'}
                                    </div>
                                    {!isClaimed && isCurrent && <div className="absolute inset-0 bg-purple-500/10 animate-pulse"></div>}
                                </>
                            ) : (
                                <>
                                    <div className={`flex items-center justify-center mb-1 mt-3 transition-transform ${isCurrent ? 'scale-110 text-2xl drop-shadow-md' : 'text-2xl'}`}>
                                        {isClaimed ? <ClaimedCheckIcon /> : reward.type === 'stars' ? '⭐' : '🪐'}
                                    </div>
                                    <div className={`text-[10px] font-bold ${isCurrent ? 'text-slate-900 dark:text-white' : isClaimed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {isClaimed ? 'Secured' : reward.amount >= 1000 ? `${(reward.amount/1000).toFixed(0)}K` : reward.amount}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Actions */}
            <div className="relative z-10 flex flex-col gap-3">
                 {!isRewardAvailable ? (
                    <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Next Drop</span>
                            <span className="text-xs text-slate-500 font-medium">Refilling supplies...</span>
                        </div>
                        <CountdownTimer lastClaimed={player.lastRewardClaimed} />
                    </div>
                 ) : (
                    <button
                        onClick={onClaim}
                        className={`w-full h-14 bg-gradient-to-r from-${theme}-400 via-${theme}-500 to-blue-500 hover:from-${theme}-300 hover:to-blue-400 text-white font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_0_25px_rgba(var(--bg-primary),0.5)] hover:shadow-[0_0_40px_rgba(var(--bg-primary),0.7)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20`}
                    >
                        <span>Claim Supply Drop</span>
                        <span className="text-xl animate-bounce">🚀</span>
                    </button>
                 )}
                 
                 <button 
                    onClick={onBack} 
                    className="w-full py-3 text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                 >
                    Close Communications
                 </button>
            </div>
        </div>
     </div>
  );
}

export default DailyRewardView;
