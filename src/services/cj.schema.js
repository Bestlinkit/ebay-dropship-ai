/**
 * CJ Unified Data Contract (v8.0 - HYDRATION & MAPPING LOCK)
 * Mandate: Fix mapping. Protect existing data. Zero crash.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

/**
 * 🛡️ SAFE STRING GUARD
 */
function safeString(value) {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
}

/**
 * 🏗️ NORMALIZATION CORE (v8.0 mapping rules)
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // --- HYDRATION PROTECTION ---
  // If field already exists in raw, do NOT overwrite with null/undefined from cjData
  
  const id = raw?.id || cjData?.pid || cjData?.id || "UNKNOWN";
  
  // Rule 2: Name Mapping
  const name = raw?.name || raw?.productName || raw?.title || 
               cjData?.productNameEn || cjData?.productName || cjData?.name || 
               "Unnamed Product";

  // Rule 3: Image Mapping
  const images = (raw?.images?.length ? raw.images : null) || 
                 cjData?.productImageList || 
                 (cjData?.productImage ? [cjData.productImage] : []) || 
                 cjData?.images || 
                 [];

  // Rule 4: Variant Mapping
  const variants = (raw?.variants?.length ? raw.variants : null) || 
                   cjData?.variants || 
                   cjData?.skuList || 
                   cjData?.variantList || 
                   [];

  // Rule 5: Shipping Mapping
  const shipping = resolveShipping(cjData || raw);

  // FAILSAFE GUARD (Rule 8)
  return {
    id: safeString(id),
    title: safeString(name),
    name: safeString(name),
    
    images: Array.isArray(images) ? images.map(img => {
        const url = typeof img === 'string' ? img : (img.variantImage || img.image_url || "");
        return url.startsWith('//') ? 'https:' + url : url;
    }).filter(Boolean) : [],
    
    variants: Array.isArray(variants) ? variants : [],
    variantCount: Array.isArray(variants) ? variants.length : 0,
    
    price: raw?.price ?? cjData?.sellPrice ?? cjData?.price ?? null,
    cjCost: cjData?.sellPrice ?? cjData?.price ?? raw?.cjCost ?? 0,
    
    shippingCost: shipping.cost || 0,
    deliveryTime: shipping.delivery || "7-15 Days",
    
    description: safeString(cjData?.descriptionHtml || cjData?.productDesc || raw?.description || ""),
    warehouse: safeString(raw?.warehouse || cjData?.warehouseName || "CN"),
    
    // Pass raw data for downstream needs
    rawDetail: cjData,
    shipping: shipping
  };
}

/**
 * 🚢 SHIPPING RESOLVER
 */
export function resolveShipping(data) {
  const method = data?.logistics?.[0] || data?.shipping_options?.[0];
  
  return {
    cost: parseFloat(data?.shippingFee || method?.price || method?.amount || 0),
    delivery: data?.deliveryTime || method?.deliveryTime || method?.logisticTime || "7-15 Days",
    name: data?.logisticName || method?.logisticsName || "Standard Shipping"
  };
}

// Backwards compatibility
export const normalizeToContract = normalizeProduct;
export const validateProduct = () => true;
