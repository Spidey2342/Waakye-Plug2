import { useState, useEffect } from 'react'
import { Flame, Star, ShoppingBag, Trophy, Zap } from 'lucide-react'
import { getOrCreatePlayer, recordOrder, type PlayerStats } from '../lib/gameService'
import { toast } from 'sonner'

interface Props {
  userId: string
  username: string
  orderTotal?: number
  onOrderComplete?: (player: PlayerStats) => void
}

export function PointsStreak({ userId, username, orderTotal = 1, onOrderComplete }: Props) {
  const [player, setPlayer] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [justEarned, setJustEarned] = useState<number | null>(null)

  useEffect(() => {
    getOrCreatePlayer(userId, username)
      .then(setPlayer)
      .finally(() => setLoading(false))
  }, [userId, username])

  async function handleOrder() {
    if (!player) return
    setOrdering(true)
    try {
      const result = await recordOrder(userId, orderTotal)
      setPlayer(result.player)
      setJustEarned(result.pointsEarned)
      setTimeout(() => setJustEarned(null), 3000)

      if (result.streakUpdated && result.newStreak > 1) {
        toast.success(`🔥 ${result.newStreak}-day streak! +${result.pointsEarned} points`)
      } else {
        toast.success(`+${result.pointsEarned} points earned!`)
      }

      onOrderComplete?.(result.player)
    } catch (e) {
      toast.error('Could not record order. Try again.')
    } finally {
      setOrdering(false)
    }
  }

  const streakColor =
    (player?.current_streak ?? 0) >= 7 ? 'text-amber-500' :
    (player?.current_streak ?? 0) >= 3 ? 'text-orange-400' : 'text-gray-400'

  if (loading) {
    return (
      <div className="flex gap-3 animate-pulse">
        <div className="h-20 w-32 rounded-xl bg-gray-100" />
        <div className="h-20 w-32 rounded-xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Points */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Star size={14} className="text-amber-400" />
            Total points
          </div>
          <div className="text-2xl font-semibold text-gray-900 relative">
            {player?.points.toLocaleString() ?? 0}
            {justEarned && (
              <span className="absolute -top-2 left-full ml-1 text-sm font-bold text-green-500 animate-bounce">
                +{justEarned}
              </span>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className={`flex items-center gap-2 text-xs mb-1 ${streakColor}`}>
            <Flame size={14} />
            Current streak
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {player?.current_streak ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">days</span>
          </div>
        </div>

        {/* Total orders */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ShoppingBag size={14} />
            Orders
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {player?.total_orders ?? 0}
          </div>
        </div>

        {/* Longest streak */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Trophy size={14} className="text-amber-400" />
            Best streak
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {player?.longest_streak ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">days</span>
          </div>
        </div>
      </div>

      {/* Streak bonus notice */}
      {(player?.current_streak ?? 0) >= 3 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-4 py-2 text-sm text-amber-700">
          <Zap size={16} className="text-amber-500" />
          {(player?.current_streak ?? 0) >= 7
            ? '7-day streak active — +50 bonus points per order! 🏆'
            : '3-day streak active — +20 bonus points per order! 🔥'}
        </div>
      )}

      {/* Demo order button — wire this to your real checkout */}
      <button
        onClick={handleOrder}
        disabled={ordering}
        className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
      >
        {ordering ? 'Recording order...' : 'Place Order & Earn Points'}
      </button>
    </div>
  )
}