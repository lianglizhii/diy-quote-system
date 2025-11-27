export interface Product {
  id: string;
  model: string;
  name: string;
  battery: string[]; // Multi-select options for the vehicle
  motor: string;
  brakeTire: string;
  seatDash: string;
  controlFunc: string;
  additional: string;
  colors: string[]; 
  price: number; // Single price (Tax Inc)
}

export interface Accessory {
  id: string;
  category: 'battery' | 'charger';
  voltage: string;
  capacity: string;
  price: number;
}

// Union type for items in the cart/quote
export type CartItem = 
  | (Product & { type: 'vehicle'; quantity: number; selectedColor: string })
  | (Accessory & { type: 'accessory'; quantity: number; selectedColor?: never });

export type Currency = 'CNY' | 'USD';
export type Language = 'zh' | 'en';
export type DocumentType = 'quotation' | 'price_list';

export const BATTERY_OPTIONS = [
  "48V 20Ah",
  "60V 20Ah",
  "60V 32Ah",
  "72V 20Ah",
  "72V 32Ah"
];