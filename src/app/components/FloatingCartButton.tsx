'use client';

import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/app/context/CartContext';

export function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const { totalItems, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          onClick={onClick}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#7a1d1d] text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl hover:bg-[#6a1717] transition-colors"
        >
          <span className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-white text-[#7a1d1d] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </span>
          <span className="w-px h-4 bg-white/30" />
          <span className="font-bold text-sm">View Cart</span>
          <span className="font-bold text-sm">GH₵{totalPrice}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}