import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { TrendingUp, ArrowRight, Zap, Target, ChevronLeft, ChevronRight, BarChart3, Search } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Pro Trending Carousel
 * Fixed sliding/dragging logic and added 'Research' functionality.
 */
const TrendingCarousel = ({ products, onResearch }) => {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 500);
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {/* Navigation Controls */}
      <div className="absolute -top-14 right-0 flex gap-2 z-10">
          <button 
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                "p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm transition-all text-slate-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed",
                canScrollLeft && "hover:shadow-md"
              )}
          >
              <ChevronLeft size={18} />
          </button>
          <button 
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                "p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm transition-all text-slate-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed",
                canScrollRight && "hover:shadow-md"
              )}
          >
              <ChevronRight size={18} />
          </button>
      </div>

      <div 
        ref={carouselRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-1"
      >
        {products.map((product, i) => (
          <div 
            key={i}
            className="min-w-[320px] md:min-w-[380px] snap-start bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl group/card"
          >
            <div className="flex gap-5">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner shrink-0 border border-slate-50 relative">
                    <img 
                        src={product.thumbnail} 
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                        draggable="false"
                    />
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-emerald-500" size={14} />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">#{i + 1} Viral</span>
                        </div>
                        <h4 className="font-black text-sm leading-tight line-clamp-2 text-slate-800 tracking-tight group-hover/card:text-primary transition-colors">{product.title}</h4>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-5">
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Net Yield</p>
                    <p className="text-lg font-black text-emerald-600 leading-none">+${(Math.random() * 2000 + 500).toFixed(0)}</p>
                </div>
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Velocity</p>
                    <p className="text-lg font-black text-slate-800 leading-none">{Math.floor(product.soldCount / 30)}+/d</p>
                </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <button 
                  onClick={() => onResearch?.(product)}
                  className="flex-1 bg-slate-900 text-white rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-primary hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    <BarChart3 size={14} /> Research Trends
                </button>
                <button className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                    <Search size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingCarousel;
