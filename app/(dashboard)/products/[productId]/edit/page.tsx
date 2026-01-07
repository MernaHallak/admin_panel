'use client';

import { useParams, useRouter } from 'next/navigation';
import { EditProduct } from '@/components/products/EditProduct';
import { useAdminData } from '@/lib/store';

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const { shops, products, setProducts} = useAdminData();
  const productId = params?.productId ?? null;

  return (
    <EditProduct
      productId={productId}
      shops={shops}
      products={products}
      setProducts={setProducts}
      onBack={() => router.push('/products')}
    />
  );
}
