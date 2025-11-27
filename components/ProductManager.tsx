import React, { useState } from 'react';
import { Product, Accessory } from '../types';
import { Edit, Trash2, Search, List, Bike, Zap, Battery } from 'lucide-react';
import ProductForm from './ProductForm';

interface ProductManagerProps {
  products: Product[];
  accessories: Accessory[];
  onUpdate: (item: Product | Accessory) => void;
  onDelete: (id: string, type: 'vehicle' | 'accessory') => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, accessories, onUpdate, onDelete }) => {
  const [editingItem, setEditingItem] = useState<Product | Accessory | null>(null);
  const [viewTab, setViewTab] = useState<'vehicles' | 'accessories'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccessories = accessories.filter(a => 
    a.voltage.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.capacity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: Product | Accessory) => {
    setEditingItem(item);
  };

  const handleUpdate = (updatedItem: Product | Accessory) => {
    onUpdate(updatedItem);
    setEditingItem(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string, type: 'vehicle' | 'accessory') => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this item? / 确定要删除该项吗?')) {
      onDelete(id, type);
    }
  };

  if (editingItem) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditingItem(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2">
          &larr; Back to list
        </button>
        <ProductForm onSave={handleUpdate} initialData={editingItem} onCancel={() => setEditingItem(null)} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <List className="w-5 h-5 mr-2 text-brand-600" />
            库存管理 (Manage)
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button
               onClick={() => setViewTab('vehicles')}
               className={`px-3 py-1 text-sm rounded-md transition-all ${viewTab === 'vehicles' ? 'bg-white shadow text-brand-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Vehicles
             </button>
             <button
               onClick={() => setViewTab('accessories')}
               className={`px-3 py-1 text-sm rounded-md transition-all ${viewTab === 'accessories' ? 'bg-white shadow text-brand-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Accessories
             </button>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {viewTab === 'vehicles' ? (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (¥)</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (¥)</th>
                </>
              )}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {viewTab === 'vehicles' ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                     <div className="flex flex-wrap gap-1">
                       {product.colors && product.colors.length > 0 ? product.colors.map((c, i) => <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{c}</span>) : <span className="text-gray-400 italic">None</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">¥{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      <button onClick={() => handleEdit(product)} className="text-brand-600 hover:text-brand-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(e, product.id, 'vehicle')} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredAccessories.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                    {acc.category === 'battery' ? <Battery className="w-4 h-4 mr-2 text-green-600" /> : <Zap className="w-4 h-4 mr-2 text-yellow-500" />}
                    {acc.category === 'battery' ? 'Battery' : 'Charger'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acc.voltage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acc.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">¥{acc.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      <button onClick={() => handleEdit(acc)} className="text-brand-600 hover:text-brand-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(e, acc.id, 'accessory')} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            
            {((viewTab === 'vehicles' && filteredProducts.length === 0) || (viewTab === 'accessories' && filteredAccessories.length === 0)) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManager;