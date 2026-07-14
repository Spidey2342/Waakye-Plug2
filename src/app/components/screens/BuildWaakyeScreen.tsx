'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Minus, Check, Loader2 } from 'lucide-react';
import { useVendor } from '@/app/context/VendorContext';
import { getVendorMenu, groupMenuByCategory } from '@/app/lib/vendorMenu';
import { MenuItemThumbnail } from '@/app/components/MenuItemThumbnail';
import type { OrderLineItem } from '@/app/context/CartContext';

interface BuildWaakyeScreenProps {
  onBack: () => void;
  onAddToCart: (items: OrderLineItem[]) => void;
}

export function BuildWaakyeScreen({ onBack, onAddToCart }: BuildWaakyeScreenProps) {
  const { selectedVendor } = useVendor();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(() =>
    groupMenuByCategory([])
  );

  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [proteinQty, setProteinQty] = useState<Record<string, number>>({});
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedVendor) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const items = await getVendorMenu(selectedVendor!.id);
        if (cancelled) return;
        const grouped = groupMenuByCategory(items);
        setMenu(grouped);
        if (grouped.base.length > 0) setSelectedBaseId(grouped.base[0].id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedVendor]);

  const updateProteinQty = (itemId: string, delta: number) => {
    setProteinQty((prev) => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[itemId];
      else updated[itemId] = next;
      return updated;
    });
  };

  const toggleExtra = (itemId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectedBase = menu.base.find((b) => b.id === selectedBaseId) ?? null;

  const total =
    (selectedBase?.price ?? 0) +
    Object.entries(proteinQty).reduce((sum, [id, qty]) => {
      const item = menu.protein.find((p) => p.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0) +
    selectedExtraIds.reduce((sum, id) => {
      const item = menu.extra.find((e) => e.id === id);
      return sum + (item ? item.price : 0);
    }, 0);

  const handleAddCombo = (comboId: string) => {
    const item = menu.combo.find((c) => c.id === comboId);
    if (!item) return;
    onAddToCart([{ id: item.id, name: item.name, price: item.price, category: 'combo', quantity: 1, imageUrl: item.image_url }]);
  };

  const handleAdd = () => {
    if (!selectedBase) return;

    const items: OrderLineItem[] = [
      { id: selectedBase.id, name: selectedBase.name, price: selectedBase.price, category: 'base', quantity: 1, imageUrl: selectedBase.image_url },
    ];

    Object.entries(proteinQty).forEach(([id, qty]) => {
      const item = menu.protein.find((p) => p.id === id);
      if (item && qty > 0) {
        items.push({ id: item.id, name: item.name, price: item.price, category: 'protein', quantity: qty, imageUrl: item.image_url });
      }
    });

    selectedExtraIds.forEach((id) => {
      const item = menu.extra.find((e) => e.id === id);
      if (item) items.push({ id: item.id, name: item.name, price: item.price, category: 'extra', quantity: 1, imageUrl: item.image_url });
    });

    onAddToCart(items);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center">
        <Loader2 size={32} className="text-[#7a1d1d] animate-spin" />
      </div>
    );
  }

  const menuIsEmpty = menu.base.length === 0 && menu.protein.length === 0 && menu.extra.length === 0 && menu.combo.length === 0;
  const hasBuilder = menu.base.length > 0 || menu.protein.length > 0 || menu.extra.length > 0;

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{selectedVendor?.business_name ?? 'Build Your Order'}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-40 [-webkit-overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto p-4 space-y-8">

          {menuIsEmpty && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="font-bold">This vendor hasn't added their menu yet.</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon.</p>
            </div>
          )}

          {/* Ready-made combo items — fixed price, one tap, no builder needed */}
          {menu.combo.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-bold text-xl mb-4">Ready to Order</h2>
              <div className="grid grid-cols-2 gap-3">
                {menu.combo.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden flex flex-col"
                  >
                    <div className="h-28 bg-gray-50">
                      <MenuItemThumbnail imageUrl={item.image_url} category="combo" size="full" />
                    </div>
                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <div className="font-bold text-sm leading-tight">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 line-clamp-2">{item.description}</div>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-[#7a1d1d] font-bold text-sm">
                          {item.pricing_type === 'variable' ? 'From ' : ''}GH₵{item.price}
                        </span>
                        <button
                          onClick={() => handleAddCombo(item.id)}
                          className="bg-[#7a1d1d] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#6a1717] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Divider between ready-made items and the build-your-own flow */}
          {menu.combo.length > 0 && hasBuilder && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Or Build Your Own</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {menu.base.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-bold text-xl mb-4">Choose Your Size</h2>
              <div className="grid grid-cols-2 gap-3">
                {menu.base.map((item) => {
                  const isSelected = selectedBaseId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedBaseId(item.id)}
                      className={`relative rounded-2xl border-2 overflow-hidden text-left transition-all ${
                        isSelected ? 'border-[#7a1d1d]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-[#7a1d1d] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`h-24 bg-gray-50 transition-transform ${isSelected ? 'scale-105' : ''}`}>
                        <MenuItemThumbnail imageUrl={item.image_url} category="base" size="full" />
                      </div>
                      <div className={`p-3 ${isSelected ? 'bg-[#7a1d1d]/5' : 'bg-white'}`}>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-[#7a1d1d] font-bold mt-0.5">GH₵{item.price}</div>
                        {item.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {menu.protein.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-bold text-xl mb-4">Add Proteins</h2>
              <div className="space-y-3">
                {menu.protein.map((item) => {
                  const qty = proteinQty[item.id] || 0;
                  const isActive = qty > 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isActive ? 'border-[#7a1d1d] bg-[#7a1d1d]/5' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MenuItemThumbnail imageUrl={item.image_url} category="protein" size="sm" />
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-sm text-gray-600">GH₵{item.price} each</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateProteinQty(item.id, -1)}
                          disabled={qty === 0}
                          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-8 text-center font-bold">{qty}</div>
                        <button
                          onClick={() => updateProteinQty(item.id, 1)}
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

          {menu.extra.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-bold text-xl mb-4">Extras</h2>
              <div className="space-y-2">
                {menu.extra.map((item) => {
                  const isChecked = selectedExtraIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked ? 'border-[#4ade80] bg-green-50' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleExtra(item.id)}
                          className="w-5 h-5 accent-[#7a1d1d]"
                        />
                        <MenuItemThumbnail imageUrl={item.image_url} category="extra" size="sm" />
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

      {/* Sticky Footer — only for the build-your-own flow */}
      {hasBuilder && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{total}</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={!selectedBase}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
                selectedBase ? 'bg-[#7a1d1d] text-white hover:bg-[#6a1717]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}