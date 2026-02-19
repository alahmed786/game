
import React from 'react';
import { Player, Theme, LeaderboardViewProps } from '../types';

const DUMMY_LEADERS: Partial<Player>[] = [
    { telegramId: 'bot1', username: 'AstroGeneral_X', balance: 25000000, level: 52, stars: 1500, photoUrl: '' },
    { telegramId: 'bot2', username: 'CryptoValkyrie', balance: 18500000, level: 48, stars: 920, photoUrl: '' },
    { telegramId: 'bot3', username: 'QuantumDrifter', balance: 12800000, level: 41, stars: 610, photoUrl: '' },
    { telegramId: 'bot4', username: 'StarLord_007', balance: 9500000, level: 38, stars: 450, photoUrl: '' },
    { telegramId: 'bot5', username: 'NebulaSniper', balance: 7200000, level: 35, stars: 300, photoUrl: '' },
    { telegramId: 'bot6', username: 'VoidWalker', balance: 6000000, level: 30, stars: 280, photoUrl: '' },
    { telegramId: 'bot7', username: 'GalacticWhale', balance: 5500000, level: 28, stars: 250, photoUrl: '' },
    { telegramId: 'bot8', username: 'MoonBaseAlpha', balance: 4200000, level: 25, stars: 220, photoUrl: '' },
    { telegramId: 'bot9', username: 'MarsRover', balance: 3000000, level: 20, stars: 180, photoUrl: '' },
];

const PlayerRow: React.FC<{ player: Partial<Player>; rank: number; theme: string; isMe?: boolean }> = ({ player, rank, theme, isMe }) => {
    let containerStyles = "bg-white/40 dark:bg-slate-900/30 border-white/30 dark:border-white/5";
    let rankBadge = <span className="text-slate-500 font-mono font-bold w-6 text-center">#{rank}</span>;
    let nameColor = isMe ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300";
    let balanceColor = isMe ? `text-${theme}-600 dark:text-${theme}-400` : "text-slate-500 dark:text-slate-400";

    if (rank === 1) {
        containerStyles = "bg-gradient-to-r from-yellow-200/40 via-white/60 to-white/40 dark:from-yellow-900/40 dark:via-slate-900/60 dark:to-slate-900/40 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]";
        rankBadge = <span className="text-2xl">🥇</span>;
        nameColor = "text-yellow-700 dark:text-yellow-100 font-black tracking-wide";
        balanceColor = "text-yellow-600 dark:text-yellow-400";
    } else if (rank === 2) {
        containerStyles = "bg-gradient-to-r from-slate-200/40 via-white/60 to-white/40 dark:from-slate-700/40 dark:via-slate-900/60 dark:to-slate-900/40 border-slate-400/40 shadow-[0_0_15px_rgba(148,163,184,0.1)]";
        rankBadge = <span className="text-2xl">🥈</span>;
        nameColor = "text-slate-700 dark:text-slate-100 font-bold";
        balanceColor = "text-slate-500 dark:text-slate-300";
    } else if (rank === 3) {
        containerStyles = "bg-gradient-to-r from-orange-200/40 via-white/60 to-white/40 dark:from-orange-900/40 dark:via-slate-900/60 dark:to-slate-900/40 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
        rankBadge = <span className="text-2xl">🥉</span>;
        nameColor = "text-orange-700 dark:text-orange-100 font-bold";
        balanceColor = "text-orange-600 dark:text-orange-400";
    }
    
    if (isMe) {
        containerStyles = `bg-${theme}-100/40 dark:bg-${theme}-900/40 border-${theme}-400 dark:border-${theme}-500 ring-1 ring-${theme}-400/30 dark:ring-${theme}-500/50 shadow-[0_0_30px_rgba(var(--bg-primary),0.2)] mt-2 transform scale-[1.02]`;
        nameColor = `text-${theme}-800 dark:text-${theme}-100 font-black tracking-wide`;
        balanceColor = `text-${theme}-700 dark:text-${theme}-300`;
    }

    return (
        <div className={`relative p-3 rounded-2xl flex items-center justify-between transition-all border group backdrop-blur-xl shadow-sm ${containerStyles}`}>
            {/* Hover Glow */}
            <div className={`absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none`}></div>

            <div className="flex items-center gap-4 z-10">
                <div className="w-8 flex justify-center shrink-0">
                    {rankBadge}
                </div>
                
                <div className="relative shrink-0">
                    <img 
                        src={player.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`} 
                        className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-950 shadow-lg object-cover ${rank === 1 ? 'border-2 border-yellow-500' : 'border border-white/20 dark:border-white/10'}`}
                        alt=""
                    />
                    {isMe && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>}
                </div>
                
                <div className="flex flex-col gap-0.5">
                    <span className={`text-sm truncate max-w-[120px] ${nameColor}`}>
                        {player.username || 'Unknown'} {isMe && '(You)'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/30 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-slate-500`}>
                            Lvl {player.level}
                        </span>
                        {(player.stars || 0) > 0 && (
                            <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-0.5">
                                <span>⭐</span> {player.stars}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-0.5 z-10">
                <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-bold text-sm ${balanceColor}`}>
                        {Number(player.balance).toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-60 text-slate-500 dark:text-slate-400">Dust</span>
                </div>
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
  const activeLeaderboard = (leaderboardData && leaderboardData.length > 0) ? leaderboardData : DUMMY_LEADERS;

  const displayLimit = 50;
  const topPlayers = activeLeaderboard.slice(0, displayLimit);
  const userInTop = topPlayers.some(p => p.telegramId === player.telegramId);

  return (
    <div className="pt-6 px-4 pb-32 flex flex-col gap-8">
      
      {/* Referral Section - "Alliance Mainframe" */}
      <div className={`relative overflow-hidden rounded-[2rem] bg-white/60 dark:bg-slate-900 border border-white/40 dark:border-${theme}-500/30 shadow-2xl group transition-all backdrop-blur-xl`}>
        {/* Holographic BG */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${theme}-100/40 via-transparent to-slate-100/50 dark:from-${theme}-900/40 dark:via-transparent dark:to-black`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        
        <div className="p-6 relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${theme}-500 to-${theme}-700 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(var(--bg-primary),0.4)] border border-white/20 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                    💎
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest drop-shadow-sm">Alliance Uplink</h2>
                    <p className={`text-xs text-${theme}-600 dark:text-${theme}-200/70 font-medium tracking-wider`}>Recruit commanders. Earn Stars.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/40 dark:bg-black/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/30 dark:border-white/5 backdrop-blur-md">
                    <span className="text-3xl font-black text-slate-900 dark:text-white drop-shadow-sm">{player.referralCount}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Recruits</span>
                </div>
                <div className="bg-white/40 dark:bg-black/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/30 dark:border-white/5 backdrop-blur-md">
                    <span className="text-3xl font-black text-yellow-500 dark:text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">+{earnedStars}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Stars Earned</span>
                </div>
            </div>
            
            <button 
                onClick={handleInvite}
                className={`w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-transparent hover:border-${theme}-400 relative overflow-hidden group/btn`}
            >
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shine`}></div>
                <span>Broadcast Signal</span>
                <span className="text-xl">📡</span>
            </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <span>🏆</span> Top Commanders
            </h3>
            <span className="text-[9px] font-mono text-slate-600 border border-slate-300 dark:border-slate-800 px-2 py-1 rounded bg-white/30 dark:bg-black/20">Global Rank: #{userRank}</span>
        </div>
        
        <div className="flex flex-col gap-2 relative">
            {topPlayers.map((leader, index) => (
                <PlayerRow 
                    key={leader.telegramId || index} 
                    player={leader} 
                    rank={index + 1} 
                    theme={theme} 
                    isMe={leader.telegramId === player.telegramId}
                />
            ))}

            {!userInTop && (
                <PlayerRow 
                    player={player} 
                    rank={userRank || 999} 
                    theme={theme} 
                    isMe={true} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
