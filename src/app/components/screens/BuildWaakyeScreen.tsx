'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Minus, Check, Loader2 } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { getVendorMenu, groupMenuByCategory, type MenuItem } from '@/app/lib/vendorMenu';
import { WaakyeOrder, waakyeItemPrice, toSelectedItem } from '@/app/types/dynamicOrder';

interface BuildWaakyeScreenProps {
  order: WaakyeOrder | null;
  onUpdateOrder: (order: WaakyeOrder) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function BuildWaakyeScreen({ order, onUpdateOrder, onBack, onContinue }: BuildWaakyeScreenProps) {
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getVendorMenu()
      .then((items) => {
        if (cancelled) return;
        setMenu(items);

        // Auto-select the first available size/base item if nothing's
        // chosen yet — lets the screen work with just one base item, same
        // as with ten.
        const grouped = groupMenuByCategory(items);
        if (!order && grouped.base.length > 0) {
          onUpdateOrder({
            base: toSelectedItem(grouped.base[0]),
            proteins: {},
            extras: [],
            deliveryMode: 'pickup',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the menu. Please try again.');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fefaf4] px-6 text-center">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!menu || !order) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fefaf4]">
        <Loader2 className="w-6 h-6 animate-spin text-[#7a1d1d]" />
      </div>
    );
  }

  const { base, protein, extra } = groupMenuByCategory(menu);

  const updateBase = (item: MenuItem) => {
    onUpdateOrder({ ...order, base: toSelectedItem(item) });
  };

  const updateProtein = (item: MenuItem, delta: number) => {
    const currentQty = order.proteins[item.id]?.quantity ?? 0;
    const newQty = Math.max(0, currentQty + delta);

    const newProteins = { ...order.proteins };
    if (newQty === 0) {
      delete newProteins[item.id];
    } else {
      newProteins[item.id] = { item: toSelectedItem(item), quantity: newQty };
    }

    onUpdateOrder({ ...order, proteins: newProteins });
  };

  const toggleExtra = (item: MenuItem) => {
    const isSelected = order.extras.some((e) => e.id === item.id);
    const newExtras = isSelected
      ? order.extras.filter((e) => e.id !== item.id)
      : [...order.extras, toSelectedItem(item)];
    onUpdateOrder({ ...order, extras: newExtras });
  };

  const total = waakyeItemPrice(order);

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Build Your Waakye</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-40 [-webkit-overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto p-4 space-y-8">

          {/* Size Section — hidden if the vendor hasn't added any base items */}
          {base.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-bold text-xl mb-4">Choose Your Size</h2>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.min(base.length, 3)}, minmax(0, 1fr))` }}
              >
                {base.map((item) => {
                  const isSelected = order.base.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => updateBase(item)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#7a1d1d] bg-[#7a1d1d]/5'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#7a1d1d] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`text-3xl mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                        🍚
                      </div>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-[#7a1d1d] font-bold mt-1">GH₵{item.price}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Proteins Section — hidden if the vendor hasn't added any yet */}
          {protein.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-bold text-xl mb-4">Add Proteins</h2>
              <div className="space-y-3">
                {protein.map((item) => {
                  const quantity = order.proteins[item.id]?.quantity ?? 0;
                  const isActive = quantity > 0;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isActive ? 'border-[#7a1d1d] bg-[#7a1d1d]/5' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-sm text-gray-600">GH₵{item.price} each</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateProtein(item, -1)}
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-8 text-center font-bold">{quantity}</div>
                        <button
                          onClick={() => updateProtein(item, 1)}
                          className="w-10 h-10 rounded-full bg-[#7a1d1d] text-white flex items-center justify-center hover:bg-[#6a1717]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Extras Section — hidden if the vendor hasn't added any yet */}
          {extra.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-bold text-xl mb-4">Extras</h2>
              <div className="space-y-2">
                {extra.map((item) => {
                  const isChecked = order.extras.some((e) => e.id === item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#4ade80] bg-green-50'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleExtra(item)} />
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-sm text-gray-600">+GH₵{item.price}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{total}</span>
          </div>
          <button
            onClick={onContinue}
            className="w-full bg-[#7a1d1d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6a1717] transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}