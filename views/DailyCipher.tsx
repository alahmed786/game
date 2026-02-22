import React, { useState, useEffect, useRef } from 'react';
import { MORSE_CODE_MAP } from '../constants';
import { DailyCipherViewProps } from '../types';

// ✅ NEW: Countdown Timer Component for Cipher
const CipherCountdownTimer: React.FC = () => {
  const calculateTimeLeft = () => {
    const now = Date.now();
    // Calculate the exact start of the NEXT day (UTC Midnight)
    const nextMidnight = Math.ceil(now / 86400000) * 86400000;
    const timeLeft = nextMidnight - now;

    if (timeLeft <= 0) return "00:00:00";

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
  }, []);

  return (
    <div className="mt-2 flex flex-col items-center animate-fade-in">
        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase tracking-widest mb-1">Next Transmission In</span>
        <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-5 py-2 rounded-xl border border-emerald-500/20 shadow-inner">
            {timeLeft}
        </div>
    </div>
  );
};

const DailyCipherView: React.FC<DailyCipherViewProps> = ({ onSolve, onBack, isCipherClaimed, theme, cipherWord }) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const pressTimer = useRef<number | null>(null);

  // Convert comma-separated string from Admin to an array
  const wordsList = (cipherWord || 'SPACE')
    .split(',')
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length > 0);

  // Get current day index based on Unix Epoch (changes exactly every 24h globally)
  const currentDayIndex = Math.floor(Date.now() / 86400000);
  
  // Pick the word based on the day. If it runs out of words, it loops back to the start.
  const targetWord = wordsList.length > 0 
      ? wordsList[currentDayIndex % wordsList.length] 
      : 'SPACE';

  // Safe morse conversion
  const correctMorseSequence = targetWord.split('').map(char => MORSE_CODE_MAP[char] || '').join('');

  const handlePointerDown = () => {
    pressTimer.current = window.setTimeout(() => {
      setInput(prev => prev + '-');
      pressTimer.current = null;
    }, 200); // 200ms for a long press (dash)
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      setInput(prev => prev + '.');
    }
    pressTimer.current = null;
  };
  
  const checkCipher = () => {
    if (input === correctMorseSequence) {
      setFeedback('TRANSMISSION DECODED! REWARD GRANTED.');
      setTimeout(() => {
        onSolve();
      }, 1500);
    } else {
      setFeedback('INCORRECT SEQUENCE. PURGING...');
      setTimeout(() => {
        setInput('');
        setFeedback('');
      }, 1000);
    }
  };

  const claimedView = (
    <div className="text-center gap-6 flex flex-col items-center justify-center h-full animate-fade-in w-full">
      <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse mt-4">
        <span className="text-6xl drop-shadow-lg">🛰️</span>
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Transmission Decoded</h2>
        <p className="text-emerald-600 dark:text-emerald-400 font-mono text-xs tracking-widest">INTELLIGENCE SECURED</p>
      </div>
      
      <div className="bg-white/60 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 max-w-xs backdrop-blur-md shadow-lg flex flex-col gap-4 w-full">
         <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">You have successfully cracked today's cipher code. Return tomorrow for new orders.</p>
         {/* ✅ NEW: Live Countdown Timer */}
         <CipherCountdownTimer />
      </div>

      <button 
        onClick={onBack} 
        className="w-full max-w-xs mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
      >
        Return to Bridge
      </button>
    </div>
  );

  const activeView = (
    <div className="flex flex-col items-center w-full max-w-sm gap-6 animate-fade-in max-h-[85vh] overflow-y-auto">
      
      {/* Header / Target Word */}
      <div className="flex flex-col items-center w-full gap-2">
        <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-[10px] text-red-500 dark:text-red-400 font-mono uppercase tracking-[0.2em]">Live Signal</span>
        </div>
        
        <div className="relative w-full flex justify-center py-4">
             {/* Glowing Word */}
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-[0.3em] drop-shadow-sm z-10">
                {targetWord}
            </h1>
            <div className={`absolute inset-0 bg-${theme}-500/10 blur-2xl rounded-full z-0 animate-pulse`}></div>
        </div>
        
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Enter Morse Sequence</p>
      </div>

      {/* Input Display */}
      <div className="w-full bg-white/50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-28 flex items-center justify-center relative overflow-hidden shadow-inner group shrink-0">
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(0,0,0,0.03),rgba(0,0,0,0.01),rgba(0,0,0,0.03))] dark:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-${theme}-500/30 opacity-50 animate-scan pointer-events-none`}></div>

        <span className={`font-mono text-3xl text-${theme}-600 dark:text-${theme}-400 tracking-[0.3em] drop-shadow-[0_0_10px_rgba(var(--bg-primary),0.8)] z-20 break-all text-center leading-relaxed`}>
            {input ? (
                input.split('').map((char, i) => (
                    <span key={i} className={char === '-' ? 'text-amber-500 dark:text-amber-400' : `text-${theme}-600 dark:text-${theme}-400`}>
                        {char === '.' ? '●' : '▬'}
                    </span>
                ))
            ) : (
                <span className="text-xs text-slate-400 dark:text-slate-700 font-sans font-bold tracking-[0.2em] animate-pulse">AWAITING INPUT</span>
            )}
        </span>
      </div>

      {/* Telegraph Button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-40 h-40 rounded-full bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-black border-4 border-slate-200 dark:border-slate-700/50 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center justify-center active:scale-95 active:border-slate-300 dark:active:border-white/30 transition-all duration-150 group select-none touch-none shrink-0"
      >
        <div className="absolute -inset-4 rounded-full border border-slate-200 dark:border-white/5 opacity-50 animate-spin-slow"></div>
        <div className="absolute -inset-8 rounded-full border border-slate-200 dark:border-white/5 opacity-30 animate-spin-reverse"></div>
        
        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-white to-slate-200 dark:from-slate-800 dark:to-black border border-white dark:border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] flex items-center justify-center relative overflow-hidden">
             <div className={`absolute inset-0 bg-${theme}-500/0 group-active:bg-${theme}-500/10 transition-colors duration-100`}></div>
             <span className={`text-5xl group-active:scale-90 transition-transform duration-100 group-active:text-${theme}-600 dark:group-active:text-${theme}-400 text-slate-400 dark:text-slate-500 drop-shadow-md`}>
                📡
             </span>
        </div>
      </button>

      {/* Instructions */}
      <div className="flex justify-between w-full px-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
         <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${theme}-500 dark:bg-${theme}-400`}></span> Tap ( Dot )
         </div>
         <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span> Hold ( Dash )
         </div>
      </div>
      
      {/* Feedback / Error Message */}
      <div className="h-8 flex items-center justify-center shrink-0">
         {feedback && (
             <span className={`text-xs font-bold uppercase tracking-widest animate-pulse ${feedback.includes('DECODED') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {feedback}
             </span>
         )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full shrink-0">
        <button 
            onClick={() => setInput('')} 
            className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold py-3.5 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-xs uppercase tracking-wider"
        >
            Clear Signal
        </button>
        <button 
            onClick={checkCipher} 
            className={`flex-1 bg-gradient-to-r from-${theme}-600 to-blue-600 hover:from-${theme}-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(var(--bg-primary),0.3)] active:scale-95 transition-all text-xs uppercase tracking-wider`}
        >
            Transmit
        </button>
      </div>

      <button onClick={onBack} className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em] hover:text-slate-800 dark:hover:text-slate-400 transition-colors shrink-0">
        Abort Mission
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 z-[100]">
        <style>{`
            @keyframes scan {
                0% { transform: translateY(0); opacity: 0.5; }
                100% { transform: translateY(100px); opacity: 0; }
            }
            .animate-scan {
                animation: scan 2s linear infinite;
            }
            @keyframes spin-reverse {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
            }
            .animate-spin-reverse {
                animation: spin-reverse 15s linear infinite;
            }
        `}</style>

        {/* Background ambience */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-${theme}-200/40 dark:bg-${theme}-900/20 rounded-full blur-[128px]`}></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[128px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
             {isCipherClaimed ? claimedView : activeView}
        </div>
    </div>
  );
};

export default DailyCipherView;
