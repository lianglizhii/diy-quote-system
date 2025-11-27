import React, { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';
import QuoteGenerator from './components/QuoteGenerator';
import ProductManager from './components/ProductManager';
import { Product, Accessory } from './types';
import { Bike, ClipboardList, PlusCircle, Key, ListChecks } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'quote'>('add');
  const [products, setProducts] = useState<Product[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Initialize
  useEffect(() => {
    // Load products
    const savedProducts = localStorage.getItem('benbao_products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        // MIGRATION: 
        // 1. Convert legacy 'colors' string to 'string[]'
        // 2. Map 'priceTaxInc' to 'price' if 'price' is missing
        const migrated = parsed.map((p: any) => ({
          ...p,
          colors: Array.isArray(p.colors) 
            ? p.colors 
            : (typeof p.colors === 'string' && p.colors.length > 0 ? p.colors.split(',').map((c:string) => c.trim()) : []),
          price: p.price !== undefined ? p.price : (p.priceTaxInc || 0)
        }));
        setProducts(migrated);
      } catch (e) {
        console.error("Failed to parse saved products");
      }
    }

    // Load accessories
    const savedAccessories = localStorage.getItem('benbao_accessories');
    if (savedAccessories) {
      try {
        setAccessories(JSON.parse(savedAccessories));
      } catch (e) {
        console.error("Failed to parse saved accessories");
      }
    }

    checkApiKey();
  }, []);

  const checkApiKey = async () => {
     const win = window as any;
     if (win.aistudio && win.aistudio.hasSelectedApiKey) {
       const hasKey = await win.aistudio.hasSelectedApiKey();
       setHasApiKey(hasKey);
     } else {
       setHasApiKey(!!process.env.API_KEY);
     }
  };

  const saveProductsToStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('benbao_products', JSON.stringify(newProducts));
  };

  const saveAccessoriesToStorage = (newAccessories: Accessory[]) => {
    setAccessories(newAccessories);
    localStorage.setItem('benbao_accessories', JSON.stringify(newAccessories));
  };

  const handleSaveProduct = (item: Product | Accessory) => {
    if ('category' in item) {
      // It's an accessory
      const updated = [...accessories, item as Accessory];
      saveAccessoriesToStorage(updated);
    } else {
      // It's a vehicle
      const updated = [...products, item as Product];
      saveProductsToStorage(updated);
    }
    setActiveTab('manage'); 
  };

  const handleUpdateProduct = (item: Product | Accessory) => {
    if ('category' in item) {
      const updated = accessories.map(a => a.id === item.id ? (item as Accessory) : a);
      saveAccessoriesToStorage(updated);
    } else {
      const updated = products.map(p => p.id === item.id ? (item as Product) : p);
      saveProductsToStorage(updated);
    }
  };

  const handleDeleteProduct = (id: string, type: 'vehicle' | 'accessory') => {
    if (type === 'accessory') {
      const updated = accessories.filter(a => a.id !== id);
      saveAccessoriesToStorage(updated);
    } else {
      const updated = products.filter(p => p.id !== id);
      saveProductsToStorage(updated);
    }
  };

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
      await checkApiKey();
    } else {
      alert("API Key selection not supported in this environment.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Bike className="w-8 h-8 text-brand-600" />
              <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
                BENBAO <span className="text-brand-600">EV</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
               {!hasApiKey && (
                 <button 
                  onClick={handleSelectKey}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200"
                 >
                   <Key className="w-3 h-3 mr-1" />
                   Set API Key
                 </button>
               )}
               <div className="text-xs text-gray-500 hidden sm:block">
                 Version 1.2.0
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* Sidebar Nav (Hidden on print) */}
        <nav className="w-64 flex-shrink-0 hidden md:block no-print">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'add' 
                  ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <PlusCircle className={`mr-3 h-5 w-5 ${activeTab === 'add' ? 'text-brand-500' : 'text-gray-400'}`} />
              添加产品 (Add Item)
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'manage' 
                  ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ListChecks className={`mr-3 h-5 w-5 ${activeTab === 'manage' ? 'text-brand-500' : 'text-gray-400'}`} />
              管理库存 (Manage)
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'quote' 
                  ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ClipboardList className={`mr-3 h-5 w-5 ${activeTab === 'quote' ? 'text-brand-500' : 'text-gray-400'}`} />
              生成报价/价格表 (Quote)
            </button>
          </div>
          
          <div className="mt-8 px-4">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory Stats</h3>
             <div className="mt-2 text-sm text-gray-600">
               Vehicles: <span className="font-bold text-gray-900">{products.length}</span>
             </div>
             <div className="mt-1 text-sm text-gray-600">
               Accessories: <span className="font-bold text-gray-900">{accessories.length}</span>
             </div>
          </div>
        </nav>

        {/* Mobile Tab Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 no-print">
           <button 
             onClick={() => setActiveTab('add')}
             className={`flex flex-col items-center p-2 rounded-md ${activeTab === 'add' ? 'text-brand-600' : 'text-gray-500'}`}
           >
             <PlusCircle className="h-6 w-6" />
             <span className="text-xs mt-1">Add</span>
           </button>
           <button 
             onClick={() => setActiveTab('manage')}
             className={`flex flex-col items-center p-2 rounded-md ${activeTab === 'manage' ? 'text-brand-600' : 'text-gray-500'}`}
           >
             <ListChecks className="h-6 w-6" />
             <span className="text-xs mt-1">Manage</span>
           </button>
           <button 
             onClick={() => setActiveTab('quote')}
             className={`flex flex-col items-center p-2 rounded-md ${activeTab === 'quote' ? 'text-brand-600' : 'text-gray-500'}`}
           >
             <ClipboardList className="h-6 w-6" />
             <span className="text-xs mt-1">Quote</span>
           </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {!hasApiKey && activeTab === 'quote' && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 no-print">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    Warning: Gemini API Key is not set. Translation features will not work. 
                    <button onClick={handleSelectKey} className="font-bold underline ml-1">Select Key</button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add' && <ProductForm onSave={handleSaveProduct} />}
          {activeTab === 'manage' && (
            <ProductManager 
              products={products} 
              accessories={accessories}
              onUpdate={handleUpdateProduct} 
              onDelete={handleDeleteProduct} 
            />
          )}
          {activeTab === 'quote' && <QuoteGenerator products={products} accessories={accessories} />}
        </main>
      </div>
    </div>
  );
};

export default App;