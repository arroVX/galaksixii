"use client";

import React, { useState } from "react";
import { Product } from "@/types/merch";
import { Heart, Clock, CheckCircle2, ShoppingBag, Zap, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const [isLiked, setIsLiked] = useState(false);

  const isPO = product.stockType === "PRE_ORDER";

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-3xl p-3 border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
    >
      {/* Image Container with Rounded Corners */}
      <div className="relative aspect-square w-full bg-white rounded-2xl overflow-hidden mb-3 p-4 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Heart Wishlist Button Top-Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition shadow-sm ${
            isLiked ? "text-red-500 scale-110" : "text-slate-400 hover:text-slate-700"
          }`}
          title="Simpan Wishlist"
        >
          <Heart size={14} className={isLiked ? "fill-red-500" : ""} />
        </button>

        {/* Category Badge Top-Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 font-bold text-[9px] uppercase tracking-wider rounded-full shadow-sm border border-slate-100">
            {product.category.split(" ")[0]}
          </span>
          {isPO && (
            <span className="px-2.5 py-1 bg-amber-500/90 text-slate-950 font-extrabold text-[9px] rounded-full shadow-sm flex items-center justify-center gap-1">
              <Clock size={10} /> PO
            </span>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Title and Price Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-slate-700 transition-colors flex-1">
              {product.name}
            </h3>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 shrink-0">
              Rp {product.price.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-slate-700">5.0</span>
            <span>(1.2k Reviews)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="flex-1 py-1.5 px-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] sm:text-[11px] font-bold shadow-sm transition transform active:scale-95 text-center"
          >
            Add to Chart
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="flex-1 py-1.5 px-2 rounded-full bg-slate-800 hover:bg-black text-white text-[10px] sm:text-[11px] font-bold shadow-md transition transform active:scale-95 text-center"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};
