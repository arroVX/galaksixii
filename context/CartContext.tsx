"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  // Hydrate from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("gala_merch_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const validCart = parsedCart.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        }));
        setCart(validCart);
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("gala_merch_cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product: Product, size: string, color: string, quantity: number = 1) => {
    const cartItemId = `${product.id}-${size}-${color}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          selectedSize: size,
          selectedColor: color,
          quantity,
          stockType: product.stockType,
          poReleaseDate: product.poReleaseDate
        };
        return [...prevCart, newItem];
      }
    });

    showToast(`✓ ${product.name} (${size} | ${color}) ditambahkan ke keranjang!`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
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
