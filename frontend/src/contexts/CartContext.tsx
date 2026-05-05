import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock_quantity) {
          toast.error('الكمية المطلوبة تتجاوز المخزون المتاح');
          return prev;
        }
        toast.success('تم تحديث الكمية');
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i);
      }
      toast.success('تمت الإضافة إلى السلة');
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
