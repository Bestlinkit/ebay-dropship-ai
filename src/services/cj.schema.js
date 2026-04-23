/**
 * CJ Unified Data Contract (v13.0 - FIX IMAGES & VARIANTS)
 * Mandate: Fix Protocol-less URLs. Map All Description Sources. Fallback Variant Counts.
 */

/**
 * 🏗️ NAMESPACED MAPPING
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };

  // --- ✅ FIX IMAGE MAPPING (CRITICAL) ---
  const rawImage =
    p.productImage ||
    (Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList[0] : null) ||
    p.image ||
    p.mainImage ||
    "";

  // Fix protocol-less URLs (starts with //)
  const image = rawImage 
    ? (rawImage.startsWith('//') ? `https:${rawImage}` : (rawImage.startsWith('http') ? rawImage : `https:${rawImage}`))
    : "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ FIX VARIANT EXTRACTION ---
  const variants = p.skuList || p.variantList || p.variants || [];
  // Use explicit variant count if available from API (often in search results)
  const variantCount = Array.isArray(variants) && variants.length > 0 
    ? variants.length 
    : (parseInt(p.variantCount || p.variant_count || p.variantsNum || 0) || 0);

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
            ? p.productImageList.map(img => img.startsWith('//') ? `https:${img}` : img)
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
