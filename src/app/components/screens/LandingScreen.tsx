import { motion } from 'motion/react';
import { Sunrise, ArrowRight } from 'lucide-react';
import { CountdownTimer } from '@/app/components/CountdownTimer';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface LandingScreenProps {
  timeUntilClose: number;
  onStart: () => void;
  onTimerComplete: () => void;
}

export function LandingScreen({ timeUntilClose, onStart, onTimerComplete }: LandingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center px-4 py-6 [webkit-tap-highlight-color:transparent]"
    >
      <div className="max-w-md w-full pb-[env(safe-area-inset-bottom)]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Hero Image */}
          <div className="relative h-64 sm:h-72 bg-gradient-to-br from-amber-100 to-orange-50">
            <ImageWithFallback
  src="https://i.pinimg.com/736x/48/95/40/489540c16760f9c02b89028a5e5fd7e2.jpg"
  alt="Delicious Waakye Bowl"
  className="w-full h-full object-cover"
  loading="eager"
  decoding="async"
/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <div className="inline-flex items-center gap-2 text-3xl font-bold text-gray-900 mb-2">
                <Sunrise className="w-8 h-8 text-amber-500" />
                Good morning
              </div>
            </motion.div>

            <p className="text-gray-600 mb-2">
              Orders open till <span className="font-bold">8:30 AM</span>
            </p>

            {/* Countdown Timer */}
           <div className="mb-6 bg-gray-50 rounded-xl py-3">
              <CountdownTimer 
                milliseconds={timeUntilClose} 
                onComplete={onTimerComplete}
              />
              <p className="text-sm text-gray-500 mt-1">Time remaining</p>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="w-full bg-[#7a1d1d] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-[#6a1717] transition-colors"
            >
           Build Your Waakye
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <p className="text-sm text-gray-500 mt-4">
              ⚡ Limited bowls today
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600 select-none">
          <p className="font-bold text-[#7a1d1d]">Waakye Plug</p>
          <p>Fresh. Fast. Morning only.</p>
        </div>
      </div>
    </motion.div>
  );
}