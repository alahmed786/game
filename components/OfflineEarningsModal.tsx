import React from 'react';

interface OfflineEarningsModalProps {
  amount: number;
  onClaim: () => void;
  isDarkMode: boolean;
}

const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({ amount, onClaim, isDarkMode }) => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className={`relative w-full max-w-sm rounded-[2rem] p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border border-purple-500/30' : 'bg-white border border-purple-200'}`}>
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none"></div>
            <div className="w-24 h-24 mx-auto bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-[spin_10s_linear_infinite]">
                🌌
            </div>
            <h2 className={`text-2xl font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Wormhole Secured</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your offline drones have returned from the void with harvested stardust.</p>
            
            <div className="flex items-center justify-center gap-2 mb-8 bg-purple-500/10 py-4 rounded-xl border border-purple-500/20">
                <span className="text-2xl drop-shadow-sm">🪐</span>
                <span className="text-3xl font-black font-mono text-purple-400 tracking-wider">+{Math.floor(amount).toLocaleString()}</span>
            </div>

            <button 
                onClick={onClaim}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
            >
                Transfer to Vault
            </button>
        </div>
    </div>
);

export default OfflineEarningsModal;
