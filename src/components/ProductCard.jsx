import React from 'react';
import { 
  TrendingUp, 
  Zap,
  ArrowRight,
  Package,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Premium, Short & Smart Product Card (V5.5)
 * High information density, minimal vertical footprint.
 */
const ProductCard = ({ product, onImport, compact = false }) => {
  if (!product) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 overflow-hidden flex flex-col",
        compact ? "h-auto" : "h-[420px]"
      )}
    >
      {/* Visual Header */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
          <img 
            src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
               <Zap size={10} className="text-primary fill-primary" />
               <span className="opacity-80">{product.profitScore || 85}% Match</span>
            </div>
          </div>
          
          {/* Quick Hub Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-slate-900/60 to-transparent">
              <button 
                onClick={() => onImport(product)}
                className="w-full h-11 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all overflow-hidden relative group/btn"
              >
                  <span className="relative z-10 flex items-center gap-2">
                     Deep Scrutiny <ArrowRight size={14} />
                  </span>
                  <div className="absolute inset-0 bg-primary translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-300" />
              </button>
          </div>
      </div>

      {/* Analytics Layer */}
      <div className="p-6 flex-1 flex flex-col">
          <div className="space-y-4">
              <div className="flex justify-between items-start gap-3">
                  <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.2rem] group-hover:text-primary transition-colors">
                      {product.title}
                  </h3>
                  <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900 leading-none tracking-tight">${product.price}</p>
                      <p className="text-[9px] font-bold text-slate-400 line-through mt-1 opacity-60">
                        ${product.originalPrice || (product.price * 1.4).toFixed(2)}
                      </p>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border",
                    product.competition === 'LOW' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    product.competition === 'MEDIUM' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                      {product.competition || 'N/A'} Intensity
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1">
                      <Package size={10} className="text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-400/80 uppercase tracking-widest">{product.soldCount || 0}+ Vol</span>
                  </div>
              </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                          <div key={i} className={cn("w-1 h-1 rounded-full", i < 4 ? "bg-amber-400" : "bg-slate-100")} />
                      ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-tighter">Market Hit</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp size={12} />
                  +{(product.profitScore / 4).toFixed(1)}% ROI
              </div>
          </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
