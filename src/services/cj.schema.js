/**
 * CJ Unified Data Contract (v7.0 - TYPE SAFETY & HYDRATION RECOVERY)
 * Mandate: Absolute Type Safety. No TypeErrors. No forced filtering.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

/**
 * 🛡️ SAFE STRING GUARD (Fixes TypeError: e.replace is not a function)
 */
function safeString(value) {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(" ");
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch (e) {
            return "[Object]";
        }
    }
    return String(value);
}

/**
 * 🖼️ SAFE IMAGE PIPELINE
 */
function extractImages(raw, cjData) {
    let images = [];
    
    // Extract from ALL possible fields
    const candidates = [
        cjData?.productImageList,
        cjData?.images,
        cjData?.productImages,
        cjData?.skuImages,
        raw?.images,
        cjData?.productImage ? [cjData.productImage] : null,
        raw?.image ? [raw.image] : null
    ];

    candidates.forEach(cand => {
        if (Array.isArray(cand)) {
            images = images.concat(cand);
        }
    });

    // Clean and Normalize
    return images
        .map(img => {
            let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || img.image || "");
            url = safeString(url).trim();
            if (!url) return null;
            if (url.startsWith('//')) url = 'https:' + url;
            return url;
        })
        .filter(url => url && (url.startsWith('http') || url.startsWith('https')))
        .slice(0, 10);
}

/**
 * 🏗️ STABLE NORMALIZATION CORE
 */
export function normalizeProduct(raw = {}, cjData = {}) {
    console.log("RAW CJ:", raw, cjData);
    
    try {
        const images = extractImages(raw, cjData);
        
        // Variant Extraction (Always Array)
        const rawVariants = cjData?.variants || cjData?.skus || cjData?.productVariants || raw?.variants || [];
        const variants = Array.isArray(rawVariants) ? rawVariants : [];

        // Shipping Mapping
        const shipping = resolveShipping(cjData || raw);

        const normalized = {
            id: safeString(raw?.id || raw?.product_id || cjData?.pid || cjData?.id || "UNKNOWN"),
            name: safeString(raw?.title || raw?.productName || cjData?.productNameEn || cjData?.productName || "Unnamed Product"),
            
            images: images,
            
            // Price Logic: null if missing (NOT 0)
            price: (raw?.price !== undefined && raw?.price !== null) ? Number(raw.price) : 
                   (cjData?.sellPrice !== undefined && cjData?.sellPrice !== null) ? Number(cjData.sellPrice) : null,
            
            variants: variants,
            
            shippingCost: shipping.cost !== 0 ? shipping.cost : null,
            deliveryMin: 7, // Default min
            deliveryMax: 15, // Default max
            
            description: safeString(cjData?.descriptionHtml || cjData?.productDesc || raw?.description || "No description available"),
            
            // Legacy/Mapping fields
            cjCost: (cjData?.sellPrice !== undefined && cjData?.sellPrice !== null) ? Number(cjData.sellPrice) : Number(raw?.cjCost || 0),
            warehouse: safeString(raw?.warehouse || cjData?.warehouseName || cjData?.warehouse || "CN"),
            shipping: shipping,
            isValid: true // All results allowed (Step 5)
        };

        console.log("NORMALIZED:", normalized);
        return normalized;
    } catch (e) {
        console.error("Critical Normalization Failure:", e);
        return null;
    }
}

/**
 * 🚢 SHIPPING RESOLVER
 */
export function resolveShipping(data) {
  if (data?.logisticName && data?.logisticTime) {
    return {
      cost: parseFloat(data.shippingFee || 0),
      delivery: data.logisticTime || "7-15 Days",
      name: data.logisticName || "Standard Shipping"
    };
  }

  const method = data?.logistics?.[0] || data?.shipping_options?.[0];
  if (method) {
    return {
      cost: parseFloat(method.price ?? method.amount ?? method.shippingFee ?? 0),
      delivery: method.deliveryTime || method.logisticTime || "7-15 Days",
      name: method.logisticsName || method.logisticName || "Standard Shipping"
    };
  }

  return {
    cost: 0,
    delivery: "7-15 Days",
    name: "Standard Shipping"
  };
}

// Backwards compatibility
export const normalizeToContract = normalizeProduct;
export const validateProduct = () => true; // Always true
