import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type UserContextType = {
  userId: string
  username: string
  setUser: (username: string) => void
  hasUser: boolean
}

const UserContext = createContext<UserContextType | null>(null)

// Generate a stable random ID
function generateId(): string {
  return 'user-' + Math.random().toString(36).slice(2, 11)
}

// We store userId in sessionStorage so it persists across hot reloads
// but resets when the browser tab closes — no auth needed
function getOrCreateUserId(): string {
  let id = sessionStorage.getItem('wp_user_id')
  if (!id) {
    id = generateId()
    sessionStorage.setItem('wp_user_id', id)
  }
  return id
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId] = useState<string>(getOrCreateUserId)
  const [username, setUsername] = useState<string>(
    sessionStorage.getItem('wp_username') ?? ''
  )

  function setUser(name: string) {
    const trimmed = name.trim()
    sessionStorage.setItem('wp_username', trimmed)
    setUsername(trimmed)
  }

  const hasUser = username.trim().length > 0

  return (
    <UserContext.Provider value={{ userId, username, setUser, hasUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}