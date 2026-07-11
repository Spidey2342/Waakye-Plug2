'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  OrderItem,
  Breakfast,
  BOWL_SIZES,
  PROTEINS,
  EXTRAS,
  S_Breakfast,
  BREAKFAST_EXTRAS,
  DELIVERY_FEE,
  SERVICE_FEE,
} from '@/app/types/orderTypes';

export type CartLine = {
  id: string;
  type: 'waakye' | 'breakfast';
  order: OrderItem | Breakfast;
  quantity: number;
};

type DeliveryMode = 'pickup' | 'delivery';

interface CartContextType {
  lines: CartLine[];
  addToCart: (type: 'waakye' | 'breakfast', order: OrderItem | Breakfast) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;

  deliveryMode: DeliveryMode;
  toggleDeliveryMode: () => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerLocation: string;
  setCustomerLocation: (loc: string) => void;

  itemsSubtotal: number;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Item price ONLY — bowl/breakfast + proteins + extras, no fees.
// SERVICE_FEE / DELIVERY_FEE are applied once for the whole cart in
// totalPrice below, since orderTypes.ts's calculateOrderTotal /
// calculateBreakfastTotal already bake those fees into a single item
// and would double-count them if reused per line here.
export function waakyeItemPrice(order: OrderItem): number {
  let total = BOWL_SIZES[order.size].price;
  Object.entries(order.proteins).forEach(([id, qty]) => {
    const protein = PROTEINS.find((p) => p.id === id);
    if (protein) total += protein.price * qty;
  });
  order.extras.forEach((id) => {
    const extra = EXTRAS.find((e) => e.id === id);
    if (extra) total += extra.price;
  });
  return total;
}

export function breakfastItemPrice(order: Breakfast): number {
  let total = S_Breakfast[order.drink].price;
  order.extras.forEach((id) => {
    const extra = BREAKFAST_EXTRAS.find((e) => e.id === id);
    if (extra) total += extra.price;
  });
  return total;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');

  const addToCart = (type: 'waakye' | 'breakfast', order: OrderItem | Breakfast) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLines((prev) => [...prev, { id, type, order, quantity: 1 }]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.id === id ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((line) => line.id !== id));

  const clearCart = () => {
    setLines([]);
    setDeliveryMode('pickup');
    setCustomerPhone('');
    setCustomerLocation('');
  };

  const toggleDeliveryMode = () =>
    setDeliveryMode((m) => (m === 'pickup' ? 'delivery' : 'pickup'));

  const lineUnitPrice = (line: CartLine) =>
    line.type === 'waakye'
      ? waakyeItemPrice(line.order as OrderItem)
      : breakfastItemPrice(line.order as Breakfast);

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
  const itemsSubtotal = lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0);
  const totalPrice =
    lines.length === 0
      ? 0
      : itemsSubtotal + (deliveryMode === 'delivery' ? DELIVERY_FEE : 0) + SERVICE_FEE;

  return (
    <CartContext.Provider
      value={{
        lines,
        addToCart,
        updateQuantity,
        removeLine,
        clearCart,
        deliveryMode,
        toggleDeliveryMode,
        customerPhone,
        setCustomerPhone,
        customerLocation,
        setCustomerLocation,
        itemsSubtotal,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}