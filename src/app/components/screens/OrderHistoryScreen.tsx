import { getOrderHistory } from '@/app/utils/orderHistory';
import { StoredOrder } from '@/app/types/orderTypes';
import { MenuItemThumbnail } from '@/app/components/MenuItemThumbnail';
import { motion } from 'motion/react';
import { RotateCcw, ShoppingBag } from 'lucide-react';

interface Props {
  onOrderAgain: (order: StoredOrder) => void;
}

export function OrderHistoryScreen({ onOrderAgain }: Props) {
  const orders = getOrderHistory();

  const isEmpty = orders.length === 0;

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] px-4 py-6 [webkit-tap-highlight-color:transparent]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Your Orders</h1>
        <p className="text-sm text-gray-500 mb-5">Reorder something you've had before</p>

        {isEmpty ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🍚</p>
            <p className="font-bold text-gray-600">No orders yet.</p>
            <p className="text-sm text-gray-400 mt-1">Your waakye orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-[env(safe-area-inset-bottom)]">
            {orders.map((order, i) => {
              // NOTE: assumes StoredOrder has an `items` array (as saved from
              // ConfirmationScreen's cart lines) — swap this back to
              // order.size if your actual StoredOrder type still uses that
              // shape. Flag to me if this doesn't match orderTypes.ts.
              const headline = order.items?.find(
                (item: any) => item.category === 'base' || item.category === 'combo'
              );
              const extras = order.items?.filter(
                (item: any) => item.category !== 'base' && item.category !== 'combo'
              ) ?? [];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <MenuItemThumbnail
                      imageUrl={headline?.imageUrl}
                      category={headline?.category ?? 'base'}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {order.quantity > 1 ? `${order.quantity}x ` : ''}{headline?.name ?? 'Waakye Order'}
                      </p>
                      {extras.length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          + {extras.map((e: any) => e.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => onOrderAgain(order)}
                      className="shrink-0 flex items-center gap-1.5 bg-[#7a1d1d]/5 text-[#7a1d1d] font-bold text-xs px-3 py-2 rounded-xl active:scale-95 transition-transform hover:bg-[#7a1d1d]/10"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Again
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}