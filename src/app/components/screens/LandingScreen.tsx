import { motion } from 'motion/react';
import { CountdownTimer } from '@/app/components/CountdownTimer';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { ArrowRight, Trophy, Clock } from 'lucide-react';

interface LandingScreenProps {
  timeUntilClose: number;
  onStart: () => void;
  onBuild: () => void;
  onTimerComplete: () => void;
  onRewards: () => void;
}

export function LandingScreen({
  timeUntilClose,
  onStart,
  onBuild,
  onTimerComplete,
  onRewards,
}: LandingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-[#fefaf4] [webkit-tap-highlight-color:transparent]"
    >
      <div className="max-w-md mx-auto pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-5 pt-6 pb-3"
        >
          <div>
            <p className="text-xs text-gray-500">Good morning</p>
            <p className="font-bold text-gray-900 text-lg">Waakye Plug</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Open now
          </div>
        </motion.div>

        {/* Hero card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-4 relative rounded-3xl overflow-hidden shadow-xl h-56"
        >
          <ImageWithFallback
            src="https://i.pinimg.com/736x/48/95/40/489540c16760f9c02b89028a5e5fd7e2.jpg"
            alt="Delicious Waakye Bowl"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-white/80 text-xs font-medium mb-1">Fresh · Fast · Morning only</p>
            <p className="text-white font-bold text-xl leading-snug">
              Made fresh every morning, 5:30 – 8:00 AM
            </p>
          </div>
        </motion.div>

        {/* Countdown chip */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <CountdownTimer milliseconds={timeUntilClose} onComplete={onTimerComplete} />
            <p className="text-xs text-gray-500">Time left to order</p>
          </div>
        </motion.div>

        {/* Menu grid */}
        <div className="px-4 mt-6">
          <p className="font-bold text-gray-900 mb-3">What are you craving?</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-left hover:border-[#7a1d1d]/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[#7a1d1d]/10 flex items-center justify-center mb-3 text-2xl">
                🍚
              </div>
              <p className="font-bold text-sm">Waakye Bowl</p>
              <p className="text-xs text-gray-500 mt-0.5">Build your own</p>
              <div className="flex items-center gap-1 text-[#7a1d1d] text-xs font-bold mt-3">
                Order now <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileTap={{ scale: 0.97 }}
              onClick={onBuild}
              className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-left opacity-60"
            >
              <div className="w-11 h-11 rounded-xl bg-[#7a1d1d]/10 flex items-center justify-center mb-3 text-2xl">
                🍳
              </div>
              <p className="font-bold text-sm">Breakfast</p>
              <p className="text-xs text-gray-500 mt-0.5">Jollof & drinks</p>
              <div className="text-gray-400 text-xs font-bold mt-3">
                Coming soon
              </div>
            </motion.button>
          </div>
        </div>

        {/* Rewards link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 mt-4"
        >
          <button
            onClick={onRewards}
            className="w-full flex items-center justify-center gap-2 border-2 border-amber-300 bg-amber-50 text-amber-700 py-3 rounded-2xl font-bold text-sm hover:bg-amber-100 transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Rewards & Leaderboard
          </button>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-4">⚡ Limited bowls today</p>
      </div>
    </motion.div>
  );
}