import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Your LSD Trading Discord Server ID - UPDATE THIS
const LSD_DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || 'YOUR_DISCORD_SERVER_ID'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const isDiscordLogin = searchParams.get('discord') === 'true'
  const redirect = searchParams.get('redirect')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // If this is a Discord login, verify server membership
      if (isDiscordLogin && data.session?.provider_token) {
        try {
          // Check if user is in the LSD Discord server
          const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${data.session.provider_token}`
            }
          })
          
          if (guildsResponse.ok) {
            const guilds = await guildsResponse.json()
            const isInServer = guilds.some(guild => guild.id === LSD_DISCORD_SERVER_ID)
            
            if (!isInServer) {
              // User is not in the LSD Discord server - sign them out
              await supabase.auth.signOut()
              return NextResponse.redirect(`${origin}/discord-login?error=not_member`)
            }
            
            // User is in server - mark them as having free access
            await supabase
              .from('profiles')
              .update({ subscription_status: 'active', discord_member: true })
              .eq('id', data.user.id)
          }
        } catch (err) {
          console.error('Discord guild check error:', err)
        }
      }

      // Create or update profile - use upsert to avoid conflicts
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Trader',
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          subscription_status: 'free',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
      } catch (profileError) {
        console.error('Profile upsert error:', profileError)
      }

      // Handle redirect for checkout flow
      if (redirect === 'checkout') {
        // Check if user already has subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.subscription_status === 'active') {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        
        // Redirect to pricing to complete purchase
        return NextResponse.redirect(`${origin}/pricing?checkout=true`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
