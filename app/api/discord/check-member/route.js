import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { accessToken } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json({ isMember: false, error: 'No access token' }, { status: 400 })
    }

    const discordGuildId = process.env.DISCORD_GUILD_ID

    if (!discordGuildId) {
      // If no guild ID configured, assume member
      return NextResponse.json({ isMember: true })
    }

    // Get user's guilds from Discord API
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!guildsResponse.ok) {
      console.error('Discord API error:', guildsResponse.status)
      return NextResponse.json({ isMember: false, error: 'Discord API error' }, { status: 500 })
    }

    const guilds = await guildsResponse.json()
    const isMember = guilds.some(guild => guild.id === discordGuildId)

    return NextResponse.json({ isMember })

  } catch (error) {
    console.error('Discord check error:', error)
    return NextResponse.json({ isMember: false, error: error.message }, { status: 500 })
  }
}
