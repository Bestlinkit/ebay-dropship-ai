/**
 * CJ Unified Data Contract (v14.0 - ULTRA HARDENED)
 * Mandate: Universal URL Prefixing. Exhaustive Variant Counting. Zero Failures.
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
    
    if (clean.startsWith('http')) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    
    // If it looks like a path or domain but has no protocol
    return `https://${clean}`;
  };

  // --- ✅ FIX IMAGE MAPPING (CRITICAL) ---
  const rawImage =
    p.productImage ||
    (Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList[0] : null) ||
    p.image ||
    p.mainImage ||
    null;

  const image = sanitizeUrl(rawImage) || "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ FIX VARIANT EXTRACTION (EXHAUSTIVE) ---
  const variants = p.skuList || p.variantList || p.variants || [];
  
  // CJ Search Results often have variants count in these fields
  const possibleCounts = [
    Array.isArray(variants) ? variants.length : 0,
    parseInt(p.variantCount),
    parseInt(p.variantsNum),
    parseInt(p.variant_count),
    parseInt(p.skuCount),
    parseInt(p.productUnit) // Sometimes used as count in some CJ sub-APIs
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
        id: p.id || p.productId || p.pid || "UNKNOWN",
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
 * 🚢 SHIPPING RESOLVER (Isolated)
 */
export function resolveShipping(data) {
  const method = data?.logistics?.[0] || data?.shipping_options?.[0];
  
  return {
    cost: parseFloat(data?.shippingFee || method?.price || method?.amount || 0),
    delivery: data?.deliveryTime || method?.deliveryTime || method?.logisticTime || "7-15 Days",
    name: data?.logisticName || method?.logisticsName || "Standard Shipping"
  };
}

export function safeTrim(e) {
    return (typeof e === "string" ? e.trim() : "");
}

// Global safety guard for UI
export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
