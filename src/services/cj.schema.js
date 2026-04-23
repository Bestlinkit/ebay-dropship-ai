/**
 * CJ Unified Data Contract (v4.0 - EMERGENCY RESTORE)
 * Mandate: RESTORE DATA PRIORITY. Do not trust CJ blindly.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

export function normalizeProduct(product = {}) {
  // Restore Data Priority: Keep existing valid data, use defaults for nulls
  return {
    id: product?.id || "UNKNOWN",

    title:
      product?.title && product.title !== "Unnamed Product"
        ? product.title
        : product?.name && product.name !== "Unnamed Product"
        ? product.name
        : "Unnamed Product",

    description:
      product?.description && product.description !== "No description available"
        ? product.description
        : "No description available",

    images:
      product?.images?.length > 0
        ? product.images.map(img => {
            let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || "");
            if (url && url.startsWith('//')) url = 'https:' + url;
            return url;
          }).filter(Boolean)
        : [PLACEHOLDER],

    variants:
      product?.variants?.length > 0
        ? product.variants
        : [],

    price: parseFloat(product?.price || 0),
    cjCost: parseFloat(product?.cjCost || 0),

    warehouse: product?.warehouse || "CN",

    // 🚢 DO NOT TOUCH SHIPPING (Keep previous logic if it worked)
    shipping: product?.shipping || resolveShipping(product)
  };
}

/**
 * 🚢 PHASE 3 — SIMPLE SHIPPING (STABLE FALLBACK)
 */
export function resolveShipping(product) {
  if (product?.shipping) return product.shipping;

  const method = product?.logistics?.[0] || product?.shipping_options?.[0];

  if (method) {
    return {
      cost: parseFloat(method.cost || method.price || method.amount || 0),
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
