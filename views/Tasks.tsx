import React, { useState, useEffect } from 'react';
import { Player, Task } from '../types';
import { AD_COOLDOWN, LEVEL_BALANCE_REQUIREMENTS, calculateLevelUpAdsReq } from '../constants';
import { TasksViewProps } from '../types';
import { supabase } from '../utils/supabase';

// Formats the Ad Cooldown Time
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ✅ UPDATED: Formats the Expiration Time to include Seconds
const formatExpiry = (diffMs: number) => {
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

const TaskCard: React.FC<{
  task: Task;
  player: Player;
  isPending: boolean;
  onInitiateTask: (task: Task) => void;
  onClaimTask: (taskId: string, code: string) => boolean;
  onCancelTask: (taskId: string) => void;
  theme: string;
  onShowAd: TasksViewProps['onShowAd'];
}> = ({ task, player, isPending, onInitiateTask, onClaimTask, onCancelTask, theme, onShowAd }) => {
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adCooldownTime, setAdCooldownTime] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // ✅ NEW: Live Countdown State for Expiry
  const [expiryTimeLeft, setExpiryTimeLeft] = useState<number>(0);

  const getTaskStatus = (task: Task) => {
    const currentProgress = player.taskProgress[task.id] || 0;
    
    switch (task.type) {
      case 'telegram':
        const isTelegramDone = player.hasFollowedTelegram || currentProgress > 0;
        return { completed: isTelegramDone, progressText: '1/1' };
      case 'youtube_video':
        return { completed: currentProgress >= (task.dailyLimit || 1), progressText: `${currentProgress}/${task.dailyLimit || 1}` };
      case 'youtube_shorts':
        return { completed: currentProgress >= (task.dailyLimit || 1), progressText: `${currentProgress}/${task.dailyLimit || 1}` };
      case 'ads':
        const isComplete = currentProgress >= (task.dailyLimit || 1);
        return { completed: isComplete, progressText: `${currentProgress}/${task.dailyLimit || 1}` };
      default:
        return { completed: false, progressText: '' };
    }
  };
  
  const { completed, progressText } = getTaskStatus(task);

  // ✅ NEW: Live Countdown Effect
  useEffect(() => {
      // @ts-ignore
      if (!task.expiresAt || completed) return;

      const updateExpiry = () => {
          // @ts-ignore
          const diff = new Date(task.expiresAt).getTime() - Date.now();
          setExpiryTimeLeft(diff > 0 ? diff : 0);
      };

      updateExpiry(); // Initial call
      const interval = setInterval(updateExpiry, 1000);
      return () => clearInterval(interval);
  }, [task.expiresAt, completed]);

  // @ts-ignore - Dynamically update the text every second
  const isExpired = task.expiresAt && expiryTimeLeft <= 0;
  // @ts-ignore
  const expiryText = task.expiresAt ? formatExpiry(expiryTimeLeft) : null;

  useEffect(() => {
    if (task.type !== 'ads' || !player.lastAdWatched || completed) return;
    
    const updateCooldown = () => {
      const timePassed = Date.now() - (player.lastAdWatched || 0);
      const remaining = AD_COOLDOWN - timePassed;
      setAdCooldownTime(remaining > 0 ? remaining : 0);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [player.lastAdWatched, task.type, completed]);
  
  const handleClaim = () => {
    const success = onClaimTask(task.id, secretCode);
    if (!success) {
      setError('Incorrect Code');
    } else {
      setSecretCode('');
    }
  };
  
  const verifyTelegramMembership = async () => {
    setIsVerifying(true);
    let channelId = '@AlienLords_Channel';
    if (task.link && task.link.includes('t.me/')) {
        const parts = task.link.split('t.me/');
        if (parts[1]) channelId = '@' + parts[1].replace('/', '');
    }

    try {
        const { data, error } = await supabase.functions.invoke('verify-channel', {
            body: { 
                telegramId: player.telegramId,
                channelId: channelId 
            }
        });

        if (error) throw error;

        if (data && data.joined) {
             onInitiateTask(task);
        } else {
             alert(data?.error || "Verification failed. Please ensure you have joined the channel.");
             if (task.link) {
                 if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(task.link);
                 else window.open(task.link, '_blank');
             }
        }
    } catch (e) {
        console.error("Verification Error", e);
        alert("Unable to verify at this moment. Please try again later.");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleClick = () => {
      if (task.type === 'ads') {
          setIsAdLoading(true);
          onShowAd(
              () => {
                  setIsAdLoading(false);
                  onInitiateTask(task);
              },
              (msg) => {
                  setIsAdLoading(false);
                  alert(msg);
              }
          );
      } else if (task.type === 'telegram') {
          if (isPending) {
              verifyTelegramMembership();
          } else {
              onInitiateTask(task); 
          }
      } else {
          onInitiateTask(task);
      }
  };
  
  let buttonText = completed ? 'DONE' : 'GO';
  if (isExpired && !completed) {
      buttonText = 'EXPIRED';
  } else if (task.type === 'ads' && !completed) {
      buttonText = 'WATCH';
  } else if (task.type === 'telegram' && !completed) {
      buttonText = isPending ? 'CHECK' : 'JOIN';
  }
  
  const isAdOnCooldown = task.type === 'ads' && adCooldownTime > 0;
  const isDisabled = completed || isAdOnCooldown || isAdLoading || isVerifying || isExpired;
  
  const buttonClasses = `
    min-w-[5.5rem] h-10 px-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center transition-all duration-200 relative overflow-hidden group shadow-lg
    ${completed || isExpired
       ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed' 
       : isAdOnCooldown || isAdLoading || isVerifying
         ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/50 cursor-wait'
         : `bg-${theme}-500 text-white shadow-[0_0_20px_rgba(var(--bg-primary),0.5)] hover:bg-${theme}-400 hover:shadow-[0_0_30px_rgba(var(--bg-primary),0.7)] hover:scale-105 active:scale-95`
    }
  `;

  const iconClasses = `
    w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border transition-all duration-300 shadow-inner flex-shrink-0
    ${completed || isExpired
      ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 grayscale opacity-50' 
      : `bg-white dark:bg-slate-800 border-white/40 dark:border-white/10 shadow-lg group-hover:border-${theme}-500/30`
    }
  `;

  const containerClasses = `
    relative p-4 rounded-2xl border transition-all duration-300 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg
    ${completed || isExpired
      ? 'border-slate-200 dark:border-slate-800 opacity-70' 
      : `border-white/40 dark:border-white/10 hover:border-${theme}-500/30`
    }
    ${isPending && !completed && !isExpired ? `ring-1 ring-${theme}-500/50 bg-white/60 dark:bg-slate-900` : ''}
  `;

  const defaultView = (
    <>
      <div className="flex items-center gap-4 z-10 relative pr-2">
        <div className={iconClasses}>
          {task.icon}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={`font-bold text-sm leading-tight ${completed || isExpired ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${completed || isExpired ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500' : `bg-${theme}-50 dark:bg-${theme}-950/30 border-${theme}-200 dark:border-${theme}-500/30 text-${theme}-600 dark:text-${theme}-400`}`}>
              +{task.reward.toLocaleString()}
            </div>
            {task.dailyLimit && (
               <span className="text-[10px] text-slate-500 font-bold">{progressText}</span>
            )}
            
            {/* Live Expiry Countdown */}
            {expiryText && !completed && (
               <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                 {isExpired ? '❌ Expired' : `⏳ ${expiryText}`}
               </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClasses}
      >
         {isAdLoading ? '...' : isVerifying ? '...' : isAdOnCooldown ? formatTime(adCooldownTime) : buttonText}
      </button>
    </>
  );

  const secretCodeView = (
    <div className="w-full flex flex-col gap-4 relative z-10">
       <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
          <h3 className={`font-bold text-${theme}-600 dark:text-${theme}-400 text-xs uppercase tracking-wider flex items-center gap-2`}>
            <span className="animate-pulse">🔒</span> Enter Secret Code
          </h3>
          <button onClick={() => onCancelTask(task.id)} className="text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cancel</button>
       </div>
       
       <div className="flex gap-2">
          <input
            type="text"
            placeholder="INPUT CODE"
            value={secretCode}
            onChange={(e) => {
              setSecretCode(e.target.value);
              if (error) setError(null);
            }}
            className={`flex-1 bg-white/50 dark:bg-black/40 border rounded-lg text-center text-slate-900 dark:text-white font-mono p-3 text-sm focus:ring-2 focus:ring-${theme}-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 tracking-[0.2em]
              ${error ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : `border-slate-200 dark:border-white/10 focus:border-${theme}-500`}
            `}
          />
          <button
            onClick={handleClaim}
            className="px-6 rounded-lg font-bold text-xs uppercase tracking-widest bg-emerald-500 text-white shadow-lg active:scale-95 transition-all hover:bg-emerald-600"
          >
            Claim
          </button>
       </div>

      <div className="flex items-center justify-between">
        {error ? (
           <span className="text-red-500 dark:text-red-400 text-[10px] font-bold animate-pulse">⚠️ {error}</span>
        ) : <span/>}
        <a href={task.link} target="_blank" rel="noopener noreferrer" className={`text-${theme}-600 dark:text-${theme}-400 text-[10px] font-bold hover:text-${theme}-500 transition-colors flex items-center gap-1 group`}>
           Open Link <span className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">↗</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className={`${containerClasses} flex items-center justify-between group`}>
      {!completed && !isPending && !isExpired && <div className={`absolute inset-0 bg-gradient-to-r from-${theme}-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>}
      {isPending && !completed && !isExpired && task.type !== 'telegram' ? secretCodeView : defaultView}
    </div>
  );
};

const TasksView: React.FC<TasksViewProps> = ({ player, onInitiateTask, onClaimTask, onCancelTask, onWatchLevelUpAd, pendingTasks, theme, tasks, onShowAd }) => {
  const [isLevelAdWatching, setIsLevelAdWatching] = useState(false);
  const [levelAdError, setLevelAdError] = useState<string | null>(null);

  const nextLevelReq = LEVEL_BALANCE_REQUIREMENTS[player.level];
  const reqAds = calculateLevelUpAdsReq(player.level);
  const adsWatched = player.levelUpAdsWatched || 0;
  
  const isBalanceSufficient = nextLevelReq !== undefined && player.balance >= nextLevelReq;
  const isLevelMaxed = nextLevelReq === undefined;
  
  const handleWatchLevelAd = () => {
      setIsLevelAdWatching(true);
      setLevelAdError(null);
      
      onShowAd(
          () => {
              setIsLevelAdWatching(false);
              onWatchLevelUpAd();
          },
          (msg) => {
              setIsLevelAdWatching(false);
              setLevelAdError(msg);
          }
      );
  };
  
  const progressPercent = Math.min((adsWatched / reqAds) * 100, 100);
  const remainingAds = Math.max(0, reqAds - adsWatched);

  // We show ALL tasks here. The TaskCard will internally handle showing the "EXPIRED" state
  // This allows players to see they missed a task instead of it silently disappearing,
  // until the Admin uses the "Auto-Clean" button to remove it permanently from the DB.
  const activeTasks = tasks;

  return (
    <div className="pt-4 flex flex-col gap-6">
      {/* Header */}
      <div className="mx-4 relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900 border border-white/40 dark:border-white/5 shadow-2xl backdrop-blur-xl">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         <div className={`absolute top-0 right-0 w-32 h-32 bg-${theme}-500/20 blur-[60px]`}></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-[60px]"></div>
         
         <div className="relative z-10 p-6 text-center flex flex-col items-center gap-3">
             <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${theme}-100 to-white dark:from-${theme}-950 dark:to-slate-900 border border-${theme}-200 dark:border-${theme}-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(var(--bg-primary),0.2)]`}>
                <span className={`text-4xl drop-shadow-[0_0_10px_rgba(var(--bg-primary),0.8)]`}>🎯</span>
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Missions</h2>
                <p className={`text-xs text-${theme}-600 dark:text-${theme}-300/70 font-bold uppercase tracking-wide`}>Earn Resources & Rewards</p>
             </div>
         </div>
      </div>

      {/* Priority Level Up Mission */}
      {!isLevelMaxed && (
        <div className="px-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <span className="text-yellow-500 animate-pulse">⚠️</span> Priority Clearance
             </h3>
             <div className={`relative p-4 rounded-2xl border transition-all duration-300 bg-white/60 dark:bg-slate-900/90 backdrop-blur-md flex flex-col gap-4 group shadow-lg
                ${isBalanceSufficient ? `border-${theme}-500/50 shadow-[0_0_15px_rgba(var(--bg-primary),0.15)]` : 'border-slate-200 dark:border-slate-800 opacity-80'}
             `}>
                <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border transition-all duration-300 ${isBalanceSufficient ? `bg-gradient-to-br from-${theme}-100 to-white dark:from-${theme}-900 dark:to-slate-900 border-${theme}-200 dark:border-${theme}-500/30 text-slate-900 dark:text-white shadow-lg` : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 grayscale text-slate-400 dark:text-slate-600'}`}>
                            🚀
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className={`font-bold text-sm leading-tight ${isBalanceSufficient ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                Level {player.level + 1} Access
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold ${isBalanceSufficient ? `text-${theme}-600 dark:text-${theme}-400` : 'text-slate-500 dark:text-slate-600'}`}>
                                    {isBalanceSufficient ? "Security Protocol Active" : "Insufficient Resources"}
                                </span>
                            </div>
                        </div>
                    </div>
                     
                     {!isBalanceSufficient && (
                         <div className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded text-[10px] font-bold text-slate-500 border border-slate-300 dark:border-slate-700">
                            LOCKED
                         </div>
                     )}
                </div>

                {isBalanceSufficient && (
                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <span>Verification Progress</span>
                            <span className={`text-${theme}-600 dark:text-${theme}-400`}>{adsWatched} / {reqAds} ADS</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-${theme}-500 transition-all duration-500 ease-out`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        {levelAdError && <p className="text-red-500 dark:text-red-400 text-[10px] font-bold">{levelAdError}</p>}

                        <button
                            onClick={handleWatchLevelAd}
                            disabled={isLevelAdWatching}
                            className={`w-full h-12 mt-1 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative overflow-hidden
                                ${isLevelAdWatching
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 cursor-wait'
                                        : `bg-gradient-to-r from-${theme}-600 to-blue-600 text-white shadow-lg active:scale-[0.98] hover:shadow-[0_0_20px_rgba(var(--bg-primary),0.4)]`
                                }
                            `}
                        >
                            {isLevelAdWatching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>VERIFYING...</span>
                                </>
                            ) : (
                                <>
                                    <span>WATCH SECURITY AD</span>
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-[9px]">+{1}</span>
                                </>
                            )}
                        </button>
                        <p className="text-[9px] text-center text-slate-500 font-mono">
                            Watch {remainingAds} more ad{remainingAds !== 1 ? 's' : ''} to grant clearance.
                        </p>
                    </div>
                )}
             </div>
        </div>
      )}

      {/* Standard Task List */}
      <div className="flex flex-col gap-3 pb-24 px-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Standard Operations</h3>
        
        {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 mt-2 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl gap-3 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                <span className="text-5xl opacity-40 mb-2">📭</span>
                <span className="text-sm font-black uppercase tracking-widest text-center text-slate-600 dark:text-slate-400">No Tasks Available</span>
                <span className="text-[11px] font-bold text-center max-w-[200px] text-slate-500 dark:text-slate-500">Check back later for new missions and resource drops.</span>
            </div>
        ) : (
            activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                player={player}
                isPending={pendingTasks.includes(task.id)}
                onInitiateTask={onInitiateTask}
                onClaimTask={onClaimTask}
                onCancelTask={onCancelTask}
                theme={theme}
                onShowAd={onShowAd}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default TasksView;
