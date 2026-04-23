/**
 * CJ Unified Data Contract (v17.0 - THE "TRUTH" VERSION)
 * Mandate: Absolute exhaustive mapping. Use every known CJ field variant.
 */

/**
 * 🏗️ NAMESPACED MAPPING
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };

  // --- 🛠️ HELPER: UNIVERSAL IMAGE SANITIZER ---
  const sanitizeUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    let clean = url.trim();
    if (!clean) return null;
    if (clean.startsWith('http')) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    if (clean.includes('.') && !clean.startsWith('http')) return `https://${clean}`;
    return clean;
  };

  // --- ✅ FIX IMAGE MAPPING (EXHAUSTIVE) ---
  const rawImage =
    p.productImage ||
    p.product_image ||
    p.image ||
    p.mainImage ||
    p.main_image ||
    p.product_image_url ||
    (Array.isArray(p.productImageList) && p.productImageList.length > 0 ? p.productImageList[0] : null) ||
    null;

  const image = sanitizeUrl(rawImage) || "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ FIX VARIANT EXTRACTION (THE TRUTH) ---
  const variants = p.skuList || p.skus || p.variantList || p.variants || p.variant_list || p.productSkus || [];
  
  const possibleCounts = [
    Array.isArray(variants) ? variants.length : 0,
    parseInt(p.variantCount),
    parseInt(p.variantsNum),
    parseInt(p.variant_count),
    parseInt(p.skuCount),
    parseInt(p.productUnit)
  ];
  
  const variantCount = possibleCounts.find(c => !isNaN(c) && c > 0) || (Array.isArray(variants) ? variants.length : 0);

  // --- ✅ FIX DESCRIPTION MAPPING (THE TRUTH) ---
  const description = 
    p.descriptionHtml || 
    p.description_html || 
    p.description || 
    p.productDesc || 
    p.productDescription || 
    p.product_desc ||
    p.product_description ||
    "";

  // Create isolated CJ namespace
  const cjMapped = {
    cj: {
        id: String(p.id || p.productId || p.pid || p.product_id || "UNKNOWN"),
        name: p.nameEn || p.productNameEn || p.productName || p.name || p.title || p.productTitle || "Unnamed Product",
        image: image,
        images: Array.isArray(p.productImageList) && p.productImageList.length > 0 
            ? p.productImageList.map(img => sanitizeUrl(img)).filter(Boolean)
            : [image],
        variants: Array.isArray(variants) ? variants : [],
        variantCount: variantCount,
        price: parseFloat(p.sellPrice || p.price || p.productPrice || 0),
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
 * 🚢 SHIPPING RESOLVER
 */
export function resolveShipping(data) {
  const method = 
    data?.logistics?.[0] || 
    data?.shipping_options?.[0] || 
    data?.freight?.[0] ||
    data?.shipping_method ||
    data?.best_shipping;

  const fee = 
    data?.shippingFee || 
    data?.shipping_fee || 
    data?.logisticFee || 
    data?.freightFee ||
    data?.shippingAmount ||
    data?.amount ||
    method?.price || 
    method?.amount || 
    method?.fee ||
    0;
  
  const delivery = 
    data?.deliveryTime || 
    data?.logisticTime || 
    data?.shippingTime ||
    data?.delivery_time ||
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

export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
