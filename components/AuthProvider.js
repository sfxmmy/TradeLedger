'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signOut: () => {},
  isPro: false,
  isAdmin: false,
  hasAccess: false,
  supabase: null
})

// Create client outside component to ensure singleton
let globalSupabase = null
function getSupabase() {
  if (!globalSupabase && typeof window !== 'undefined') {
    globalSupabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return globalSupabase
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState(null)
  const initialized = useRef(false)

  // Initialize supabase client on mount
  useEffect(() => {
    const client = getSupabase()
    setSupabase(client)
  }, [])

  // Initialize auth once supabase is ready
  useEffect(() => {
    if (!supabase || initialized.current) return
    initialized.current = true

    let mounted = true

    // Failsafe timeout
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth timeout')
        setLoading(false)
      }
    }, 3000)

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          
          // Get profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (mounted) {
            setProfile(profileData || null)
          }
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth error:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData || null)
      } else {
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
  }

  const isAdmin = user?.email === 'ssiagos@hotmail.com'
  const isPro = profile?.subscription_status === 'active'
  const hasAccess = isAdmin || isPro

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      isPro,
      isAdmin,
      hasAccess,
      supabase
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
