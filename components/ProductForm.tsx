import React, { useState, useEffect } from 'react';
import { Product, Accessory, BATTERY_OPTIONS } from '../types';
import { Plus, Save, X, RotateCcw, Battery, Zap, Bike } from 'lucide-react';

interface ProductFormProps {
  onSave: (item: Product | Accessory) => void;
  initialData?: Product | Accessory;
  onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, initialData, onCancel }) => {
  const [itemType, setItemType] = useState<'vehicle' | 'battery' | 'charger'>('vehicle');
  
  // Vehicle Form State
  const [productData, setProductData] = useState<Partial<Product>>({
    battery: [],
    colors: [],
  });
  
  // Accessory Form State
  const [accessoryData, setAccessoryData] = useState<Partial<Accessory>>({
    category: 'battery',
  });

  const [customBattery, setCustomBattery] = useState('');
  const [customColor, setCustomColor] = useState('');

  // Load initial data (Edit Mode)
  useEffect(() => {
    if (initialData) {
      if ('category' in initialData) {
        setItemType(initialData.category);
        setAccessoryData(initialData);
      } else {
        setItemType('vehicle');
        setProductData(initialData);
      }
    } else {
      // Reset
      setProductData({ battery: [], colors: [] });
      setAccessoryData({ category: 'battery' });
    }
  }, [initialData]);

  // Handlers for Vehicle
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const toggleBattery = (option: string) => {
    setProductData(prev => {
      const current = prev.battery || [];
      if (current.includes(option)) {
        return { ...prev, battery: current.filter(b => b !== option) };
      } else {
        return { ...prev, battery: [...current, option] };
      }
    });
  };

  const addCustomBattery = () => {
    if (customBattery && !productData.battery?.includes(customBattery)) {
      setProductData(prev => ({
        ...prev,
        battery: [...(prev.battery || []), customBattery]
      }));
      setCustomBattery('');
    }
  };

  const addCustomColor = () => {
    if (customColor && !productData.colors?.includes(customColor)) {
      setProductData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), customColor]
      }));
      setCustomColor('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    setProductData(prev => ({
      ...prev,
      colors: prev.colors?.filter(c => c !== colorToRemove) || []
    }));
  };

  // Handlers for Accessory
  const handleAccessoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccessoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleAccessoryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessoryData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (itemType === 'vehicle') {
      if (!productData.model || !productData.name) {
        alert("Model and Name are required");
        return;
      }
      const newProduct: Product = {
        id: productData.id || Date.now().toString(),
        model: productData.model || '',
        name: productData.name || '',
        battery: productData.battery || [],
        motor: productData.motor || '',
        brakeTire: productData.brakeTire || '',
        seatDash: productData.seatDash || '',
        controlFunc: productData.controlFunc || '',
        additional: productData.additional || '',
        colors: productData.colors || [],
        price: productData.price || 0,
      };
      onSave(newProduct);
      if (!initialData) {
        setProductData({ battery: [], colors: [] });
        alert("Vehicle Saved");
      }
    } else {
      // Accessory
      if (!accessoryData.voltage || !accessoryData.capacity) {
        alert("Voltage and Capacity are required");
        return;
      }
      const newAccessory: Accessory = {
        id: accessoryData.id || Date.now().toString(),
        category: itemType, // 'battery' or 'charger'
        voltage: accessoryData.voltage || '',
        capacity: accessoryData.capacity || '',
        price: accessoryData.price || 0,
      };
      onSave(newAccessory);
      if (!initialData) {
        setAccessoryData({ category: itemType, voltage: '', capacity: '', price: 0 });
        alert(`${itemType === 'battery' ? 'Battery' : 'Charger'} Saved`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          {initialData ? (
            <>
              <RotateCcw className="w-5 h-5 mr-2 text-orange-600" />
              编辑 (Edit Item)
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2 text-brand-600" />
              添加 (Add Item)
            </>
          )}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Tabs (Only show in Add mode, or if editing an existing type, lock tab selection if desired but here we just hide tabs in edit mode usually, or allow switching if creating new) */}
      {!initialData && (
        <div className="flex space-x-4 mb-6 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setItemType('vehicle')}
            className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              itemType === 'vehicle' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bike className="w-4 h-4 mr-2" />
            电动车 (Vehicle)
          </button>
          <button
            type="button"
            onClick={() => setItemType('battery')}
            className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              itemType === 'battery' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Battery className="w-4 h-4 mr-2" />
            电池 (Battery)
          </button>
          <button
            type="button"
            onClick={() => setItemType('charger')}
            className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              itemType === 'charger' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            充电器 (Charger)
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {itemType === 'vehicle' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">型号 (Model)</label>
                <input name="model" value={productData.model || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" placeholder="e.g. BB-X1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">名称 (Name)</label>
                <input name="name" value={productData.name || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" placeholder="e.g. City Cruiser" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">价格 (Price - Tax Inc) ¥</label>
                <input name="price" type="number" value={productData.price || ''} onChange={handleProductPriceChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">电池选项 (Battery Options)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {BATTERY_OPTIONS.map(opt => (
                  <button key={opt} type="button" onClick={() => toggleBattery(opt)} className={`px-3 py-1 rounded-full text-sm border ${productData.battery?.includes(opt) ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{opt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customBattery} onChange={(e) => setCustomBattery(e.target.value)} placeholder="其他电池规格 (Other)" className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomBattery())} />
                <button type="button" onClick={addCustomBattery} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">添加 (Add)</button>
              </div>
              {productData.battery && productData.battery.length > 0 && <div className="mt-2 text-sm text-gray-500">已选: {productData.battery.join(', ')}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">电机/控制器 (Motor/Controller)</label>
              <input name="motor" value={productData.motor || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">制动/轮胎 (Brake/Tire)</label>
              <input name="brakeTire" value={productData.brakeTire || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">座椅/仪表 (Seat/Dashboard)</label>
              <input name="seatDash" value={productData.seatDash || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">操控功能 (Control Func)</label>
              <input name="controlFunc" value={productData.controlFunc || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">附加配置 (Additional Config)</label>
              <input name="additional" value={productData.additional || ''} onChange={handleProductChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">可选颜色 (Colors)</label>
              <div className="flex gap-2 mb-3">
                <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="输入颜色并添加 (Enter color)" className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())} />
                <button type="button" onClick={addCustomColor} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">添加颜色 (Add Color)</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {productData.colors && productData.colors.map((color, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    {color}
                    <button type="button" onClick={() => removeColor(color)} className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-600 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white">
                      <span className="sr-only">Remove color</span>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-lg">
            {/* Accessory Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">电压 (Voltage)</label>
              <input name="voltage" value={accessoryData.voltage || ''} onChange={handleAccessoryChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" placeholder="e.g. 72V" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">容量/规格 (Capacity)</label>
              <input name="capacity" value={accessoryData.capacity || ''} onChange={handleAccessoryChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" placeholder="e.g. 20Ah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">价格 (Price) ¥</label>
              <input name="price" type="number" value={accessoryData.price || ''} onChange={handleAccessoryPriceChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2" />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
              initialData 
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            <Save className="w-5 h-5 mr-2" />
            {initialData ? '更新信息 (Update)' : `保存${itemType === 'vehicle' ? '车型' : (itemType === 'battery' ? '电池' : '充电器')} (Save)`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;