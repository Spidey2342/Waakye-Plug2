import { getOrderHistory } from '@/app/utils/orderHistory';
import { StoredOrder } from '@/app/types/orderTypes';

interface Props {
  onOrderAgain: (order: StoredOrder) => void;
}

export function OrderHistoryScreen({ onOrderAgain }: Props) {
  const orders = getOrderHistory();

  return (
  <div className="min-h-[100dvh] bg-[#fefaf4] px-4 py-6 [webkit-tap-highlight-color:transparent]">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>

      {orders.length === 0 && (
        <div className="text-center py-10 text-gray-600">
  <p className="text-lg">🍚</p>
  <p className="mt-2">No orders yet.</p>
  <p className="text-sm text-gray-500">Your waakye orders will appear here.</p>
</div>
      )}

      <div className="space-y-3 pb-[env(safe-area-inset-bottom)]">
        {orders.map(order => (
          <div
            key={order.id}
          className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm active:scale-[0.98] transition"
          >
            <p className="font-bold">
              {order.size} Waakye
            </p>

            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString([], {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})}
            </p>

            <button
              onClick={() => onOrderAgain(order)}
             className="mt-3 inline-block text-[#7a1d1d] font-bold text-sm active:opacity-70"
            >
              Order again →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
