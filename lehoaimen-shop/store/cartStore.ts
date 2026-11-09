// store/cartStore.ts - Zustand cart store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantId?: number, engraving?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number, engraving?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem: CartItem) => {
        set(state => {
          const existingIndex = state.items.findIndex(
            item => item.product_id === newItem.product_id && item.variant_id === newItem.variant_id && item.engraving === newItem.engraving
          );
          
          if (existingIndex >= 0) {
            const items = [...state.items];
            const existing = items[existingIndex];
            const newQty = existing.quantity + newItem.quantity;
            items[existingIndex] = {
              ...existing,
              quantity: Math.min(newQty, existing.stock),
            };
            return { items };
          }
          
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (productId: number, variantId?: number, engraving?: string) => {
        set(state => ({
          items: state.items.filter(
            item => !(item.product_id === productId && item.variant_id === variantId && item.engraving === engraving)
          )
        }));
      },
      
      updateQuantity: (productId: number, quantity: number, variantId?: number, engraving?: string) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId, engraving);
          return;
        }
        set(state => ({
          items: state.items.map(item => 
            item.product_id === productId && item.variant_id === variantId && item.engraving === engraving
              ? { ...item, quantity: Math.min(quantity, item.stock) }
              : item
          )
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'lehoaimen-cart',
    }
  )
);

// Wishlist store
interface WishlistStore {
  items: number[];
  toggle: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (productId: number) => {
        set(state => ({
          items: state.items.includes(productId)
            ? state.items.filter(id => id !== productId)
            : [...state.items, productId]
        }));
      },
      isWishlisted: (productId: number) => get().items.includes(productId),
    }),
    { name: 'lehoaimen-wishlist' }
  )
);

// Recently viewed store
interface RecentlyViewedStore {
  items: number[];
  addItem: (productId: number) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId: number) => {
        set(state => ({
          items: [productId, ...state.items.filter(id => id !== productId)].slice(0, 10)
        }));
      },
    }),
    { name: 'lehoaimen-recently-viewed' }
  )
);

