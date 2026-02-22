import React, { useState, useEffect } from 'react';
import { Player, Task, Upgrade, StellarDeal, AdminConfig, Withdrawal, DailyReward, AdminViewProps, AdUnit, ErrorLog } from '../types';
import { supabase, saveGameSettings, fetchAllPlayersAdmin } from '../utils/supabase';

const TON_TO_INR_RATE = 640; 

const AdminView: React.FC<AdminViewProps> = ({
  config, setConfig, tasks, setTasks, stellarDeals, setStellarDeals, 
  upgrades, setUpgrades, withdrawals, setWithdrawals, players, setPlayers, dailyRewards, setDailyRewards, onBack
}) => {
  const [tab, setTab] = useState<'config' | 'missions' | 'fleet' | 'finance' | 'users' | 'ads' | 'debug'>('config');
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const refreshData = async () => {
        const allPlayersData = await fetchAllPlayersAdmin();
        if (allPlayersData) {
            // @ts-ignore
            setPlayers(allPlayersData as Player[]);
            
            const allWithdrawals: Withdrawal[] = [];
            // @ts-ignore
            (allPlayersData as Player[]).forEach(p => {
                if (p.withdrawalHistory && p.withdrawalHistory.length > 0) {
                     const userWds = p.withdrawalHistory.map(w => ({
                         ...w,
                         telegramId: w.telegramId || p.telegramId,
                         username: w.username || p.username
                     }));
                     allWithdrawals.push(...userWds);
                }
            });
            allWithdrawals.sort((a, b) => b.timestamp - a.timestamp);
            setWithdrawals(allWithdrawals);
        }
    };
    refreshData();
  }, []);

  useEffect(() => {
    if (tab === 'debug') {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('error_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);
            
            if (data) setLogs(data);
        };
        fetchLogs();
    }
  }, [tab]);

  const handleSaveToBackend = async () => {
      setIsSaving(true);
      setSaveStatus("Uploading...");
      try {
          const globalSettings = {
              adminConfig: config,
              tasks: tasks,
              stellarDeals: stellarDeals,
              dailyRewards: dailyRewards,
              upgrades: upgrades
          };
          const success = await saveGameSettings(globalSettings);
          
          if (success) {
              setSaveStatus("Success!");
          } else {
              setSaveStatus("Failed! Check Console.");
          }
          
          setTimeout(() => setSaveStatus(null), 3000);
      } catch (e) {
          console.error(e);
          setSaveStatus("Error!");
          setTimeout(() => setSaveStatus(null), 3000);
      } finally {
          setIsSaving(false);
      }
  };

  const handleConfigChange = (key: keyof AdminConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleDailyRewardChange = (index: number, amount: number) => {
      setDailyRewards(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], amount };
          return updated;
      });
  };

  const [newTask, setNewTask] = useState<Partial<any>>({ type: 'telegram', reward: 1000 });
  
  const addTask = () => {
    if (!newTask.title) return;
    const task: Task = {
      id: `task_${Date.now()}`,
      title: newTask.title,
      reward: Number(newTask.reward),
      type: newTask.type as any,
      icon: newTask.type === 'telegram' ? '✈️' : newTask.type === 'ads' ? '🎟️' : '📺',
      link: newTask.link || '',
      dailyLimit: Number(newTask.dailyLimit) || 1,
      secretCode: newTask.secretCode || '',
      // @ts-ignore
      chatId: newTask.chatId || '',
      // @ts-ignore
      expiresAt: newTask.expiresAt || undefined
    };
    setTasks([...tasks, task]);
    setNewTask({ type: 'telegram', reward: 1000 });
  };
  
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const autoCleanTasks = () => {
      const now = Date.now();
      let removedCount = 0;

      const activeTasks = tasks.filter(task => {
          // @ts-ignore
          if (task.expiresAt && new Date(task.expiresAt).getTime() <= now) {
              removedCount++;
              return false; 
          }

          if (players.length > 0) {
              const limit = task.dailyLimit || 1;
              const allCompleted = players.every(p => {
                  const progress = p.taskProgress?.[task.id] || 0;
                  if (task.type === 'telegram') {
                      return p.hasFollowedTelegram || progress >= 1;
                  }
                  return progress >= limit;
              });

              if (allCompleted) {
                  removedCount++;
                  return false; 
              }
          }

          return true; 
      });

      if (removedCount > 0) {
          setTasks(activeTasks);
          alert(`🧹 Cleaned up ${removedCount} tasks. Click 'SAVE CHANGES' to update the database.`);
      } else {
          alert("✅ All current tasks are still valid and active.");
      }
  };

  const [newDeal, setNewDeal] = useState<Partial<StellarDeal>>({ costType: 'stars', rewardType: 'stardust_boost' });
  const addDeal = () => {
    if (!newDeal.title) return;
    const deal: StellarDeal = {
        id: `deal_${Date.now()}`,
        title: newDeal.title,
        description: newDeal.description || '',
        icon: newDeal.icon || '📦',
        costType: newDeal.costType as any,
        cost: Number(newDeal.cost),
        rewardType: newDeal.rewardType as any,
        rewardValue: Number(newDeal.rewardValue) || 1000, 
        cooldown: Number(newDeal.cooldown) || 0
    };
    setStellarDeals([...stellarDeals, deal]);
  };
  const deleteDeal = (id: string) => setStellarDeals(stellarDeals.filter(d => d.id !== id));

  const [newAdUnit, setNewAdUnit] = useState<Partial<AdUnit>>({ type: 'rewarded', network: 'Adsgram', active: true });
  const addAdUnit = () => {
      if (!newAdUnit.name || !newAdUnit.blockId) return;
      const unit: AdUnit = {
          id: `au_${Date.now()}`,
          name: newAdUnit.name,
          network: newAdUnit.network || 'Adsgram',
          blockId: newAdUnit.blockId,
          type: newAdUnit.type || 'rewarded',
          active: newAdUnit.active ?? true
      };
      setConfig(prev => ({ ...prev, adUnits: [...(prev.adUnits || []), unit] }));
      setNewAdUnit({ type: 'rewarded', network: 'Adsgram', active: true, name: '', blockId: '' });
  };
  const deleteAdUnit = (id: string) => {
      setConfig(prev => ({ ...prev, adUnits: prev.adUnits.filter(u => u.id !== id) }));
  };

  const handleWithdrawalAction = async (id: string, action: 'Paid' | 'Rejected') => {
    const player = players.find(p => p.withdrawalHistory.some(w => w.id === id));
    if (!player) return;

    const updatedHistory = player.withdrawalHistory.map(w => w.id === id ? { ...w, status: action } : w);
    
    try {
        await supabase.from('players').update({ withdrawalHistory: updatedHistory }).eq('telegramid', player.telegramId); 
        
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: action } : w));
        setPlayers(prev => prev.map(p => p.telegramId === player.telegramId ? { ...p, withdrawalHistory: updatedHistory } : p));
    } catch(e) {
        console.error("Failed to update withdrawal", e);
    }
  };

  const toggleBan = async (id: string) => {
      const player = players.find(p => p.telegramId === id);
      if(!player) return;
      
      const newStatus = !player.isBanned;

      try {
          await supabase.from('players').update({ isBanned: newStatus }).eq('telegramid', id); 
          setPlayers(prev => prev.map(p => p.telegramId === id ? { ...p, isBanned: newStatus } : p));
      } catch (e) {
          console.error("Ban failed", e);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[200] overflow-y-auto text-white font-mono">
      <div className="bg-slate-900 border-b border-red-900 p-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
                <h1 className="font-bold text-red-500 uppercase tracking-widest text-lg">Overlord Console</h1>
                <p className="text-[10px] text-slate-500">GOD MODE ACTIVE</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleSaveToBackend} 
                disabled={isSaving}
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${saveStatus === 'Success!' ? 'bg-green-600 text-white' : saveStatus === 'Failed! Check Console.' ? 'bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
                {isSaving ? 'Saving...' : saveStatus || 'SAVE CHANGES'}
            </button>
            <button onClick={onBack} className="bg-slate-800 px-4 py-2 rounded border border-slate-700 text-xs hover:bg-slate-700">EXIT</button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950 sticky top-[73px] z-40">
        {['config', 'missions', 'fleet', 'ads', 'finance', 'users', 'debug'].map(t => (
            <button 
                key={t} 
                onClick={() => setTab(t as any)}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                {t}
            </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl mx-auto pb-24">
        
        {/* CONFIG TAB */}
        {tab === 'config' && (
            <div className="grid gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-red-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">Game Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Daily Cipher Words (Comma Separated for Day 1, Day 2, etc.)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. ALPHA, BRAVO, CHARLIE, SPACE"
                                value={config.dailyCipherWord} 
                                onChange={(e) => handleConfigChange('dailyCipherWord', e.target.value.toUpperCase())} 
                                className="bg-black border border-slate-700 p-2 rounded text-emerald-400 font-bold tracking-widest" 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Cipher Reward Amount</label>
                            <input type="number" value={config.dailyCipherReward} onChange={(e) => handleConfigChange('dailyCipherReward', Number(e.target.value))} className="bg-black border border-slate-700 p-2 rounded text-emerald-400 font-bold" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Min Withdrawal (TON)</label>
                            <input type="number" value={config.minWithdrawalTon} onChange={(e) => handleConfigChange('minWithdrawalTon', Number(e.target.value))} className="bg-black border border-slate-700 p-2 rounded text-cyan-400 font-bold" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Referral Reward (Stars)</label>
                            <input type="number" value={config.referralRewardStars} onChange={(e) => handleConfigChange('referralRewardStars', Number(e.target.value))} className="bg-black border border-slate-700 p-2 rounded text-yellow-400 font-bold" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Daily Reward Multiplier</label>
                            <input type="number" value={config.dailyRewardBase} onChange={(e) => handleConfigChange('dailyRewardBase', Number(e.target.value))} className="bg-black border border-slate-700 p-2 rounded text-purple-400 font-bold" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-red-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">Daily Reward Schedule</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {dailyRewards.map((reward, index) => (
                            <div key={index} className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Day {index + 1} ({reward.type === 'stars' ? 'Stars' : 'Stardust'})</label>
                                <input type="number" value={reward.amount} onChange={(e) => handleDailyRewardChange(index, Number(e.target.value))} className={`bg-black border border-slate-700 p-2 rounded font-bold ${reward.type === 'stars' ? 'text-yellow-400' : 'text-cyan-400'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* MISSIONS TAB */}
        {tab === 'missions' && (
            <div className="grid gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-red-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">Create Mission</h2>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input placeholder="Title" value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs col-span-2" />
                        <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any})} className="bg-black border border-slate-700 p-2 rounded text-xs">
                            <option value="telegram">Telegram</option>
                            <option value="youtube_video">YouTube Video</option>
                            <option value="youtube_shorts">YouTube Short</option>
                            <option value="ads">Watch Ads</option>
                        </select>
                        <input type="number" placeholder="Reward" value={newTask.reward} onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        <input placeholder="URL Link (https://...)" value={newTask.link || ''} onChange={e => setNewTask({...newTask, link: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        
                        {newTask.type === 'telegram' ? (
                            <input placeholder="Chat ID / @username (e.g. @mychannel)" value={newTask.chatId || ''} onChange={e => setNewTask({...newTask, chatId: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs border-purple-500/50" />
                        ) : (
                            <input placeholder="Secret Code (Optional)" value={newTask.secretCode || ''} onChange={e => setNewTask({...newTask, secretCode: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        )}

                        <input type="number" placeholder="Limit (e.g. 1)" value={newTask.dailyLimit} onChange={e => setNewTask({...newTask, dailyLimit: Number(e.target.value)})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        
                        <div className="col-span-2 flex flex-col gap-1 mt-2 border-t border-slate-800 pt-2">
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Expiration Date / Time (Optional)</label>
                            <input 
                                type="datetime-local" 
                                value={newTask.expiresAt || ''} 
                                onChange={e => setNewTask({...newTask, expiresAt: e.target.value})} 
                                className="bg-black border border-slate-700 p-2 rounded text-xs text-white" 
                            />
                        </div>
                    </div>
                    <button onClick={addTask} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-xs font-bold uppercase mt-2">Add Mission</button>
                    
                    <button onClick={autoCleanTasks} className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs font-bold uppercase mt-2 border border-slate-600">
                        🧹 Auto-Clean Expired / Completed Tasks
                    </button>
                </div>

                <div className="grid gap-3">
                    {tasks.map(t => {
                        // @ts-ignore
                        const isExpired = t.expiresAt && new Date(t.expiresAt).getTime() < Date.now();
                        
                        return (
                            <div key={t.id} className={`bg-slate-900/50 p-4 rounded flex justify-between items-center border ${isExpired ? 'border-red-900/50 opacity-60' : 'border-slate-800'}`}>
                                <div>
                                    <p className="font-bold text-sm">
                                        {t.title} 
                                        {isExpired && <span className="ml-2 text-[9px] bg-red-900/40 text-red-500 px-1.5 py-0.5 rounded">EXPIRED</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {/* @ts-ignore */}
                                        {t.type} • Reward: {t.reward} • {t.type === 'telegram' ? `Target: ${t.chatId || 'Link Only'}` : `Code: ${t.secretCode || 'None'}`}
                                    </p>
                                    {/* @ts-ignore */}
                                    {t.expiresAt && <p className={`text-[9px] mt-1 font-bold ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>Expiry: {new Date(t.expiresAt).toLocaleString()}</p>}
                                </div>
                                <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400 text-xs font-bold border border-red-900 px-3 py-1 rounded">DELETE</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* FLEET TAB */}
        {tab === 'fleet' && (
            <div className="grid gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-red-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">Add Stellar Deal</h2>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input placeholder="Title" value={newDeal.title || ''} onChange={e => setNewDeal({...newDeal, title: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        <input placeholder="Description" value={newDeal.description || ''} onChange={e => setNewDeal({...newDeal, description: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        <select value={newDeal.costType} onChange={e => setNewDeal({...newDeal, costType: e.target.value as any})} className="bg-black border border-slate-700 p-2 rounded text-xs">
                            <option value="stars">Cost: Stars</option>
                            <option value="stardust">Cost: Stardust</option>
                            <option value="ad">Cost: Watch Ad</option>
                        </select>
                        <input type="number" placeholder="Cost Amount" value={newDeal.cost} onChange={e => setNewDeal({...newDeal, cost: Number(e.target.value)})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        <select value={newDeal.rewardType} onChange={e => setNewDeal({...newDeal, rewardType: e.target.value as any})} className="bg-black border border-slate-700 p-2 rounded text-xs">
                            <option value="stardust_boost">Reward: Stardust</option>
                            <option value="energy_boost">Reward: Energy</option>
                        </select>
                        <input type="number" placeholder="Reward Value" value={newDeal.rewardValue as number} onChange={e => setNewDeal({...newDeal, rewardValue: Number(e.target.value)})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                    </div>
                    <button onClick={addDeal} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-xs font-bold uppercase">Add Deal</button>
                </div>
                
                 <div className="grid gap-3">
                    {stellarDeals.map(d => (
                        <div key={d.id} className="bg-slate-900/50 p-4 rounded flex justify-between items-center border border-slate-800">
                            <div>
                                <p className="font-bold text-sm">{d.title}</p>
                                <p className="text-[10px] text-slate-500">{d.description} • Cost: {d.cost} {d.costType}</p>
                            </div>
                            <button onClick={() => deleteDeal(d.id)} className="text-red-500 hover:text-red-400 text-xs font-bold border border-red-900 px-3 py-1 rounded">DELETE</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ADS TAB */}
        {tab === 'ads' && (
            <div className="grid gap-6">
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-red-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">Add Ad Unit</h2>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input placeholder="Unit Name (e.g. 'Level Up')" value={newAdUnit.name || ''} onChange={e => setNewAdUnit({...newAdUnit, name: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs" />
                        <input placeholder="Block/Unit ID" value={newAdUnit.blockId || ''} onChange={e => setNewAdUnit({...newAdUnit, blockId: e.target.value})} className="bg-black border border-slate-700 p-2 rounded text-xs font-mono" />
                        <select value={newAdUnit.network} onChange={e => setNewAdUnit({...newAdUnit, network: e.target.value as any})} className="bg-black border border-slate-700 p-2 rounded text-xs">
                            <option value="Adsgram">Adsgram</option>
                            <option value="Google">Google AdSense</option>
                            <option value="Adsterra">Adsterra</option>
                            <option value="Custom">Custom / Other</option>
                        </select>
                        <select value={newAdUnit.type} onChange={e => setNewAdUnit({...newAdUnit, type: e.target.value as any})} className="bg-black border border-slate-700 p-2 rounded text-xs">
                            <option value="rewarded">Rewarded Video</option>
                            <option value="interstitial">Interstitial</option>
                            <option value="banner">Banner</option>
                        </select>
                    </div>
                    <button onClick={addAdUnit} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-xs font-bold uppercase">Add Ad Unit</button>
                </div>

                <div className="grid gap-3">
                    {config.adUnits && config.adUnits.map(u => (
                        <div key={u.id} className="bg-slate-900/50 p-4 rounded flex justify-between items-center border border-slate-800">
                             <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm text-white">{u.name}</p>
                                    <span className={`text-[9px] px-1.5 rounded border ${u.type === 'rewarded' ? 'border-yellow-500/30 text-yellow-500' : 'border-blue-500/30 text-blue-500'}`}>{u.type}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                    <span className="text-slate-400">{u.network}</span> • ID: {u.blockId}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <button onClick={() => deleteAdUnit(u.id)} className="text-red-500 hover:text-red-400 text-xs font-bold border border-red-900 px-3 py-1 rounded">DELETE</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* FINANCE TAB */}
        {tab === 'finance' && (
             <div className="grid gap-4">
                 <h2 className="text-red-400 font-bold uppercase tracking-widest text-sm">Withdrawal Requests</h2>
                 {withdrawals.length === 0 ? (
                     <div className="text-slate-500 text-center py-8 text-xs">NO PENDING REQUESTS</div>
                 ) : (
                     withdrawals.map(w => {
                         const isUpi = w.method === 'UPI';
                         const amountDisplay = isUpi
                             ? `₹${(w.amountTon * TON_TO_INR_RATE).toLocaleString(undefined, {maximumFractionDigits: 0})}`
                             : `${w.amountTon.toFixed(2)} TON`;

                         return (
                             <div key={w.id} className="bg-slate-900 p-4 rounded border border-slate-800 flex justify-between items-center">
                                 <div>
                                     <p className="font-bold text-sm text-white">{w.username} <span className="text-slate-500 text-[10px]">({w.telegramId})</span></p>
                                     <p className={`text-xs font-mono ${isUpi ? 'text-orange-400' : 'text-cyan-400'}`}>{amountDisplay} → {w.address}</p>
                                     <p className="text-[10px] text-slate-500">{new Date(w.timestamp).toLocaleString()}</p>
                                 </div>
                                 <div className="flex gap-2">
                                     {w.status === 'Pending' ? (
                                         <>
                                            <button onClick={() => handleWithdrawalAction(w.id, 'Paid')} className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold">PAY</button>
                                            <button onClick={() => handleWithdrawalAction(w.id, 'Rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold">REJECT</button>
                                         </>
                                     ) : (
                                         <span className={`text-xs font-bold ${w.status === 'Paid' ? 'text-emerald-400' : 'text-red-400'}`}>{w.status.toUpperCase()}</span>
                                     )}
                                 </div>
                             </div>
                         );
                     })
                 )}
             </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
             <div className="grid gap-4">
                <h2 className="text-red-400 font-bold uppercase tracking-widest text-sm">User Database</h2>
                <div className="grid gap-2">
                    {players.map(p => (
                        <div key={p.telegramId} className="bg-slate-900 p-4 rounded border border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={p.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.username}`} className="w-8 h-8 rounded-full bg-slate-800" alt="" />
                                <div>
                                    <p className="font-bold text-sm">{p.username}</p>
                                    <p className="text-[10px] text-slate-500">Bal: {p.balance.toLocaleString()} • Lvl: {p.level}</p>
                                </div>
                            </div>
                            <button onClick={() => toggleBan(p.telegramId)} className={`px-3 py-1 rounded text-[10px] font-bold border ${p.isBanned ? 'bg-emerald-900 border-emerald-500 text-emerald-400' : 'bg-red-900 border-red-500 text-red-400'}`}>
                                {p.isBanned ? 'UNBAN' : 'BAN'}
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        {/* DEBUG TAB */}
        {tab === 'debug' && (
             <div className="grid gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-red-400 font-bold uppercase tracking-widest text-sm">System Error Logs</h2>
                    <button onClick={() => setTab('config')} className="text-xs text-slate-500 underline">Refresh Logs</button>
                </div>
                
                {logs.length === 0 ? (
                     <div className="text-slate-500 text-center py-8 text-xs border border-dashed border-slate-800 rounded-xl">NO ERRORS RECORDED</div>
                ) : (
                    <div className="grid gap-2">
                        {logs.map(log => (
                            <div key={log.id || Math.random()} className="bg-slate-900 p-4 rounded border border-red-900/30 flex flex-col gap-2 overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <span className="text-red-400 font-bold text-xs">{log.message}</span>
                                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono bg-black/40 p-2 rounded max-h-20 overflow-y-auto">
                                    {log.stack || 'No Stack Trace'}
                                </div>
                                <div className="flex gap-4 text-[10px] text-slate-600">
                                    <span>User: {log.user_id}</span>
                                    <span>Platform: {log.platform || 'Unknown'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        )}

      </div>
    </div>
  );
};

export default AdminView;
