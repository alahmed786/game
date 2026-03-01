import React, { useState } from 'react';
import { Player } from '../types';

interface ProfileModalProps {
  player: Player;
  onClose: () => void;
  onDelete: () => void;
  isDarkMode: boolean;
  theme: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ player, onClose, onDelete, isDarkMode, theme }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: "How do I earn Stardust?", a: "Hold the central core to generate Stardust. You can also complete missions and buy Auto-Miners for passive income." },
        { q: "What is Wormhole Profits?", a: "A special technology that allows your Auto-Miner Drones to collect Stardust even when you close the app!" },
        { q: "How do I withdraw?", a: "Navigate to the Wallet tab. Once you reach the minimum TON limit, you can request a payout to your crypto wallet or UPI." },
        { q: "What are Stars?", a: "Premium currency used to purchase elite Fleet Upgrades and special Stellar Deals." }
    ];

    const handleContactUs = () => {
        const email = "network.captchacash@gmail.com";
        navigator.clipboard.writeText(email).then(() => {
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert("Support email copied to clipboard!\n\n" + email);
            } else {
                alert("Support email copied to clipboard!\n\n" + email);
            }
        }).catch(err => {
            console.error("Clipboard failed", err);
            prompt("Please copy our support email:", email);
        });
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in pb-0 sm:pb-6 px-0 sm:px-4">
            <div className={`w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border border-slate-800' : 'bg-white border border-slate-200'}`}>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Commander Profile</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        ✖
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar flex flex-col gap-6">
                    
                    <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className={`w-14 h-14 rounded-xl p-[2px] bg-gradient-to-br from-${theme}-400 to-purple-500 shrink-0`}>
                            <img src={player.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} alt="Avatar" className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Username</span>
                            <span className={`font-black text-lg truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{player.username}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Chat ID</span>
                            <span className="font-mono text-xs text-cyan-500 truncate">{player.telegramId}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support & Help</h3>
                        <button onClick={handleContactUs} className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📧</span>
                                <div className="flex flex-col text-left">
                                    <span className={`font-bold text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Contact Us</span>
                                    <span className="text-[10px] text-slate-500">network.captchacash@gmail.com</span>
                                </div>
                            </div>
                            <span className="text-slate-400">📋 Copy</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Frequently Asked Questions</h3>
                        <div className="flex flex-col gap-2">
                            {faqs.map((faq, i) => (
                                <div key={i} className={`rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-4 text-left flex justify-between items-center"
                                    >
                                        <span className={`font-bold text-sm pr-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{faq.q}</span>
                                        <span className="text-slate-400 font-mono text-lg leading-none">{openFaq === i ? '−' : '+'}</span>
                                    </button>
                                    {openFaq === i && (
                                        <div className={`px-4 pb-4 text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-red-900/30">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">Danger Zone</h3>
                        {!confirmDelete ? (
                            <button 
                                onClick={() => setConfirmDelete(true)} 
                                className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 font-bold text-sm hover:bg-red-500/10 transition-colors"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                                <p className="text-xs text-red-400 font-bold text-center mb-2 uppercase">Are you absolutely sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button onClick={onDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all active:scale-95">Yes, Delete</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
