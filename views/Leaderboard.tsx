
import React from 'react';
import { Player, Theme, LeaderboardViewProps } from '../types';

const PlayerRow: React.FC<{ player: Player; rank: number; theme: string; isMe?: boolean }> = ({ player, rank, theme, isMe }) => {
    const isTop3 = rank <= 3;
    
    let rankStyles = "text-slate-500 font-mono";
    let containerStyles = "bg-slate-900/40 border-white/5 hover:bg-slate-800/60";
    let glowEffect = "";

    if (rank === 1) {
        rankStyles = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]";
        containerStyles = "bg-gradient-to-r from-yellow-900/20 to-slate-900/60 border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.1)] scale-[1.02] z-10";
        glowEffect = "absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-r-full shadow-[0_0_10px_orange]";
    } else if (rank === 2) {
        rankStyles = "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]";
        containerStyles = "bg-gradient-to-r from-slate-800/40 to-slate-900/60 border-slate-400/30";
        glowEffect = "absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-400 rounded-r-full shadow-[0_0_10px_white]";
    } else if (rank === 3) {
        rankStyles = "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]";
        containerStyles = "bg-gradient-to-r from-orange-900/20 to-slate-900/60 border-orange-500/30";
        glowEffect = "absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r-full shadow-[0_0_10px_orange]";
    }
    
    if (isMe) {
        containerStyles = `bg-${theme}-900/30 border-${theme}-500/50 shadow-[0_0_15px_rgba(var(--bg-primary),0.2)] sticky bottom-24 z-20 backdrop-blur-xl`;
    }

    return (
        <div className={`relative p-4 rounded-2xl flex items-center justify-between transition-all border ${containerStyles}`}>
            {isTop3 && <div className={glowEffect}></div>}
            
            <div className="flex items-center gap-4">
                <span className={`w-8 font-black text-lg text-center ${rankStyles}`}>
                    #{rank}
                </span>
                
                <div className="relative">
                    <img 
                        src={player.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`} 
                        className={`w-11 h-11 rounded-xl bg-slate-800 shadow-md ${rank === 1 ? 'border-2 border-yellow-500' : 'border border-slate-700'}`}
                        alt=""
                    />
                    {rank === 1 && <div className="absolute -top-2 -right-2 text-base animate-bounce">👑</div>}
                    {isMe && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black"></div>}
                </div>
                
                <div className="flex flex-col gap-0.5">
                    <span className={`font-bold text-sm ${rank === 1 || isMe ? 'text-white' : 'text-slate-200'}`}>
                        {player.username || 'Unknown Commander'} {isMe && '(You)'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${rank === 1 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-800 text-slate-500'}`}>
                            Lvl {player.level}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                    <span className={`text-${theme}-400 text-xs`}>🪐</span>
                    <span className={`font-bold text-sm font-mono ${rank === 1 || isMe ? 'text-white' : 'text-slate-300'}`}>
                        {Number(player.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </div>
                {player.stars > 0 && (
                    <span className="text-[9px] text-yellow-500 font-bold flex items-center gap-1">
                        {player.stars} ⭐
                    </span>
                )}
            </div>
        </div>
    );
};

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ player, theme, referralReward, leaderboardData = [], userRank }) => {
  
  const handleInvite = () => {
    const botUsername = 'AlienLords_bot'; 
    const referralLink = `https://t.me/${botUsername}/app?startapp=${player.telegramId}`;
    const text = 'Join my fleet commander! 🚀';
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(fullUrl);
    } else {
        window.open(fullUrl, '_blank');
    }
  };

  const earnedStars = player.referralCount * referralReward;
  
  // Logic: Show top 10. If user is NOT in top 10, show user at the bottom.
  const top10 = leaderboardData.slice(0, 10);
  const userInTop10 = top10.some(p => p.telegramId === player.telegramId);

  return (
    <div className="pt-6 px-4 pb-32 flex flex-col gap-8">
      
      {/* Referral Section - "Alliance Mainframe" */}
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-${theme}-900/40 to-black border border-${theme}-500/20 shadow-2xl group transition-all`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${theme}-500/10 blur-[80px] rounded-full group-hover:bg-${theme}-500/20 transition-colors duration-700`}></div>
        
        <div className="p-7 relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-5 border-b border-white/5 pb-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-yellow-400/30 ring-4 ring-black/50`}>
                    💎
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-md">Alliance Mainframe</h2>
                    <p className={`text-xs text-${theme}-200/60 font-medium tracking-wide`}>Expand your fleet. Dominate the void.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 backdrop-blur-sm relative overflow-hidden group/stat">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                    <span className="text-3xl font-black text-white drop-shadow-sm">{player.referralCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Recruits</span>
                </div>
                <div className="bg-slate-900/60 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 backdrop-blur-sm relative overflow-hidden group/stat">
                     <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                    <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">+{earnedStars}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Stars Earned</span>
                </div>
            </div>
            
            <div className={`bg-${theme}-500/10 rounded-xl p-3 text-center border border-${theme}-500/20 flex items-center justify-center gap-2`}>
                <span className="text-lg">🎁</span>
                <p className={`text-xs font-bold text-${theme}-300`}>
                    Reward: <span className="text-yellow-400 border-b border-yellow-500/50 pb-0.5">{referralReward} ⭐</span> per recruit
                </p>
            </div>

            <button 
                onClick={handleInvite}
                className="w-full h-14 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-yellow-400/20 overflow-hidden relative group/btn"
            >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 blur-md"></div>
                <span>Broadcast Signal</span>
                <span className="text-xl animate-bounce">🚀</span>
            </button>
            
            {player.invitedBy && (
                <div className="text-center">
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Recruited by <span className={`text-${theme}-400 ml-1 border-b border-${theme}-500/30`}>{player.invitedBy}</span>
                    </p>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <span>🏆</span> Top Commanders
        </h3>
        
        {top10.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-xs font-mono border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 backdrop-blur-sm flex flex-col items-center gap-2">
                <span className="text-3xl opacity-20 grayscale">📶</span>
                <span>NO DATA UPLINK</span>
            </div>
        ) : (
            <div className="flex flex-col gap-3">
                {top10.map((leader, index) => (
                    <PlayerRow 
                        key={leader.telegramId || index} 
                        player={leader} 
                        rank={index + 1} 
                        theme={theme} 
                        isMe={leader.telegramId === player.telegramId}
                    />
                ))}

                {!userInTop10 && (
                    <>
                        <div className="text-center py-2 text-slate-600 text-2xl tracking-widest opacity-50 font-black animate-pulse">
                            • • •
                        </div>
                        <PlayerRow 
                            player={player} 
                            rank={userRank || 999} 
                            theme={theme} 
                            isMe={true} 
                        />
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
