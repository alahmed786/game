
import React, { useEffect, useState } from 'react';
import { EarnViewProps } from '../types';
import { BOOSTERS, BOOSTER_CLAIM_COOLDOWN } from '../constants';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AdClaimModal: React.FC<{ reward: number; onClaim: () => void; onCancel: () => void; theme: string; onShowAd: EarnViewProps['onShowAd'] }> = ({ reward, onClaim, onCancel, theme, onShowAd }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = () => {
    setIsWatching(true);
    setError(null);
    onShowAd(
      () => {
        setIsWatching(false);
        onClaim();
      },
      (msg) => {
        setIsWatching(false);
        setError(msg);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
        <span className="text-5xl">✨</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Claim Your Stardust!</h2>
        <p className="text-slate-600 dark:text-slate-300">You've gathered <span className={`font-bold text-${theme}-600 dark:text-${theme}-400`}>{reward.toFixed(2)}</span> stardust. Watch a quick ad to add it to your empire.</p>
        
        {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase">{error}</p>}
        
        <div className="flex flex-col gap-3 w-full mt-2">
          <button onClick={handleClaim} disabled={isWatching} className={`w-full bg-gradient-to-r from-${theme}-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-${theme}-500/20 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2`}>
            {isWatching ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>LOADING AD...</span></>) : ('Watch Ad & Claim')}
          </button>
          <button onClick={onCancel} disabled={isWatching} className="w-full text-slate-500 dark:text-slate-400 text-sm font-semibold py-2 rounded-xl active:scale-95 transition-all">Discard</button>
        </div>
      </div>
    </div>
  );
};

const AdBoosterModal: React.FC<{ onConfirm: () => void; onCancel: () => void; theme: string; onShowAd: EarnViewProps['onShowAd'] }> = ({ onConfirm, onCancel, theme, onShowAd }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setIsWatching(true);
    setError(null);
    onShowAd(
      () => {
        setIsWatching(false);
        onConfirm();
      },
      (msg) => {
        setIsWatching(false);
        setError(msg);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
        <span className="text-5xl">🚀</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Instant Energy Refill!</h2>
        <p className="text-slate-600 dark:text-slate-300">Watch a short ad to instantly refill your energy and get back to earning.</p>
        
        {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase">{error}</p>}

        <div className="flex flex-col gap-3 w-full mt-2">
          <button onClick={handleConfirm} disabled={isWatching} className={`w-full bg-gradient-to-r from-${theme}-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-${theme}-500/20 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2`}>
            {isWatching ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>LOADING AD...</span></>) : ('Watch Ad for Refill')}
          </button>
          <button onClick={onCancel} disabled={isWatching} className="w-full text-slate-500 dark:text-slate-400 text-sm font-semibold py-2 rounded-xl active:scale-95 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const EarnView: React.FC<EarnViewProps> = ({ player, onHoldStart, onHoldEnd, floatingTexts, onDailyRewardClick, onCipherClick, isRewardAvailable, onActivateBooster, pendingHoldReward, isClaimModalVisible, onClaimHoldReward, onCancelHoldReward, currentHoldAmount, isRewardUrgent, isCipherClaimed, theme, onShowAd }) => {
  const [boosterCooldownTime, setBoosterCooldownTime] = useState(0);
  const [isActivelyHolding, setIsActivelyHolding] = useState(false);
  const [isAdModalVisible, setIsAdModalVisible] = useState(false);

  const isActuallyHolding = isActivelyHolding && player.currentEnergy > 0;

  useEffect(() => {
    const updateCooldown = () => {
      if (player.lastBoosterClaimed) {
        const timePassed = Date.now() - player.lastBoosterClaimed;
        const remaining = BOOSTER_CLAIM_COOLDOWN - timePassed;
        setBoosterCooldownTime(remaining > 0 ? remaining : 0);
      } else {
        setBoosterCooldownTime(0);
      }
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [player.lastBoosterClaimed]);


  const handlePointerDown = () => { setIsActivelyHolding(true); onHoldStart(); };
  const handlePointerUp = () => { setIsActivelyHolding(false); onHoldEnd(); };
  
  const booster = BOOSTERS[0];
  const isBoosterReady = boosterCooldownTime <= 0;
  
  const getDailyRewardClasses = () => {
    const base = 'relative flex items-center justify-center p-3 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md border transition-transform active:scale-95 shadow-lg overflow-hidden w-full';
    if (isRewardUrgent) return `${base} animate-border-glow-red`;
    if (isRewardAvailable) return `${base} animate-border-glow-${theme}`;
    return `${base} border-white/20 dark:border-slate-800`;
  };
  
  const getDailyCipherClasses = () => {
    const base = 'relative flex items-center justify-center p-3 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md border transition-transform active:scale-95 shadow-lg overflow-hidden w-full';
    if (!isCipherClaimed) return `${base} animate-border-glow-purple`;
    return `${base} border-white/20 dark:border-slate-800`;
  };

  const handleBoosterClick = () => {
    if (isBoosterReady) {
      setIsAdModalVisible(true);
    }
  };

  const handleConfirmAd = () => {
    onActivateBooster();
    setIsAdModalVisible(false);
  };

  const getEnergyColor = () => {
    const percentage = (player.currentEnergy / player.maxEnergy) * 100;
    if (percentage < 20) return 'text-red-500';
    if (percentage < 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-slate-900 dark:text-white';
  };
  
  const getBoosterButtonClasses = () => {
    const base = 'flex items-center justify-center w-28 h-12 rounded-xl border-2 transition-all active:scale-95 backdrop-blur-sm';
    if (isBoosterReady) {
      return `${base} bg-${theme}-500/10 dark:bg-${theme}-500/20 border-${theme}-400 shadow-[0_0_15px_rgba(var(--bg-primary),0.5)]`;
    }
    return `${base} bg-slate-200/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 opacity-60 grayscale`;
  };

  const getOrbBg = () => {
      switch(theme) {
          case 'purple': return 'from-purple-400/10 via-pink-600/10 to-indigo-900/20';
          case 'orange': return 'from-orange-400/10 via-red-600/10 to-amber-900/20';
          case 'rose': return 'from-rose-400/10 via-red-600/10 to-pink-900/20';
          case 'emerald': return 'from-emerald-400/10 via-green-600/10 to-teal-900/20';
          default: return 'from-cyan-400/10 via-blue-600/10 to-indigo-900/20';
      }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full pt-4 pb-2">
      {isClaimModalVisible && pendingHoldReward !== null && ( <AdClaimModal reward={pendingHoldReward} onClaim={onClaimHoldReward} onCancel={onCancelHoldReward} theme={theme} onShowAd={onShowAd} /> )}
      {isAdModalVisible && ( <AdBoosterModal onConfirm={handleConfirmAd} onCancel={() => setIsAdModalVisible(false)} theme={theme} onShowAd={onShowAd} /> )}

      {/* Top Menu: Reward & Cipher */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 px-4 z-20">
          <button onClick={onDailyRewardClick} className={getDailyRewardClasses()}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗓️</span>
              <div className="flex flex-col items-start">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-tight">Daily Reward</span>
                  {isRewardAvailable ? (
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Available</span>
                  ) : (
                    <span className="text-sm font-bold uppercase tracking-wider text-green-500 dark:text-green-400">Claimed</span>
                  )}
              </div>
            </div>
          </button>
          <button onClick={onCipherClick} className={getDailyCipherClasses()}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-tight">Daily Cipher</span>
                    {isCipherClaimed ? (
                      <span className="text-sm font-bold uppercase tracking-wider text-green-500 dark:text-green-400">Cracked</span>
                    ) : (
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Available</span>
                    )}
                </div>
            </div>
          </button>
      </div>

      {/* Center: The Orb */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 py-4 relative">
          <div className="relative flex items-center justify-center" style={{ width: 'min(70vmin, 320px)', height: 'min(70vmin, 320px)' }}>
            
            <div className="absolute inset-0 pointer-events-none">
              {floatingTexts.map(text => {
                const randX = Math.random() * 100 - 50;
                return ( <div key={text.id} className={`absolute top-1/2 left-1/2 font-bold text-3xl text-${theme}-600 dark:text-${theme}-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] dark:drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] fountain-text`} style={{ '--start-x': '0px', '--end-x': `${randX}px` } as React.CSSProperties}>+{text.value.toFixed(2)}</div> );
              })}
            </div>
            
            <div className={`absolute w-[110%] h-[110%] rounded-full border-2 border-dashed border-${theme}-500/30 dark:border-${theme}-400/50 transition-all duration-300 ${isActuallyHolding ? 'animate-spin-slow opacity-100' : 'opacity-0'}`} />
            <div className={`absolute w-[120%] h-[120%] rounded-full border border-${theme}-500/20 dark:border-${theme}-400/30 transition-all duration-300 ${isActuallyHolding ? 'animate-spin-medium opacity-100' : 'opacity-0'}`} />
            
            <button onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onContextMenu={(e) => e.preventDefault()} disabled={player.currentEnergy < 1} className={`relative z-10 w-full h-full rounded-full select-none touch-none group flex items-center justify-center bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/20 shadow-xl ${player.currentEnergy < 1 ? 'grayscale brightness-50' : ''}`}>

              {/* Inner Ball */}
              <div className={`relative w-[85%] h-[85%] rounded-full transition-all duration-100 orb-glow ${isActuallyHolding ? 'holding-pulse' : ''}`}>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getOrbBg()}`} />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/10 dark:via-white/5" />
                  <div className={`absolute inset-[12%] rounded-full bg-gradient-radial from-sky-300/80 to-blue-600/80 dark:from-sky-400/90 dark:to-blue-800/80 shadow-inner shadow-black/20 dark:shadow-black/50 transition-transform duration-100 group-active:scale-95`}>
                      <div className={`w-full h-full rounded-full bg-gradient-to-br from-${theme}-300/80 via-${theme}-500/80 to-indigo-700/80 dark:from-${theme}-400/80 dark:via-${theme}-600/80 dark:to-indigo-900/80 animate-[pulse_3s_ease-in-out_infinite]`} />
                  </div>
              </div>
              
              {isActuallyHolding && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const angle = Math.random() * 360;
                    const radius = 60 + Math.random() * 40;
                    const style = {
                      '--start-x': `${Math.cos(angle * Math.PI / 180) * radius}px`,
                      '--start-y': `${Math.sin(angle * Math.PI / 180) * radius}px`,
                      animationDelay: `${Math.random() * 1}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    };
                    return <div key={i} className={`dust-mote bg-${theme}-500 dark:bg-${theme}-400 shadow-[0_0_8px_var(--bg-primary)]`} style={style as React.CSSProperties} />;
                  })}
                </div>
              )}

              <div className="absolute flex flex-col items-center pointer-events-none text-center">
                {isActuallyHolding ? (
                  <>
                    <p className="text-white text-3xl font-bold drop-shadow-lg">+{currentHoldAmount.toFixed(2)}</p>
                    <p className={`text-${theme}-100/90 text-[10px] font-bold uppercase tracking-widest`}>Stardust</p>
                  </>
                ) : (
                  <p className={`text-${theme}-100/90 text-xs font-bold uppercase tracking-widest`}>Press & Hold</p>
                )}
              </div>
            </button>
          </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="w-full flex items-center justify-between px-8 pb-4 z-[60]">
          <div className="flex items-center gap-2">
              <span className="text-3xl text-yellow-400 dark:text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]">⚡️</span>
              <div className="flex items-baseline gap-1.5">
                  <span className={`font-bold text-xl transition-colors duration-300 ${getEnergyColor()}`}>{Math.floor(player.currentEnergy)}</span>
                  <span className="text-slate-500 dark:text-slate-500 text-sm font-semibold">/ {player.maxEnergy}</span>
              </div>
          </div>

          <button onClick={handleBoosterClick} disabled={!isBoosterReady} className={`${getBoosterButtonClasses()}`}>
            <span className="text-2xl mr-2">{booster.icon}</span>
            {isBoosterReady ? (
              <span className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white">Boost</span>
            ) : (
              <span className="text-xs font-bold font-mono text-slate-400">{formatTime(boosterCooldownTime)}</span>
            )}
          </button>
      </div>

      <style>{`
        .bg-gradient-radial { background-image: radial-gradient(var(--tw-gradient-stops)); }
        
        @keyframes collect-dust {
          from { opacity: 1; transform: translate(var(--start-x), var(--start-y)) scale(1); }
          to { opacity: 0; transform: translate(0, 0) scale(0); }
        }

        .dust-mote {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          animation: collect-dust ease-in infinite;
        }
      `}</style>
    </div>
  );
};

export default EarnView;
