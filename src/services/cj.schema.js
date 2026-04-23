/**
 * CJ Unified Data Contract (v3.0 - STABLE FIX)
 * Mandate: Absolute Stability. No infinite loops.
 */
const PLACEHOLDER = "https://images.unsplash.com/photo-1594732806283-bc9a9af95a70?q=80&w=1000&auto=format&fit=crop";

export function normalizeProduct(product = {}, cjData = {}) {
  // Merge safety: use whatever has data
  const id = product?.id || product?.product_id || cjData?.pid || cjData?.id || "UNKNOWN";
  
  const title = product?.title || product?.productName || cjData?.productNameEn || cjData?.productName || "Unnamed Product";

  const description = cjData?.descriptionHtml || cjData?.productDesc || product?.description || "No description available";

  // Image Logic: product list first, then cj detail, then placeholder
  let images = [];
  if (product?.images?.length) images = product.images;
  else if (cjData?.productImageList?.length) images = cjData.productImageList;
  else if (cjData?.images?.length) images = cjData.images;
  else if (cjData?.productImageEnList?.length) images = cjData.productImageEnList;
  else if (product?.image) images = [product.image];
  else if (cjData?.productImage) images = [cjData.productImage];

  // Clean URLs
  const cleanImages = images.map(img => {
      let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || "");
      if (!url) return null;
      if (url.startsWith('//')) url = 'https:' + url;
      return url;
  }).filter(Boolean);

  // Variant Logic
  let variants = [];
  if (product?.variants?.length) variants = product.variants;
  else if (cjData?.variants?.length) variants = cjData.variants;
  else if (cjData?.skus?.length) variants = cjData.skus;
  else if (cjData?.productVariants?.length) variants = cjData.productVariants;
  else if (cjData?.productVariantSkuList?.length) variants = cjData.productVariantSkuList;

  // Price Logic
  const price = parseFloat(product?.price || 0);
  const cjCost = parseFloat(cjData?.sellPrice || cjData?.price || product?.cjCost || 0);

  // Shipping Extraction (Phase 3 Simple Shipping)
  const shipping = resolveShipping(cjData || product);

  return {
    id,
    title,
    description,
    images: cleanImages.length ? cleanImages : [PLACEHOLDER],
    variants: variants || [],
    price,
    cjCost,
    warehouse: product?.warehouse || cjData?.warehouseName || cjData?.warehouse || "CN",
    shipping: shipping,
    origin: (product?.warehouse || cjData?.warehouseName || "").toUpperCase().includes('US') ? "United States" : "China"
  };
}

/**
 * 🚢 PHASE 3 — SIMPLE SHIPPING (NO COMPLEXITY)
 */
export function resolveShipping(cjData) {
  // Look for direct fields in detail API
  if (cjData?.logisticName && cjData?.logisticTime) {
    return {
      cost: parseFloat(cjData.shippingFee || 0),
      delivery: cjData.logisticTime || "7-15 Days",
      name: cjData.logisticName || "Standard Shipping"
    };
  }

  // Look for nested logistics
  const method = cjData?.logistics?.[0] || cjData?.shipping_options?.[0];

  if (method) {
    return {
      cost: parseFloat(method.price || method.amount || method.shippingFee || 0),
      delivery: method.deliveryTime || method.logisticTime || "7-15 Days",
      name: method.logisticsName || method.logisticName || "Standard Shipping"
    };
  }

  // fallback (NEVER EMPTY)
  return {
    cost: 0,
    delivery: "7-15 Days",
    name: "Standard Shipping"
  };
}

// Backwards compatibility
export const normalizeToContract = normalizeProduct;
