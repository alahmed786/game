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
      throw new Error('Missing telegramId or channelId')
    }

    // Call Telegram API
    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelId, user_id: telegramId })
    })

    const tgData = await tgResponse.json()

    if (!tgData.ok) {
        console.error("Telegram API Error:", tgData);
        // If user is not found or chat not found, they definitely haven't joined
        return new Response(JSON.stringify({ joined: false, error: tgData.description }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so frontend can handle "joined: false" gracefully
        })
    }

    const status = tgData.result.status
    // statuses: creator, administrator, member, restricted, left, kicked
    const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status)

    return new Response(JSON.stringify({ joined: isMember, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})