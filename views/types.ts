import React from 'react';

export type ActiveBoost = {
  sourceId: string; // e.g., 'boost_meteor_mining'
  expiresAt: number;
} & (
  | { type: 'cpt'; multiplier: number; }
  | { type: 'passive_income'; pph: number; }
);

export interface Withdrawal {
  id: string;
  telegramId: string; // Added to track who requested
  username: string;   // Added for display
  method: 'TON' | 'UPI';
  address: string;
  amountTon: number;
  amountStardust: number;
  timestamp: number;
  status: 'Pending' | 'Paid' | 'Rejected';
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  user_id?: string;
  timestamp: string;
  platform?: string;
}

export interface Player {
  telegramId: string;
  username: string;
  photoUrl?: string;
  balance: number;
  coinsPerTap: number;
  passivePerHour: number;
  maxEnergy: number;
  currentEnergy: number;
  lastUpdate: number;
  lastRewardClaimed: number | null;
  consecutiveDays: number;
  dailyCipherClaimed: boolean;
  level: number;
  levelUpAdsWatched: number; 
  stars: number;
  lastBoosterClaimed: number | null;
  holdMultiplier: number;
  hasOfflineEarnings: boolean;
  hasFollowedTelegram: boolean;
  taskProgress: Record<string, number>; // New: Track progress per task ID
  lastTasksReset: number;
  lastAdWatched: number | null;
  activeBoosts: ActiveBoost[];
  lastDealPurchases: Record<string, number>;
  withdrawalHistory: Withdrawal[];
  lastWithdrawalTime: number | null; // New: Track last payout time
  activeAutoMiner: 'm1' | 'm2' | null;
  referralCount: number;
  invitedBy?: string;
  isBanned?: boolean;
}

export interface Upgrade {
  id: string;
  name:string;
  description: string;
  cost: number;
  profitPerHour?: number;
  cptBoost?: number;
  holdMultiplierBoost?: number;
  level: number;
  maxLevel: number;
  category: 'Market' | 'Special';
  icon: string;
  unlockLevel?: number;
  costType?: 'stardust' | 'stars';
}

export interface StellarDeal {
  id: string;
  title: string;
  description: string;
  icon: string;
  costType: 'ad' | 'stardust' | 'stars';
  cost: number;
  rewardType: 'energy_boost' | 'stardust_boost' | 'cpt_boost' | 'free_upgrade' | 'passive_income_boost';
  rewardValue: number | { multiplier: number; duration: number } | { pph: number; duration: number };
  cooldown?: number;
  unlockLevel?: number;
}

export type View = 'Earn' | 'Upgrades' | 'Tasks' | 'Leaderboard' | 'Wallet' | 'DailyReward' | 'DailyCipher' | 'Admin';

export interface FloatingText {
  id: number;
  value: number;
}

export interface Booster {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type DailyReward = {
  type: 'stardust' | 'stars';
  amount: number;
};

export type Theme = 'cyan' | 'purple' | 'orange' | 'rose' | 'emerald';

// --- New Admin Types ---
export interface AdUnit {
  id: string;
  name: string;
  network: 'Adsgram' | 'Google' | 'Adsterra' | 'Custom';
  blockId: string;
  type: 'interstitial' | 'rewarded' | 'banner';
  active: boolean;
}

export interface AdminConfig {
  dailyCipherWord: string;
  minWithdrawalTon: number;
  referralRewardStars: number;
  dailyRewardBase: number; 
  dailyCipherReward: number; 
  adUnits: AdUnit[]; 
  // ✅ NEW ADDITIONS FOR MAINTENANCE & DEMO MODE
  maintenanceMode: boolean;
  maintenanceEndTime: number | null; // Unix timestamp for countdown
  demoMode: boolean; // Enables test balance/levels, bypasses real ads
}

export interface EarnViewProps {
  player: Player;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  floatingTexts: FloatingText[];
  onDailyRewardClick: () => void;
  onCipherClick: () => void;
  isRewardAvailable: boolean;
  onActivateBooster: () => void;
  pendingHoldReward: number | null;
  isClaimModalVisible: boolean;
  onClaimHoldReward: () => void;
  onCancelHoldReward: () => void;
  currentHoldAmount: number;
  isRewardUrgent: boolean;
  isCipherClaimed: boolean;
  theme: Theme;
  onShowAd: (onComplete: () => void, onError: (msg: string) => void) => void;
  isDarkMode: boolean; // Added from recent updates
  toggleTheme: () => void; // Added from recent updates
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  icon: string;
  type: 'telegram' | 'youtube_video' | 'youtube_shorts' | 'ads';
  dailyLimit?: number;
  link?: string;
  secretCode?: string; 
  chatId?: string; // Added from recent updates
  expiresAt?: string; // Added from recent updates
}

export interface TasksViewProps {
  player: Player;
  onInitiateTask: (task: Task) => void;
  onClaimTask: (taskId: string, code: string) => boolean;
  onCancelTask: (taskId: string) => void;
  onWatchLevelUpAd: () => void; 
  pendingTasks: string[];
  theme: Theme;
  tasks: Task[]; 
  onShowAd: (onComplete: () => void, onError: (msg: string) => void) => void;
}

export interface UpgradesViewProps {
  upgrades: Upgrade[];
  player: Player;
  onBuy: (id: string) => void;
  onBuyStellarDeal: (deal: StellarDeal) => void;
  isDealAdModalVisible: boolean;
  dealToProcess: StellarDeal | null;
  onConfirmDealAd: () => void;
  onCancelDealAd: () => void;
  theme: Theme;
  stellarDeals: StellarDeal[]; 
  onShowAd: (onComplete: () => void, onError: (msg: string) => void) => void;
}

export interface DailyRewardViewProps {
  player: Player;
  onClaim: () => void;
  onBack: () => void;
  isRewardAvailable: boolean;
  theme: Theme;
  rewards: DailyReward[]; 
}

export interface DailyCipherViewProps {
  onSolve: () => void;
  onBack: () => void;
  isCipherClaimed: boolean;
  theme: Theme;
  cipherWord: string; 
}

export interface LeaderboardViewProps {
  player: Player;
  theme: Theme;
  referralReward: number; 
  leaderboardData?: Player[];
  userRank: number; 
}

export interface WalletViewProps {
  player: Player;
  onWithdraw: (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => void;
  theme: Theme;
  minWithdrawal: number; 
  onShowAd: (onComplete: () => void, onError: (msg: string) => void) => void;
}

export interface AdminViewProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  stellarDeals: StellarDeal[];
  setStellarDeals: React.Dispatch<React.SetStateAction<StellarDeal[]>>;
  upgrades: Upgrade[];
  setUpgrades: React.Dispatch<React.SetStateAction<Upgrade[]>>;
  withdrawals: Withdrawal[];
  setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>;
  players: Player[]; 
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>; 
  dailyRewards: DailyReward[];
  setDailyRewards: React.Dispatch<React.SetStateAction<DailyReward[]>>;
  onBack: () => void;
}
