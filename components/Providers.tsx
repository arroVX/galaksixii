"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SiteProvider } from "@/context/SiteContext";

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SiteProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </SiteProvider>
  );
};
