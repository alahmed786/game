import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upgrade, Player } from '../types';

interface AIAdvisorProps {
  upgrades: Upgrade[];
  player: Player;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ upgrades, player }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      // FIX: Per coding guidelines, API key must be sourced exclusively from process.env.API_KEY.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a Cosmic Oracle guiding a Space Empire.
        Current Fleet Stats:
        - Stardust: ${player.balance}
        - Fleet Passive Yield: ${player.passivePerHour}/hr
        - Hyper-Tap Output: ${player.coinsPerTap}
        - Technologies: ${upgrades.map(u => `${u.name} (Cost: ${u.cost}, Yield: ${u.profitPerHour || 0}/hr, Power: ${u.cptBoost || 0})`).join(', ')}

        Give me 1 cosmic advice (max 60 words) on my next move. Use space metaphors. Be cryptic but helpful.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setAdvice(response.text || 'The nebula is too thick to see the future.');
    } catch (error) {
      setAdvice('The quantum uplink is down. Earthlings are interfering.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 flex flex-col gap-6">
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-purple-500/20 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-[spin_10s_linear_infinite]">🔮</div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-white">Galactic Oracle</h2>
            <p className="text-[10px] text-purple-400 font-bold">Quantum Strategy Computation</p>
          </div>
        </div>

        {advice ? (
          <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/30 text-xs italic leading-relaxed text-purple-200">
            "{advice}"
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
            Transmit fleet data to the oracle for divine insight.
          </div>
        )}

        <button
          onClick={getAdvice}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-800 text-white font-bold py-4 rounded-xl shadow-[0_5px_20px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
        >
          {loading ? 'ESTABLISHING QUANTUM LINK...' : 'CONSULT THE VOID'}
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
