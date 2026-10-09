/** Random 4-digit numeric code (0000–9999) for customer ↔ rider handoff at dropoff. */
export function generateDeliveryCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

export function formatDeliveryCode(code: string | number | null | undefined): string | null {
  if (code == null || code === '') return null;
  const digits = String(code).replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length > 4) return digits.slice(-4);
  return digits.padStart(4, '0');
}

export function isActiveDeliveryCodeStatus(status: string): boolean {
  return status === 'available' || status === 'rider_assigned' || status === 'picked_up';
}

export function isOrderHandoffComplete(status: string | undefined, deliveredAt?: string | null): boolean {
  if (status === 'delivered' || status === 'cancelled') return true;
  return !!deliveredAt;
}

const STORAGE_PREFIX = 'waakye_delivery_code_';

// Deliberately localStorage (not sessionStorage): reloading/reopening the
// app must NOT orphan the rider's dropoff code or the in-progress order bar.
// Entries are removed the moment the order reaches delivered/cancelled, and
// the orders table remains the source of truth for recovery (see
// CustomerOrdersContext auto-reconstruction).
export function rememberDeliveryCode(orderId: string, code: string) {
  if (!orderId || !formatDeliveryCode(code)) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + orderId, formatDeliveryCode(code)!);
  } catch {
    /* private mode / quota */
  }
}

export function recallDeliveryCode(orderId: string): string | null {
  try {
    return formatDeliveryCode(localStorage.getItem(STORAGE_PREFIX + orderId));
  } catch {
    return null;
  }
}

const ACTIVE_ORDER_KEY = 'waakye_active_order_handoff';

export type ActiveOrderHandoff = {
  orderId: string;
  deliveryCode: string;
  status?: string;
};

/** Keeps the in-progress order + code reachable until delivered/cancelled. */
export function rememberActiveOrderHandoff(orderId: string, code: string, status?: string) {
  const formatted = formatDeliveryCode(code);
  if (!orderId || !formatted) return;
  rememberDeliveryCode(orderId, formatted);
  try {
    const payload: ActiveOrderHandoff = { orderId, deliveryCode: formatted, status };
    localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function updateActiveOrderHandoffStatus(status: string) {
  const current = recallActiveOrderHandoff();
  if (!current) return;
  rememberActiveOrderHandoff(current.orderId, current.deliveryCode, status);
}

export function recallActiveOrderHandoff(): ActiveOrderHandoff | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveOrderHandoff;
    const code = formatDeliveryCode(parsed.deliveryCode);
    if (!parsed.orderId || !code) return null;
    if (parsed.status === 'delivered' || parsed.status === 'cancelled') return null;
    return { orderId: parsed.orderId, deliveryCode: code, status: parsed.status };
  } catch {
    return null;
  }
}

export function clearActiveOrderHandoff(orderId?: string) {
  try {
    if (orderId) localStorage.removeItem(STORAGE_PREFIX + orderId);
    localStorage.removeItem(ACTIVE_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

/** Drop the bottom bar when My Orders (or any order list) shows this handoff as finished. */
export function reconcileActiveOrderHandoffFromOrders(
  orders: { id: string; status: string; delivered_at?: string | null }[],
): boolean {
  const handoff = recallActiveOrderHandoff();
  if (!handoff) return false;

  const row = orders.find((o) => o.id === handoff.orderId);
  if (!row) return false;

  if (isOrderHandoffComplete(row.status, row.delivered_at)) {
    clearActiveOrderHandoff(handoff.orderId);
    return true;
  }

  if (row.status !== handoff.status) {
    rememberActiveOrderHandoff(handoff.orderId, handoff.deliveryCode, row.status);
    return true;
  }
  return false;
}
