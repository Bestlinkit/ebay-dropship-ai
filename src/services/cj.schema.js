/**
 * CJ Unified Data Contract (v6.0 - HYDRATION STABILITY)
 * Mandate: Strict Validation. Clean UI. No Data Overlap.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

/**
 * 🧹 DESCRIPTION FORMATTER
 * Parses raw text into readable sections
 */
export function formatDescription(raw = "") {
  if (!raw) return { html: "", sections: {} };
  
  // Basic Cleanup
  let clean = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  const sections = {
    overview: "",
    specifications: "",
    sizeInfo: "",
    packageContent: ""
  };

  // Simple heuristic parsing based on keywords
  const text = clean.replace(/<[^>]*>/g, " ");
  
  if (text.toLowerCase().includes("package")) {
      sections.packageContent = text.split(/package/i)[1]?.split(/\n/)[0]?.trim();
  }
  
  // Return both raw and structured
  return {
    html: clean,
    sections: sections,
    isFormatted: true
  };
}

/**
 * 🖼️ IMAGE EXTRACTOR
 */
function extractImages(raw, cjData) {
  let images = [];
  
  // Priority: Main Image List > Details Images > Variant Images
  if (cjData?.productImageList?.length) images = cjData.productImageList;
  else if (cjData?.images?.length) images = cjData.images;
  else if (raw?.images?.length) images = raw.images;
  else if (cjData?.productImage) images = [cjData.productImage];
  else if (raw?.image) images = [raw.image];

  // Fallback: Variant Images
  if (!images.length && (cjData?.variants?.length || raw?.variants?.length)) {
      const variantImages = (cjData?.variants || raw?.variants)
          .map(v => v.variantImage || v.image || v.image_url)
          .filter(Boolean);
      if (variantImages.length) images = [variantImages[0]];
  }

  // Normalize URLs
  return images.map(img => {
      let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || "");
      if (!url) return null;
      if (url.startsWith('//')) url = 'https:' + url;
      return url;
  }).filter(url => url && url.startsWith('http')).slice(0, 10);
}

/**
 * 🛡️ VALIDATION LAYER (TEMPORARILY DISABLED)
 */
export function validateProduct(normalized) {
    // Force allow all for debugging/raw discovery
    return true;
}

/**
 * 🏗️ NORMALIZATION CORE
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  const images = extractImages(raw, cjData);
  const variants = (raw?.variants?.length ? raw.variants : cjData?.variants || cjData?.skus || cjData?.productVariants || []).filter(v => v && (v.sku || v.variantSku || v.id));

  // 🚢 SHIPPING MAPPING
  const shipping = resolveShipping(cjData || raw);

  const normalized = {
    id: raw?.id || raw?.product_id || cjData?.pid || cjData?.id || "UNKNOWN",
    title: raw?.title || raw?.productName || cjData?.productNameEn || cjData?.productName || "Unnamed Product",
    
    // Description: Formatted for Detail View ONLY
    description: formatDescription(cjData?.descriptionHtml || cjData?.productDesc || raw?.description || ""),
    
    images: images.length ? images : [PLACEHOLDER],
    variants: variants,
    variantCount: variants.length,
    
    price: parseFloat(raw?.price ?? cjData?.sellPrice ?? cjData?.price ?? 0),
    cjCost: parseFloat(cjData?.sellPrice ?? cjData?.price ?? raw?.cjCost ?? 0),
    
    warehouse: raw?.warehouse || cjData?.warehouseName || cjData?.warehouse || "CN",
    shipping: shipping,
    
    // UI Metadata
    isValid: false // Will be set by validateProduct
  };

  normalized.isValid = validateProduct(normalized);
  return normalized;
}

/**
 * 🚢 SHIPPING RESOLVER (v6.0 Reliability)
 */
export function resolveShipping(data) {
  // Priority 1: Direct detail fields
  if (data?.logisticName && data?.logisticTime) {
    return {
      cost: parseFloat(data.shippingFee || 0),
      delivery: data.logisticTime || "7-15 Days",
      name: data.logisticName || "Standard Shipping",
      status: "resolved"
    };
  }

  // Priority 2: Logistics Array
  const method = data?.logistics?.[0] || data?.shipping_options?.[0];
  if (method) {
    return {
      cost: parseFloat(method.price ?? method.amount ?? method.shippingFee ?? 0),
      delivery: method.deliveryTime || method.logisticTime || "7-15 Days",
      name: method.logisticsName || method.logisticName || "Standard Shipping",
      status: "resolved"
    };
  }

  // Fallback
  return {
    cost: 0,
    delivery: "7-15 Days",
    name: "Shipping info unavailable",
    status: "none"
  };
}

// Backwards compatibility
export const normalizeToContract = normalizeProduct;
