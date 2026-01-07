'use client';

import { useParams, useRouter } from 'next/navigation';
import { ShopDetails } from '@/components/shops/ShopDetails';
import { useAdminData } from '@/lib/store';

export default function ShopDetailsPage() {
  const params = useParams<{ shopId: string }>();
  const router = useRouter();
  const { shops, setShops} = useAdminData();
  const shopId = params?.shopId ?? null;

  return (
    <ShopDetails
      shopId={shopId}
      shops={shops}
      setShops={setShops}
      onBack={() => router.push('/shops')}
    />
  );
}
