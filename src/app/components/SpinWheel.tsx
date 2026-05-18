import { useState, useRef, useEffect } from 'react'
import { Gift, RotateCw } from 'lucide-react'
import { SPIN_REWARDS, type SpinReward } from '../../lib/supabase'
import { pickReward, recordSpin } from '../../config/gameService'
import { toast } from 'sonner'

interface Props {
  userId: string
  onRewardClaimed?: (reward: SpinReward) => void
}

const SEGMENT_COUNT = SPIN_REWARDS.length
const FULL_CIRCLE = 2 * Math.PI
const SEGMENT_ANGLE = FULL_CIRCLE / SEGMENT_COUNT
const RADIUS = 130
const CENTER = 150

export function SpinWheel({ userId, onRewardClaimed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [reward, setReward] = useState<SpinReward | null>(null)
  const [rotation, setRotation] = useState(0)
  const animRef = useRef<number>()

  useEffect(() => {
    drawWheel(rotation)
  }, [rotation])

  function drawWheel(angle: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    SPIN_REWARDS.forEach((seg, i) => {
      const start = angle + i * SEGMENT_ANGLE - Math.PI / 2
      const end = start + SEGMENT_ANGLE

      // Segment
      ctx.beginPath()
      ctx.moveTo(CENTER, CENTER)
      ctx.arc(CENTER, CENTER, RADIUS, start, end)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(CENTER, CENTER)
      ctx.rotate(start + SEGMENT_ANGLE / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(seg.label, RADIUS - 10, 4)
      ctx.restore()
    })

    // Center circle
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, 22, 0, FULL_CIRCLE)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.stroke()

    // Center icon dot
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, 8, 0, FULL_CIRCLE)
    ctx.fillStyle = '#1D9E75'
    ctx.fill()
  }

  async function spin() {
    if (spinning) return
    setSpinning(true)
    setReward(null)

    const picked = pickReward()
    // Find segment index
    const pickedIndex = SPIN_REWARDS.indexOf(picked)
    // Target angle so the picked segment lands at top
    const targetSegmentAngle = -pickedIndex * SEGMENT_ANGLE
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * FULL_CIRCLE
    const targetRotation = extraSpins + targetSegmentAngle

    const duration = 4000
    const start = performance.now()
    const startRotation = rotation % FULL_CIRCLE

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentAngle = startRotation + targetRotation * eased
      setRotation(currentAngle)
      drawWheel(currentAngle)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setReward(picked)
        recordSpin(userId, picked)
          .then(() => {
            toast.success(`You won: ${picked.label}! +${picked.points} pts`)
            onRewardClaimed?.(picked)
          })
          .catch(() => toast.error('Could not save reward'))
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Pointer triangle at top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '20px solid #1D9E75',
          }}
        />
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="drop-shadow-lg"
          style={{ borderRadius: '50%' }}
        />
      </div>

      {/* Reward banner */}
      {reward && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-green-800 font-medium animate-bounce">
          <Gift size={20} className="text-green-600" />
          You won: <span className="font-bold">{reward.label}</span> (+{reward.points} pts)
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning}
        className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
      >
        <RotateCw size={16} className={spinning ? 'animate-spin' : ''} />
        {spinning ? 'Spinning...' : 'Spin the Ladle!'}
      </button>

      <p className="text-xs text-gray-400 text-center max-w-xs">
        Spin after every order to win free delivery, discounts, and bonus points.
      </p>
    </div>
  )
}