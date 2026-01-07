export type Page =
  | 'shops'
  | 'shop-details'
  | 'products'
  | 'add-product'
  | 'edit-product';

export interface Shop {
  id: string;
  name: string;
  logo: string;
  city: string;
  status: 'active' | 'disabled';
  whatsapp: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  shopId: string;
  shopName: string;
  image: string;
  price: number;
  status: 'visible' | 'hidden';
  category: string;
  flagged: boolean;
  lastUpdated: string;
  description?: string;
  specs?: string;
}
