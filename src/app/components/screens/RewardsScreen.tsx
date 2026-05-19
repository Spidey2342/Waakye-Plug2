import { useState, useRef, useEffect } from 'react'
import { Star, Flame, RotateCw, Trophy, Crown, Medal, ShoppingBag, ArrowLeft, Gift, RefreshCw, Zap } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { getOrCreatePlayer, getLeaderboard, getPlayerRank, recordSpin, pickReward } from '../../lib/Gameservice'
import { supabase, SPIN_REWARDS, type PlayerStats, type SpinReward } from '../../lib/supabase'
import { toast } from 'sonner'

type Tab = 'rewards' | 'spin' | 'leaderboard'

interface Props {
  onBack: () => void
  canSpin?: boolean
}

// ─── Spin Wheel ───────────────────────────────────────────────────────────────
const SEGMENT_COUNT = SPIN_REWARDS.length
const FULL_CIRCLE = 2 * Math.PI
const SEGMENT_ANGLE = FULL_CIRCLE / SEGMENT_COUNT
const RADIUS = 120
const CENTER = 140

function SpinWheel({ userId, canSpin, onRewardClaimed }: {
  userId: string
  canSpin: boolean
  onRewardClaimed: (reward: SpinReward, updatedPoints: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [reward, setReward] = useState<SpinReward | null>(null)
  const [rotation, setRotation] = useState(0)
  const [hasSpun, setHasSpun] = useState(false)
  const animRef = useRef<number>()

  useEffect(() => { drawWheel(rotation) }, [rotation])

  function drawWheel(angle: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    SPIN_REWARDS.forEach((seg, i) => {
      const start = angle + i * SEGMENT_ANGLE - Math.PI / 2
      const end = start + SEGMENT_ANGLE
      ctx.beginPath()
      ctx.moveTo(CENTER, CENTER)
      ctx.arc(CENTER, CENTER, RADIUS, start, end)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.save()
      ctx.translate(CENTER, CENTER)
      ctx.rotate(start + SEGMENT_ANGLE / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(seg.label, RADIUS - 8, 4)
      ctx.restore()
    })
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, 20, 0, FULL_CIRCLE)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, 7, 0, FULL_CIRCLE)
    ctx.fillStyle = '#16a34a'
    ctx.fill()
  }

  async function spin() {
    if (spinning || hasSpun || !canSpin) return
    setSpinning(true)
    setReward(null)
    const picked = pickReward()
    const pickedIndex = SPIN_REWARDS.indexOf(picked)
    const targetSegmentAngle = -pickedIndex * SEGMENT_ANGLE
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * FULL_CIRCLE
    const targetRotation = extraSpins + targetSegmentAngle
    const duration = 4000
    const start = performance.now()
    const startRotation = rotation % FULL_CIRCLE

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentAngle = startRotation + targetRotation * eased
      setRotation(currentAngle)
      drawWheel(currentAngle)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setReward(picked)
        setHasSpun(true)
        recordSpin(userId, picked)
          .then(updated => {
            toast.success(`You won: ${picked.label}! +${picked.points} pts`)
            onRewardClaimed(picked, updated.points)
          })
          .catch(() => toast.error('Could not save reward'))
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10"
          style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #16a34a' }} />
        <canvas ref={canvasRef} width={280} height={280} className="drop-shadow-lg rounded-full" />
      </div>
      {reward && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-green-800 font-medium">
          <Gift size={18} className="text-green-600" />
          Won: <span className="font-bold ml-1">{reward.label}</span>&nbsp;(+{reward.points} pts)
        </div>
      )}
      {!canSpin && !hasSpun && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-center">
          🔒 Complete an order to unlock your spin!
        </p>
      )}
      <button
        onClick={spin}
        disabled={spinning || hasSpun || !canSpin}
        className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
      >
        <RotateCw size={15} className={spinning ? 'animate-spin' : ''} />
        {hasSpun ? 'Already spun this order' : spinning ? 'Spinning...' : 'Spin the Ladle!'}
      </button>
    </div>
  )
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function LeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const [board, setBoard] = useState<PlayerStats[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await getLeaderboard(10)
      setBoard(data)
      const rank = await getPlayerRank(currentUserId)
      setMyRank(rank)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  function avatarColor(name: string) {
    const colors = ['#16a34a', '#7F77DD', '#EF9F27', '#D85A30', '#378ADD', '#D4537E']
    return colors[name.charCodeAt(0) % colors.length]
  }

  const rankIcons = [
    <Crown size={16} className="text-amber-400" />,
    <Medal size={16} className="text-gray-400" />,
    <Medal size={16} className="text-orange-400" />,
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <span className="font-semibold text-gray-900">Top Pluggers</span>
        </div>
        <button onClick={load} disabled={loading} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Live
        </button>
      </div>

      {myRank && myRank > 10 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          You're ranked <strong>#{myRank}</strong> — keep ordering to climb! 🚀
        </div>
      )}

      {loading && board.length === 0 ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : board.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No players yet. Be the first! 🍛
        </div>
      ) : (
        <ol className="space-y-2">
          {board.map((player, i) => {
            const isMe = player.user_id === currentUserId
            return (
              <li key={player.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isMe ? 'border-green-300 bg-green-50' : i < 3 ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white'}`}>
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  {i < 3 ? rankIcons[i] : <span className="text-xs text-gray-400">#{i + 1}</span>}
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(player.username) }}>
                  {initials(player.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {player.username} {isMe && <span className="text-xs text-green-600 font-normal">(you)</span>}
                    {player.current_streak >= 3 && <span className="ml-1 text-xs">🔥{player.current_streak}</span>}
                  </div>
                  <div className="text-xs text-gray-400">{player.total_orders} order{player.total_orders !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-700">{player.points.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">pts</div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <p className="text-center text-xs text-gray-400">Updates live · Top 3 win free meals 🎉</p>
    </div>
  )
}

// ─── Main RewardsScreen ───────────────────────────────────────────────────────
export function RewardsScreen({ onBack, canSpin = false }: Props) {
  const { userId, username } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>(canSpin ? 'spin' : 'rewards')
  const [player, setPlayer] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinUnlocked, setSpinUnlocked] = useState(canSpin)

  useEffect(() => {
    getOrCreatePlayer(userId, username)
      .then(setPlayer)
      .finally(() => setLoading(false))
  }, [userId, username])

  function handleRewardClaimed(_reward: SpinReward, newPoints: number) {
    setPlayer(p => p ? { ...p, points: newPoints } : p)
    setSpinUnlocked(false)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rewards', label: 'My Points', icon: <Star size={14} /> },
    { id: 'spin', label: 'Spin', icon: <RotateCw size={14} /> },
    { id: 'leaderboard', label: 'Board', icon: <Trophy size={14} /> },
  ]

  const streakColor = (player?.current_streak ?? 0) >= 7 ? 'text-amber-500' :
    (player?.current_streak ?? 0) >= 3 ? 'text-orange-400' : 'text-gray-400'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-gray-100">
        <button onClick={onBack} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Waakye Rewards</h1>
          <p className="text-xs text-gray-400">Hey, {username} 👋</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mx-4 mt-4 rounded-xl bg-gray-100 p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">

        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Star size={12} className="text-amber-400" />Total points</div>
                    <div className="text-2xl font-semibold text-gray-900">{player?.points.toLocaleString() ?? 0}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${streakColor}`}><Flame size={12} />Streak</div>
                    <div className="text-2xl font-semibold text-gray-900">{player?.current_streak ?? 0}<span className="text-sm font-normal text-gray-400 ml-1">days</span></div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><ShoppingBag size={12} />Orders</div>
                    <div className="text-2xl font-semibold text-gray-900">{player?.total_orders ?? 0}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Trophy size={12} className="text-amber-400" />Best streak</div>
                    <div className="text-2xl font-semibold text-gray-900">{player?.longest_streak ?? 0}<span className="text-sm font-normal text-gray-400 ml-1">days</span></div>
                  </div>
                </div>

                {(player?.current_streak ?? 0) >= 3 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-700">
                    <Zap size={14} className="text-amber-500" />
                    {(player?.current_streak ?? 0) >= 7
                      ? '7-day streak — +50 bonus pts per order! 🏆'
                      : '3-day streak — +20 bonus pts per order! 🔥'}
                  </div>
                )}

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-800 mb-2">How points work</p>
                  <p>🍛 Every order → <strong>+10 pts</strong> base</p>
                  <p>🔥 3-day streak → <strong>+20 pts</strong> bonus</p>
                  <p>🏆 7-day streak → <strong>+50 pts</strong> bonus</p>
                  <p>🎡 Spin the wheel → up to <strong>+100 pts</strong></p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'spin' && (
          <SpinWheel
            userId={userId}
            canSpin={spinUnlocked}
            onRewardClaimed={handleRewardClaimed}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab currentUserId={userId} />
        )}
      </div>
    </div>
  )
}
