import { useState } from 'react'
import { useUser } from '@/app/context/UserContext'

export function UsernameScreen() {
  const { setUser } = useUser()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    const trimmed = input.trim()
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters')
      return
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or less')
      return
    }
    setError('')
    setLoading(true)
    // Small delay so it feels intentional
    await new Promise(r => setTimeout(r, 300))
    setUser(trimmed)
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleContinue()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      {/* Logo / brand */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🍛</div>
        <h1 className="text-2xl font-bold text-gray-900">Waakye Plug</h1>
        <p className="text-sm text-gray-500 mt-1">Fresh every morning, 5:30 – 8:00 AM</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">What's your name?</h2>
        <p className="text-sm text-gray-500 mb-5">
          We'll use this for your orders and the leaderboard.
        </p>

        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={handleKey}
          placeholder="e.g. Kwame, Ama, Kofi..."
          maxLength={20}
          autoFocus
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
        />

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={loading || input.trim().length < 2}
          className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : "Let's go →"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          No account needed — just your name 👋
        </p>
      </div>
    </div>
  )
}