import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore
const BOT_TOKEN = Deno.env.get('BOT_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { telegramId, channelId } = await req.json()

    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set in Edge Function secrets.')
    }

    if (!telegramId || !channelId) {
      throw new Error('Missing telegramId or channelId in request payload.')
    }

    // Call Telegram API
    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelId, user_id: telegramId })
    })

    const tgData = await tgResponse.json()

    // If Telegram returns an error (e.g., user not found in chat, bot not admin)
    if (!tgData.ok) {
        console.error("Telegram API Error:", tgData);
        return new Response(JSON.stringify({ 
            joined: false, 
            error: tgData.description || "Verification failed. Ensure you have joined the channel." 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so frontend can handle the "joined: false" payload gracefully
        })
    }

    const status = tgData.result.status
    // Valid statuses that prove membership
    const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status)

    return new Response(JSON.stringify({ joined: isMember, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
