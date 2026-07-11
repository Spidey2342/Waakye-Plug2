'use client';

import { motion } from 'motion/react';
import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart, CartLine } from '@/app/context/CartContext';
import {
  BOWL_SIZES,
  S_Breakfast,
  calculateOrderTotal,
  calculateBreakfastTotal,
  OrderItem,
  Breakfast,
} from '@/app/types/orderTypes';

interface CartScreenProps {
  onBack: () => void;
  onCheckout: () => void;
}

export function CartScreen({ onBack, onCheckout }: CartScreenProps) {
  const { lines, updateQuantity, removeLine, totalItems, totalPrice } = useCart();

  const lineLabel = (line: CartLine) =>
    line.type === 'waakye'
      ? `${BOWL_SIZES[(line.order as OrderItem).size].name} Waakye`
      : S_Breakfast[(line.order as Breakfast).drink].name;

  const lineUnitPrice = (line: CartLine) =>
    line.type === 'waakye'
      ? calculateOrderTotal(line.order as OrderItem)
      : calculateBreakfastTotal(line.order as Breakfast);

  if (lines.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <ShoppingBag className="w-9 h-9 text-gray-300" />
        </div>
        <h1 className="font-bold text-lg mb-1">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">Add a bowl or breakfast to get started.</p>
        <button
          onClick={onBack}
          className="bg-[#7a1d1d] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#6a1717] transition-colors"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Your Cart</h1>
          <span className="text-sm text-gray-500 w-10 text-right">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto pb-40 [-webkit-overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          {lines.map((line, i) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border-2 border-gray-200 flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-[#7a1d1d]/5 flex items-center justify-center text-2xl shrink-0">
                🍚
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{lineLabel(line)}</div>
                <div className="text-[#7a1d1d] font-bold text-sm mt-0.5">
                  GH₵{lineUnitPrice(line) * line.quantity}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    line.quantity === 1 ? removeLine(line.id) : updateQuantity(line.id, -1)
                  }
                  className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  {line.quantity === 1 ? (
                    <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>
                <div className="w-6 text-center font-bold text-sm">{line.quantity}</div>
                <button
                  onClick={() => updateQuantity(line.id, 1)}
                  className="w-8 h-8 rounded-full bg-[#7a1d1d] text-white flex items-center justify-center hover:bg-[#6a1717]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}

          <button
            onClick={onBack}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-white transition-colors"
          >
            + Add another item
          </button>
        </div>
      </div>

      {/* Sticky checkout footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{totalPrice}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-[#7a1d1d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6a1717] transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}