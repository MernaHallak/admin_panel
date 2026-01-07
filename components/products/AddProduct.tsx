'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Shop } from '@/lib/types';

interface AddProductProps {
  shops: Shop[];
  products: Product[];
  setProducts: (products: Product[]) => void;
  onBack: () => void;
}

interface FormData {
  name: string;
  model: string;
  shopId: string;
  image: string;
  price: string;
  category: string;
  status: 'visible' | 'hidden';
  description: string;
  specs: string;
}

interface FormErrors {
  name?: string;
  model?: string;
  shopId?: string;
  price?: string;
  category?: string;
}

export function AddProduct({ shops, products, setProducts, onBack }: AddProductProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    model: '',
    shopId: '',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=150&fit=crop',
    price: '',
    category: '',
    status: 'visible',
    description: '',
    specs: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['Premium', 'Business', 'Gaming', 'Budget', 'Workstation'];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.shopId) {
      newErrors.shopId = 'Please select a shop';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const shop = shops.find(s => s.id === formData.shopId);
    const newProduct: Product = {
      id: String(Date.now()),
      name: formData.name,
      model: formData.model,
      shopId: formData.shopId,
      shopName: shop?.name || '',
      image: formData.image,
      price: parseFloat(formData.price),
      status: formData.status,
      category: formData.category,
      flagged: false,
      lastUpdated: new Date().toISOString().split('T')[0],
      description: formData.description,
      specs: formData.specs,
    };

    setProducts([...products, newProduct]);
    toast.success('Product created successfully');
    setIsSaving(false);
    onBack();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-gray-900">Add New Product</h1>
            <p className="text-gray-600 mt-1">Create a new product and assign it to a shop</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Create Product'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div>
            <label className="block text-gray-700 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              <img
                src={formData.image}
                alt="Product"
                className="w-24 h-24 rounded-lg object-cover border border-gray-200"
              />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 mt-1">Recommended: 800x600px, PNG or JPG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., MacBook Pro 16&quot;"
              />
              {errors.name && (
                <p className="text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-gray-700 mb-2">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  setErrors({ ...errors, model: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.model ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., M3 Max"
              />
              {errors.model && (
                <p className="text-red-600 mt-1">{errors.model}</p>
              )}
            </div>

            {/* Shop */}
            <div>
              <label className="block text-gray-700 mb-2">Shop *</label>
              <select
                value={formData.shopId}
                onChange={(e) => {
                  setFormData({ ...formData, shopId: e.target.value });
                  setErrors({ ...errors, shopId: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
                  errors.shopId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a shop</option>
                {shops.filter(s => s.status === 'active').map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
              {errors.shopId && (
                <p className="text-red-600 mt-1">{errors.shopId}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-gray-700 mb-2">Price (USD) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  setErrors({ ...errors, price: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
              />
              {errors.price && (
                <p className="text-red-600 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setErrors({ ...errors, category: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 mt-1">{errors.category}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-700 mb-2">Visibility Status</label>
              <div className="flex items-center gap-3 h-[42px]">
                <button
                  onClick={() => setFormData({ ...formData, status: formData.status === 'visible' ? 'hidden' : 'visible' })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.status === 'visible' ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status === 'visible' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`${
                  formData.status === 'visible' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {formData.status === 'visible' ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Product description..."
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-gray-700 mb-2">Specifications</label>
            <textarea
              value={formData.specs}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., 16GB RAM, 512GB SSD, Intel i7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
