'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SERVICE_FEE } from '@/app/types/orderTypes';
import { DELIVERY_FEE_STANDARD_GHS } from '@/app/lib/deliveryPricing';
import type { MenuItem } from '@/app/lib/vendorMenu';

// Flat shape matching exactly what orders.items needs in Supabase —
// building the cart around this from the start means checkout doesn't
// need to convert anything.
export type OrderLineItem = {
  id: string;      // vendor_menu_items id
  name: string;
  price: number;   // unit price at time of adding
  category: MenuItem['category'];
  quantity: number; // per-unit quantity within ONE composed order (e.g. 2 eggs)
  imageUrl?: string | null; // display-only — not part of the real orders.items shape
  /** What a Waakye pack line comes with (packs only) — carried into orders.items so recaps can show it. */
  included?: { name: string; quantity: number }[];
};

export type CartLine = {
  id: string;               // client-side cart line id
  vendorId: string;
  items: OrderLineItem[];   // composition for one order: base (qty 1) + chosen proteins/extras
  quantity: number;         // how many of this exact composed order
};

type DeliveryMode = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'momo';

interface CartContextType {
  lines: CartLine[];
  addToCart: (vendorId: string, items: OrderLineItem[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;

  deliveryMode: DeliveryMode;
  toggleDeliveryMode: () => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerLocation: string;
  setCustomerLocation: (loc: string) => void;
  /** Customer-confirmed dropoff pin (rider nav source of truth). */
  deliveryLat: number | null;
  deliveryLng: number | null;
  setDeliveryCoords: (lat: number, lng: number) => void;
  clearDeliveryCoords: () => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;

  /** Distance-based quote (updated on checkout map). */
  quotedDeliveryFee: number;
  setQuotedDeliveryFee: (fee: number) => void;
  quotedDistanceKm: number | null;
  setQuotedDistanceKm: (km: number | null) => void;

  itemsSubtotal: number;
  totalItems: number;
  totalPrice: number;
  pendingDeliveryFeeOwed: number;
  setPendingDeliveryFeeOwed: (amount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// The whole cart (lines + delivery details + payment) is drafted to
// localStorage so a stray page refresh — the kind that re-requests
// geolocation, clears the pin, and empties the basket — doesn't nuke an
// in-progress order. Drafts older than 24h are discarded.
const CART_KEY = 'wp.cart.v1';
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;

interface PersistedCart {
  savedAt: number;
  lines: CartLine[];
  deliveryMode: DeliveryMode;
  customerPhone: string;
  customerLocation: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod: PaymentMethod;
}

function loadPersistedCart(): PersistedCart | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCart;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    if (Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistCart(cart: PersistedCart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // storage unavailable — cart still works for this session
  }
}

export function lineUnitPrice(line: CartLine): number {
  return line.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadPersistedCart);
  const [lines, setLines] = useState<CartLine[]>(initial?.lines ?? []);
  // Defaults to 'delivery' — Pickup is a disabled "coming soon" button right
  // now, so defaulting to 'pickup' meant someone could hit Confirm without
  // ever being asked for phone/address.
const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(initial?.deliveryMode ?? 'delivery');
  const [customerPhone, setCustomerPhone] = useState(initial?.customerPhone ?? '');
  const [customerLocation, setCustomerLocation] = useState(initial?.customerLocation ?? '');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(initial?.deliveryLat ?? null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(initial?.deliveryLng ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'cash');
  const [quotedDeliveryFee, setQuotedDeliveryFee] = useState(DELIVERY_FEE_STANDARD_GHS);
  const [quotedDistanceKm, setQuotedDistanceKm] = useState<number | null>(null);
  const [pendingDeliveryFeeOwed, setPendingDeliveryFeeOwed] = useState(0);

  // Autosave the draft on every change so a refresh restores it intact.
  useEffect(() => {
    persistCart({
      savedAt: Date.now(),
      lines,
      deliveryMode,
      customerPhone,
      customerLocation,
      deliveryLat,
      deliveryLng,
      paymentMethod,
    });
  }, [lines, deliveryMode, customerPhone, customerLocation, deliveryLat, deliveryLng, paymentMethod]);

  const addToCart = (vendorId: string, items: OrderLineItem[]) => {
    const id = `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLines((prev) => [...prev, { id, vendorId, items, quantity: 1 }]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) => (line.id === id ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((line) => line.id !== id));

  const setDeliveryCoords = (lat: number, lng: number) => {
    setDeliveryLat(lat);
    setDeliveryLng(lng);
  };

  const clearDeliveryCoords = () => {
    setDeliveryLat(null);
    setDeliveryLng(null);
  };

  const clearCart = () => {
    setLines([]);
    setDeliveryMode('delivery');
    setCustomerPhone('');
    setCustomerLocation('');
    setDeliveryLat(null);
    setDeliveryLng(null);
    setPaymentMethod('cash');
    setQuotedDeliveryFee(DELIVERY_FEE_STANDARD_GHS);
    setQuotedDistanceKm(null);
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // ignore
    }
  };

  const toggleDeliveryMode = () => setDeliveryMode((m) => (m === 'pickup' ? 'delivery' : 'pickup'));

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
  const itemsSubtotal = lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0);
  const deliveryComponent =
    deliveryMode === 'delivery' ? quotedDeliveryFee : 0;
  const totalPrice =
    lines.length === 0 ? 0 : itemsSubtotal + deliveryComponent + SERVICE_FEE + pendingDeliveryFeeOwed;

  return (
    <CartContext.Provider
      value={{
        lines, addToCart, updateQuantity, removeLine, clearCart,
        deliveryMode, toggleDeliveryMode,
        customerPhone, setCustomerPhone,
        customerLocation, setCustomerLocation,
        deliveryLat, deliveryLng, setDeliveryCoords, clearDeliveryCoords,
        paymentMethod, setPaymentMethod,
        quotedDeliveryFee, setQuotedDeliveryFee,
        quotedDistanceKm, setQuotedDistanceKm,
        itemsSubtotal, totalItems, totalPrice,
        pendingDeliveryFeeOwed, setPendingDeliveryFeeOwed,
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
