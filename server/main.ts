
/*
 * NOTE: This is the server-side code intended to run on a Node.js/Express environment.
 * It is provided here as part of the full stack delivery.
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import Redis from 'ioredis';

const app = express();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(express.json());

// Telegram Data Validation Middleware
const validateTelegramInitData = (req: any, res: any, next: any) => {
  const initData = req.headers['x-tg-init-data'];
  if (!initData) return res.status(401).send('Unauthorized');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const sortedParams = Array.from(params.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN || '')
    .digest();

  const computedHash = crypto.createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex');

  if (computedHash !== hash) return res.status(403).send('Invalid Signature');
  
  const user = JSON.parse(params.get('user') || '{}');
  req.userId = user.id.toString();
  next();
};

// --- REAL TELEGRAM API VERIFICATION ---
app.post('/api/v1/verify_channel', validateTelegramInitData, async (req: any, res) => {
    const { channelId } = req.body; // e.g., "@AlienLords_Channel" or "-100..."

    if (!channelId) return res.status(400).json({ error: 'Channel ID required' });

    try {
        const botToken = process.env.BOT_TOKEN;
        const tgApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${req.userId}`;
        
        const response = await fetch(tgApiUrl);
        const data = await response.json();

        if (!data.ok) {
            return res.status(400).json({ joined: false, error: data.description });
        }

        const status = data.result.status;
        const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);

        if (isMember) {
             // Optional: Log success or update DB immediately here if using Prisma
             return res.json({ joined: true });
        } else {
             return res.json({ joined: false });
        }
    } catch (e) {
        console.error("Telegram API Error:", e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoints
app.get('/api/v1/init', validateTelegramInitData, async (req: any, res) => {
  let player = await prisma.player.findUnique({
    where: { telegramId: req.userId },
    include: { upgrades: true }
  });

  if (!player) {
    player = await prisma.player.create({
      data: {
        telegramId: req.userId,
        balance: '1000',
        coinsPerTap: 1,
        passivePerHour: 0,
        maxEnergy: 1000,
        currentEnergy: 1000
      } as any,
      include: { upgrades: true }
    });
  }

  // Handle Offline Progress
  const secondsSinceLastUpdate = (Date.now() - new Date(player.lastEnergyUpdate).getTime()) / 1000;
  const passiveIncome = Math.floor((player.passivePerHour / 3600) * secondsSinceLastUpdate);
  const energyGained = Math.floor(secondsSinceLastUpdate * 2);
  
  const updatedPlayer = await prisma.player.update({
    where: { telegramId: req.userId },
    data: {
      balance: (BigInt(player.balance) + BigInt(passiveIncome)).toString(),
      currentEnergy: Math.min(player.maxEnergy, player.currentEnergy + energyGained),
      lastEnergyUpdate: new Date()
    }
  });

  res.json(updatedPlayer);
});

app.post('/api/v1/tap', validateTelegramInitData, async (req: any, res) => {
  const { taps } = req.body;
  if (taps > 20) return res.status(429).send('Too many taps');

  // Use Redis for rate limiting
  const rateLimitKey = `tap:${req.userId}`;
  const tapCount = await redis.incr(rateLimitKey);
  if (tapCount === 1) await redis.expire(rateLimitKey, 1);
  if (tapCount > 20) return res.status(429).send('Rate limit exceeded');

  const player = await prisma.player.findUnique({ where: { telegramId: req.userId } });
  if (!player || player.currentEnergy < taps) return res.status(400).send('Not enough energy');

  const updated = await prisma.player.update({
    where: { telegramId: req.userId },
    data: {
      balance: (BigInt(player.balance) + BigInt(taps * player.coinsPerTap)).toString(),
      currentEnergy: player.currentEnergy - taps,
      lastEnergyUpdate: new Date()
    }
  });

  res.json(updated);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Alien Lord server online on port ${PORT}`));
