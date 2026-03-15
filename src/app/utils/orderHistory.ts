import { StoredOrder, OrderItem } from '@/app/types/orderTypes';

const STORAGE_KEY = 'waakye_order_history';

export function saveOrder(order: OrderItem) {
  const existing = getOrderHistory();

  const newOrder: StoredOrder = {
    ...order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([newOrder, ...existing])
  );
}

export function getOrderHistory(): StoredOrder[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
