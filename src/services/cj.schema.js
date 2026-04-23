/**
 * CJ Unified Data Contract (v9.0 - STABILIZATION LOCK)
 * Mandate: Fix mapping. Protect existing data. Zero regression.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

/**
 * 🔥 ISSUE 5: GLOBAL DATA PROTECTION LAYER
 */
export function sanitizeProduct(product = {}) {
  return {
    ...product,
    name: product.name || product.title || "Unnamed Product",
    images: Array.isArray(product.images) ? product.images : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    price: product.price ?? 0,
    shipping: product.shipping ?? 0
  };
}

/**
 * 🏗️ NORMALIZATION CORE (v9.0 Stabilization)
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // --- HYDRATION PROTECTION LAYER ---
  // RULE: NEVER overwrite existing data with null, undefined, or empty values

  // 1. Name Mapping (Issue 1)
  const name = raw?.name || raw?.productName || raw?.title || raw?.productTitle ||
               cjData?.productNameEn || cjData?.productName || cjData?.name || cjData?.title ||
               "Unnamed Product";

  // 2. Image Mapping (Issue 4)
  const images = (raw?.images?.length ? raw.images : null) || 
                 (cjData?.productImageList?.length ? cjData.productImageList : null) || 
                 (cjData?.productImage ? [cjData.productImage] : null) || 
                 cjData?.images || 
                 [];

  // 3. Variant Mapping (Issue 3)
  const variants = (raw?.variants?.length ? raw.variants : null) || 
                   (cjData?.variants?.length ? cjData.variants : null) || 
                   (cjData?.skuList?.length ? cjData.skuList : null) || 
                   (cjData?.variantList?.length ? cjData.variantList : null) || 
                   [];

  // 4. Shipping Mapping
  const shipping = resolveShipping(cjData || raw);

  // Consolidated Protected Object
  const normalized = {
    id: raw?.id || cjData?.pid || cjData?.id || "UNKNOWN",
    name: name,
    title: name,
    
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
    
    description: cjData?.descriptionHtml || cjData?.productDesc || raw?.description || "",
    warehouse: raw?.warehouse || cjData?.warehouseName || "CN",
    
    rawDetail: cjData,
    shipping: shipping
  };

  return sanitizeProduct(normalized);
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
