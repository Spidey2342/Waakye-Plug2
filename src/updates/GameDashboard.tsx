import { useState } from 'react'
import { Star, RotateCw, Trophy } from 'lucide-react'
import { PointsStreak } from './PointsStreak'
import { SpinWheel } from './SpinWheel'
import { Leaderboard } from './Leaderboard'
import type { PlayerStats } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Replace these with your actual auth values.
// If you're using Supabase Auth, pull userId from useSession() or useUser().
// If you don't have auth yet, use a simple name prompt to generate a temp ID.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_USER_ID = 'user-demo-001'
const DEMO_USERNAME = 'Kwame A.'

type Tab = 'rewards' | 'spin' | 'leaderboard'

export function GameDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('rewards')
  const [canSpin, setCanSpin] = useState(false)
  const [player, setPlayer] = useState<PlayerStats | null>(null)

  function handleOrderComplete(updatedPlayer: PlayerStats) {
    setPlayer(updatedPlayer)
    setCanSpin(true) // unlock spin after placing an order
    setActiveTab('spin')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rewards', label: 'My Rewards', icon: <Star size={16} /> },
    { id: 'spin', label: 'Spin', icon: <RotateCw size={16} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={16} /> },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Waakye Rewards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Order, earn points, spin for prizes, top the leaderboard.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'rewards' && (
        <PointsStreak
          userId={DEMO_USER_ID}
          username={DEMO_USERNAME}
          orderTotal={1} // pass your actual order total here (in GHS)
          onOrderComplete={handleOrderComplete}
        />
      )}

      {activeTab === 'spin' && (
        <div>
          {!canSpin && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-2 text-sm text-amber-700">
              Place an order first to unlock your spin! 🔒
            </div>
          )}
          <SpinWheel
            userId={DEMO_USER_ID}
            onRewardClaimed={() => setCanSpin(false)}
          />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Leaderboard
          currentUserId={DEMO_USER_ID}
          limit={10}
        />
      )}
    </div>
  )
}