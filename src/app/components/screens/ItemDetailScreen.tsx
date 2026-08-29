'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Heart, Share2, Minus, Plus, Star } from 'lucide-react';
import { MenuItemThumbnail } from '@/app/components/MenuItemThumbnail';
import type { MenuItem } from '@/app/lib/vendorMenu';
import type { OrderLineItem } from '@/app/context/CartContext';

interface ItemDetailScreenProps {
  item: MenuItem;
  onBack: () => void;
  onAddToCart: (items: OrderLineItem[]) => void;
}

export function ItemDetailScreen({ item, onBack, onAddToCart }: ItemDetailScreenProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const total = item.price * quantity;

  function handleAdd() {
    onAddToCart([
      {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        quantity,
        imageUrl: item.image_url,
      },
    ]);
  }

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">

      {/* ── Hero image ── */}
      <div className="relative h-72 shrink-0 bg-gray-100">
        <MenuItemThumbnail imageUrl={item.image_url} category={item.category} size="full" />

        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-sm"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFavorite((v) => !v)}
            className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-sm"
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#7a1d1d] text-[#7a1d1d]' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="flex-1 overflow-y-auto pb-40 [-webkit-overflow-scrolling:touch]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto p-5 space-y-5"
        >
          <div>
            <h1 className="font-bold text-2xl leading-tight">{item.name}</h1>
            {!item.is_available && (
              <span className="inline-block mt-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Currently unavailable
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm text-gray-700">Description</h2>
              <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                4.8
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {item.description || 'No description added for this item yet.'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[#7a1d1d]">
              {item.pricing_type === 'variable' ? 'From ' : ''}GH₵{item.price}
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Sticky add-to-cart ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleAdd}
            disabled={!item.is_available}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
              item.is_available
                ? 'bg-[#7a1d1d] text-white hover:bg-[#6a1717]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add to Cart · GH₵{total}
          </button>
        </div>
      </div>
    </div>
  );
}