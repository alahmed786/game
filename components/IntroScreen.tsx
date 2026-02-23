import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  "INITIALIZING QUANTUM UPLINK...",
  "AUTHENTICATING COMMANDER...",
  "DECRYPTING ASSETS...",
  "SYNCING NEURAL NETWORK...",
  "ESTABLISHING SECURE CONNECTION...",
  "CHARGING HYPERDRIVE...",
  "AWAITING DEPLOYMENT..."
];

interface IntroScreenProps {
  onFinished: () => void;
  isDataReady: boolean;
  isDarkMode?: boolean;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onFinished, isDataReady, isDarkMode = true }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  // Terminal Message Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Progress Logic
  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      if (isDataReady) {
        progressRef.current += 2; 
      } else {
        const target = 85;
        if (progressRef.current < target) {
          const diff = target - progressRef.current;
          progressRef.current += diff * 0.05; 
        }
      }

      if (progressRef.current >= 100) {
        progressRef.current = 100;
        setProgress(100);
        setTimeout(onFinished, 600);
        return; 
      }

      setProgress(progressRef.current);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDataReady, onFinished]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden font-mono select-none transition-colors duration-500 ${isDarkMode ? 'bg-[#050B14]' : 'bg-[#e0f2fe]'}`}>
       
       {/* === BACKGROUND AMBIENCE === */}
       {/* Deep glowing orbs */}
       <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full animate-pulse blur-[150px] ${isDarkMode ? 'bg-cyan-900/30' : 'bg-cyan-300/50'}`}></div>
       <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full animate-pulse blur-[150px] ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-300/50'}`} style={{animationDelay: '2s'}}></div>
       
       {/* Hexagonal Tech Overlay */}
       <div className="absolute inset-0 opacity-20 pointer-events-none tech-hex-bg"></div>
       {/* Noise Texture */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

       {/* Vignette Shadow */}
       {isDarkMode && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#030712_100%)] opacity-90 pointer-events-none"></div>}

       
       {/* === TOP DECORATION === */}
       <div className="w-full pt-8 px-6 flex justify-between items-start z-20 opacity-50">
           <div className="flex flex-col gap-1">
               <div className={`w-8 h-0.5 ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
               <div className={`w-4 h-0.5 ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
           </div>
           <div className={`text-[8px] tracking-[0.3em] ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>SYS.BOOT.SEQ</div>
       </div>

       {/* === CENTER: THE QUANTUM CORE === */}
       <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-md px-8 -mt-10">
          
          <div className="relative mb-10 flex items-center justify-center w-64 h-64">
              {/* Outer HUD Rings */}
              <div className={`absolute inset-0 rounded-full border border-dashed animate-[spin_20s_linear_infinite] ${isDarkMode ? 'border-cyan-500/20' : 'border-cyan-500/40'}`}></div>
              <div className={`absolute inset-4 rounded-full border-t-2 border-l-2 border-r-2 border-b-2 border-transparent animate-[spin_8s_linear_infinite] ${isDarkMode ? 'border-t-cyan-400 border-l-cyan-900' : 'border-t-cyan-500 border-l-cyan-200'}`}></div>
              <div className={`absolute inset-10 rounded-full border border-dashed animate-[spin_12s_linear_infinite_reverse] ${isDarkMode ? 'border-indigo-500/30' : 'border-indigo-500/50'}`}></div>
              
              {/* Central Hexagon Frame */}
              <div className="absolute inset-14 flex items-center justify-center animate-pulse-slow">
                  <div className={`relative w-full h-full flex items-center justify-center backdrop-blur-md hex-clip shadow-[0_0_50px_rgba(6,182,212,0.15)] ${isDarkMode ? 'bg-slate-900/60 border border-cyan-500/30' : 'bg-white/60 border border-cyan-400/50'}`}>
                      
                      {/* Inner Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10`}></div>
                      
                      {/* The Alien */}
                      <div className="text-6xl drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] z-10 animate-float">
                          👽
                      </div>

                      {/* Scanning Laser inside Hexagon */}
                      <div className="absolute top-0 left-0 w-full h-full overflow-hidden hex-clip pointer-events-none">
                          <div className={`w-full h-1 blur-[2px] animate-[scan_2s_ease-in-out_infinite] ${isDarkMode ? 'bg-cyan-400/50' : 'bg-cyan-500/40'}`}></div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Sleek Typography */}
          <div className="flex flex-col items-center">
              <h2 className={`text-[10px] font-bold tracking-[0.5em] uppercase mb-2 ${isDarkMode ? 'text-cyan-500/80' : 'text-cyan-600/80'}`}>
                  Project
              </h2>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-[0.2em] uppercase text-center leading-tight drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Alien<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">Overlord</span>
              </h1>
          </div>
       </div>

       {/* === BOTTOM: TERMINAL & LOADING BAR === */}
       <div className="w-full max-w-md px-8 pb-12 z-20 flex flex-col gap-4">
           
          {/* Status Console Readout */}
          <div className={`flex flex-col w-full p-3 rounded-lg border backdrop-blur-sm ${isDarkMode ? 'bg-black/40 border-cyan-900/50' : 'bg-white/40 border-cyan-200/50'}`}>
            <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-ping ${isDataReady ? 'bg-emerald-400 text-emerald-400' : 'bg-cyan-400 text-cyan-400'}`}></div>
                     <span className={`text-[9px] uppercase tracking-widest font-bold ${isDataReady ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {isDataReady ? 'Connection Secured' : 'Establishing Uplink'}
                     </span>
                 </div>
                 <span className={`text-[9px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>v1.0.5</span>
            </div>
            
            <div className="flex items-center gap-2">
                <span className={`text-xs ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'}`}>{'>_'}</span>
                <p key={msgIndex} className={`font-mono text-[10px] tracking-widest uppercase animate-typewriter overflow-hidden whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                   {MESSAGES[msgIndex]}
                </p>
            </div>
          </div>

          {/* High-Tech Progress Bar */}
          <div className="w-full flex flex-col gap-1.5">
              <div className="flex justify-between w-full">
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Data Transfer</span>
                  <span className={`text-[10px] font-black font-mono ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{Math.floor(progress)}%</span>
              </div>
              
              {/* Outer Bar Casing */}
              <div className={`w-full h-2 rounded-sm border p-[1px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
                  {/* Inner Filled Bar */}
                  <div 
                    className="h-full rounded-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 relative overflow-hidden"
                    style={{ width: `${progress}%`, transition: 'width 0.15s ease-out' }}
                  >
                      {/* Bar Glint/Shine */}
                      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)] w-[30%] animate-[slideRight_1.5s_ease-in-out_infinite]"></div>
                  </div>
              </div>
          </div>

       </div>

        {/* === CUSTOM STYLES === */}
        <style>{`
            /* Hexagon Clip Path */
            .hex-clip {
                clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
            }

            /* Hexagonal Tech Background */
            .tech-hex-bg {
                background-image: url("data:image/svg+xml,%3Csvg width='60' height='100' viewBox='0 0 60 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 100L0 85V15L30 0l30 15v70l-30 15zm0-96L2.5 17.5v65L30 96l27.5-13.5v-65L30 4z' fill='%2306b6d4' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E");
                background-size: 40px 68px;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-5px) scale(1.02); }
            }

            @keyframes scan {
                0% { transform: translateY(-60px); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(60px); opacity: 0; }
            }

            @keyframes pulse-slow {
                0%, 100% { opacity: 1; filter: drop-shadow(0 0 15px rgba(6,182,212,0.2)); }
                50% { opacity: 0.8; filter: drop-shadow(0 0 30px rgba(6,182,212,0.4)); }
            }

            @keyframes slideRight {
                0% { transform: translateX(-200%); }
                100% { transform: translateX(400%); }
            }

            @keyframes typewriter {
                from { width: 0; opacity: 0;}
                to { width: 100%; opacity: 1;}
            }
        `}</style>
    </div>
  );
};

export default IntroScreen;
