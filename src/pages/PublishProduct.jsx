import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ShieldCheck,
  ChevronRight,
  Loader2,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ebayTrading from '../services/ebay';
import cjService from '../services/cj.service';
import { toast } from 'sonner';

const PublishProduct = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [listingData, setListingData] = useState(null);
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetching(true);
        // We use a dummy object with ID to trigger enrichment
        const enriched = await cjService.enrichSingleProduct({ id });
        setProduct(enriched);
      } catch (err) {
        toast.error("Failed to fetch product data.");
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handlePublish = async () => {
    if (!product) return;
    setLoading(true);
    try {
      // Map to the backend contract
      const payload = {
        title: product.cj?.name || product.title,
        description: product.cj?.description || product.description,
        images: product.cj?.images || product.images,
        price: product.cj?.price || product.price,
        quantity: 10,
        categoryId: "24087", // Fallback to Casual Shoes for testing
        sku: id,
        variants: (product.cj?.variants || []).map(v => {
          const parts = (v.variantStandardEn || v.variantNameEn || "").split('-').map(p => p.trim());
          const attributes = [];
          if (parts.length === 1) {
            const val = parts[0];
            if (!isNaN(val) || val.match(/^[0-9.]+$/)) attributes.push({ name: "Size", value: val });
            else attributes.push({ name: "Color", value: val });
          } else {
            attributes.push({ name: "Color", value: parts[0] });
            attributes.push({ name: "Size", value: parts[1] });
          }
          return {
            sku: v.skuCode || v.variantSku || v.id,
            name: v.variantStandardEn || v.variantNameEn || v.skuCode,
            price: v.variantSellPrice || v.sellPrice || product.cj?.price,
            quantity: 10,
            attributes: attributes
          };
        })
      };

      const result = await ebayTrading.publishItem(payload);
      if (result.success) {
        setListingData(result);
        setSuccess(true);
        toast.success("Successfully published to eBay!");
      } else {
        throw new Error(result.error || "Publish failed");
      }
    } catch (error) {
      console.error("=== EBAY LISTING FAILURE ===", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500 font-medium">Hydrating product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="text-rose-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Product not found.</p>
        <button onClick={() => navigate('/discovery')} className="mt-4 btn-secondary">Back to Discovery</button>
      </div>
    );
  }

  if (success) {
     return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-inner shadow-emerald-200">
             <CheckCircle2 size={48} className="text-emerald-500" />
           </div>
           <h1 className="text-4xl font-display font-bold text-center mb-4">It's Official!</h1>
           <p className="text-slate-500 text-center max-w-md mb-8">
             Your product has been published to eBay. It may take a few minutes to appear in search results.
           </p>
           
           <div className="glass-card p-6 rounded-3xl w-full max-w-md mb-8">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                 <span className="text-sm font-bold text-slate-400 uppercase">eBay Listing ID</span>
                 <span className="font-mono font-bold text-primary">{listingData.itemId}</span>
              </div>
              <button className="w-full btn-secondary flex items-center justify-center gap-2">
                 <ExternalLink size={18} />
                 View on eBay
              </button>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => navigate('/discovery')}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
              >
                Find More Products
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Launch Listing</h1>
        <p className="text-slate-500 mt-1">Review your final listing details and push to eBay.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Review Column */}
        <div className="md:col-span-2 space-y-6">
           <div className="glass-card p-8 rounded-3xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                 <Globe className="text-primary" size={20} />
                 Listing Summary
              </h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Title</label>
                    <p className="font-bold text-slate-700">{product.cj?.name || product.title}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                     <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Price</label>
                        <p className="text-2xl font-black text-slate-900">${product.cj?.price || product.price}</p>
                     </div>
                     <div>
                         <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Supplier Authority</label>
                         <p className="text-emerald-600 font-bold">Verified In-Stock</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="glass-card p-8 rounded-3xl">
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-primary">
                  <ShieldCheck size={20} />
                  Business Policies
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Free Standard Shipping (3-5 Days)",
                    "30-Day Money Back Returns",
                    "Item Location: New Jersey, USA",
                    "Immediate Payment Required"
                  ].map((policy, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                       </div>
                       <span className="text-xs font-medium text-slate-700">{policy}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Profit Column */}
         <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-slate-400 font-bold text-xs uppercase mb-6 flex items-center gap-2">
                    <DollarSign size={14} />
                    Profit Breakdown
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Sale Price</span>
                        <span>${product.cj?.price || product.price}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Source Cost</span>
                        <span className="text-rose-400">-${product.cj?.cost || product.cost || '0.00'}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">eBay Fees (12%)</span>
                        <span className="text-rose-400">-${((product.cj?.price || product.price) * 0.12).toFixed(2)}</span>
                     </div>
                     <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                        <div>
                           <p className="text-slate-400 text-[10px] font-bold uppercase">Net Profit</p>
                           <p className="text-3xl font-black text-emerald-400">
                               {product.cj?.price ? `$${((product.cj.price) - (product.cj.cost || 0) - (product.cj.price * 0.12)).toFixed(2)}` : 'N/A'}
                           </p>
                        </div>
                        <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded">
                           ROI: {product.cj?.cost > 0 ? `+${(((product.cj.price - product.cj.cost - (product.cj.price * 0.12)) / product.cj.cost) * 100).toFixed(0)}%` : 'N/A'}
                        </div>
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full btn-primary h-14 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                   Ready to Launch
                   <Rocket size={20} className="group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl font-medium text-xs text-slate-500 flex gap-3">
               <AlertCircle className="shrink-0 text-amber-500" size={16} />
               By clicking "Launch", you agree to eBay's selling policies. This listing will remain active until sold or cancelled.
            </div>
         </div>
      </div>
    </div>
  );
};

export default PublishProduct;
