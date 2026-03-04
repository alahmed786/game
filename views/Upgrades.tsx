import React, { useState, useEffect } from 'react';
import { Upgrade, Player, StellarDeal, UpgradesViewProps } from '../types';

const formatTime = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AdDealModal: React.FC<{ deal: StellarDeal; onConfirm: () => void; onCancel: () => void; theme: string; onShowAd: UpgradesViewProps['onShowAd'] }> = ({ deal, onConfirm, onCancel, theme, onShowAd }) => {
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
      <div className="w-full max-w-sm bg-white/60 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
        <span className="text-6xl drop-shadow-lg">{deal.icon}</span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">{deal.title}</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">{deal.description}</p>
        
        {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>}

        <div className="flex flex-col gap-3 w-full mt-4">
          <button onClick={handleConfirm} disabled={isWatching} className={`w-full bg-gradient-to-r from-${theme}-500 to-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-${theme}-500/30 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-3`}>
            {isWatching ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>ESTABLISHING LINK...</span></>) : ('Watch & Claim')}
          </button>
          <button onClick={onCancel} disabled={isWatching} className="w-full text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-widest py-3 rounded-xl active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-slate-800">Abort</button>
        </div>
      </div>
    </div>
  );
};

const StellarDealCard: React.FC<{ deal: StellarDeal, player: Player, onBuy: (deal: StellarDeal) => void, theme: string }> = ({ deal, player, onBuy, theme }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const activeBoost = player.activeBoosts.find(b => b.sourceId === deal.id);
  const onCooldown = deal.cooldown && player.lastDealPurchases[deal.id] && (Date.now() - player.lastDealPurchases[deal.id] < deal.cooldown);

  useEffect(() => {
    const updateTimer = () => {
      let remaining = 0;
      if (activeBoost) remaining = activeBoost.expiresAt - Date.now();
      else if (onCooldown) remaining = (player.lastDealPurchases[deal.id] + deal.cooldown!) - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [player.activeBoosts, player.lastDealPurchases, deal.id, deal.cooldown, activeBoost, onCooldown]);

  const isUnlocked = !deal.unlockLevel || player.level >= deal.unlockLevel;
  const isForbiddenTech = deal.id === 'ad_free_upgrade';
  const hasEnoughCurrency = deal.costType === 'stars' ? player.stars >= deal.cost : deal.costType === 'stardust' ? player.balance >= deal.cost : true; 
  const canBuy = isUnlocked && hasEnoughCurrency && !onCooldown && !activeBoost;
  const costIcon = deal.costType === 'stars' ? '⭐' : deal.costType === 'stardust' ? '🪐' : '🎟️';

  const getButtonContent = () => {
    if (activeBoost) return <><span className="text-emerald-500 font-black">ACTIVE:</span><span className="font-mono text-slate-900 dark:text-white">{formatTime(timeLeft)}</span></>;
    if (onCooldown) return <span className="font-mono text-slate-900 dark:text-white tracking-widest">{formatTime(timeLeft)}</span>;
    if (!isUnlocked) return <span className="text-red-500 dark:text-red-400 font-black">LVL {deal.unlockLevel} REQ.</span>;
    return <><span>{costIcon}</span><span className={deal.costType === 'ad' ? 'text-slate-900 dark:text-white font-black' : 'font-black'}>{deal.costType === 'ad' ? 'TRANSMIT SIGNAL' : deal.cost.toLocaleString()}</span></>;
  };

  const forbiddenTechStyles = isForbiddenTech 
    ? "bg-gradient-to-br from-yellow-200/40 via-purple-200/40 to-white/60 dark:from-yellow-900/40 dark:via-purple-900/40 dark:to-slate-900/60 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
    : `bg-white/60 dark:bg-slate-900/60 border-${activeBoost ? 'emerald-500' : 'yellow-500/30'}`;

  return (
    <div className={`relative w-full backdrop-blur-xl border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg
      ${!canBuy && isUnlocked ? 'opacity-60' : ''} 
      ${!isUnlocked ? 'opacity-60 grayscale' : ''}
      ${activeBoost ? 'animate-border-glow-green border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''}
      ${forbiddenTechStyles}
    `}>
      {isForbiddenTech && (
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg uppercase tracking-widest z-10 animate-bounce">
              Legendary
          </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-inner ${isForbiddenTech ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white' : 'bg-white/80 dark:bg-slate-800 border-white/20 dark:border-slate-700'}`}>
              {deal.icon}
          </div>
          <div>
            <h3 className={`font-black text-lg ${isForbiddenTech ? 'text-slate-900 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>{deal.title}</h3>
            <p className={`text-xs font-medium leading-tight mt-0.5 ${isForbiddenTech ? 'text-slate-700 dark:text-yellow-100/70' : 'text-slate-500 dark:text-slate-400'}`}>{deal.description}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => onBuy(deal)}
        disabled={!canBuy}
        className={`w-full py-3 rounded-xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed
            ${canBuy && deal.costType === 'ad' ? `bg-gradient-to-r from-${theme}-500 to-${theme}-600 text-white shadow-lg shadow-${theme}-500/30` : canBuy ? 'bg-white dark:bg-slate-100 text-slate-950 font-black shadow-lg border border-slate-200 dark:border-transparent hover:scale-[1.02]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 font-bold'}
            ${isForbiddenTech && canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : ''}
        `}
        style={onCooldown ? { background: 'repeating-linear-gradient(-45deg, rgba(203,213,225,0.2), rgba(203,213,225,0.2) 10px, rgba(226,232,240,0.2) 10px, rgba(226,232,240,0.2) 20px)' } : {}}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

// --- UX IMPROVED UPGRADE CARD ---
const UpgradeCard: React.FC<{ upgrade: Upgrade, player: Player, theme: string, onBuy: (id: string) => void }> = ({ upgrade, player, theme, onBuy }) => {
  const isUnlocked = !upgrade.unlockLevel || player.level >= upgrade.unlockLevel;
  const isStarCost = upgrade.costType === 'stars';
  const hasEnoughCurrency = isStarCost ? player.stars >= upgrade.cost : player.balance >= upgrade.cost;
  const isMaxed = upgrade.level >= upgrade.maxLevel;
  const canBuy = isUnlocked && hasEnoughCurrency && !isMaxed;
  
  const isPassive = !!upgrade.profitPerHour;
  const currentYield = isPassive ? (upgrade.profitPerHour! * upgrade.level) : 0;
  const nextYield = isPassive && !isMaxed ? (upgrade.profitPerHour! * (upgrade.level + 1)) : currentYield;

  return (
    <div 
      className={`relative backdrop-blur-xl border p-5 rounded-3xl flex flex-col gap-4 transition-all shadow-lg overflow-hidden
        ${isMaxed ? 'bg-gradient-to-br from-amber-500/10 to-emerald-500/10 dark:from-amber-500/5 dark:to-emerald-500/5 border-amber-500/30 dark:border-emerald-500/30' : 'bg-white/70 dark:bg-slate-900/70 border-white/40 dark:border-slate-800'}
        ${!isUnlocked ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Decorative Glow for Maxed */}
      {isMaxed && <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[50px] pointer-events-none"></div>}

      <div className="flex gap-4 items-start relative z-10">
        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-inner border 
            ${isMaxed ? 'bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-slate-800 dark:to-slate-800 border-emerald-400/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <span className={isMaxed ? 'drop-shadow-md scale-110 transition-transform' : ''}>{upgrade.icon}</span>
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-between items-start gap-2">
                <h3 className={`font-black text-base truncate ${isMaxed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {upgrade.name}
                </h3>
                <div className={`px-2 py-0.5 rounded border shrink-0 ${isMaxed ? 'bg-emerald-500 text-white border-emerald-400 shadow-md' : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isMaxed ? 'text-white' : `text-${theme}-600 dark:text-${theme}-500`}`}>
                        {isMaxed ? 'MAX' : `LVL ${upgrade.level}`}
                    </span>
                </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-snug mt-1">{upgrade.description}</p>
            
            {/* Visual Passive Mining Badge */}
            {isPassive && upgrade.level > 0 && (
                <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/10 w-max px-2 py-1 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Mining Offline & Online
                    </span>
                </div>
            )}

            {!isUnlocked && upgrade.unlockLevel && (
                <div className="mt-2 inline-block bg-red-500/10 px-2 py-1 rounded border border-red-500/20 w-max">
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest">Requires Level {upgrade.unlockLevel}</p>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80 relative z-10">
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/50 grow">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Mining Yield</span>
          {isPassive ? (
             <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">+{currentYield.toLocaleString()}/hr</span>
                {!isMaxed && (
                    <>
                        <span className="text-slate-400 text-[10px]">→</span>
                        <span className={`font-black text-${theme}-600 dark:text-${theme}-400`}>+{nextYield.toLocaleString()}/hr</span>
                    </>
                )}
             </div>
          ) : (
             <span className={`text-sm font-black text-purple-600 dark:text-purple-400`}>
                {upgrade.cptBoost ? `+${upgrade.cptBoost} Power per Tap` : 
                 upgrade.holdMultiplierBoost ? `+${(upgrade.holdMultiplierBoost * 100).toFixed(0)}% Hold Earnings` : 'Special Effect Active'}
             </span>
          )}
        </div>
        
        <button
          onClick={() => onBuy(upgrade.id)}
          disabled={!canBuy}
          className={`px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shrink-0 w-full sm:w-auto
            ${isMaxed 
              ? 'bg-emerald-500 text-white opacity-100 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
              : canBuy 
              ? `bg-slate-900 dark:bg-white text-white dark:text-slate-950 active:scale-95 shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100` 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}
          `}
        >
          {isMaxed ? (
             <span className="flex items-center gap-1">✓ <span className="pt-0.5">COMPLETED</span></span>
          ) : (
             <>
                <span className="text-sm">{isStarCost ? '⭐' : '🪐'}</span>
                <span className="pt-0.5">UPGRADE • {upgrade.cost.toLocaleString()}</span>
             </>
          )}
        </button>
      </div>
    </div>
  );
};


const UpgradesView: React.FC<UpgradesViewProps> = ({ upgrades, stellarDeals, player, onBuy, onBuyStellarDeal, isDealAdModalVisible, dealToProcess, onConfirmDealAd, onCancelDealAd, theme, onShowAd }) => {
  const marketUpgrades = upgrades.filter(u => u.category === 'Market');
  const specialUpgrades = upgrades.filter(u => u.category === 'Special');

  return (
    <div className="pt-4 flex flex-col gap-6">
      {isDealAdModalVisible && dealToProcess && <AdDealModal deal={dealToProcess} onConfirm={onConfirmDealAd} onCancel={onCancelDealAd} theme={theme} onShowAd={onShowAd} />}
      
      {/* UX IMPROVEMENT: Global Dashboard showing exactly how the offline mining is doing */}
      <div className={`bg-gradient-to-br from-${theme}-900/40 to-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-${theme}-500/30 text-center flex flex-col items-center gap-2 mx-4 shadow-[0_0_30px_rgba(var(--bg-primary),0.2)] relative overflow-hidden`}>
        {player.passivePerHour > 0 && <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${theme}-500/20 rounded-full blur-[50px] animate-pulse`}></div>}
        
        <div className={`relative w-16 h-16 bg-gradient-to-br from-${theme}-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/10 rotate-3`}>
           🚀
           {player.passivePerHour > 0 && (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping"></span>
           )}
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md mt-1">Fleet Command</h2>
        
        {/* Real-time Mining Status Banner */}
        <div className="mt-3 bg-slate-950/60 rounded-2xl p-4 w-full border border-slate-800 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${player.passivePerHour > 0 ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${player.passivePerHour > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                    {player.passivePerHour > 0 ? 'SYSTEM ACTIVE' : 'SYSTEM STANDBY'}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Global Mining Rate</span>
                <span className={`font-mono font-black text-sm ${player.passivePerHour > 0 ? `text-${theme}-400` : 'text-slate-400'}`}>
                    +{player.passivePerHour.toLocaleString()}/hr
                </span>
            </div>
        </div>
        
        {/* Anti-Spam Clarification Text for the user */}
        {player.passivePerHour > 0 ? (
            <p className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                * Drones auto-collect Stardust when offline for &gt; 5 mins
            </p>
        ) : (
            <p className="text-[10px] text-slate-400 font-medium mt-2">Purchase Auto-Miners to enable offline progression.</p>
        )}
      </div>

      {/* Stellar Deals / Market */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-5">
            <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
            <h3 className="text-sm font-black text-yellow-500 dark:text-yellow-400 uppercase tracking-widest">Stellar Market</h3>
        </div>
        <div className="flex flex-col gap-4 px-4">
          {stellarDeals.map(deal => (
            <StellarDealCard key={deal.id} deal={deal} player={player} onBuy={onBuyStellarDeal} theme={theme} />
          ))}
        </div>
      </div>

      {/* Basic Upgrades (Cost Stardust) */}
      {marketUpgrades.length > 0 && (
          <>
              <div className="flex items-center gap-2 px-5 mt-4">
                 <span className={`w-1 h-4 bg-${theme}-500 rounded-full`}></span>
                 <h3 className={`text-sm font-black text-${theme}-600 dark:text-${theme}-400 uppercase tracking-widest`}>Passive Income</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 px-4">
                {marketUpgrades.map((upgrade) => (
                  <UpgradeCard key={upgrade.id} upgrade={upgrade} player={player} theme={theme} onBuy={onBuy} />
                ))}
              </div>
          </>
      )}

      {/* Premium Upgrades (Cost Stars) */}
      <div className="flex items-center gap-2 px-5 mt-6">
          <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
          <h3 className={`text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest`}>Special Technologies</h3>
      </div>
      <div className="grid grid-cols-1 gap-5 pb-12 px-4">
        {specialUpgrades.map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} player={player} theme={theme} onBuy={onBuy} />
        ))}
      </div>

    </div>
  );
};

export default UpgradesView;
