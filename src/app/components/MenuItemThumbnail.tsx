import { Soup, Beef, Salad, CupSoda, Croissant, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { MenuItem } from '@/app/lib/vendorMenu';

const CATEGORY_ICON: Record<MenuItem['category'], LucideIcon> = {
  base: Soup,
  protein: Beef,
  extra: Salad,
  drink: CupSoda,
  breakfast_item: Croissant,
  combo: UtensilsCrossed,
};

const SIZE_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
  full: 'w-full h-full',
} as const;

const ICON_SIZE = { sm: 16, md: 22, lg: 26, full: 32 } as const;

interface MenuItemThumbnailProps {
  imageUrl?: string | null;
  category: MenuItem['category'];
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function MenuItemThumbnail({ imageUrl, category, size = 'md', className = '' }: MenuItemThumbnailProps) {
  const Icon = CATEGORY_ICON[category] ?? UtensilsCrossed;
  const dims = SIZE_CLASSES[size];

  if (imageUrl) {
    return (
      <div className={`${dims} rounded-xl overflow-hidden bg-gray-100 shrink-0 ${className}`}>
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${dims} rounded-xl bg-[#7a1d1d]/10 flex items-center justify-center shrink-0 ${className}`}>
      <Icon size={ICON_SIZE[size]} className="text-[#7a1d1d]" />
    </div>
  );
}