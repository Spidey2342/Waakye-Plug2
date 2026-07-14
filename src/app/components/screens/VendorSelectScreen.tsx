'use client';

import { motion } from 'motion/react';
import { Store, MapPin, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useVendor, type Vendor } from '@/app/context/VendorContext';

interface VendorSelectScreenProps {
  onSelect: () => void;
}

export function VendorSelectScreen({ onSelect }: VendorSelectScreenProps) {
  const { vendors, loadingVendors, selectVendor } = useVendor();

  function handlePick(vendor: Vendor) {
    if (!vendor.is_open) return;
    selectVendor(vendor);
    onSelect();
  }

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] px-4 py-6 [webkit-tap-highlight-color:transparent]">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 pt-4">
          <div className="w-12 h-12 rounded-2xl bg-[#7a1d1d]/10 flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed className="w-6 h-6 text-[#7a1d1d]" />
          </div>
          <h1 className="font-bold text-xl">Choose a Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Pick who you're ordering from today</p>
        </div>

        {loadingVendors ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-medium">No vendors within 6km right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor, i) => (
              <motion.button
                key={vendor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePick(vendor)}
                disabled={!vendor.is_open}
                className={`w-full bg-white rounded-3xl shadow-sm p-3 text-left flex items-center gap-4 transition-all ${
                  vendor.is_open ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-[#7a1d1d]/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-base truncate">{vendor.business_name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        vendor.is_open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {vendor.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {vendor.description && (
                    <p className="text-sm text-gray-500 truncate">{vendor.description}</p>
                  )}
                  {(vendor.location || vendor.distanceKm != null) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{vendor.location}</span>
                      {vendor.location && vendor.distanceKm != null && <span>·</span>}
                      {vendor.distanceKm != null && (
                        <span className="font-semibold text-[#7a1d1d]">{vendor.distanceKm.toFixed(1)} km away</span>
                      )}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}