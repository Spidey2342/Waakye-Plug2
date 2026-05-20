import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Copy, Check, RotateCw, Gift, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { OrderItem, formatOrderMessage, formatBreakfastMessage, Breakfast, BOWL_SIZES } from '@/app/types/orderTypes';
import { useUser } from '@/app/context/UserContext';
import { getOrCreatePlayer, pickReward, recordSpin, recordOrder } from '@/app/lib/game-service';
import { SPIN_REWARDS, type SpinReward } from '@/app/lib/supabase';
import { toast } from 'sonner';

interface ConfirmationScreenProps {
  order: OrderItem | Breakfast;
  orderType: 'waakye' | 'breakfast';
  onDone: () => void;
  onConfirm: () => void;
  onSaveOrder: (order: any) => void;
}

// ─── Spin Wheel popup ─────────────────────────────────────────────────────────
const SEGMENT_COUNT = SPIN_REWARDS.length;
const FULL_CIRCLE = 2 * Math.PI;
const SEGMENT_ANGLE = FULL_CIRCLE / SEGMENT_COUNT;
const RADIUS = 100;
const CENTER = 115;

function SpinWheelPopup({
  userId,
  spinsRemaining,
  onRewardPicked,
  onSkip,
}: {
  userId: string;
  spinsRemaining: number;
  onRewardPicked: (reward: SpinReward) => void;
  onSkip: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<SpinReward | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(spinsRemaining);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number>();

  useEffect(() => { drawWheel(0); }, []);

  function drawWheel(angle: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    SPIN_REWARDS.forEach((seg, i) => {
      const start = angle + i * SEGMENT_ANGLE - Math.PI / 2;
      const end = start + SEGMENT_ANGLE;
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, RADIUS, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(CENTER, CENTER);
      ctx.rotate(start + SEGMENT_ANGLE / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(seg.label, RADIUS - 6, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 16, 0, FULL_CIRCLE);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 6, 0, FULL_CIRCLE);
    ctx.fillStyle = '#7a1d1d';
    ctx.fill();
  }

  async function spin() {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setReward(null);
    const picked = pickReward();
    const pickedIndex = SPIN_REWARDS.indexOf(picked);
    const targetAngle = -pickedIndex * SEGMENT_ANGLE;
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * FULL_CIRCLE;
    const targetRotation = extraSpins + targetAngle;
    const duration = 4000;
    const start = performance.now();
    const startRotation = rotation % FULL_CIRCLE;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startRotation + targetRotation * eased;
      setRotation(currentAngle);
      drawWheel(currentAngle);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setReward(picked);
        setSpinsLeft(s => s - 1);
        recordSpin(userId, picked)
          .then(() => toast.success(`+${picked.points} pts added!`))
          .catch(() => {});
      }
    }
    animRef.current = requestAnimationFrame(animate);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">
          🎡 Spin Before You Send!
        </h2>
        <p className="text-sm text-center text-gray-500 mb-4">
          Win a reward that gets added to your order
          {spinsLeft > 0 && <span className="block font-medium text-amber-600">{spinsLeft} spin{spinsLeft !== 1 ? 's' : ''} available</span>}
        </p>

        {/* Wheel */}
        <div className="flex justify-center mb-4 relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
            style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '18px solid #7a1d1d' }} />
          <canvas ref={canvasRef} width={230} height={230} className="rounded-full drop-shadow-md" />
        </div>

        {/* Reward banner */}
        {reward && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4"
          >
            <Gift size={18} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">🎉 You won: {reward.label}!</p>
              <p className="text-xs text-amber-600">Will be added to your WhatsApp message</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-2 mt-2">
          {/* Spin button — shown when spins left and no reward yet OR want to respin */}
          {spinsLeft > 0 && (
            <button
              onClick={spin}
              disabled={spinning}
              className="w-full flex items-center justify-center gap-2 bg-[#7a1d1d] text-white py-3 rounded-2xl font-bold hover:bg-[#6a1717] active:scale-95 transition-all disabled:opacity-50"
            >
              <RotateCw size={16} className={spinning ? 'animate-spin' : ''} />
              {spinning ? 'Spinning...' : reward ? `Spin again (${spinsLeft} left)` : `Spin! (${spinsLeft} left)`}
            </button>
          )}

          {/* Proceed button */}
          <button
            onClick={() => reward ? onRewardPicked(reward) : onSkip()}
            disabled={spinning}
            className="w-full py-3 rounded-2xl font-medium text-sm border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {reward ? '✅ Use this reward & continue →' : 'Skip, continue without reward'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Send confirmation dialog ─────────────────────────────────────────────────
function SendConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={20} className="text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Send this order?</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          This will open WhatsApp with your order message ready to send.
        </p>

        {/* Message preview */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-200 max-h-36 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
            {message}
          </pre>
        </div>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={18} />
            Yes, send via WhatsApp
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Go back and edit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ConfirmationScreen ──────────────────────────────────────────────────
export function ConfirmationScreen({ order, orderType, onDone, onSaveOrder }: ConfirmationScreenProps) {
  const { userId, username } = useUser();
  const isWaakye = orderType === 'waakye';
  const basePrice = isWaakye ? BOWL_SIZES[(order as OrderItem).size].price : 0;

  // Flow state
  const [step, setStep] = useState<'spin' | 'review' | 'sending'>('spin');
  const [spinsRemaining, setSpinsRemaining] = useState(3);
  const [wonReward, setWonReward] = useState<SpinReward | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  // Build message with reward injected if won
  const baseMessage =
    orderType === 'waakye'
      ? formatOrderMessage(order as OrderItem)
      : formatBreakfastMessage(order as Breakfast);

  const message = wonReward
    ? baseMessage.replace(
        '⚡ Sent from Waakye Plug',
        `🎁 *Reward: ${wonReward.label}*\n\n⚡ Sent from Waakye Plug`
      )
    : baseMessage;

  // Record order on mount — this gives spins + points
  useEffect(() => {
    async function init() {
      try {
        const result = await recordOrder(userId, username, basePrice || 1);
        setPointsEarned(result.pointsEarned);
        setSpinsRemaining(result.player.spins_remaining ?? 3);
      } catch {
        try {
          const player = await getOrCreatePlayer(userId, username);
          setSpinsRemaining(player.spins_remaining ?? 0);
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  function handleRewardPicked(reward: SpinReward) {
    setWonReward(reward);
    setStep('review');
  }

  function handleSkipSpin() {
    setStep('review');
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function handleWhatsApp() {
    const phoneNumber = '233599995651';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setShowSendConfirm(false);
    setStep('sending');
    setTimeout(() => {
      onSaveOrder(order);
      onDone();
    }, 800);
  }

  return (
    <>
      <AnimatePresence>
        {/* Step 1 — Spin popup (shown first, blocks everything else) */}
        {step === 'spin' && !loading && (
          <SpinWheelPopup
            userId={userId}
            spinsRemaining={spinsRemaining}
            onRewardPicked={handleRewardPicked}
            onSkip={handleSkipSpin}
          />
        )}

        {/* Send confirmation dialog */}
        {showSendConfirm && (
          <SendConfirmDialog
            message={message}
            onConfirm={handleWhatsApp}
            onCancel={() => setShowSendConfirm(false)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center px-4 py-6 [webkit-tap-highlight-color:transparent]">
        <div className="max-w-md w-full pb-[env(safe-area-inset-bottom)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 will-change-transform"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-green-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-center mb-2">Almost There! 🎉</h1>
            <p className="text-gray-600 text-center mb-4">
              Review your order then send via WhatsApp
            </p>

            {/* Points earned */}
            {!loading && pointsEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4 text-sm text-amber-700"
              >
                ⭐ You earned <strong>+{pointsEarned} points</strong> for this order!
              </motion.div>
            )}

            {/* Reward won badge */}
            {wonReward && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4"
              >
                <Gift size={20} className="text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800">Reward: {wonReward.label} 🎁</p>
                  <p className="text-xs text-green-600">Added to your message below</p>
                </div>
                <button
                  onClick={() => setStep('spin')}
                  className="text-xs text-green-600 underline flex-shrink-0"
                >
                  Change
                </button>
              </motion.div>
            )}

            {/* No reward — option to go back and spin */}
            {!wonReward && step === 'review' && (
              <button
                onClick={() => setStep('spin')}
                className="w-full mb-4 border border-dashed border-amber-300 bg-amber-50 text-amber-700 py-2.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
              >
                <RotateCw size={14} />
                Go back and spin for a reward
              </button>
            )}

            {/* Message preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Your Message</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-sm text-[#7a1d1d] hover:text-[#6a1717]"
                >
                  {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                </button>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto [-webkit-overflow-scrolling:touch]">
                {message}
              </pre>
            </div>

            {/* Send button — opens confirm dialog */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSendConfirm(true)}
              disabled={step === 'sending' || loading}
              className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-colors shadow-md disabled:opacity-60"
            >
              <MessageCircle className="w-6 h-6" />
              <div>
                <div>Confirm via WhatsApp</div>
                <div className="text-xs font-normal">Preferred 👍</div>
              </div>
            </motion.button>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-gray-700 text-center">
                💬 We'll reply with pickup/delivery details within minutes!
              </p>
            </div>
          </motion.div>

          <div className="text-center mt-6 text-sm text-gray-600 pb-[env(safe-area-inset-bottom)]">
            <p className="font-bold text-[#7a1d1d]">Waakye Plug</p>
            <p>Thanks for ordering! 🙏</p>
          </div>
        </div>
      </div>
    </>
  );
}