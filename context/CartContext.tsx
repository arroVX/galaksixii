"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { CartItem, Product } from "@/types/merch";

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItemCount: number;
  toastMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Ref agar handler selalu membaca isi keranjang terbaru (menghindari stale closure).
  const cartRef = useRef<CartItem[]>([]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("gala_merch_cart");
      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart);
        const validCart = (Array.isArray(parsedCart) ? parsedCart : [])
          .filter((item): item is Partial<CartItem> => Boolean(item && item.id && item.productId))
          .map((item) => ({
            ...item,
            price: Number(item.price) || 0,
            quantity: Math.max(1, Number(item.quantity) || 1)
          })) as CartItem[];
        // Hydrasi cache keranjang dari localStorage saat mount (sumber eksternal, tidak tersedia saat SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(validCart);
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    setHydrated(true);
  }, []);

  // Sync to localStorage — hanya setelah hydrasi selesai agar tidak menimpa
  // data tersimpan dengan keranjang kosong saat pertama kali mount.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("gala_merch_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [cart, hydrated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product: Product, size: string, color: string, quantity: number = 1) => {
    const cartItemId = `${product.id}-${size}-${color}`;
    const limit =
      product.stockType === "READY" ? Math.max(0, product.stockCount || 0) : Number.MAX_SAFE_INTEGER;

    const existing = cartRef.current.find((item) => item.id === cartItemId);
    const currentQty = existing?.quantity ?? 0;

    if (currentQty >= limit) {
      showToast(`Stok ${product.name} (${size} | ${color}) sudah mencapai batas maksimal di keranjang.`);
      return;
    }

    const newQty = Math.min(currentQty + quantity, limit);

    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === cartItemId);
      if (index > -1) {
        const updated = [...prevCart];
        updated[index] = { ...updated[index], quantity: Math.min(updated[index].quantity + quantity, limit) };
        return updated;
      }
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        selectedSize: size,
        selectedColor: color,
        quantity: newQty,
        stockType: product.stockType,
        poReleaseDate: product.poReleaseDate,
        maxStock: product.stockType === "READY" ? limit : undefined
      };
      return [...prevCart, newItem];
    });

    showToast(
      newQty < currentQty + quantity
        ? `Stok terbatas — hanya ${newQty - currentQty} unit ${product.name} yang ditambahkan.`
        : `✓ ${product.name} (${size} | ${color}) ditambahkan ke keranjang!`
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== cartItemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const limit = item.maxStock ?? Number.MAX_SAFE_INTEGER;
          return { ...item, quantity: Math.min(newQty, limit) };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItemCount,
        toastMessage
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#1b1c1c] text-white text-[14px] font-semibold px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
