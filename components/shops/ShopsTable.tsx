'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Pencil, Power, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';
import type { Shop } from '@/lib/types';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface ShopsTableProps {
  shops: Shop[];
  setShops: (shops: Shop[]) => void;
  onViewDetails: (shopId: string) => void;
}

export function ShopsTable({ shops, setShops, onViewDetails }: ShopsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<string | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [shopToToggle, setShopToToggle] = useState<Shop | null>(null);

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(shops.map(shop => shop.city)));
    return uniqueCities.sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shop.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = filterCity === 'all' || shop.city === filterCity;
      const matchesStatus = filterStatus === 'all' || shop.status === filterStatus;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [shops, searchQuery, filterCity, filterStatus]);

  const handleToggleStatus = (shop: Shop) => {
    setShopToToggle(shop);
    setToggleModalOpen(true);
  };

  const confirmToggleStatus = () => {
    if (!shopToToggle) return;

    setShops(shops.map(shop =>
      shop.id === shopToToggle.id
        ? { ...shop, status: shop.status === 'active' ? 'disabled' : 'active' }
        : shop
    ));
    
    const newStatus = shopToToggle.status === 'active' ? 'disabled' : 'active';
    toast.success(`Shop ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
    setShopToToggle(null);
  };

  const handleDelete = (shopId: string) => {
    setShopToDelete(shopId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!shopToDelete) return;
    
    setShops(shops.filter(shop => shop.id !== shopToDelete));
    toast.success('Shop deleted successfully');
    setShopToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Shops Management</h1>
          <p className="text-gray-600 mt-1">Manage all vendor shops in the marketplace</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* City Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'disabled')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={Store}
            title="No shops found"
            description="No shops match your current filters. Try adjusting your search criteria."
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">Shop</th>
                  <th className="px-6 py-3 text-left text-gray-700">City</th>
                  <th className="px-6 py-3 text-left text-gray-700">WhatsApp</th>
                  <th className="px-6 py-3 text-left text-gray-700">Status</th>
                  <th className="px-6 py-3 text-right text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShops.map(shop => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="text-gray-900">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{shop.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{shop.whatsapp}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full ${
                        shop.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetails(shop.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewDetails(shop.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(shop)}
                          className={`p-2 rounded-lg transition-colors ${
                            shop.status === 'active'
                              ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={shop.status === 'active' ? 'Disable' : 'Enable'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(shop.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Shop"
        message="Are you sure you want to delete this shop? This action cannot be undone and will affect all associated products."
        confirmText="Delete"
        confirmVariant="danger"
      />

      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={shopToToggle?.status === 'active' ? 'Disable Shop' : 'Enable Shop'}
        message={`Are you sure you want to ${shopToToggle?.status === 'active' ? 'disable' : 'enable'} this shop? ${
          shopToToggle?.status === 'active' 
            ? 'Products from this shop will be hidden from the marketplace.' 
            : 'Products from this shop will be visible in the marketplace.'
        }`}
        confirmText={shopToToggle?.status === 'active' ? 'Disable' : 'Enable'}
        confirmVariant="primary"
      />
    </div>
  );
}
