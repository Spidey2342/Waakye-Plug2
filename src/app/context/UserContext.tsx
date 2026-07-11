import { createContext, useContext, useState, type ReactNode } from 'react'

type UserContextType = {
  userId: string
  username: string
  phone: string
  setUser: (username: string, phone: string) => void
  hasUser: boolean
}

const UserContext = createContext<UserContextType | null>(null)

function generateId(): string {
  return 'user-' + Math.random().toString(36).slice(2, 11)
}

// localStorage (not sessionStorage) so the same device/browser is recognized
// as the same person across visits — sessionStorage was wiping identity every
// time the tab or browser closed, which is why repeat sign-ins looked like
// new users each time.
function getOrCreateUserId(): string {
  let id = localStorage.getItem('wp_user_id')
  if (!id) {
    id = generateId()
    localStorage.setItem('wp_user_id', id)
  }
  return id
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId] = useState<string>(getOrCreateUserId)
  const [username, setUsername] = useState<string>(
    localStorage.getItem('wp_username') ?? ''
  )
  const [phone, setPhone] = useState<string>(
    localStorage.getItem('wp_phone') ?? ''
  )

  function setUser(name: string, phoneNumber: string) {
    const trimmedName = name.trim()
    localStorage.setItem('wp_username', trimmedName)
    localStorage.setItem('wp_phone', phoneNumber)
    setUsername(trimmedName)
    setPhone(phoneNumber)
  }

  const hasUser = username.trim().length > 0 && phone.trim().length > 0

  return (
    <UserContext.Provider value={{ userId, username, phone, setUser, hasUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}