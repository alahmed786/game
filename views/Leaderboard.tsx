
import React from 'react';
import { Player, Theme } from '../types';

interface LeaderboardViewProps {
  player: Player;
  theme: Theme;
  referralReward: number;
  leaderboardData?: Player[]; // New prop for real data
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ player, theme, referralReward, leaderboardData = [] }) => {
  
  const handleInvite = () => {
    // Generate Invite Link
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

  // Use real data if available, otherwise show empty state (better than static mock data for production feel)
  const leaders = leaderboardData.length > 0 ? leaderboardData : [];

  return (
    <div className="pt-4 flex flex-col gap-6">
      
      {/* Referral Section */}
      <div className={`mx-4 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-${theme}-950 via-slate-900 to-black border border-${theme}-500/30 shadow-2xl group`}>
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-9xl grayscale">🤝</span>
        </div>
        <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-${theme}-500/10 to-transparent`}></div>
        
        <div className="p-6 relative z-10 flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-yellow-400/30`}>
                    💎
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Recruitment</h2>
                    <p className={`text-xs text-${theme}-200/70 font-medium`}>Build your alliance. Earn rewards.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-xl p-3 flex flex-col items-center border border-white/5 backdrop-blur-sm">
                    <span className="text-3xl font-black text-white">{player.referralCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Recruits</span>
                </div>
                <div className="bg-black/40 rounded-xl p-3 flex flex-col items-center border border-white/5 backdrop-blur-sm">
                    <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">+{earnedStars}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Stars Earned</span>
                </div>
            </div>
            
            <div className={`bg-${theme}-500/10 rounded-lg p-3 text-center border border-${theme}-500/20`}>
                <p className={`text-xs font-bold text-${theme}-300`}>
                    <span className="mr-2">🎁</span>
                    Referral Reward: <span className="text-yellow-400">{referralReward} ⭐</span> per user
                </p>
            </div>

            <button 
                onClick={handleInvite}
                className="w-full h-12 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-400/20"
            >
                <span>Invite Friends</span>
                <span className="text-lg animate-bounce">🚀</span>
            </button>
            
            {player.invitedBy && (
                <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-mono">
                        RECRUITED BY <span className={`text-${theme}-400 font-bold ml-1`}>{player.invitedBy}</span>
                    </p>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-3 mx-4 pb-24">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Top Commanders</h3>
        {leaders.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
                NO DATA UPLINK
            </div>
        ) : (
            leaders.map((leader, index) => (
            <div 
                key={leader.telegramId || index}
                className="bg-slate-900/80 border border-white/5 p-4 rounded-2xl flex items-center justify-between backdrop-blur-sm"
            >
                <div className="flex items-center gap-4">
                <span className={`w-6 font-black text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-400' : 'text-slate-600'}`}>
                    #{index + 1}
                </span>
                <img 
                    src={leader.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${leader.username}`} 
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-inner"
                    alt=""
                />
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">{leader.username || 'Unknown'}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Level {leader.level}</span>
                </div>
                </div>
                <div className="flex items-center gap-1.5">
                <span className={`text-${theme}-400 text-xs font-black`}>🪐</span>
                <span className="font-bold text-sm text-white font-mono">{Number(leader.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
