import { supabase } from '@/app/lib/supabase';

export type MenuItem = {
  id: string;
  vendor_id: string;
  category: 'base' | 'protein' | 'extra' | 'drink' | 'breakfast_item' | 'combo';
  name: string;
  description: string | null;
  price: number; // exact price if pricing_type is 'fixed', minimum price if 'variable'
  pricing_type: 'fixed' | 'variable';
  image_url: string | null;
  is_available: boolean;
};

export type Vendor = {
  id: string;
  business_name: string;
  description: string | null;
  location: string | null;
  is_open: boolean;
  latitude: number | null;
  longitude: number | null;
};

// Any approved vendor — this replaces the old hardcoded single VENDOR_ID.
// Customers now pick a vendor via VendorSelectScreen instead of always
// landing on one fixed shop.
export async function getApprovedVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, description, location, is_open, latitude, longitude')
    .eq('status', 'approved')
    .order('business_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Vendor[];
}

export async function getVendorMenu(vendorId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('vendor_menu_items')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_available', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MenuItem[];
}

export function groupMenuByCategory(items: MenuItem[]) {
  return {
    base: items.filter((i) => i.category === 'base'),
    protein: items.filter((i) => i.category === 'protein'),
    extra: items.filter((i) => i.category === 'extra'),
    drink: items.filter((i) => i.category === 'drink'),
    breakfast_item: items.filter((i) => i.category === 'breakfast_item'),
    combo: items.filter((i) => i.category === 'combo'),
  };
}

// Haversine distance in km between two lat/lng points.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}