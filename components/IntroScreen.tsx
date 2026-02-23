import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  "INITIALIZING QUANTUM UPLINK...",
  "AUTHENTICATING COMMANDER...",
  "LOADING ASSETS...",
  "SYNCING WITH GALAXY...",
  "ESTABLISHING SECURE CONNECTION...",
  "PREPARING FLEET...",
  "ENGAGING HYPERDRIVE..."
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

  // Message Rotation
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
        progressRef.current += 2.5; 
      } else {
        const target = 85;
        if (progressRef.current < target) {
          const diff = target - progressRef.current;
          progressRef.current += diff * 0.04; 
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
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden font-mono select-none ${isDarkMode ? 'bg-[#030712]' : 'bg-[#f0f9ff]'}`}>
       
       {/* --- DYNAMIC BACKGROUND LAYERS --- */}
       <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full animate-pulse blur-[120px] ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-200/60'}`}></div>
       <div className={`absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full animate-[pulse_4s_ease-in-out_infinite] blur-[120px] ${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-200/60'}`} style={{animationDelay: '1s'}}></div>
       
       {isDarkMode ? (
           <div className="absolute inset-0 opacity-80" id="starfield"></div>
       ) : (
           <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
       )}

       <div className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-20 pointer-events-none perspective-grid-container">
          <div className={`w-full h-full absolute inset-0 ${isDarkMode ? 'bg-[linear-gradient(to_bottom,transparent_0%,#06b6d4_100%)] opacity-30' : 'bg-[linear-gradient(to_bottom,transparent_0%,#0ea5e9_100%)] opacity-20'}`}></div>
          <div className="grid-lines absolute inset-0"></div>
       </div>
       
       {isDarkMode && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-70 pointer-events-none"></div>}
       
       {/* --- DEAD CENTER CONTENT (Logo & Title) --- */}
       <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm px-8 -mt-16">
          
          {/* Holographic Scanner / Retro Alien Logo */}
          <div className="relative mb-16 flex items-center justify-center">
              {/* Outer Rings */}
              <div className={`absolute w-56 h-56 rounded-full border-2 border-dashed animate-[spin_15s_linear_infinite] ${isDarkMode ? 'border-cyan-500/20' : 'border-cyan-500/30'}`}></div>
              <div className={`absolute w-48 h-48 rounded-full border border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-[spin_3s_linear_infinite]`}></div>
              <div className="absolute w-40 h-40 rounded-full border border-indigo-500/50 animate-[spin_8s_linear_infinite_reverse]"></div>
              
              {/* Core Gem with Alien Emoji */}
              <div className={`relative w-28 h-28 rounded-3xl rotate-45 flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(6,182,212,0.3)] ${isDarkMode ? 'bg-slate-900/40 border border-cyan-400/30' : 'bg-white/60 border border-cyan-500/30'}`}>
                  {/* The Emoji rotated back to stand upright */}
                  <div className="-rotate-45 text-6xl drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse">
                      👾
                  </div>
                  
                  {/* Scanner Line */}
                  <div className="absolute inset-0 w-full h-1 bg-cyan-400/60 blur-[3px] animate-[scan_2.5s_ease-in-out_infinite]"></div>
              </div>
          </div>

          {/* Title */}
          <h1 className={`text-4xl font-black tracking-[0.25em] uppercase text-center drop-shadow-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Alien<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Overlord</span>
          </h1>

       </div>

       {/* --- BOTTOM CONTENT (Loading Bar & Status) --- */}
       <div className="absolute bottom-10 w-full max-w-sm px-8 flex flex-col gap-5 z-20">
           
          {/* Status Message */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center gap-2 mb-2">
                 <div className={`w-2 h-2 rounded-full animate-ping ${isDataReady ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                 <span className={`text-[10px] uppercase tracking-widest font-bold ${isDataReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {isDataReady ? 'Uplink Established' : 'System Booting'}
                 </span>
            </div>
            <p key={msgIndex} className={`font-bold font-mono text-[10px] tracking-[0.15em] uppercase animate-[fadeInUp_0.3s_ease-out] text-center ${isDarkMode ? 'text-cyan-200/70' : 'text-slate-500'}`}>
               {MESSAGES[msgIndex]}
            </p>
          </div>

          {/* Loading Bar & Meta */}
          <div className="w-full flex flex-col gap-2">
              {/* Progress Bar Container */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden relative shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  {/* Animated Bar */}
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_15px_cyan] relative"
                    style={{ width: `${progress}%`, transition: 'width 0.15s ease-out' }}
                  >
                      {/* Data Stream Effect Inside Bar */}
                      <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] w-[50px] animate-[slideRight_1s_linear_infinite]"></div>
                  </div>
              </div>
              
              {/* Footer Meta Details */}
              <div className={`flex justify-between items-center w-full text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  <span>V 1.0.5</span>
                  <span className="font-bold text-cyan-500 text-xs">{Math.floor(progress)}%</span>
                  <span>SECURE PROTOCOL</span>
              </div>
          </div>

       </div>

        <style>{`
            @keyframes slideRight {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400px); }
            }
            @keyframes scan {
                0% { transform: translateY(-50px); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(50px); opacity: 0; }
            }
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(5px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            #starfield {
                background-image: 
                    radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 40px 70px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 50px 160px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 90px 40px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0));
                background-size: 200px 200px;
                animation: zoomStars 25s linear infinite;
            }
            @keyframes zoomStars {
                from { transform: scale(1); opacity: 0.8; }
                to { transform: scale(1.5); opacity: 0.3; }
            }
            .perspective-grid-container {
                perspective: 400px;
                overflow: hidden;
            }
            .grid-lines {
                width: 200%;
                height: 200%;
                margin-left: -50%;
                background-image: 
                    linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .4) 25%, rgba(6, 182, 212, .4) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .4) 75%, rgba(6, 182, 212, .4) 76%, transparent 77%, transparent), 
                    linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .4) 25%, rgba(6, 182, 212, .4) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .4) 75%, rgba(6, 182, 212, .4) 76%, transparent 77%, transparent);
                background-size: 50px 50px;
                transform: rotateX(65deg) translateY(-50px) translateZ(-100px);
                animation: gridMove 15s linear infinite;
            }
            @keyframes gridMove {
                0% { transform: rotateX(65deg) translateY(0); }
                100% { transform: rotateX(65deg) translateY(50px); }
            }
        `}</style>
    </div>
  );
};

export default IntroScreen;
