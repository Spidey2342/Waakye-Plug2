import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react'
import { getLeaderboard, getPlayerRank } from '../../config/gameService'
import type { PlayerStats } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'

interface Props {
  currentUserId?: string
  limit?: number
}

const RANK_STYLES = [
  { icon: <Crown size={18} className="text-amber-400" />, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { icon: <Medal size={18} className="text-gray-400" />, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
  { icon: <Medal size={18} className="text-orange-400" />, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
]

export function Leaderboard({ currentUserId, limit = 10 }: Props) {
  const [board, setBoard] = useState<PlayerStats[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  async function load() {
    setLoading(true)
    try {
      const data = await getLeaderboard(limit)
      setBoard(data)
      setLastUpdated(new Date())
      if (currentUserId) {
        const rank = await getPlayerRank(currentUserId)
        setMyRank(rank)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    // Real-time subscription — updates whenever any player_stats row changes
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, limit])

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getAvatarColor(name: string) {
    const colors = ['#1D9E75', '#7F77DD', '#EF9F27', '#D85A30', '#378ADD', '#D4537E']
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Top Pluggers</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* My rank callout */}
      {currentUserId && myRank && myRank > limit && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          You're ranked <span className="font-bold">#{myRank}</span> — keep ordering to climb! 🚀
        </div>
      )}

      {/* Board */}
      {loading && board.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          No players yet. Place the first order to top the board! 🍛
        </div>
      ) : (
        <ol className="space-y-2">
          {board.map((player, i) => {
            const rank = i + 1
            const style = RANK_STYLES[i] ?? null
            const isMe = player.user_id === currentUserId

            return (
              <li
                key={player.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  isMe
                    ? 'border-green-300 bg-green-50 ring-1 ring-green-200'
                    : style
                    ? `${style.bg} ${style.border}`
                    : 'border-gray-100 bg-white'
                }`}
              >
                {/* Rank */}
                <div className="w-7 flex items-center justify-center flex-shrink-0">
                  {style ? style.icon : (
                    <span className="text-sm font-medium text-gray-400">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(player.username) }}
                >
                  {getInitials(player.username)}
                </div>

                {/* Name + streak */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isMe ? 'text-green-800' : 'text-gray-800'}`}>
                      {player.username} {isMe && <span className="text-xs font-normal">(you)</span>}
                    </span>
                    {player.current_streak >= 3 && (
                      <span className="text-xs">🔥{player.current_streak}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {player.total_orders} order{player.total_orders !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${style ? style.text : 'text-gray-700'}`}>
                    {player.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">pts</div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <p className="text-center text-xs text-gray-400">
        Updates live · Resets monthly · Top 3 win free meals 🎉
      </p>
    </div>
  )
}