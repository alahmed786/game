
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-fade-in">
        <div className={`w-full max-w-sm bg-slate-950 border border-${theme}-500/30 rounded-[2rem] p-8 flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl`}>
            
            {/* Background Animation */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${theme}-500 to-transparent animate-scan`}></div>
            <div className={`absolute -bottom-32 -right-32 w-64 h-64 bg-${theme}-500/10 blur-[80px] rounded-full pointer-events-none`}></div>

            <div className="flex flex-col items-center text-center gap-4 z-10">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${theme}-900 to-black border border-${theme}-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(var(--bg-primary),0.2)]`}>
                    <span className="text-4xl animate-pulse filter drop-shadow-[0_0_8px_currentColor]">🛡️</span>
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">
                        Security Check
                    </h2>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed px-4">
                        High-value asset transfer initiated.<br/>
                        <span className={`text-${theme}-400`}>Verify identity to proceed.</span>
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 w-full justify-center px-8">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 0 ? `bg-${theme}-500 shadow-[0_0_10px_rgba(var(--bg-primary),0.8)]` : 'bg-slate-800'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? `bg-${theme}-500 shadow-[0_0_10px_rgba(var(--bg-primary),0.8)]` : 'bg-slate-800'}`}></div>
            </div>

            {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-950/50 px-3 py-2 rounded-lg border border-red-500/20">{error}</p>}

            <div className="flex flex-col w-full gap-3 z-10 mt-2">
                <button 
                    onClick={handleWatch}
                    disabled={isWatching}
                    className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all relative overflow-hidden group
                        ${isWatching 
                            ? 'bg-slate-900 text-slate-500 cursor-wait border border-slate-800' 
                            : `bg-white text-black hover:bg-${theme}-50 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]`
                        }
                    `}
                >
                    {isWatching ? (
                        <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin"></div>
                            <span>Verifying...</span>
                        </>
                    ) : (
                        <>
                            <span>{step === 0 ? 'Establish Link 1/2' : 'Finalize Link 2/2'}</span>
                        </>
                    )}
                </button>
                
                <button 
                    onClick={onCancel}
                    disabled={isWatching}
                    className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-white transition-colors py-3"
                >
                    Abort Transfer
                </button>
            </div>
        </div>
    </div>
  );
};

const TransactionCard: React.FC<{ withdrawal: Withdrawal; isIndiaMode: boolean; theme: string }> = ({ withdrawal, isIndiaMode, theme }) => {
  const date = new Date(withdrawal.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = new Date(withdrawal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUpi = withdrawal.method === 'UPI';
  
  const displayAmount = isUpi 
    ? `₹${(withdrawal.amountTon * TON_TO_INR_RATE).toLocaleString(undefined, {maximumFractionDigits: 0})}`
    : `${withdrawal.amountTon.toFixed(2)} TON`;

  const statusConfig = 
    withdrawal.status === 'Paid' ? { color: 'emerald', icon: '✓', text: 'Confirmed' } :
    withdrawal.status === 'Rejected' ? { color: 'red', icon: '✕', text: 'Failed' } :
    { color: 'amber', icon: '◷', text: 'Pending' };

  return (
    <div className="relative group rounded-2xl bg-slate-900/40 border border-white/5 p-4 transition-all hover:bg-slate-800/60 hover:border-white/10 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border bg-gradient-to-br ${isUpi ? 'from-orange-950/50 to-orange-900/20 border-orange-500/20 text-orange-400' : 'from-cyan-950/50 to-cyan-900/20 border-cyan-500/20 text-cyan-400'}`}>
                    {isUpi ? '🇮🇳' : '💎'}
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-0.5">{isUpi ? 'UPI Network' : 'TON Blockchain'}</div>
                    <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                        <span>{date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>{time}</span>
                    </div>
                </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1.5 bg-${statusConfig.color}-500/10 border-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}>
                <span>{statusConfig.icon}</span>
                {statusConfig.text}
            </div>
        </div>
        
        <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1">
            <div className="flex flex-col gap-1 max-w-[60%]">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Destination</span>
                <span className="text-[10px] text-slate-400 font-mono truncate bg-black/30 px-2 py-1 rounded border border-white/5">
                    {withdrawal.address}
                </span>
            </div>
            <span className={`text-base font-black font-mono tracking-tight ${isUpi ? 'text-orange-200 drop-shadow-[0_0_10px_rgba(251,146,60,0.3)]' : 'text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}>
                {displayAmount}
            </span>
        </div>
    </div>
  )
}

const WalletView: React.FC<WalletViewProps> = ({ player, onWithdraw, theme, minWithdrawal, onShowAd }) => {
  const isIndiaMode = useMemo(() => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta';
    } catch {
        return false;
    }
  }, []);

  const [address, setAddress] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  // Verification State
  const [showVerify, setShowVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  
  const tonBalance = player.balance / DUST_TO_TON_RATE;
  const inrBalance = tonBalance * TON_TO_INR_RATE;
  const usdBalance = tonBalance * TON_TO_USD_RATE;
  
  const minWithdrawalDisplay = isIndiaMode 
    ? `₹${(minWithdrawal * TON_TO_INR_RATE).toLocaleString()}`
    : `${minWithdrawal} TON`;

  const progressPercent = Math.min((tonBalance / minWithdrawal) * 100, 100);

  // Check cooldown timer
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
        setMessage({ type: 'success', text: 'Transfer Protocol Executed' });
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
    <div className="pt-6 px-4 pb-32 flex flex-col gap-8 min-h-full">
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
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">VAULT</h1>
                <div className="flex items-center gap-2 mt-1 bg-slate-900/50 px-2 py-1 rounded-full border border-white/5 w-fit backdrop-blur-md">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${theme}-400 animate-pulse shadow-[0_0_5px_currentColor]`} />
                    <span className={`text-[9px] font-bold text-${theme}-400 tracking-widest uppercase`}>
                        Secure Connection
                    </span>
                </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl backdrop-blur-md shadow-lg animate-[float_4s_ease-in-out_infinite]">
                🏦
            </div>
        </div>

        {/* Balance Card - Quantum Node */}
        <div className="relative w-full aspect-[1.7] rounded-[2.5rem] overflow-hidden group shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${theme}-900 via-slate-950 to-black`}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-${theme}-500/20 blur-[100px] rounded-full`}></div>
            <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-${theme}-900/40 to-transparent`}></div>
            
            {/* Content */}
            <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Total Asset Value</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                                {isIndiaMode ? '₹' : '$'}
                                <span className="ml-1">{isIndiaMode ? inrBalance.toLocaleString(undefined, {maximumFractionDigits: 0}) : usdBalance.toFixed(2)}</span>
                            </span>
                        </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-inner group-hover:bg-white/10 transition-colors`}>
                        <span className="text-sm filter drop-shadow-md">{walletContext.icon}</span>
                        <span className="text-[10px] font-bold text-white uppercase">{walletContext.currency}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                            <span>Withdrawal Threshold</span>
                            <span className={canWithdraw && !onCooldown ? `text-${theme}-300 drop-shadow-[0_0_5px_currentColor]` : 'text-slate-400'}>
                                {Math.floor(progressPercent)}%
                            </span>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div 
                                className={`h-full shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out relative ${canWithdraw && !onCooldown ? `bg-gradient-to-r from-${theme}-400 to-white` : 'bg-slate-700'}`} 
                                style={{ width: `${progressPercent}%` }}
                            >
                                {canWithdraw && !onCooldown && <div className="absolute inset-0 bg-white/50 animate-[shine_2s_infinite]"></div>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-white/40 font-bold uppercase">Network</span>
                            <span className="text-[10px] text-white/90 font-mono tracking-wide drop-shadow-sm">{walletContext.network}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-white/40 font-bold uppercase">Min. Limit</span>
                            <span className="text-[10px] text-white/90 font-mono tracking-wide drop-shadow-sm">{minWithdrawalDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <span className="text-lg">⚡</span> Transfer Protocol
            </h3>
            
            <div className="flex flex-col gap-4">
                {/* Input */}
                <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-${theme}-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 transition duration-500 blur-md`}></div>
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-1 flex items-center shadow-lg transition-all group-focus-within:bg-slate-900/80 group-focus-within:border-white/20">
                        <div className="pl-4 pr-3 text-slate-500 text-2xl transition-colors group-focus-within:text-white filter drop-shadow-md">
                            {isIndiaMode ? '💳' : '⛓️'}
                        </div>
                        <input 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={isIndiaMode ? "Enter UPI ID (user@upi)" : "Enter TON Wallet Address"}
                            disabled={onCooldown}
                            className="w-full bg-transparent border-none text-white font-mono text-sm py-4 focus:ring-0 placeholder:text-slate-600 tracking-wide"
                        />
                    </div>
                </div>

                {/* Withdraw Button */}
                <button 
                    onClick={handleInitiate}
                    disabled={!canWithdraw || isAnimating || onCooldown}
                    className={`
                        relative w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden group transition-all duration-300
                        ${!canWithdraw || onCooldown 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                            : `bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]`
                        }
                    `}
                >
                    {isAnimating ? (
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </div>
                    ) : onCooldown ? (
                        <div className="flex flex-col items-center justify-center leading-none gap-1">
                            <span className="text-red-400">Limit Reached</span>
                            <span className="text-[9px] font-mono opacity-60">{formatCountdown(cooldownRemaining)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 group-hover:gap-4 transition-all">
                            <span>Initiate Transfer</span>
                            <span className="text-lg">➡️</span>
                        </div>
                    )}
                </button>
                
                {message && (
                    <div className={`text-center text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl border animate-fade-in flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
                        {message.text}
                    </div>
                )}
            </div>
        </div>

        {/* Ledger */}
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="text-lg">📠</span> Ledger
                </h3>
                {player.withdrawalHistory.length > 0 && (
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{player.withdrawalHistory.length} RECORDS</span>
                )}
            </div>
            
            <div className="flex flex-col gap-3">
                {player.withdrawalHistory.length > 0 ? (
                    player.withdrawalHistory.map(tx => <TransactionCard key={tx.id} withdrawal={tx} isIndiaMode={isIndiaMode} theme={theme} />)
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-slate-600 gap-3 backdrop-blur-sm">
                        <span className="text-4xl opacity-20 grayscale">📂</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Empty Records</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default WalletView;
