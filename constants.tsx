import { Upgrade, Booster, DailyReward, Task, StellarDeal, Theme, AdminConfig } from './types';

// Theme Configurations - Grays removed, replaced with vibrant/high-level colors
export const THEME_CONFIG: Record<Theme, { primary: string; secondary: string }> = {
  cyan: { primary: 'rgba(56, 189, 248, 0.2)', secondary: 'rgba(167, 139, 250, 0.15)' },
  blue: { primary: 'rgba(59, 130, 246, 0.2)', secondary: 'rgba(37, 99, 235, 0.15)' },
  indigo: { primary: 'rgba(99, 102, 241, 0.2)', secondary: 'rgba(79, 70, 229, 0.15)' },
  purple: { primary: 'rgba(168, 85, 247, 0.25)', secondary: 'rgba(147, 51, 234, 0.2)' },
  pink: { primary: 'rgba(236, 72, 153, 0.25)', secondary: 'rgba(219, 39, 119, 0.2)' },
  red: { primary: 'rgba(239, 68, 68, 0.25)', secondary: 'rgba(220, 38, 38, 0.2)' },
  orange: { primary: 'rgba(249, 115, 22, 0.25)', secondary: 'rgba(234, 88, 12, 0.2)' },
  yellow: { primary: 'rgba(250, 204, 21, 0.25)', secondary: 'rgba(202, 138, 4, 0.2)' },
  green: { primary: 'rgba(34, 197, 94, 0.25)', secondary: 'rgba(22, 163, 74, 0.2)' },
  teal: { primary: 'rgba(20, 184, 166, 0.25)', secondary: 'rgba(13, 148, 136, 0.2)' },
  emerald: { primary: 'rgba(16, 185, 129, 0.25)', secondary: 'rgba(5, 150, 105, 0.2)' },
  sky: { primary: 'rgba(14, 165, 233, 0.2)', secondary: 'rgba(2, 132, 199, 0.15)' },
  violet: { primary: 'rgba(139, 92, 246, 0.25)', secondary: 'rgba(124, 58, 237, 0.2)' },
  fuchsia: { primary: 'rgba(217, 70, 239, 0.25)', secondary: 'rgba(192, 38, 211, 0.2)' },
  rose: { primary: 'rgba(244, 63, 94, 0.25)', secondary: 'rgba(225, 29, 72, 0.2)' },
  amber: { primary: 'rgba(245, 158, 11, 0.25)', secondary: 'rgba(217, 119, 6, 0.2)' },
  lime: { primary: 'rgba(132, 204, 22, 0.25)', secondary: 'rgba(101, 163, 13, 0.2)' },
  crimson: { primary: 'rgba(220, 20, 60, 0.25)', secondary: 'rgba(178, 34, 34, 0.2)' },
  gold: { primary: 'rgba(255, 215, 0, 0.25)', secondary: 'rgba(218, 165, 32, 0.2)' },
  neonBlue: { primary: 'rgba(0, 255, 255, 0.25)', secondary: 'rgba(0, 206, 209, 0.2)' },
  neonPink: { primary: 'rgba(255, 20, 147, 0.25)', secondary: 'rgba(199, 21, 133, 0.2)' },
  'emerald-600': { primary: 'rgba(5, 150, 105, 0.25)', secondary: 'rgba(4, 120, 87, 0.2)' },
  'cyan-600': { primary: 'rgba(8, 145, 178, 0.2)', secondary: 'rgba(14, 116, 144, 0.15)' },
  'blue-600': { primary: 'rgba(37, 99, 235, 0.2)', secondary: 'rgba(29, 78, 216, 0.15)' },
  'purple-600': { primary: 'rgba(147, 51, 234, 0.25)', secondary: 'rgba(126, 34, 206, 0.2)' },
};

// Theme colors for each level (1-25)
const LEVEL_THEMES: Theme[] = [
  'cyan',        // Level 1
  'blue',        // Level 2
  'indigo',      // Level 3
  'purple',      // Level 4
  'pink',        // Level 5
  'red',         // Level 6
  'orange',      // Level 7
  'yellow',      // Level 8
  'green',       // Level 9
  'teal',        // Level 10
  'emerald',     // Level 11
  'sky',         // Level 12
  'violet',      // Level 13
  'fuchsia',     // Level 14
  'rose',        // Level 15
  'amber',       // Level 16
  'lime',        // Level 17
  'crimson',     // Level 18 
  'gold',        // Level 19 
  'neonBlue',    // Level 20 
  'neonPink',    // Level 21 
  'emerald-600', // Level 22 
  'cyan-600',    // Level 23
  'blue-600',    // Level 24
  'purple-600'   // Level 25
];

export const getLevelTheme = (level: number): Theme => {
  // Cap at level 25 (array index 24)
  const index = Math.min(level - 1, LEVEL_THEMES.length - 1);
  return LEVEL_THEMES[index];
};

// Rank System - Updated for up to level 25
export const getRankName = (level: number): string => {
  if (level >= 25) return 'GALACTIC EMPEROR';
  if (level >= 22) return 'COSMIC OVERLORD';
  if (level >= 19) return 'NEBULA TITAN';
  if (level >= 16) return 'STAR SOVEREIGN';
  if (level >= 13) return 'VOID MONARCH';
  if (level >= 10) return 'QUANTUM COMMANDER';
  if (level >= 8) return 'ASTRO KNIGHT';
  if (level >= 6) return 'SPACE CAPTAIN';
  if (level >= 4) return 'ORBIT PILOT';
  if (level >= 2) return 'COSMIC CADET';
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

// Level balance requirements for 25 levels with progressive scaling ending exactly at 1 Crore (10,000,000)
export const LEVEL_BALANCE_REQUIREMENTS: { [key: number]: number } = {
  1: 0,            // Level 1
  2: 50,           // Level 2
  3: 200,          // Level 3
  4: 500,          // Level 4
  5: 1000,         // Level 5
  6: 2500,         // Level 6
  7: 5000,         // Level 7
  8: 10000,        // Level 8
  9: 25000,        // Level 9
  10: 50000,       // Level 10
  11: 100000,      // Level 11
  12: 200000,      // Level 12
  13: 350000,      // Level 13
  14: 500000,      // Level 14
  15: 750000,      // Level 15
  16: 1000000,     // Level 16 - 10 Lakhs
  17: 1500000,     // Level 17
  18: 2000000,     // Level 18
  19: 3000000,     // Level 19
  20: 4000000,     // Level 20
  21: 5000000,     // Level 21 - 50 Lakhs
  22: 6500000,     // Level 22
  23: 8000000,     // Level 23
  24: 9000000,     // Level 24
  25: 10000000     // Level 25 - 1 Crore Max
};

// Calculate how many ads need to be watched to level up
export const calculateLevelUpAdsReq = (level: number): number => {
    if (level >= 25) return 0; // No ads needed for max level
    
    // Progressive ad requirements: more ads needed for higher levels
    const baseAds = 2;
    const extraAds = Math.floor((level - 1) / 3); // +1 ad every 3 levels
    return Math.min(baseAds + extraAds, 8); // Cap at 8 ads maximum
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

// Season 2 message for level 25 completion
export const SEASON_2_MESSAGE = {
  title: 'SEASON 1 COMPLETE!',
  message: 'Congratulations, Commander! You have mastered all 25 levels. Season 2 is coming soon with new galaxies, upgrades, and challenges!',
  rewards: {
    stars: 1000,
    stardust: 1000000,
    title: 'GALACTIC EMPEROR'
  }
};
