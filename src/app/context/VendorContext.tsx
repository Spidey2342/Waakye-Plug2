'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getApprovedVendors, type Vendor } from '@/app/lib/vendorMenu';

interface VendorContextType {
  vendors: Vendor[];
  loadingVendors: boolean;
  selectedVendor: Vendor | null;
  selectVendor: (vendor: Vendor) => void;
  clearVendor: () => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

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

  function selectVendor(vendor: Vendor) {
    setSelectedVendor(vendor);
  }

  function clearVendor() {
    setSelectedVendor(null);
  }

  return (
    <VendorContext.Provider value={{ vendors, loadingVendors, selectedVendor, selectVendor, clearVendor }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used within a VendorProvider');
  return ctx;
}