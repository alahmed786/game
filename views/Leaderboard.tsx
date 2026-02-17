import React from 'react';
import { Player, Theme, LeaderboardViewProps } from '../types';

const PlayerRow: React.FC<{ player: Player; rank: number; theme: string; isMe?: boolean }> = ({ player, rank, theme, isMe }) => {
    const isTop3 = rank <= 3;
    
    // Tighter padding (p-3) and margins for mobile
    let rankStyles = "text-slate-500 font-mono text-base";
    let containerStyles = "bg-slate-900/40 border-white/5";
    let glowEffect = "";

    if (rank === 1) {
        rankStyles = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]";
        containerStyles = "bg-gradient-to-r from-yellow-900/20 to-slate-900/60 border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.1)] z-10";
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
        containerStyles = `bg-${theme}-900/80 border-${theme}-500/50 shadow-[0_0_15px_rgba(var(--bg-primary),0.3)] sticky bottom-24 z-20 backdrop-blur-xl`;
    }

    return (
        <div className={`relative p-3 rounded-xl flex items-center justify-between transition-all border ${containerStyles} mb-2 last:mb-0`}>
            {isTop3 && <div className={glowEffect}></div>}
            
            <div className="flex items-center gap-3">
                <span className={`w-6 font-black text-center ${rankStyles}`}>
                    #{rank}
                </span>
                
                <div className="relative">
                    <img 
                        src={player.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`} 
                        className={`w-10 h-10 rounded-lg bg-slate-800 shadow-md ${rank === 1 ? 'border-2 border-yellow-500' : 'border border-slate-700'}`}
                        alt=""
                    />
                    {rank === 1 && <div className="absolute -top-1.5 -right-1.5 text-xs animate-bounce">👑</div>}
                    {isMe && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>}
                </div>
                
                <div className="flex flex-col">
                    <span className={`font-bold text-sm leading-tight ${rank === 1 || isMe ? 'text-white' : 'text-slate-200'}`}>
                        {player.username ? (player.username.length > 12 ? player.username.substring(0, 10) + '..' : player.username) : 'Unknown'} {isMe && '(You)'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${rank === 1 ? 'text-yellow-300' : 'text-slate-500'}`}>
                        Lvl {player.level}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                    <span className={`text-${theme}-400 text-[10px]`}>🪐</span>
                    <span className={`font-bold text-sm font-mono ${rank === 1 || isMe ? 'text-white' : 'text-slate-300'}`}>
                        {Number(player.balance).toLocaleString(undefined, { maximumFractionDigits: 0, notation: "compact" })}
                    </span>
                </div>
                {player.stars > 0 && (
                    <span className="text-[9px] text-yellow-500 font-bold flex items-center gap-0.5">
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
  
  const top9 = leaderboardData.slice(0, 9);
  const userInTop9 = top9.some(p => p.telegramId === player.telegramId);
  const displayList = top9;

  return (
    // ✅ REDUCED MARGIN: px-2 instead of px-4. Reduced Top Padding: pt-4.
    <div className="pt-4 px-2 pb-28 flex flex-col gap-5 w-full max-w-md mx-auto">
      
      {/* Compact Referral Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-${theme}-900/40 to-black border border-${theme}-500/20 shadow-lg`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        
        {/* Reduced padding inside the card (p-5 instead of p-7) */}
        <div className="p-5 relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg border border-yellow-400/30`}>
                    💎
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Alliance Mainframe</h2>
                    <p className={`text-[10px] text-${theme}-200/60 font-medium`}>Expand your fleet. Dominate the void.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-2xl font-black text-white">{player.referralCount}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Recruits</span>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-2xl font-black text-yellow-400">+{earnedStars}</span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Stars Earned</span>
                </div>
            </div>

            <button 
                onClick={handleInvite}
                className="w-full h-11 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
                <span>Broadcast Signal</span>
                <span className="text-lg">🚀</span>
            </button>
            
            <div className="text-center">
                <p className={`text-[10px] text-${theme}-300 font-bold`}>
                    Reward: <span className="text-yellow-400">{referralReward} ⭐</span> per recruit
                </p>
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <span>🏆</span> Top Commanders
        </h3>
        
        {leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs font-mono border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <span>NO DATA UPLINK</span>
            </div>
        ) : (
            <div className="flex flex-col w-full">
                {displayList.map((leader, index) => (
                    <PlayerRow 
                        key={leader.telegramId || index} 
                        player={leader} 
                        rank={index + 1} 
                        theme={theme} 
                        isMe={leader.telegramId === player.telegramId}
                    />
                ))}

                {!userInTop9 && (
                    <>
                        <div className="text-center py-1 text-slate-600 text-xl tracking-widest opacity-50 font-black">
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
