'use client';

import * as React from 'react';
import type { Product, Shop } from './types';
import { initialProducts, initialShops } from './seed';

type AdminDataState = {
  shops: Shop[];
  products: Product[];
};

type AdminDataContextValue = AdminDataState & {
  setShops: (shops: Shop[]) => void;
  setProducts: (products: Product[]) => void;
  reset: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = 'laptop_store_admin:v1';

const AdminDataContext = React.createContext<AdminDataContextValue | null>(null);

function safeParse(raw: string | null): AdminDataState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const shops = Array.isArray(parsed.shops) ? parsed.shops : null;
    const products = Array.isArray(parsed.products) ? parsed.products : null;
    if (!shops || !products) return null;
    return { shops, products };
  } catch {
    return null;
  }
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [shops, _setShops] = React.useState<Shop[]>(initialShops);
  const [products, _setProducts] = React.useState<Product[]>(initialProducts);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage once
  React.useEffect(() => {
    const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (stored) {
      _setShops(stored.shops);
      _setProducts(stored.products);
    }
    setHydrated(true);
  }, []);

  // Persist after hydration
  React.useEffect(() => {
    if (!hydrated) return;
    const payload: AdminDataState = { shops, products };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [shops, products, hydrated]);

  const setShops = React.useCallback((next: Shop[]) => _setShops(next), []);
  const setProducts = React.useCallback((next: Product[]) => _setProducts(next), []);

  const reset = React.useCallback(() => {
    _setShops(initialShops);
    _setProducts(initialProducts);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AdminDataContextValue = React.useMemo(
    () => ({ shops, products, setShops, setProducts, reset, hydrated }),
    [shops, products, setShops, setProducts, reset, hydrated]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = React.useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return ctx;
}
