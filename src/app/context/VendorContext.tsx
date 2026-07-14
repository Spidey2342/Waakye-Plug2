'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { getApprovedVendors, distanceKm, type Vendor } from '@/app/lib/vendorMenu';

export type VendorWithDistance = Vendor & { distanceKm: number | null };

interface VendorContextType {
  vendors: VendorWithDistance[];
  loadingVendors: boolean;
  selectedVendor: Vendor | null;
  selectVendor: (vendor: Vendor) => void;
  clearVendor: () => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

const MAX_DISTANCE_KM = 6;

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getApprovedVendors();
        if (!cancelled) setVendors(data);
      } catch (err) {
        console.error('Could not load vendors', err);
      } finally {
        if (!cancelled) setLoadingVendors(false);
      }
    }

    load();

    // Best-effort — if geolocation is denied or unavailable, vendors just
    // won't be distance-sorted. Never blocks loading the vendor list.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { timeout: 5000 }
      );
    }

    return () => { cancelled = true; };
  }, []);

  const sortedVendors: VendorWithDistance[] = useMemo(() => {
    const withDistance = vendors.map((v) => ({
      ...v,
      distanceKm:
        customerCoords && v.latitude != null && v.longitude != null
          ? distanceKm(customerCoords.lat, customerCoords.lng, v.latitude, v.longitude)
          : null,
    }));

    // Vendors with a known distance come first, nearest to farthest, and
    // anything farther than MAX_DISTANCE_KM is dropped entirely. Vendors
    // with no GPS set yet stay visible (excluding them outright would empty
    // the list while adoption of the location feature is still low) but
    // sort after known-distance ones.
    return withDistance
      .filter((v) => v.distanceKm == null || v.distanceKm <= MAX_DISTANCE_KM)
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [vendors, customerCoords]);

  function selectVendor(vendor: Vendor) {
    setSelectedVendor(vendor);
  }

  function clearVendor() {
    setSelectedVendor(null);
  }

  return (
    <VendorContext.Provider
      value={{ vendors: sortedVendors, loadingVendors, selectedVendor, selectVendor, clearVendor }}
    >
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used within a VendorProvider');
  return ctx;
}