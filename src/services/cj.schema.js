/**
 * CJ Unified Data Contract (v5.0 - RECOVERY MODE)
 * Mandate: Protect Data. Do not trust CJ blindly. 
 * Use null-coalescing (??) for numeric safety.
 */
const PLACEHOLDER = "https://via.placeholder.com/300";

export function normalizeProduct(product = {}, cjData = {}) {
  // Merge safety: prioritize existing data, fill gaps with cjData
  return {
    id: product?.id || cjData?.id || product?.product_id || cjData?.pid,

    title:
      product?.title ||
      product?.name ||
      product?.productName ||
      cjData?.productNameEn ||
      cjData?.productName ||
      cjData?.name ||
      null,

    description:
      product?.description ||
      cjData?.descriptionHtml ||
      cjData?.productDesc ||
      cjData?.description ||
      null,

    images:
      (product?.images && product.images.length > 0) ? product.images :
      (cjData?.productImageList && cjData.productImageList.length > 0) ? cjData.productImageList :
      (cjData?.images && cjData.images.length > 0) ? cjData.images :
      [],

    variants:
      (product?.variants && product.variants.length > 0) ? product.variants :
      (cjData?.variants && cjData.variants.length > 0) ? cjData.variants :
      (cjData?.skus && cjData.skus.length > 0) ? cjData.skus :
      (cjData?.productVariants && cjData.productVariants.length > 0) ? cjData.productVariants :
      [],

    price: product?.price ?? cjData?.sellPrice ?? cjData?.price ?? null,

    cjCost: cjData?.sellPrice ?? cjData?.price ?? product?.cjCost ?? null,

    warehouse:
      product?.warehouse ||
      cjData?.warehouseName ||
      cjData?.warehouse ||
      "CN",

    shipping: cjData?.shipping || product?.shipping || null
  };
}

/**
 * 🚢 PHASE 3 — SHIPPING (SAFE + REALISTIC)
 */
export function resolveShipping(data) {
  // If we already have resolved shipping, use it
  if (data?.shipping && data.shipping.name && data.shipping.name !== "Standard Shipping") {
      return {
          cost: data.shipping.cost ?? 0,
          delivery: data.shipping.delivery || "7-15 Days",
          name: data.shipping.name || "Standard Shipping"
      };
  }

  // Look for direct fields
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
      cost: parseFloat(method.cost ?? method.price ?? method.amount ?? 0),
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
