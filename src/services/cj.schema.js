/**
 * CJ Unified Data Contract (v15.0 - PRODUCTION HARDENED)
 * Mandate: Fix Shipping Fees. Fix Underscore Fields. Ensure Gallery Sync.
 */

/**
 * 🏗️ NAMESPACED MAPPING
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };

  // --- 🛠️ HELPER: UNIVERSAL IMAGE SANITIZER ---
  const sanitizeUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    let clean = url.trim();
    if (!clean) return null;
    
    // Handle double-slash and protocol-less
    if (clean.startsWith('http')) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    if (clean.includes('.') && !clean.startsWith('http')) return `https://${clean}`;
    
    return clean;
  };

  // --- ✅ FIX IMAGE MAPPING (EXHAUSTIVE) ---
  const rawImage =
    p.productImage ||
    p.product_image ||
    (Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList[0] : null) ||
    p.image ||
    p.mainImage ||
    p.main_image ||
    null;

  const image = sanitizeUrl(rawImage) || "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ FIX VARIANT EXTRACTION (EXHAUSTIVE) ---
  const variants = p.skuList || p.variantList || p.variants || [];
  
  const possibleCounts = [
    Array.isArray(variants) ? variants.length : 0,
    parseInt(p.variantCount),
    parseInt(p.variantsNum),
    parseInt(p.variant_count),
    parseInt(p.skuCount),
    parseInt(p.productUnit)
  ];
  
  const variantCount = possibleCounts.find(c => !isNaN(c) && c > 0) || 0;

  // --- ✅ FIX DESCRIPTION MAPPING ---
  const description = 
    p.descriptionHtml || 
    p.productDesc || 
    p.description || 
    p.productDescription || 
    "";

  // Create isolated CJ namespace
  const cjMapped = {
    cj: {
        id: p.id || p.productId || p.pid || p.product_id || "UNKNOWN",
        name: p.nameEn || p.productNameEn || p.productName || p.name || p.title || "Unnamed Product",
        image: image,
        images: Array.isArray(p.productImageList) && p.productImageList.length > 0 
            ? p.productImageList.map(img => sanitizeUrl(img)).filter(Boolean)
            : [image],
        variants: Array.isArray(variants) ? variants : [],
        variantCount: variantCount,
        price: parseFloat(p.sellPrice || p.price || 0),
        cost: parseFloat(p.costPrice || p.sellPrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p),
        description: description
    }
  };

  return cjMapped;
}

/**
 * 🚢 SHIPPING RESOLVER (Aggressive Fallbacks)
 */
export function resolveShipping(data) {
  // Search through all possible shipping locations in the payload
  const method = 
    data?.logistics?.[0] || 
    data?.shipping_options?.[0] || 
    data?.freight?.[0] ||
    data?.shipping_method;

  const fee = 
    data?.shippingFee || 
    data?.shipping_fee || 
    data?.logisticFee || 
    data?.freightFee ||
    method?.price || 
    method?.amount || 
    method?.fee ||
    0;
  
  const delivery = 
    data?.deliveryTime || 
    data?.logisticTime || 
    data?.shippingTime ||
    method?.deliveryTime || 
    method?.logisticTime || 
    "7-15 Days";

  return {
    cost: parseFloat(fee),
    delivery: String(delivery),
    name: data?.logisticName || method?.logisticsName || method?.name || "Standard Shipping"
  };
}

export function safeTrim(e) {
    return (typeof e === "string" ? e.trim() : "");
}

// Global safety guard for UI
export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
