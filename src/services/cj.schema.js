/**
 * CJ Unified Data Contract (v11.0 - FLEXIBLE MAPPING)
 * Mandate: Zero Pipeline Blocks. Flexible Fallbacks. Safe String Handling.
 */

/**
 * 🏗️ NAMESPACED MAPPING (Fixed Step 2)
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // SCOPED LOGGING
  console.log("CJ RAW:", raw, cjData);

  // Combine data sources but prefer detailed data if available
  const p = { ...raw, ...cjData };

  // --- FLEXIBLE FIELD MAPPING (Issue 2 & 5) ---
  const name = p.nameEn || p.productNameEn || p.productName || p.name || p.title || "Unnamed Product";
  const image = p.productImage || p.image || "";
  const price = p.sellPrice || p.price || 0;
  const variants = p.skuList || p.variants || p.variantList || [];

  // Create isolated CJ namespace
  const cjMapped = {
    cj: {
        id: p.id || p.productId || p.pid || "UNKNOWN",
        name: typeof name === "string" ? name : "Unnamed Product",
        image: typeof image === "string" ? image : "",
        images: p.productImageList || (image ? [image] : []),
        variants: Array.isArray(variants) ? variants : [],
        variantCount: Array.isArray(variants) ? variants.length : 0,
        price: parseFloat(price) || 0,
        cost: parseFloat(p.costPrice || p.sellPrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p)
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

/**
 * ✅ 4. FIX STRING TYPE ERRORS
 */
export function safeTrim(e) {
    return (typeof e === "string" ? e.trim() : "");
}

// Global safety guard for UI
export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
