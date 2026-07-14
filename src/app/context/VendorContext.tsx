'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { getApprovedVendors, distanceKm, type Vendor } from '@/app/lib/vendorMenu';

export type VendorWithDistance = Vendor & { distanceKm: number | null };

export type LocationStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

interface VendorContextType {
  vendors: VendorWithDistance[];
  loadingVendors: boolean;
  selectedVendor: Vendor | null;
  selectVendor: (vendor: Vendor) => void;
  clearVendor: () => void;
  locationStatus: LocationStatus;
  requestLocation: () => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

const MAX_DISTANCE_KM = 6;

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('pending');

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
    return () => { cancelled = true; };
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      (err) => {
        // code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        setLocationStatus(err.code === 1 ? 'denied' : 'unavailable');
      },
      { timeout: 8000 }
    );
  }

  useEffect(() => {
    requestLocation();
  }, []);

  const sortedVendors: VendorWithDistance[] = useMemo(() => {
    if (!customerCoords) return [];

    const withDistance = vendors.map((v) => ({
      ...v,
      distanceKm:
        v.latitude != null && v.longitude != null
          ? distanceKm(customerCoords.lat, customerCoords.lng, v.latitude, v.longitude)
          : null,
    }));

    // Location is mandatory now, so we can only show vendors we can actually
    // confirm are nearby — a vendor with no GPS set stays hidden until they
    // set one, mirroring how Bolt/Uber won't surface something they can't place.
    return withDistance
      .filter((v) => v.distanceKm != null && v.distanceKm <= MAX_DISTANCE_KM)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [vendors, customerCoords]);

  function selectVendor(vendor: Vendor) {
    setSelectedVendor(vendor);
  }

  function clearVendor() {
    setSelectedVendor(null);
  }

  return (
    <VendorContext.Provider
      value={{
        vendors: sortedVendors,
        loadingVendors,
        selectedVendor,
        selectVendor,
        clearVendor,
        locationStatus,
        requestLocation,
      }}
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