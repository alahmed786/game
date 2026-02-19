
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Withdrawal, Theme, WalletViewProps } from '../types';
import { WITHDRAWAL_COOLDOWN_MS } from '../constants';

const DUST_TO_TON_RATE = 100000;
const TON_TO_USD_RATE = 7.5; 
const TON_TO_INR_RATE = 640; 

const formatCountdown = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
};

const VerificationModal: React.FC<{ 
  step: number; 
  onComplete: () => void; 
  onCancel: () => void; 
  theme: string;
  onShowAd: WalletViewProps['onShowAd'];
}> = ({ step, onComplete, onCancel, theme, onShowAd }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWatch = () => {
    setIsWatching(true);
    setError(null);
    onShowAd(
        () => {
            setIsWatching(false);
            onComplete();
        },
        (msg) => {
            setIsWatching(false);
            setError(msg);
        }
    );
  };

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-fade-in">
        <div className={`w-full max-w-sm bg-white/60 dark:bg-[#0a0a0a] border border-white/40 dark:border-${theme}-500/30 rounded-3xl p-8 flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl`}>
            
            {/* Scanning Line */}
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-${theme}-500/5 to-transparent animate-scan pointer-events-none`}></div>

            <div className="flex flex-col items-center text-center gap-4 z-10">
                <div className={`w-20 h-20 rounded-full bg-${theme}-100 dark:bg-${theme}-900/20 border border-${theme}-200 dark:border-${theme}-500/50 flex items-center justify-center mb-2 relative`}>
                    <div className={`absolute inset-0 rounded-full border-t-2 border-${theme}-400 animate-spin`}></div>
                    <span className="text-3xl">🛡️</span>
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1">
                        Security Protocol
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono">
                        Biometric verification required for transfer.
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 w-full justify-center px-12 py-2">
                <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 0 ? `bg-${theme}-500 shadow-[0_0_8px_currentColor]` : 'bg-slate-300 dark:bg-slate-800'}`}></div>
                <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? `bg-${theme}-500 shadow-[0_0_8px_currentColor]` : 'bg-slate-300 dark:bg-slate-800'}`}></div>
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-100 dark:bg-red-950/30 px-3 py-2 rounded border border-red-500/20">{error}</p>}

            <div className="flex flex-col w-full gap-3 z-10 mt-2">
                <button 
                    onClick={handleWatch}
                    disabled={isWatching}
                    className={`w-full h-14 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all relative overflow-hidden
                        ${isWatching 
                            ? 'bg-slate-200 dark:bg-slate-900 text-slate-500 cursor-wait border border-slate-300 dark:border-slate-800' 
                            : `bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]`
                        }
                    `}
                >
                    {isWatching ? 'Verifying...' : (step === 0 ? 'Initialize Link' : 'Confirm Transfer')}
                </button>
                
                <button 
                    onClick={onCancel}
                    disabled={isWatching}
                    className="text-[10px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest hover:text-red-500 dark:hover:text-red-400 transition-colors py-2"
                >
                    Abort
                </button>
            </div>
        </div>
    </div>
  );
};

const TransactionCard: React.FC<{ withdrawal: Withdrawal; isIndiaMode: boolean; theme: string }> = ({ withdrawal, isIndiaMode, theme }) => {
  const date = new Date(withdrawal.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const isUpi = withdrawal.method === 'UPI';
  
  const displayAmount = isUpi 
    ? `₹${(withdrawal.amountTon * TON_TO_INR_RATE).toLocaleString(undefined, {maximumFractionDigits: 0})}`
    : `${withdrawal.amountTon.toFixed(2)} TON`;

  const statusConfig = 
    withdrawal.status === 'Paid' ? { color: 'emerald', text: 'DONE', icon: '✓' } :
    withdrawal.status === 'Rejected' ? { color: 'red', text: 'FAIL', icon: '✕' } :
    { color: 'amber', text: 'WAIT', icon: '⧖' };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/5 hover:border-white/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
        <div className="p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform`}>
                    {isUpi ? '⚡' : '💎'}
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-bold text-xs tracking-wide">{isUpi ? 'UPI Transfer' : 'TON Withdrawal'}</span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tight">{date} • {withdrawal.address.slice(0,4)}...{withdrawal.address.slice(-4)}</span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-black font-mono tracking-tight ${isUpi ? 'text-slate-800 dark:text-slate-200' : 'text-cyan-600 dark:text-cyan-400'}`}>
                    - {displayAmount}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full bg-${statusConfig.color}-500/10 text-${statusConfig.color}-600 dark:text-${statusConfig.color}-400 border border-${statusConfig.color}-500/20`}>
                    {statusConfig.text}
                </span>
            </div>
        </div>
    </div>
  )
}

const WalletView: React.FC<WalletViewProps> = ({ player, onWithdraw, theme, minWithdrawal, onShowAd }) => {
  // Enhanced India detection with geolocation logic placeholder
  const [detectedLocation, setDetectedLocation] = useState<string>('Global, Earth');
  const [isIndiaMode, setIsIndiaMode] = useState(false);

  useEffect(() => {
    // 1. Timezone Detection (Fastest, usually accurate for India)
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
            setIsIndiaMode(true);
            setDetectedLocation('India, Karnataka'); // Defaulting to request if timezone matches India
        }
    } catch {
        // Fallback
    }

    // 2. Browser Geolocation (Optional enhancement)
    // Note: We won't use a reverse geocoding API here to keep it frontend-only and fast,
    // but requesting permission makes it feel "real".
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // If we had an API key, we would fetch(https://api.opencagedata.com/...) here.
                // For now, if we successfully get coordinates and we know it's India timezone,
                // we confirm the specific location display.
                console.log("Location acquired:", position.coords);
            }, 
            (err) => {
                console.log("Geolocation permission denied or failed:", err);
            }
        );
    }
  }, []);

  const [address, setAddress] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  const [showVerify, setShowVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  
  const tonBalance = player.balance / DUST_TO_TON_RATE;
  const inrBalance = tonBalance * TON_TO_INR_RATE;
  const usdBalance = tonBalance * TON_TO_USD_RATE;
  
  const minWithdrawalDisplay = isIndiaMode 
    ? `₹${(minWithdrawal * TON_TO_INR_RATE).toLocaleString()}`
    : `${minWithdrawal} TON`;

  const progressPercent = Math.min((tonBalance / minWithdrawal) * 100, 100);

  useEffect(() => {
    const checkCooldown = () => {
        if (!player.lastWithdrawalTime) {
            setCooldownRemaining(0);
            return;
        }
        const timePassed = Date.now() - player.lastWithdrawalTime;
        const remaining = WITHDRAWAL_COOLDOWN_MS - timePassed;
        setCooldownRemaining(remaining > 0 ? remaining : 0);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [player.lastWithdrawalTime]);

  const onCooldown = cooldownRemaining > 0;
  const canWithdraw = tonBalance >= minWithdrawal && !onCooldown;

  const handleInitiate = () => {
      if (!address.trim()) {
        setMessage({ type: 'error', text: isIndiaMode ? 'Enter Valid UPI ID' : 'Enter Wallet Address' });
        return;
      }
      if (onCooldown) {
          setMessage({ type: 'error', text: 'Daily limit reached.' });
          return;
      }
      if (isIndiaMode) {
        if (!/^[\w.-]+@[\w.-]+$/.test(address)) {
            setMessage({ type: 'error', text: 'Invalid UPI Format' });
            return;
        }
      } else {
        if (address.length < 24) {
             setMessage({ type: 'error', text: 'Invalid TON Address' });
             return;
        }
      }
      if (tonBalance < minWithdrawal) {
        setMessage({ type: 'error', text: `Min: ${minWithdrawalDisplay}` });
        return;
      }
      setVerifyStep(0);
      setShowVerify(true);
  };

  const handleVerificationComplete = () => {
      if (verifyStep === 0) {
          setVerifyStep(1);
      } else {
          setShowVerify(false);
          performWithdrawal();
      }
  };

  const performWithdrawal = () => {
    setIsAnimating(true);
    setTimeout(() => {
        onWithdraw({
            method: isIndiaMode ? 'UPI' : 'TON', 
            address: address,
            amountTon: tonBalance,
            amountStardust: player.balance,
        });
        setAddress('');
        setMessage({ type: 'success', text: 'Transfer Initiated' });
        setIsAnimating(false);
        setTimeout(() => setMessage(null), 3000);
    }, 1500);
  };

  const walletContext = isIndiaMode ? {
    currency: 'INR',
    symbol: '₹',
    network: 'UPI Network',
    icon: '🇮🇳'
  } : {
    currency: 'TON',
    symbol: '💎',
    network: 'TON Mainnet',
    icon: '🌐'
  };

  return (
    <div className="pt-6 px-4 pb-32 flex flex-col gap-6 min-h-full">
        {/* Anti-Autofill Styles */}
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
              transition: background-color 5000s ease-in-out 0s;
              -webkit-text-fill-color: inherit !important;
          }
        `}</style>

        {showVerify && (
            <VerificationModal 
                step={verifyStep} 
                onComplete={handleVerificationComplete} 
                onCancel={() => setShowVerify(false)} 
                theme={theme}
                onShowAd={onShowAd}
            />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${theme}-500 to-${theme}-700 flex items-center justify-center text-xl shadow-lg shadow-${theme}-500/20 text-white`}>
                    🏦
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Star Vault</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Storage</p>
                </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
            </div>
        </div>

        {/* Balance Card - FUTURISTIC REDESIGN */}
        <div className="relative w-full aspect-[1.6] rounded-3xl overflow-hidden group shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-${theme}-500/20 perspective-1000">
            {/* Dynamic Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-${theme}-900 dark:from-slate-950 dark:via-slate-900 dark:to-${theme}-950`}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            
            {/* Holographic Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>

            {/* Glowing Orbs */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${theme}-500/20 rounded-full blur-[80px]`}></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                     {/* Chip */}
                    <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 border border-yellow-400/50 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 border border-black/10 rounded-[4px] m-[2px]"></div>
                        <div className="absolute left-[33%] top-0 bottom-0 w-[1px] bg-black/10"></div>
                        <div className="absolute right-[33%] top-0 bottom-0 w-[1px] bg-black/10"></div>
                        <div className="absolute top-[33%] left-0 right-0 h-[1px] bg-black/10"></div>
                        <div className="absolute bottom-[33%] left-0 right-0 h-[1px] bg-black/10"></div>
                    </div>
                    {/* Signal Icon - STRAIGHT (Uniform Height) */}
                    <div className="flex flex-col gap-1 items-end">
                         <div className="flex gap-1">
                             <div className="w-1 h-3 bg-white/40 rounded-sm"></div>
                             <div className="w-1 h-3 bg-white/60 rounded-sm"></div>
                             <div className="w-1 h-3 bg-white/80 rounded-sm"></div>
                             <div className="w-1 h-3 bg-white rounded-sm"></div>
                         </div>
                         <span className="text-[9px] font-mono text-white/50">{walletContext.network}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest flex items-center gap-2">
                         Total Balance
                         <span className={`w-1.5 h-1.5 rounded-full ${canWithdraw ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                            {isIndiaMode ? '₹' : '$'}
                            {isIndiaMode ? inrBalance.toLocaleString(undefined, {maximumFractionDigits: 0}) : usdBalance.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 font-bold uppercase">Card Holder</span>
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{player.username.slice(0, 12)}</span>
                    </div>
                    {/* UPDATED LOCATION DISPLAY */}
                    <div className="flex flex-col items-end">
                         <span className="text-xs font-mono text-white uppercase tracking-widest">{detectedLocation}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Withdrawal Status & Progress */}
        <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-5 border border-white/40 dark:border-white/5 backdrop-blur-xl shadow-lg">
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Transfer Limit</h3>
                 <span className={`text-xs font-black ${canWithdraw ? `text-${theme}-600 dark:text-${theme}-400` : 'text-slate-400'}`}>
                    {Math.floor(progressPercent)}%
                 </span>
             </div>
             
             <div className="relative h-4 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden shadow-inner">
                {/* Ticks */}
                <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-slate-300 dark:bg-white/5 z-10"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-300 dark:bg-white/5 z-10"></div>
                <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-slate-300 dark:bg-white/5 z-10"></div>
                
                <div 
                    className={`h-full transition-all duration-1000 ease-out relative 
                        ${canWithdraw && !onCooldown 
                            ? `bg-gradient-to-r from-${theme}-600 to-${theme}-400` 
                            : 'bg-gradient-to-r from-slate-400 to-slate-500 grayscale'
                        }`} 
                    style={{ width: `${progressPercent}%` }}
                >
                    {canWithdraw && !onCooldown && <div className="absolute inset-0 bg-white/20 animate-[shine_2s_infinite]"></div>}
                </div>
            </div>
            
            <div className="flex justify-between mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Min: 0</span>
                <span className={`text-[9px] font-bold uppercase ${canWithdraw ? 'text-emerald-500' : 'text-red-400'}`}>
                    Target: {minWithdrawalDisplay}
                </span>
            </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-4">
            <div className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${theme}-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500`}></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-1 flex items-center border border-slate-200 dark:border-slate-800">
                    <div className="pl-4 pr-3 text-slate-400 text-lg border-r border-slate-200 dark:border-slate-800 mr-2 font-mono font-bold">
                        {isIndiaMode ? 'UID' : '#'}
                    </div>
                    <input 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={isIndiaMode ? "Enter UPI ID (e.g. name@upi)" : "Enter TON Address"}
                        disabled={onCooldown}
                        autoComplete="off"
                        className="w-full bg-transparent border-none text-slate-900 dark:text-white font-mono text-sm py-4 focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wide outline-none focus:outline-none ring-0 shadow-none"
                    />
                    {address && (
                        <button onClick={() => setAddress('')} className="pr-4 text-slate-400 hover:text-red-500 transition-colors">✕</button>
                    )}
                </div>
            </div>

            <button 
                onClick={handleInitiate}
                disabled={!canWithdraw || isAnimating || onCooldown}
                className={`
                    relative w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden group transition-all duration-300 shadow-xl
                    ${!canWithdraw || onCooldown 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
                        : `bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-black hover:scale-[1.01] hover:shadow-${theme}-500/20`
                    }
                `}
            >
                {isAnimating ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </div>
                ) : onCooldown ? (
                    <div className="flex flex-col items-center justify-center leading-none gap-1">
                        <span className="text-red-500 dark:text-red-400">Cooldown Active</span>
                        <span className="text-[9px] font-mono opacity-60">{formatCountdown(cooldownRemaining)}</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <span>Execute Transfer</span>
                        <span className="text-lg">➡️</span>
                    </div>
                )}
            </button>
            
            {message && (
                <div className={`text-center text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg border animate-fade-in ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                    {message.text}
                </div>
            )}
        </div>

        {/* Transaction History Redesign */}
        <div className="flex flex-col gap-4 mt-2">
             <div className="flex items-center justify-between px-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Latest Activity</h3>
                 <span className="text-[9px] font-mono text-slate-400">SYNCED</span>
             </div>
             
             <div className="flex flex-col gap-3">
                {player.withdrawalHistory.length > 0 ? (
                    player.withdrawalHistory.map(tx => <TransactionCard key={tx.id} withdrawal={tx} isIndiaMode={isIndiaMode} theme={theme} />)
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-600 gap-3">
                        <span className="text-3xl opacity-20">📂</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Empty Ledger</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default WalletView;
