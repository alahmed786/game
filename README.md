
# Alien Overlord: Space Tap

## Production Setup Guide

### 1. Database Setup (Supabase)
1. Go to your Supabase Project -> **SQL Editor**.
2. Run the following SQL to create the tables:

```sql
create table public.players (
  "telegramId" text not null primary key,
  username text,
  balance numeric default 0,
  level int default 1,
  stars int default 0,
  "gameState" jsonb default '{}'::jsonb,
  "lastUpdated" timestamp with time zone default timezone('utc'::text, now())
);

create table public.error_logs (
  id uuid default gen_random_uuid() primary key,
  message text,
  stack text,
  user_id text,
  platform text,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

alter table public.players enable row level security;
alter table public.error_logs enable row level security;

create policy "Enable all for players" on public.players for all using (true) with check (true);
create policy "Enable insert for logs" on public.error_logs for insert with check (true);
create policy "Enable read for logs" on public.error_logs for select using (true);
```

### 2. Environment Variables
1. Get your `ANON_KEY` from Supabase Settings -> API.
2. Update `.env` locally (for testing).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Vercel/Netlify project settings.

### 3. Deploy
- Push to GitHub.
- Import to Vercel.
- Paste the Vercel URL into @BotFather -> /mybots -> Bot Settings -> Menu Button / Web App.
