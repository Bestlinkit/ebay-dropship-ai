/**
 * CJ Unified Data Contract (v12.0 - FINAL STABILIZATION)
 * Mandate: Fix Images. Fix Variants. Final Display Lock.
 */

/**
 * 🏗️ NAMESPACED MAPPING (Fixed Step 1 & 3)
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // SCOPED LOGGING
  console.log("CJ RAW:", raw, cjData);

  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };

  // --- ✅ 3. FIX IMAGE MAPPING (CRITICAL) ---
  const image =
    p.productImage ||
    (Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList[0] : null) ||
    p.image ||
    p.mainImage ||
    "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ 1. FIX VARIANT EXTRACTION (CRITICAL) ---
  const variants = p.skuList || p.variantList || p.variants || [];
  const variantCount = Array.isArray(variants) ? variants.length : 0;

  // Create isolated CJ namespace
  const cjMapped = {
    cj: {
        id: p.id || p.productId || p.pid || "UNKNOWN",
        name: p.nameEn || p.productNameEn || p.productName || p.name || p.title || "Unnamed Product",
        image: image,
        images: Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList : [image],
        variants: Array.isArray(variants) ? variants : [],
        variantCount: variantCount,
        price: parseFloat(p.sellPrice || p.price || 0),
        cost: parseFloat(p.costPrice || p.sellPrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p),
        description: p.descriptionHtml || p.productDesc || ""
    }
  };

  // LOG MAPPED
  console.log("CJ MAPPED:", cjMapped);

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
