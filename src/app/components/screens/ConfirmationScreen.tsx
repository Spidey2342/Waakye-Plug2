import { motion } from 'motion/react';
import { Check, Gift } from 'lucide-react';
import { useVendor } from '@/app/context/VendorContext';

interface ConfirmationScreenProps {
  onDone: () => void;
  pointsEarned: number;
}

export function ConfirmationScreen({ onDone, pointsEarned }: ConfirmationScreenProps) {
  const { selectedVendor } = useVendor();

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center px-4 py-6 [webkit-tap-highlight-color:transparent]">
      <div className="max-w-md w-full pb-[env(safe-area-inset-bottom)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 will-change-transform text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold mb-1.5">Order Sent! 🎉</h1>
          <p className="text-gray-500 text-sm mb-5">
            {selectedVendor?.business_name ?? 'The vendor'} has received your order and will confirm it shortly.
          </p>

          {pointsEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-5 text-sm text-amber-700"
            >
              ⭐ You earned <strong>+{pointsEarned} points</strong> for this order!
            </motion.div>
          )}

          <button
            onClick={onDone}
            className="w-full bg-[#7a1d1d] text-white py-4 rounded-2xl font-bold hover:bg-[#6a1717] transition-colors"
          >
            Done
          </button>
        </motion.div>

        <div className="text-center mt-5 text-sm text-gray-500 pb-[env(safe-area-inset-bottom)]">
          <p className="font-bold text-[#7a1d1d]">Waakye Plug</p>
          <p>Thanks for ordering! 🙏</p>
        </div>
      </div>
    </div>
  );
}