
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
  isDataReady: boolean; // New prop to control finishing
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onFinished, isDataReady }) => {
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
      // If data is ready, we accelerate to 100%
      if (isDataReady) {
        progressRef.current += 2; // Fast finish
      } else {
        // If data NOT ready, we slow down asymptotically towards 85%
        // This makes it look like it's "working" without getting stuck at 0
        const target = 85;
        if (progressRef.current < target) {
          const diff = target - progressRef.current;
          progressRef.current += diff * 0.05; // Smooth deceleration
        }
      }

      // Cap at 100
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        setProgress(100);
        // Small delay at 100% before unmounting for visual satisfaction
        setTimeout(onFinished, 500);
        return; // Stop loop
      }

      setProgress(progressRef.current);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDataReady, onFinished]);

  return (
    <div className="fixed inset-0 bg-[#030712] z-[100] flex flex-col items-center justify-center overflow-hidden font-mono select-none">
       
       {/* --- DYNAMIC BACKGROUND LAYERS --- */}
       <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse"></div>
       <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-900/20 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
       
       <div className="absolute inset-0 opacity-80" id="starfield"></div>

       <div className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-20 pointer-events-none perspective-grid-container">
          <div className="w-full h-full bg-[linear-gradient(to_bottom,transparent_0%,#06b6d4_100%)] opacity-20 absolute inset-0"></div>
          <div className="grid-lines absolute inset-0"></div>
       </div>
       
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80 pointer-events-none"></div>
       <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>


       {/* --- FOREGROUND CONTENT --- */}

       <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm px-6">
          
          {/* Holographic Scanner */}
          <div className="relative mb-16">
              <div className="w-48 h-48 rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-4 rounded-full border-t border-b border-purple-500/50 animate-[spin_5s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-24 h-24 bg-cyan-900/10 rounded-full border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      <span className="text-5xl animate-pulse filter drop-shadow-[0_0_10px_cyan]">👽</span>
                      <div className="absolute inset-0 w-full h-1 bg-cyan-400/50 blur-[2px] animate-[scan_2s_linear_infinite]"></div>
                  </div>
              </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-white tracking-[0.3em] uppercase mb-10 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            Alien<br/><span className="text-cyan-400">Overlord</span>
          </h1>

          {/* Status Message */}
          <div className="h-16 flex flex-col items-center justify-center w-full">
            <div className="flex items-center gap-2 mb-2">
                 <div className={`w-1.5 h-1.5 rounded-full animate-ping ${isDataReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                 <span className={`text-[10px] uppercase tracking-widest font-bold ${isDataReady ? 'text-green-500' : 'text-yellow-500'}`}>
                    {isDataReady ? 'Ready to Launch' : 'System Booting'}
                 </span>
            </div>
            <p key={msgIndex} className="text-cyan-300 font-bold font-mono text-xs tracking-[0.15em] uppercase animate-[fadeInUp_0.3s_ease-out] text-center">
               {MESSAGES[msgIndex]}
            </p>
          </div>

          {/* Loading Bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_10px_cyan]"
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
              ></div>
          </div>
          
          <div className="mt-2 text-[10px] text-cyan-600 font-mono">
              {Math.floor(progress)}%
          </div>

          <div className="mt-4 flex justify-between w-full text-[9px] text-slate-600 font-mono uppercase tracking-widest">
              <span>V 1.0.5</span>
              <span>SECURE PROTOCOL</span>
          </div>

       </div>

        <style>{`
            @keyframes scan {
                0% { transform: translateY(-40px); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(40px); opacity: 0; }
            }
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(5px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            #starfield {
                background-image: 
                    radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 160px 120px, #ddd, rgba(0,0,0,0));
                background-size: 200px 200px;
                animation: zoomStars 20s linear infinite;
            }
            @keyframes zoomStars {
                from { transform: scale(1); opacity: 0.8; }
                to { transform: scale(1.5); opacity: 0.5; }
            }
            .perspective-grid-container {
                perspective: 300px;
                overflow: hidden;
            }
            .grid-lines {
                width: 200%;
                height: 200%;
                margin-left: -50%;
                background-image: 
                    linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent), 
                    linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent);
                background-size: 40px 40px;
                transform: rotateX(60deg) translateY(-50px) translateZ(-100px);
                animation: gridMove 20s linear infinite;
            }
            @keyframes gridMove {
                0% { transform: rotateX(60deg) translateY(0); }
                100% { transform: rotateX(60deg) translateY(40px); }
            }
        `}</style>
    </div>
  );
};

export default IntroScreen;
