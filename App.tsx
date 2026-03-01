import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';

// Modals and UI Components
import IntroScreen from './components/IntroScreen';
import StatsHeader from './components/StatsHeader';
import Navigation from './components/Navigation';
import MaintenanceScreen from './components/MaintenanceScreen';
import OfflineEarningsModal from './components/OfflineEarningsModal';
import ProfileModal from './components/ProfileModal';

// Views
import EarnView from './views/Earn';
import UpgradesView from './views/Upgrades';
import TasksView from './views/Tasks';
import LeaderboardView from './views/Leaderboard';
import WalletView from './views/Wallet';
import DailyRewardView from './views/DailyReward';
import DailyCipherView from './views/DailyCipher';
import AdminView from './views/Admin';

const App: React.FC = () => {
  // Connect the "Brains" (Logic) to the "Looks" (UI)
  const { state, actions } = useGameEngine();

  // Destructure State for easy access
  const {
    showIntro, view, adminConfig, tasks, upgrades, stellarDeals, dailyRewards, globalWithdrawals, allPlayers, userRank, player, floatingTexts,
    pendingHoldReward, isClaimModalVisible, currentHoldAmount, offlineEarnings, isProfileModalVisible, isRewardUrgent, pendingTasks,
    animateBalance, showLevelAlert, theme, isDarkMode, dealToProcess, isDealAdModalVisible, ADMIN_ID
  } = state;

  // Destructure Actions for easy access
  const {
    setShowIntro, setView, setAdminConfig, setTasks, setUpgrades, setStellarDeals, setDailyRewards, setGlobalWithdrawals, setAllPlayers,
    setPlayer, setPendingHoldReward, setIsClaimModalVisible, setOfflineEarnings, setIsProfileModalVisible, setDealToProcess, setIsDealAdModalVisible, 
    toggleThemeMode, handleShowAd, handleClaimOfflineEarnings, handleHoldStart, handleHoldEnd, handleClaimHoldReward, handleCancelHoldReward, 
    buyUpgrade, handleBuyStellarDeal, handleConfirmDealAd, handleClaimReward, handleSolveCipher, handleActivateBooster, handleWatchLevelUpAd, 
    handleInitiateTask, handleCancelTask, handleClaimTask, handleWithdrawal, handleDeleteAccount
  } = actions;

  // Global App States
  if (showIntro) return <IntroScreen isDataReady={!!player} onFinished={() => setShowIntro(false)} isDarkMode={isDarkMode} />;
  if (!player) return <div className="flex h-screen items-center justify-center text-cyan-400 font-bold animate-pulse">RE-ESTABLISHING UPLINK...</div>;
  if (player.isBanned) return <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 text-center z-[1000]"><span className="text-6xl mb-4">🚫</span><h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">ACCESS DENIED</h1></div>;

  const isMaintenanceActive = adminConfig.maintenanceMode && adminConfig.maintenanceEndTime && Date.now() < adminConfig.maintenanceEndTime;
  if (isMaintenanceActive && player.telegramId !== ADMIN_ID) {
      return <MaintenanceScreen endTime={adminConfig.maintenanceEndTime as number} isDarkMode={isDarkMode} onFinished={() => setAdminConfig(prev => ({ ...prev, maintenanceMode: false }))} />;
  }

  const isRewardAvailable = !player.lastRewardClaimed || Date.now() - player.lastRewardClaimed > 86400000;
  const handleOpenAdmin = () => { if (player.telegramId === ADMIN_ID) setView('Admin'); else alert("Access Denied."); };

  // View Router
  const renderView = () => {
    switch(view) {
      case 'Earn': return (
        <EarnView 
            player={player} onHoldStart={handleHoldStart} onHoldEnd={handleHoldEnd} floatingTexts={floatingTexts} 
            onDailyRewardClick={() => setView('DailyReward')} onCipherClick={() => setView('DailyCipher')} 
            isRewardAvailable={isRewardAvailable} onActivateBooster={handleActivateBooster} pendingHoldReward={pendingHoldReward} 
            isClaimModalVisible={isClaimModalVisible} onClaimHoldReward={handleClaimHoldReward} onCancelHoldReward={handleCancelHoldReward} 
            currentHoldAmount={currentHoldAmount} isRewardUrgent={isRewardUrgent} isCipherClaimed={player.dailyCipherClaimed} 
            theme={theme} onShowAd={handleShowAd} isDarkMode={isDarkMode} toggleTheme={toggleThemeMode}
        />
      );
      case 'Upgrades': return (
        <UpgradesView 
            upgrades={upgrades} stellarDeals={stellarDeals} player={player} onBuy={buyUpgrade} onBuyStellarDeal={handleBuyStellarDeal} 
            isDealAdModalVisible={isDealAdModalVisible} dealToProcess={dealToProcess} onConfirmDealAd={handleConfirmDealAd} 
            onCancelDealAd={() => setIsDealAdModalVisible(false)} theme={theme} onShowAd={handleShowAd} 
        />
      );
      case 'Tasks': return (
        <TasksView 
            player={player} onInitiateTask={handleInitiateTask} onClaimTask={handleClaimTask} onCancelTask={handleCancelTask} 
            onWatchLevelUpAd={handleWatchLevelUpAd} pendingTasks={pendingTasks} theme={theme} tasks={tasks} onShowAd={handleShowAd} 
        />
      );
      case 'Leaderboard': return (
        <LeaderboardView player={player} theme={theme} referralReward={adminConfig.referralRewardStars} leaderboardData={allPlayers} userRank={userRank} />
      );
      case 'Wallet': return (
        <WalletView player={player} onWithdraw={handleWithdrawal} theme={theme} minWithdrawal={adminConfig.minWithdrawalTon} onShowAd={handleShowAd} />
      );
      case 'DailyReward': return (
        <DailyRewardView player={player} onClaim={handleClaimReward} onBack={() => setView('Earn')} isRewardAvailable={isRewardAvailable} theme={theme} rewards={dailyRewards} />
      );
      case 'DailyCipher': return (
        <DailyCipherView onSolve={handleSolveCipher} onBack={() => setView('Earn')} isCipherClaimed={player.dailyCipherClaimed} theme={theme} cipherWord={adminConfig.dailyCipherWord} />
      );
      case 'Admin': 
        if (player.telegramId !== ADMIN_ID) return null;
        return (
            <AdminView 
                config={adminConfig} setConfig={setAdminConfig} tasks={tasks} setTasks={setTasks} stellarDeals={stellarDeals} setStellarDeals={setStellarDeals}
                upgrades={upgrades} setUpgrades={setUpgrades} withdrawals={globalWithdrawals} setWithdrawals={setGlobalWithdrawals}
                players={allPlayers} setPlayers={setAllPlayers} dailyRewards={dailyRewards} setDailyRewards={setDailyRewards} onBack={() => setView('Earn')}
            />
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden relative">
      
      {/* Modals & Overlays */}
      {isProfileModalVisible && (
          <ProfileModal player={player} onClose={() => setIsProfileModalVisible(false)} onDelete={handleDeleteAccount} isDarkMode={isDarkMode} theme={theme} />
      )}

      {offlineEarnings !== null && (
          <OfflineEarningsModal amount={offlineEarnings} onClaim={handleClaimOfflineEarnings} isDarkMode={isDarkMode} />
      )}

      {adminConfig.demoMode && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] pointer-events-none animate-pulse">
            Demo Mode Active
          </div>
      )}

      {showLevelAlert && (
          <div className="absolute top-[80px] left-4 right-4 z-[100] pointer-events-auto">
             <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-${theme}-400 dark:border-${theme}-500/80 shadow-[0_0_25px_0px_var(--tw-shadow-color)] shadow-${theme}-400/50 dark:shadow-${theme}-500/40 p-4 rounded-2xl flex items-center gap-3 animate-slide-down-fade`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 animate-pulse flex-shrink-0">🚀</div>
                <div className="flex flex-col flex-1">
                   <h4 className={`text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm drop-shadow-sm`}>Level {player.level + 1} Ready!</h4>
                   <p className="text-slate-600 dark:text-slate-400 text-[9px] uppercase font-bold tracking-wider mt-0.5 leading-tight">Go to missions and complete the security check to unlock.</p>
                </div>
                <button onClick={() => { setView('Tasks'); setShowLevelAlert(false); }} className={`bg-gradient-to-r from-${theme}-500 to-${theme}-600 dark:from-${theme}-600 dark:to-${theme}-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-${theme}-500/30 active:scale-95 transition-transform flex-shrink-0`}>GO</button>
             </div>
             <style>{`@keyframes slideDownFade { 0% { opacity: 0; transform: translateY(-20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } } .animate-slide-down-fade { animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
          </div>
      )}

      {/* Main Layout */}
      <div className='flex flex-col h-full'>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <StatsHeader player={player} animateBalance={animateBalance} theme={theme} onOpenAdmin={handleOpenAdmin} showAdminLock={player.telegramId === ADMIN_ID} onOpenProfile={() => setIsProfileModalVisible(true)} />
        )}
        
        <div className={`flex-1 overflow-y-auto ${view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' ? 'pb-24' : ''}`}>
          {renderView()}
        </div>

        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <Navigation currentView={view} onViewChange={setView} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default App;
