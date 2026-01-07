'use client';

import { useRouter } from 'next/navigation';
import { ProductsTable } from '@/components/products/ProductsTable';
import { useAdminData } from '@/lib/store';

export default function ProductsPage() {
  const router = useRouter();
  const { products, setProducts, shops} = useAdminData();
  return (
    <ProductsTable
      products={products}
      setProducts={setProducts}
      shops={shops}
      onAddProduct={() => router.push('/products/add')}
      onEditProduct={(productId) => router.push(`/products/${productId}/edit`)}
    />
  );
}
