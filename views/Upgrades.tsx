
import React, { useState, useEffect } from 'react';
import { Upgrade, Player, StellarDeal, Theme, UpgradesViewProps } from '../types';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">{deal.icon}</span>
        <h2 className="text-xl font-bold text-white">{deal.title}</h2>
        <p className="text-slate-300 text-sm">{deal.description}</p>
        
        {error && <p className="text-red-400 text-xs font-bold uppercase">{error}</p>}

        <div className="flex flex-col gap-3 w-full mt-2">
          <button onClick={handleConfirm} disabled={isWatching} className={`w-full bg-gradient-to-r from-${theme}-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-${theme}-500/20 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2`}>
            {isWatching ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>LOADING...</span></>) : ('Watch & Claim')}
          </button>
          <button onClick={onCancel} disabled={isWatching} className="w-full text-slate-400 text-sm font-semibold py-2 rounded-xl active:scale-95 transition-all">Cancel</button>
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
      if (activeBoost) {
        remaining = activeBoost.expiresAt - Date.now();
      } else if (onCooldown) {
        remaining = (player.lastDealPurchases[deal.id] + deal.cooldown!) - Date.now();
      }
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [player.activeBoosts, player.lastDealPurchases, deal.id, deal.cooldown, activeBoost, onCooldown]);

  const isUnlocked = !deal.unlockLevel || player.level >= deal.unlockLevel;
  const isForbiddenTech = deal.id === 'ad_free_upgrade';
  
  const hasEnoughCurrency = deal.costType === 'stars'
    ? player.stars >= deal.cost
    : deal.costType === 'stardust'
    ? player.balance >= deal.cost
    : true; // Ads don't have a currency cost
    
  const canBuy = isUnlocked && hasEnoughCurrency && !onCooldown && !activeBoost;

  const costIcon = deal.costType === 'stars' ? '⭐' : deal.costType === 'stardust' ? '🪐' : '🎟️';

  const getButtonContent = () => {
    if (activeBoost) return <><span className="text-green-400">Active:</span><span className="font-mono text-white">{formatTime(timeLeft)}</span></>;
    if (onCooldown) return <span className="font-mono text-white">{formatTime(timeLeft)}</span>;
    if (!isUnlocked) return <span className="text-red-400">LVL {deal.unlockLevel} REQ.</span>;
    
    return <><span>{costIcon}</span><span className={deal.costType === 'ad' ? 'text-white' : ''}>{deal.costType === 'ad' ? 'Watch Ad' : deal.cost.toLocaleString()}</span></>;
  };

  const forbiddenTechStyles = isForbiddenTech 
    ? "bg-gradient-to-br from-yellow-900/40 via-purple-900/40 to-slate-900/60 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)] animate-pulse"
    : `bg-slate-900/60 border-${activeBoost ? 'green-400' : 'yellow-500/30'}`;

  return (
    <div className={`relative w-full backdrop-blur-md border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all 
      ${!canBuy && isUnlocked ? 'opacity-60' : ''} 
      ${!isUnlocked ? 'opacity-60 grayscale' : ''}
      ${activeBoost ? 'animate-border-glow-green' : ''}
      ${forbiddenTechStyles}
    `}>
      {isForbiddenTech && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-widest z-10 animate-bounce">
              Legendary
          </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner ${isForbiddenTech ? 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-300 text-white' : 'bg-slate-800 border-slate-700'}`}>
              {deal.icon}
          </div>
          <div>
            <h3 className={`font-bold text-base ${isForbiddenTech ? 'text-yellow-100' : 'text-white'}`}>{deal.title}</h3>
            <p className={`text-xs leading-tight ${isForbiddenTech ? 'text-yellow-200/70' : 'text-slate-300'}`}>{deal.description}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => onBuy(deal)}
        disabled={!canBuy}
        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed
            ${canBuy && deal.costType === 'ad' ? `bg-${theme}-500 text-white shadow-lg` : canBuy ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-600'}
            ${isForbiddenTech && canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]' : ''}
        `}
        style={onCooldown ? { background: 'repeating-linear-gradient(-45deg, #2d3748, #2d3748 10px, #4a5568 10px, #4a5568 20px)' } : {}}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};


const UpgradesView: React.FC<UpgradesViewProps> = ({ upgrades, stellarDeals, player, onBuy, onBuyStellarDeal, isDealAdModalVisible, dealToProcess, onConfirmDealAd, onCancelDealAd, theme, onShowAd }) => {
  const [filter, setFilter] = useState<'Special'>('Special'); // Only one category left

  const filteredUpgrades = upgrades.filter(u => u.category === filter);

  return (
    <div className="pt-4 flex flex-col gap-6">
      {isDealAdModalVisible && dealToProcess && <AdDealModal deal={dealToProcess} onConfirm={onConfirmDealAd} onCancel={onCancelDealAd} theme={theme} onShowAd={onShowAd} />}
      <div className={`bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-${theme}-500/20 text-center flex flex-col items-center gap-2 mx-4`}>
        <div className={`w-16 h-16 bg-gradient-to-br from-${theme}-500 to-blue-600 rounded-full flex items-center justify-center text-4xl shadow-xl`}>🚀</div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Fleet Command</h2>
        <p className="text-xs text-slate-300">Upgrade your technologies to expand your cosmic influence.</p>
      </div>

      {/* Stellar Market */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest px-4">Stellar Market</h3>
        <div className="flex flex-col gap-4 px-4">
          {stellarDeals.map(deal => (
            <StellarDealCard key={deal.id} deal={deal} player={player} onBuy={onBuyStellarDeal} theme={theme} />
          ))}
        </div>
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>


      <div className="px-4">
        <h3 className={`text-sm font-bold text-${theme}-400 uppercase tracking-widest mb-3`}>Special Technologies</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-12 px-4">
        {filteredUpgrades.map((upgrade) => {
          const isUnlocked = !upgrade.unlockLevel || player.level >= upgrade.unlockLevel;
          const isStarCost = upgrade.costType === 'stars';
          const hasEnoughCurrency = isStarCost 
            ? player.stars >= upgrade.cost
            : player.balance >= upgrade.cost;
          const canBuy = isUnlocked && hasEnoughCurrency && upgrade.level < upgrade.maxLevel;

          return (
            <div 
              key={upgrade.id}
              className={`relative bg-slate-900/60 backdrop-blur-md border p-4 rounded-2xl flex flex-col gap-4 transition-all border-slate-800 ${
                !isUnlocked || !hasEnoughCurrency ? 'opacity-60' : `hover:border-${theme}-500/40`
              } ${!isUnlocked ? 'grayscale' : ''}`}
            >
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-700">
                  {upgrade.icon}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-base text-white">{upgrade.name}</h3>
                        <div className="bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                            <span className={`text-[10px] font-bold text-${theme}-500`}>LVL {upgrade.level}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight max-w-xs">{upgrade.description}</p>
                    {!isUnlocked && upgrade.unlockLevel && (
                        <p className="text-xs text-red-400 font-bold mt-1">Requires Level {upgrade.unlockLevel}</p>
                    )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Effect</span>
                  <span className={`text-sm font-black ${upgrade.profitPerHour ? `text-${theme}-400` : 'text-purple-400'}`}>
                    {upgrade.profitPerHour ? `+${upgrade.profitPerHour.toLocaleString()}/hr` : 
                     upgrade.cptBoost ? `+${upgrade.cptBoost} PWR` : 
                     upgrade.holdMultiplierBoost ? `+${(upgrade.holdMultiplierBoost * 100).toFixed(0)}% Hold` : 'Special'}
                  </span>
                </div>
                
                <button
                  onClick={() => onBuy(upgrade.id)}
                  disabled={!canBuy}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all
                    ${canBuy 
                      ? 'bg-white text-slate-950 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : 'bg-slate-800 text-slate-600'}
                  `}
                >
                  <span>{isStarCost ? '⭐' : '🪐'}</span>
                  {upgrade.cost.toLocaleString()}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradesView;
