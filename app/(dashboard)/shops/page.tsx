'use client';

import { useRouter } from 'next/navigation';
import { ShopsTable } from '@/components/shops/ShopsTable';
import { useAdminData } from '@/lib/store';

export default function ShopsPage() {
  const router = useRouter();
  const { shops, setShops} = useAdminData();

  // Avoid hydration flicker for localStorage (optional)
  return (
    <ShopsTable
      shops={shops}
      setShops={setShops}
      onViewDetails={(shopId) => router.push(`/shops/${shopId}`)}
    />
  );
}
