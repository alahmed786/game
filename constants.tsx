import { Upgrade, Booster, DailyReward, Task, StellarDeal, Theme, AdminConfig } from './types';

// Theme Configurations
export const THEME_CONFIG: Record<Theme, { primary: string; secondary: string }> = {
  cyan: { primary: 'rgba(56, 189, 248, 0.2)', secondary: 'rgba(167, 139, 250, 0.15)' },
  purple: { primary: 'rgba(168, 85, 247, 0.25)', secondary: 'rgba(236, 72, 153, 0.2)' },
  orange: { primary: 'rgba(249, 115, 22, 0.25)', secondary: 'rgba(234, 179, 8, 0.2)' },
  rose: { primary: 'rgba(244, 63, 94, 0.25)', secondary: 'rgba(139, 92, 246, 0.2)' },
  emerald: { primary: 'rgba(16, 185, 129, 0.25)', secondary: 'rgba(56, 189, 248, 0.2)' },
};

export const getLevelTheme = (level: number): Theme => {
  if (level < 3) return 'cyan';
  if (level < 5) return 'purple';
  if (level < 7) return 'emerald';
  if (level < 9) return 'orange';
  return 'rose';
};

// Rank System
export const getRankName = (level: number): string => {
  if (level >= 50) return 'ALIEN OVERLORD';
  if (level >= 40) return 'CELESTIAL TITAN';
  if (level >= 30) return 'QUANTUM MONARCH';
  if (level >= 20) return 'NEBULA LORD';
  if (level >= 15) return 'COSMIC ADMIRAL';
  if (level >= 10) return 'GALAXY RANGER';
  if (level >= 7) return 'FLEET CAPTAIN';
  if (level >= 4) return 'STAR PILOT';
  if (level >= 2) return 'VOID SCOUT';
  return 'SPACE CADET';
};

// Initial Admin Config
export const INITIAL_ADMIN_CONFIG: AdminConfig = {
  dailyCipherWord: 'SPACE',
  minWithdrawalTon: 3,
  referralRewardStars: 10,
  dailyRewardBase: 1, 
  dailyCipherReward: 5000,
  maintenanceMode: false,
  maintenanceEndTime: null,
  demoMode: false,
  adUnits: [
    { id: 'au_default_rewarded', name: 'Standard Rewarded', network: 'Adsgram', blockId: '0000', type: 'rewarded', active: true }
  ]
};

// ✅ 100% REMOVED: Void Manipulator. 
// ✅ UPDATED: Quantum Reactor Max Level 10, Wormhole Level 10 (cost 45 stars)
export const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'm1',
    name: 'Auto-Miner Drone',
    description: 'Basic drones that automate stardust collection. Essential for offline mining.',
    cost: 1500,
    costType: 'stardust',
    profitPerHour: 2500,
    level: 0,
    maxLevel: 25,
    category: 'Market',
    icon: '🤖',
  },
  {
    id: 's1',
    name: 'Quantum Reactor',
    description: 'Permanently increases Stardust gained per tap.',
    cost: 8,
    cptBoost: 2,
    level: 0,
    maxLevel: 10,
    category: 'Special',
    icon: '🌀',
    costType: 'stars',
  },
  {
    id: 's4',
    name: 'Energy Siphon',
    description: 'Permanently boosts the Stardust you earn when holding down the orb.',
    cost: 30,
    holdMultiplierBoost: 0.1,
    level: 0,
    maxLevel: 5,
    category: 'Special',
    icon: '⚡',
    unlockLevel: 6,
    costType: 'stars',
  },
  {
    id: 's5',
    name: 'Wormhole Profits',
    description: 'Allows your empire to accumulate Stardust while you are offline. Requires Auto-Miners to function!',
    cost: 45, 
    level: 0,
    maxLevel: 1,
    category: 'Special',
    icon: '🌌',
    unlockLevel: 10, 
    costType: 'stars',
  },
];

// ✅ 100% REMOVED: Meteor Mining. 
export const INITIAL_STELLAR_DEALS: StellarDeal[] = [
  {
    id: 'ad_supply_drop',
    title: 'Orbital Supply Drop',
    description: 'Watch a brief transmission to receive an instant cache of 2,000 Stardust.',
    icon: '📦',
    costType: 'ad',
    cost: 1,
    rewardType: 'stardust_boost',
    rewardValue: 2000,
    cooldown: 3600000, 
  },
  {
    id: 'boost_auto_pilot',
    title: 'Auto Pilot',
    description: "Generate 150 Stardust per hour. This boost lasts for 5 hours.",
    icon: '🤖',
    costType: 'stars',
    cost: 24,
    rewardType: 'passive_income_boost',
    rewardValue: { pph: 150, duration: 18000000 },
    unlockLevel: 14,
  },
  {
    id: 'ad_energy_refill',
    title: 'Emergency Recharge',
    description: 'Watch an ad to instantly restore 500 energy points.',
    icon: '🔋',
    costType: 'ad',
    cost: 1,
    rewardType: 'energy_boost',
    rewardValue: 500,
    cooldown: 3600000,
  },
  {
    id: 'ad_free_upgrade',
    title: 'Forbidden Tech Archive',
    description: 'Uncover ancient alien blueprints (Watch Ad) to instantly upgrade your cheapest technology level.',
    icon: '📜',
    costType: 'ad',
    cost: 1,
    rewardType: 'free_upgrade',
    rewardValue: 1,
    cooldown: 14400000, 
  },
];

export const MAX_ENERGY = 1000;
export const ENERGY_REFILL_DURATION_SECONDS = 3600; 
export const ENERGY_REGEN_RATE = MAX_ENERGY / ENERGY_REFILL_DURATION_SECONDS;

export const INITIAL_DAILY_REWARDS: DailyReward[] = [
  { type: 'stardust', amount: 500 },
  { type: 'stardust', amount: 1200 },
  { type: 'stardust', amount: 2500 },
  { type: 'stardust', amount: 5000 },
  { type: 'stardust', amount: 10000 },
  { type: 'stardust', amount: 25000 },
  { type: 'stars', amount: 5 }, 
];

export const MORSE_CODE_MAP: { [key: string]: string } = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
};

export const HOLD_TICK_RATE_MS = 100;
export const HOLD_EARN_MULTIPLIER = 0.2;
export const HOLD_ENERGY_DRAIN_PER_TICK = 1;
export const WITHDRAWAL_COOLDOWN_MS = 86400000; 

const generateLevelRequirements = (): number[] => {
  const levels = [0, 1000, 5000, 10000]; 
  const growthFactor = 1.16;
  for (let i = 4; i < 50; i++) {
    const nextReq = Math.floor(levels[i - 1] * growthFactor);
    levels.push(nextReq);
  }
  levels[49] = 10000000; 
  return levels;
};
export const LEVEL_BALANCE_REQUIREMENTS = generateLevelRequirements();

export const calculateLevelUpAdsReq = (level: number): number => {
    const index = (level - 1) % 5;
    return (index + 1) * 2;
};

export const BOOSTERS: Booster[] = [
  {
    id: 'energy_refill',
    name: 'Full Reactor',
    description: 'Instantly refill your energy to maximum.',
    icon: '🚀'
  }
];

export const BOOSTER_CLAIM_COOLDOWN = 180000;

export const INITIAL_TASKS: Task[] = [
  {
    id: 'follow_telegram',
    title: 'Follow Telegram Channel',
    reward: 1000,
    icon: '✈️',
    type: 'telegram',
    link: 'https://t.me/telegram'
  },
  {
    id: 'watch_youtube_video',
    title: 'Watch YouTube Video',
    reward: 1200,
    icon: '📺',
    type: 'youtube_video',
    dailyLimit: 3,
    link: 'http://youtube.com',
    secretCode: '1234'
  },
  {
    id: 'watch_ads',
    title: 'Watch 5 Ads',
    reward: 1500,
    icon: '🎟️',
    type: 'ads',
    dailyLimit: 5
  }
];

export const AD_COOLDOWN = 60000;
