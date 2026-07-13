import { supabase } from '@/app/lib/supabase';

export type MenuItem = {
  id: string;
  vendor_id: string;
  category: 'base' | 'protein' | 'extra' | 'drink' | 'breakfast_item' | 'combo';
  name: string;
  price: number; // exact price if pricing_type is 'fixed', minimum price if 'variable'
  pricing_type: 'fixed' | 'variable';
  image_url: string | null;
  is_available: boolean;
};

// Waakye Plug's own vendor row — single-shop mode for now. When multi-vendor
// browsing lands later, this becomes a parameter instead of a constant.
export const VENDOR_ID = '88efc36d-614f-4018-8059-76e83098b0ed';

export async function getVendorMenu(vendorId: string = VENDOR_ID): Promise<MenuItem[]> {
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