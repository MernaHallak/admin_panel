'use client';

import { useRouter } from 'next/navigation';
import { AddProduct } from '@/components/products/AddProduct';
import { useAdminData } from '@/lib/store';

export default function AddProductPage() {
  const router = useRouter();
  const { shops, products, setProducts} = useAdminData();
  return (
    <AddProduct
      shops={shops}
      products={products}
      setProducts={setProducts}
      onBack={() => router.push('/products')}
    />
  );
}
