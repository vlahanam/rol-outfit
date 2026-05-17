'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { ApiResponse, Cart } from '@/types/api';

interface CartContextValue {
  cartCount: number;
  incrementCart: (qty?: number) => void;
  decrementCart: (qty?: number) => void;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  incrementCart: () => {},
  decrementCart: () => {},
  refreshCart: async () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setCartCount(0);
      return;
    }
    try {
      const res = await api.get<ApiResponse<Cart>>('/cart');
      const items = res.data?.items ?? [];
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const incrementCart = useCallback((qty = 1) => {
    setCartCount((prev) => prev + qty);
  }, []);

  const decrementCart = useCallback((qty = 1) => {
    setCartCount((prev) => Math.max(0, prev - qty));
  }, []);

  const clearCart = useCallback(() => {
    setCartCount(0);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, incrementCart, decrementCart, refreshCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
