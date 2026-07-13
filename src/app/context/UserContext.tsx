'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/app/lib/supabase'

type UserContextType = {
  userId: string           // Supabase auth uid — this is profiles.id / orders.customer_id
  username: string
  phone: string
  setUser: (username: string, phone: string) => Promise<void>
  hasUser: boolean
  ready: boolean            // true once the anonymous session + profile lookup finish
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [ready, setReady] = useState(false)

  // Resolve (or create) an anonymous Supabase Auth session on first load —
  // Supabase's client persists that session in the browser on its own, so
  // this replaces the old hand-rolled localStorage id entirely. Then load
  // any existing profile tied to that session.
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      let uid = session?.user?.id

      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Anonymous sign-in failed', error)
          setReady(true)
          return
        }
        uid = data.user?.id
      }

      if (!uid) {
        setReady(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', uid)
        .maybeSingle()

      if (!cancelled) {
        setUserId(uid)
        setUsername(profile?.full_name ?? '')
        setPhone(profile?.phone ?? '')
        setReady(true)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  async function setUser(name: string, phoneNumber: string) {
    if (!userId) return
    const trimmedName = name.trim()

    // profiles.email is NOT NULL + UNIQUE; anonymous auth users don't have
    // a real email, so use a synthetic one tied to their auth id.
    const syntheticEmail = `${userId}@customers.waakyeplug.app`

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: trimmedName,
      phone: phoneNumber,
      email: syntheticEmail,
      role: 'customer',
    })

    if (error) {
      console.error('Could not save profile', error)
      return
    }

    setUsername(trimmedName)
    setPhone(phoneNumber)
  }

  const hasUser = username.trim().length > 0 && phone.trim().length > 0

  return (
    <UserContext.Provider value={{ userId, username, phone, setUser, hasUser, ready }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}