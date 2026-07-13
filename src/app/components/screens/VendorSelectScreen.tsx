'use client';

import { motion } from 'motion/react';
import { Store, MapPin, ChevronRight } from 'lucide-react';
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
          <div className="text-4xl mb-2">🍚</div>
          <h1 className="font-bold text-xl">Choose a Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Pick who you're ordering from today</p>
        </div>

        {loadingVendors ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No vendors available right now.</p>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor, i) => (
              <motion.button
                key={vendor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePick(vendor)}
                disabled={!vendor.is_open}
                className={`w-full bg-white rounded-2xl border-2 p-4 text-left flex items-center gap-3 transition-colors ${
                  vendor.is_open ? 'border-gray-100 hover:border-[#7a1d1d]/30' : 'border-gray-100 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#7a1d1d]/10 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-[#7a1d1d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{vendor.business_name}</p>
                    {!vendor.is_open && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">Closed</span>
                    )}
                  </div>
                  {vendor.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{vendor.description}</p>
                  )}
                  {vendor.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {vendor.location}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}