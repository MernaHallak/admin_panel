'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Shop } from '@/lib/types';

interface ShopDetailsProps {
  shopId: string | null;
  shops: Shop[];
  setShops: (shops: Shop[]) => void;
  onBack: () => void;
}

interface FormErrors {
  name?: string;
  city?: string;
  whatsapp?: string;
}

export function ShopDetails({ shopId, shops, setShops, onBack }: ShopDetailsProps) {
  const shop = shops.find(s => s.id === shopId);
  
  const [formData, setFormData] = useState<Shop | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setFormData(shop);
    }
  }, [shop]);

  if (!shop || !formData) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shops
        </button>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Shop not found</p>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else if (!/^\+?\d{10,15}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = 'Please enter a valid WhatsApp number';
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

    setShops(shops.map(s => s.id === formData.id ? formData : s));
    toast.success('Shop updated successfully');
    setIsSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
        toast.success('Logo uploaded successfully');
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
            <h1 className="text-gray-900">Shop Details</h1>
            <p className="text-gray-600 mt-1">View and edit shop information</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-gray-700 mb-2">Shop Logo</label>
            <div className="flex items-center gap-4">
              <img
                src={formData.logo}
                alt={formData.name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload New Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 mt-1">Recommended: 400x400px, PNG or JPG</p>
              </div>
            </div>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block text-gray-700 mb-2">Shop Name *</label>
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
              placeholder="Enter shop name"
            />
            {errors.name && (
              <p className="text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                setErrors({ ...errors, city: undefined });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter city"
            />
            {errors.city && (
              <p className="text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-gray-700 mb-2">WhatsApp Number *</label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => {
                setFormData({ ...formData, whatsapp: e.target.value });
                setErrors({ ...errors, whatsapp: undefined });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.whatsapp ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1234567890"
            />
            {errors.whatsapp && (
              <p className="text-red-600 mt-1">{errors.whatsapp}</p>
            )}
            <p className="text-gray-500 mt-1">Include country code (e.g., +1234567890)</p>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-gray-700 mb-2">Shop Status</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'disabled' : 'active' })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.status === 'active' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`${
                formData.status === 'active' ? 'text-green-700' : 'text-gray-700'
              }`}>
                {formData.status === 'active' ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {formData.status === 'active' 
                ? 'Shop is visible and products can be sold' 
                : 'Shop is hidden and products are not visible'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
