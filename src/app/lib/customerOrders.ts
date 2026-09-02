import { supabase } from '@/app/lib/supabase';

export type CustomerOrder = {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  delivered_at: string | null;
  vendors: { business_name: string } | null;
  riders: { profiles: { full_name: string; phone: string | null } | null } | null;
};

export async function fetchMyOrders(customerId: string): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, delivery_address, created_at, delivered_at, vendors(business_name), riders(profiles(full_name, phone))')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CustomerOrder[];
}