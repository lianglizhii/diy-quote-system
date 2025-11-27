import React, { useState, useEffect, useRef } from 'react';
import { Product, Accessory, CartItem, Language, DocumentType } from '../types';
import { Trash2, FileText, Download, Printer, Loader2, Battery, Zap, Bike, Upload, Image as ImageIcon } from 'lucide-react';
import { translateProductsToEnglish } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface QuoteGeneratorProps {
  products: Product[];
  accessories: Accessory[];
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ products, accessories }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'vehicle' | 'battery' | 'charger'>('vehicle');
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [language, setLanguage] = useState<Language>('zh');
  const [docType, setDocType] = useState<DocumentType>('quotation'); // 'quotation' or 'price_list'
  
  const [translatedCart, setTranslatedCart] = useState<CartItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [format, setFormat] = useState<'pad' | 'excel'>('pad');
  
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Logo
  useEffect(() => {
    const savedLogo = localStorage.getItem('benbao_logo');
    if (savedLogo) setLogo(savedLogo);
  }, []);

  // Reset selections when category changes
  useEffect(() => {
    setSelectedId('');
    setSelectedColor('');
  }, [activeCategory]);

  // Sync translation
  useEffect(() => {
    const handleTranslation = async () => {
      if (language === 'en' && cart.length > 0) {
        setIsTranslating(true);
        try {
          // Separate vehicles from accessories (we only translate vehicles for now)
          const vehicles = cart.filter(item => item.type === 'vehicle') as (Product & { type: 'vehicle', quantity: number, selectedColor: string })[];
          const others = cart.filter(item => item.type !== 'vehicle');

          const vehiclesToTranslate = vehicles.map(({ quantity, selectedColor, type, ...product }) => product);
          const translatedVehicles = await translateProductsToEnglish(vehiclesToTranslate);
          
          const newTranslatedVehicles = translatedVehicles.map((p, index) => ({
            ...p,
            type: 'vehicle' as const,
            quantity: vehicles[index].quantity,
            selectedColor: vehicles[index].selectedColor
          }));

          setTranslatedCart([...newTranslatedVehicles, ...others]);
        } catch (error) {
          console.error("Translation error", error);
          setTranslatedCart(cart); 
        } finally {
          setIsTranslating(false);
        }
      } else {
        setTranslatedCart(cart);
      }
    };
    handleTranslation();
  }, [language, cart]);

  const displayCart = language === 'en' ? translatedCart : cart;
  const currentProduct = products.find(p => p.id === selectedId);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("图片文件过大，请上传小于 2MB 的图片 (Image too large, max 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogo(base64);
        localStorage.setItem('benbao_logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const addToCart = () => {
    if (!selectedId) return;

    if (activeCategory === 'vehicle') {
      const product = products.find(p => p.id === selectedId);
      if (product) {
        const colorToAdd = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : 'Standard');
        setCart(prev => {
          const existing = prev.find(item => item.id === product.id && item.type === 'vehicle' && item.selectedColor === colorToAdd);
          if (existing) {
             return prev.map(item => (item.id === product.id && item.type === 'vehicle' && item.selectedColor === colorToAdd) ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { ...product, type: 'vehicle', quantity: 1, selectedColor: colorToAdd }];
        });
      }
    } else {
      const acc = accessories.find(a => a.id === selectedId);
      if (acc) {
        setCart(prev => {
          const existing = prev.find(item => item.id === acc.id && item.type === 'accessory');
          if (existing) {
             return prev.map(item => (item.id === acc.id && item.type === 'accessory') ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { ...acc, type: 'accessory', quantity: 1 }];
        });
      }
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const getTotal = () => {
    return displayCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Excel Export
  const exportCSV = () => {
    const headers = [
      language === 'zh' ? '类型' : 'Type',
      language === 'zh' ? '型号/规格' : 'Model/Spec',
      language === 'zh' ? '详情' : 'Details',
      language === 'zh' ? '颜色' : 'Color',
      language === 'zh' ? '单价' : 'Unit Price',
      ...(docType === 'quotation' ? [
        language === 'zh' ? '数量' : 'Qty',
        language === 'zh' ? '总价' : 'Total'
      ] : [])
    ];

    const rows = displayCart.map(item => {
      let spec = '';
      let details = '';
      let color = '';

      if (item.type === 'vehicle') {
        const p = item as Product;
        spec = p.model;
        details = p.name;
        color = docType === 'price_list' ? p.colors.join('; ') : (item as any).selectedColor;
      } else {
        const a = item as Accessory;
        spec = `${a.voltage} ${a.capacity}`;
        details = a.category === 'battery' ? 'Battery' : 'Charger';
      }

      const row = [
        item.type,
        spec,
        details,
        color,
        item.price
      ];
      
      if (docType === 'quotation') {
        row.push(item.quantity);
        row.push(item.quantity * item.price);
      }
      return row;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `benbao_${docType}_${language}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Generation
  const handleDownloadPdf = async () => {
    const element = document.getElementById('quote-preview');
    if (!element) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Hide no-print elements
          clonedDoc.querySelectorAll('.hide-in-pdf').forEach((el) => { (el as HTMLElement).style.display = 'none'; });
          // Ensure print-only elements are visible
          clonedDoc.querySelectorAll('.print-only').forEach((el) => { (el as HTMLElement).style.display = 'block'; });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if content overflows (unlikely with fixed A4 container, but good for safety)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position - heightLeft - pdfHeight, pdfWidth, imgHeight); 
        heightLeft -= pdfHeight;
      }

      pdf.save(`Benbao_${docType === 'quotation' ? 'Quote' : 'PriceList'}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Fail:", error);
      alert("PDF generation failed, falling back to browser print.");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 no-print">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-brand-600" />
          生成文档 (Generate Document)
        </h2>

        {/* Add Item Section */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex space-x-4 mb-4">
            <button onClick={() => setActiveCategory('vehicle')} className={`flex items-center text-sm font-medium pb-2 border-b-2 ${activeCategory === 'vehicle' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}><Bike className="w-4 h-4 mr-2"/>车型</button>
            <button onClick={() => setActiveCategory('battery')} className={`flex items-center text-sm font-medium pb-2 border-b-2 ${activeCategory === 'battery' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}><Battery className="w-4 h-4 mr-2"/>电池</button>
            <button onClick={() => setActiveCategory('charger')} className={`flex items-center text-sm font-medium pb-2 border-b-2 ${activeCategory === 'charger' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}><Zap className="w-4 h-4 mr-2"/>充电器</button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">选择产品 (Select Item)</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm border p-2">
                <option value="">-- Select --</option>
                {activeCategory === 'vehicle' ? (
                  products.map(p => <option key={p.id} value={p.id}>{p.model} - {p.name}</option>)
                ) : (
                  accessories.filter(a => a.category === activeCategory).map(a => <option key={a.id} value={a.id}>{a.voltage} {a.capacity} - ¥{a.price}</option>)
                )}
              </select>
            </div>
            
            {activeCategory === 'vehicle' && (
              <div className="flex-1 w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">选择颜色 (Select Color)</label>
                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} disabled={!selectedId} className="block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100">
                  <option value="">-- {currentProduct?.colors?.length ? 'Select Color' : 'Default'} --</option>
                  {currentProduct?.colors?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <button onClick={addToCart} disabled={!selectedId} className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-gray-300">+ 添加 (Add)</button>
          </div>
        </div>

        {/* Config Options */}
        <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-md border border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Type / 类型</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setDocType('quotation')} className={`px-3 py-1 text-sm rounded-md border ${docType === 'quotation' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300'}`}>报价单 (Quote)</button>
              <button onClick={() => setDocType('price_list')} className={`px-3 py-1 text-sm rounded-md border ${docType === 'price_list' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300'}`}>价格表 (List)</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Language / 语言</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setLanguage('zh')} className={`px-3 py-1 text-sm rounded-md border ${language === 'zh' ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white border-gray-300'}`}>中文</button>
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-md border ${language === 'en' ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white border-gray-300'}`}>English</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Logo Setting</label>
            <div className="flex gap-2 mt-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <button onClick={triggerFileUpload} className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <Upload className="w-3 h-3 mr-1" /> {logo ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logo && <button onClick={() => { setLogo(null); localStorage.removeItem('benbao_logo'); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
          
          <div className="ml-auto flex gap-2">
             {format === 'excel' ? (
                <button onClick={exportCSV} disabled={cart.length === 0} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"><Download className="w-4 h-4 mr-2" /> Export</button>
             ) : (
               <>
                 <button onClick={() => window.print()} disabled={cart.length === 0} className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"><Printer className="w-4 h-4" /></button>
                 <button onClick={handleDownloadPdf} disabled={cart.length === 0 || isGeneratingPdf} className="flex items-center px-4 py-2 bg-brand-700 text-white rounded-md hover:bg-brand-800 disabled:opacity-50">{isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Download PDF</button>
               </>
             )}
          </div>
        </div>
      </div>

      {/* Preview Area Container - Styled to look like a workspace */}
      <div className="bg-gray-200 p-4 md:p-8 rounded-xl border border-gray-300 overflow-auto flex justify-center print:bg-white print:p-0 print:border-none">
        
        {/* Actual A4 Page */}
        <div 
          id="quote-preview" 
          className="bg-white shadow-xl flex flex-col relative print:shadow-none"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', // A4 height
            height: '297mm',    // Enforce fixed height for single page designs if needed, but minHeight is safer
            padding: '15mm'     // Standard margins
          }}
        >
          {/* Main Content Wrapper */}
          <div className="flex-grow flex flex-col h-full">
            
            {/* Header */}
            <div className="border-b-2 border-brand-600 pb-4 mb-4 flex justify-between items-start">
              <div className="flex items-center">
                {logo ? (
                  <img src={logo} alt="Company Logo" className="h-16 w-auto max-w-[200px] object-contain mr-4" />
                ) : (
                  <div onClick={triggerFileUpload} className="h-16 w-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 mr-4 no-print" title="Click to upload logo">
                     <ImageIcon className="w-6 h-6 mb-1" />
                     <span className="text-[10px]">Logo</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-serif-sc font-bold text-gray-900 tracking-tight text-brand-700">
                    {language === 'zh' ? '浙江奔宝车业有限公司' : 'ZHEJIANG BENBAO VEHICLE CO., LTD.'}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">{language === 'zh' ? '日期: ' : 'Date: '}{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-brand-600 uppercase tracking-widest font-serif">
                  {docType === 'quotation' 
                    ? (language === 'zh' ? '报价单' : 'QUOTATION') 
                    : (language === 'zh' ? '价格表' : 'PRICE LIST')
                  }
                </h2>
                <div className="text-sm text-gray-500 mt-2 font-mono">
                  <p>Ref: {docType === 'quotation' ? 'Q' : 'P'}-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>
            </div>

            {isTranslating ? (
              <div className="py-20 text-center text-brand-600 flex flex-col items-center justify-center no-print hide-in-pdf"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p>Translating via Gemini AI...</p></div>
            ) : (
              <div className="mb-4 flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-800">
                      <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase w-10">#</th>
                      <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase w-1/4">{language === 'zh' ? '型号/规格' : 'Model/Spec'}</th>
                      <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase w-1/3">{language === 'zh' ? '配置详情' : 'Details'}</th>
                      {docType === 'price_list' && <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase">{language === 'zh' ? '可选颜色' : 'Colors'}</th>}
                      <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase text-right w-24">{language === 'zh' ? '单价' : 'Price'}</th>
                      
                      {docType === 'quotation' && (
                        <>
                          <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase text-center w-16">{language === 'zh' ? '数量' : 'Qty'}</th>
                          <th className="py-2 px-2 text-xs font-bold text-gray-800 uppercase text-right w-24">{language === 'zh' ? '总计' : 'Total'}</th>
                        </>
                      )}
                      <th className="py-2 px-2 text-xs w-8 no-print hide-in-pdf"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayCart.map((item, idx) => {
                      const isVehicle = item.type === 'vehicle';
                      return (
                        <tr key={`${item.id}-${idx}`}>
                          <td className="py-2 px-2 text-sm text-gray-600 align-top">{idx + 1}</td>
                          
                          {/* Model/Spec Column */}
                          <td className="py-2 px-2 align-top">
                            {isVehicle ? (
                              <>
                                <div className="font-bold text-gray-900 text-sm">{(item as Product).model}</div>
                                <div className="text-gray-600 text-xs">{(item as Product).name}</div>
                                {docType === 'quotation' && <div className="text-xs text-brand-700 font-semibold mt-0.5">Color: {(item as any).selectedColor}</div>}
                              </>
                            ) : (
                              <>
                                <div className="font-bold text-gray-900 text-sm">{(item as Accessory).category === 'battery' ? 'Battery' : 'Charger'}</div>
                                <div className="text-gray-600 text-xs">{(item as Accessory).voltage} {(item as Accessory).capacity}</div>
                              </>
                            )}
                          </td>

                          {/* Details Column */}
                          <td className="py-2 px-2 text-xs text-gray-600 space-y-0.5 align-top leading-tight">
                            {isVehicle ? (
                              <>
                                <p><span className="font-semibold text-gray-800">Motor:</span> {(item as Product).motor}</p>
                                <p><span className="font-semibold text-gray-800">Brake/Tire:</span> {(item as Product).brakeTire}</p>
                                <p><span className="font-semibold text-gray-800">Batt Support:</span> {(item as Product).battery.join(', ')}</p>
                              </>
                            ) : (
                              <p>Original Accessory</p>
                            )}
                          </td>

                          {/* Price List: Colors Column */}
                          {docType === 'price_list' && (
                            <td className="py-2 px-2 text-xs text-gray-600 align-top">
                              {isVehicle ? (item as Product).colors.join(', ') : '-'}
                            </td>
                          )}

                          <td className="py-2 px-2 text-sm text-gray-900 text-right font-mono align-top">¥{item.price.toLocaleString()}</td>

                          {/* Quotation Columns */}
                          {docType === 'quotation' && (
                            <>
                              <td className="py-2 px-2 text-center align-top">
                                <div className="flex items-center justify-center space-x-1 no-print hide-in-pdf">
                                  <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="text-gray-400 hover:text-brand-600 font-bold px-1">-</button>
                                  <span className="text-sm font-medium">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="text-gray-400 hover:text-brand-600 font-bold px-1">+</button>
                                </div>
                                <div className="hidden print-only text-sm text-gray-900 font-medium">{item.quantity}</div>
                              </td>
                              <td className="py-2 px-2 text-sm text-gray-900 text-right font-bold font-mono align-top">
                                ¥{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </>
                          )}

                          <td className="py-2 px-2 text-center align-top no-print hide-in-pdf">
                            <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {docType === 'quotation' && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-800">
                        <td colSpan={6} className="py-3 px-2 text-right text-sm font-bold text-gray-800 uppercase">
                          {language === 'zh' ? '总金额' : 'Grand Total'}
                        </td>
                        <td className="py-3 px-2 text-right text-lg font-bold text-brand-700 font-mono">¥{getTotal().toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Footer Section - Pinned to bottom using flex and mt-auto */}
            <div className="mt-auto pt-4 border-t-2 border-gray-200">
              <div className="flex flex-col md:flex-row justify-between text-sm text-gray-600 gap-8 items-end">
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-gray-800 text-xs uppercase tracking-wider">{language === 'zh' ? '条款与条件:' : 'Terms & Conditions:'}</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs leading-tight text-gray-500">
                    <li>{language === 'zh' ? '所有价格含税，包含标准包装。' : 'Prices include tax and standard packaging.'}</li>
                    <li>{language === 'zh' ? '报价有效期30天。' : 'Validity of this quotation is 30 days.'}</li>
                    <li>{language === 'zh' ? '生产周期视订单量而定。' : 'Production lead time depends on order volume.'}</li>
                    <li>{language === 'zh' ? '最终解释权归奔宝车业所有。' : 'Benbao Vehicle reserves the right of final interpretation.'}</li>
                  </ul>
                </div>
                
                <div className="w-64">
                   <p className="mb-8 text-xs font-bold uppercase text-gray-800">{language === 'zh' ? '授权签字:' : 'Authorized Signature:'}</p>
                   <div className="border-b-2 border-gray-800 w-full mb-1"></div>
                   <p className="text-xs font-serif italic text-gray-500">{language === 'zh' ? '浙江奔宝车业有限公司' : 'Zhejiang Benbao Vehicle Co., Ltd.'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;