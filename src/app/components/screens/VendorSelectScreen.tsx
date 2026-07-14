'use client';

import { motion } from 'motion/react';
import { Store, MapPin, ChevronRight, UtensilsCrossed, Loader2, LocateFixed } from 'lucide-react';
import { useVendor, type Vendor } from '@/app/context/VendorContext';

interface VendorSelectScreenProps {
  onSelect: () => void;
}

export function VendorSelectScreen({ onSelect }: VendorSelectScreenProps) {
  const { vendors, loadingVendors, selectVendor, locationStatus, requestLocation } = useVendor();

  function handlePick(vendor: Vendor) {
    if (!vendor.is_open) return;
    selectVendor(vendor);
    onSelect();
  }

  // ── Location is mandatory: no location, no vendor list ─────────────────────
  if (locationStatus === 'pending') {
    return (
      <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="w-8 h-8 text-[#7a1d1d] animate-spin mb-4" />
        <p className="font-bold">Finding vendors near you...</p>
      </div>
    );
  }

  if (locationStatus === 'denied' || locationStatus === 'unavailable') {
    return (
      <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7a1d1d]/10 flex items-center justify-center mb-4">
          <LocateFixed className="w-7 h-7 text-[#7a1d1d]" />
        </div>
        <h1 className="font-bold text-xl mb-2">We need your location</h1>
        <p className="text-sm text-gray-500 max-w-xs mb-1">
          We only show vendors within 6km of you, so we can't find anyone nearby without it.
        </p>
        {locationStatus === 'denied' && (
          <p className="text-xs text-gray-400 max-w-xs mb-5">
            Looks like location access was blocked — you may need to allow it in your browser's site settings, then try again.
          </p>
        )}
        <button
          onClick={requestLocation}
          className="bg-[#7a1d1d] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#6a1717] transition-colors"
        >
          Enable Location
        </button>
      </div>
    );
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
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {vendor.location && <span>{vendor.location}</span>}
                    {vendor.location && <span>·</span>}
                    <span className="font-semibold text-[#7a1d1d]">{vendor.distanceKm!.toFixed(1)} km away</span>
                  </div>
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