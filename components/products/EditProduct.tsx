'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Save, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Shop } from '@/lib/types';

interface EditProductProps {
  productId: string | null;
  shops: Shop[];
  products: Product[];
  setProducts: (products: Product[]) => void;
  onBack: () => void;
}

interface FormErrors {
  name?: string;
  model?: string;
  shopId?: string;
  price?: string;
  category?: string;
}

export function EditProduct({ productId, shops, products, setProducts, onBack }: EditProductProps) {
  const product = products.find(p => p.id === productId);
  
  const [formData, setFormData] = useState<Product | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['Premium', 'Business', 'Gaming', 'Budget', 'Workstation'];

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  if (!product || !formData) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

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

    if (formData.price <= 0) {
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
    const updatedProduct = {
      ...formData,
      shopName: shop?.name || formData.shopName,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setProducts(products.map(p => p.id === formData.id ? updatedProduct : p));
    toast.success('Product updated successfully');
    setIsSaving(false);
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

  const toggleFlagged = () => {
    setFormData({ ...formData, flagged: !formData.flagged });
    toast.success(formData.flagged ? 'Product unflagged' : 'Product flagged as reported');
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
            <h1 className="text-gray-900">Edit Product</h1>
            <p className="text-gray-600 mt-1">Update product information</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFlagged}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              formData.flagged
                ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Flag className="w-4 h-4" />
            {formData.flagged ? 'Unflag' : 'Flag as Reported'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Flagged Alert */}
      {formData.flagged && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Flag className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 mb-1">Product Flagged</h3>
            <p className="text-red-700">This product has been flagged as reported and may require review.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div>
            <label className="block text-gray-700 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              <img
                src={formData.image}
                alt={formData.name}
                className="w-24 h-24 rounded-lg object-cover border border-gray-200"
              />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload New Image
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
                {shops.map(shop => (
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
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
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
              value={formData.description || ''}
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
              value={formData.specs || ''}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., 16GB RAM, 512GB SSD, Intel i7"
            />
          </div>

          {/* Last Updated */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-500">Last updated: {formData.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
