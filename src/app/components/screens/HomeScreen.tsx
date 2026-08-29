'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Soup,
  Beef,
  Salad,
  CupSoda,
  UtensilsCrossed,
  Heart,
  Plus,
  Loader2,
  Store,
  ChevronRight,
} from 'lucide-react';
import { useVendor } from '@/app/context/VendorContext';
import { getVendorMenu, groupMenuByCategory, type MenuItem } from '@/app/lib/vendorMenu';
import { MenuItemThumbnail } from '@/app/components/MenuItemThumbnail';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'sonner';

interface HomeScreenProps {
  onOpenItem: (item: MenuItem) => void;
  onBuildOwn: () => void;
  onSwitchVendor: () => void;
  onRewards: () => void;
}

type CategoryKey = 'all' | MenuItem['category'];

const CATEGORY_TABS: { key: CategoryKey; label: string; icon: typeof Soup }[] = [
  { key: 'all', label: 'All', icon: UtensilsCrossed },
  { key: 'combo', label: 'Combos', icon: UtensilsCrossed },
  { key: 'base', label: 'Bowls', icon: Soup },
  { key: 'protein', label: 'Proteins', icon: Beef },
  { key: 'extra', label: 'Extras', icon: Salad },
  { key: 'drink', label: 'Drinks', icon: CupSoda },
];

export function HomeScreen({ onOpenItem, onBuildOwn, onSwitchVendor, onRewards }: HomeScreenProps) {
  const { selectedVendor } = useVendor();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedVendor) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const items = await getVendorMenu(selectedVendor!.id);
        if (!cancelled) setAllItems(items);
      } catch (err) {
        console.error('Could not load menu', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedVendor]);

  // Only show category tabs for categories that actually have items, so the
  // strip doesn't advertise a "Drinks" tab that opens onto nothing.
  const availableCategories = useMemo(() => {
    const present = new Set(allItems.map((i) => i.category));
    return CATEGORY_TABS.filter((tab) => tab.key === 'all' || present.has(tab.key));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeCategory !== 'all') list = list.filter((i) => i.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeCategory, query]);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function quickAdd(item: MenuItem) {
    if (!selectedVendor) return;
    addToCart(selectedVendor.id, [
      { id: item.id, name: item.name, price: item.price, category: item.category, quantity: 1, imageUrl: item.image_url },
    ]);
    toast.success(`Added ${item.name} to cart`);
  }

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] [webkit-tap-highlight-color:transparent]">
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">

        {/* ── Location header ── */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onSwitchVendor} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#7a1d1d]/10 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[#7a1d1d]" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs text-gray-400 font-medium">Ordering from</p>
              <p className="font-bold text-sm truncate flex items-center gap-1">
                {selectedVendor?.business_name ?? 'Vendor'}
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </p>
            </div>
          </button>
          {selectedVendor?.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[90px] truncate">{selectedVendor.location}</span>
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything on the menu..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[#7a1d1d]/40"
          />
        </div>

        {/* ── Promo banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#7a1d1d] text-white p-5 mb-6 relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
          <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-1">Build your own</p>
          <p className="font-bold text-lg leading-tight mb-3">Prefer to customize your bowl?</p>
          <button
            onClick={onBuildOwn}
            className="bg-white text-[#7a1d1d] text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
          >
            Build Your Own →
          </button>
        </motion.div>

        {/* ── Category chips ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {availableCategories.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  isActive ? 'bg-[#7a1d1d] text-white' : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Item grid ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#7a1d1d] animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-medium">Nothing here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item, i) => {
              const isFav = favorites.has(item.id);
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => onOpenItem(item)}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden text-left flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative h-28">
                    <MenuItemThumbnail imageUrl={item.image_url} category={item.category} size="full" />
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#7a1d1d] text-[#7a1d1d]' : 'text-gray-400'}`} />
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-[#7a1d1d] font-bold text-sm">
                        {item.pricing_type === 'variable' ? 'From ' : ''}GH₵{item.price}
                      </span>
                      <span
                        onClick={(e) => { e.stopPropagation(); quickAdd(item); }}
                        className="w-8 h-8 rounded-full bg-[#7a1d1d] text-white flex items-center justify-center hover:bg-[#6a1717] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <button
          onClick={onRewards}
          className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-amber-300 bg-amber-50 text-amber-700 py-3 rounded-2xl font-bold text-sm hover:bg-amber-100 transition-colors"
        >
          Rewards & Leaderboard
        </button>
      </div>
    </div>
  );
}