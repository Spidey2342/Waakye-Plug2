import { supabase } from '@/app/lib/supabase';
import type { CartLine } from '@/app/context/CartContext';

export type PaymentMethod = 'cash' | 'momo';

export async function submitOrder({
  customerId,
  vendorId,
  lines,
  totalAmount,
  deliveryAddress,
  paymentMethod,
}: {
  customerId: string;
  vendorId: string;
  lines: CartLine[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
}) {
  // Flatten cart lines into the plain jsonb shape the vendor dashboard expects
  // under `orders.items` — vendor's OrdersTab doesn't currently render this
  // in detail, but keeping it structured means that's easy to add later.
  const items = lines.map((line) => ({
    id: line.id,
    quantity: line.quantity,
    items: line.items,
  }));

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      vendor_id: vendorId,
      items,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}