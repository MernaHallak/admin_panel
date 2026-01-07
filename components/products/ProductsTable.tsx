'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Pencil, EyeOff, Trash2, Plus, Package, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Shop } from '@/lib/types';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface ProductsTableProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  shops: Shop[];
  onEditProduct: (productId: string) => void;
  onAddProduct: () => void;
}

export function ProductsTable({ products, setProducts, shops, onEditProduct, onAddProduct }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShop, setFilterShop] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden'>('all');
  const [filterFlagged, setFilterFlagged] = useState<'all' | 'flagged'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return uniqueCategories.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.shopName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesShop = filterShop === 'all' || product.shopId === filterShop;
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      const matchesFlagged = filterFlagged === 'all' || (filterFlagged === 'flagged' && product.flagged);
      
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = product.price >= min && product.price <= max;

      return matchesSearch && matchesShop && matchesCategory && matchesStatus && matchesFlagged && matchesPrice;
    });
  }, [products, searchQuery, filterShop, filterCategory, filterStatus, filterFlagged, minPrice, maxPrice]);

  const handleToggleVisibility = (product: Product) => {
    setProductToToggle(product);
    setToggleModalOpen(true);
  };

  const confirmToggleVisibility = () => {
    if (!productToToggle) return;

    setProducts(products.map(p =>
      p.id === productToToggle.id
        ? { ...p, status: p.status === 'visible' ? 'hidden' : 'visible' }
        : p
    ));
    
    const newStatus = productToToggle.status === 'visible' ? 'hidden' : 'visible';
    toast.success(`Product ${newStatus === 'visible' ? 'shown' : 'hidden'} successfully`);
    setProductToToggle(null);
  };

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;
    
    setProducts(products.filter(p => p.id !== productToDelete));
    toast.success('Product deleted successfully');
    setProductToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage all products across all shops</p>
        </div>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shop Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterShop}
              onChange={(e) => setFilterShop(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'visible' | 'hidden')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Flagged Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterFlagged}
              onChange={(e) => setFilterFlagged(e.target.value as 'all' | 'flagged')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Products</option>
              <option value="flagged">Flagged Only</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={Package}
            title="No products found"
            description="No products match your current filters. Try adjusting your search criteria or add a new product."
            actionLabel="Add Product"
            onAction={onAddProduct}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">Product</th>
                  <th className="px-6 py-3 text-left text-gray-700">Shop</th>
                  <th className="px-6 py-3 text-left text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-gray-700">Last Updated</th>
                  <th className="px-6 py-3 text-right text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          {product.flagged && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <Flag className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-gray-900">{product.name}</div>
                          <div className="text-gray-500">{product.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{product.shopName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">${product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full ${
                          product.status === 'visible'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status === 'visible' ? 'Visible' : 'Hidden'}
                        </span>
                        {product.flagged && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{product.lastUpdated}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditProduct(product.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditProduct(product.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.status === 'visible'
                              ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={product.status === 'visible' ? 'Hide' : 'Show'}
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={confirmToggleVisibility}
        title={productToToggle?.status === 'visible' ? 'Hide Product' : 'Show Product'}
        message={`Are you sure you want to ${productToToggle?.status === 'visible' ? 'hide' : 'show'} this product? ${
          productToToggle?.status === 'visible' 
            ? 'It will not be visible to customers.' 
            : 'It will be visible to customers.'
        }`}
        confirmText={productToToggle?.status === 'visible' ? 'Hide' : 'Show'}
        confirmVariant="primary"
      />
    </div>
  );
}
