/**
 * CJ Unified Data Contract (v21.0 - THE "RAW STRING" VERSION)
 * Mandate: Trust the API strings. No complex prefixing.
 */

export function normalizeProduct(raw = {}, cjData = {}) {
  const p = { ...raw, ...cjData };
  
  // 1. SIMPLE SANITIZER
  const cleanUrl = (url) => {
      if (!url) return null;
      if (typeof url !== 'string') {
          if (url.url) return cleanUrl(url.url);
          return null;
      }
      let s = url.trim();
      if (s.startsWith('//')) return `https:${s}`;
      return s;
  };

  // 2. PRIMARY IMAGE LOOKUP (Prioritize the search result string as requested)
  const image = cleanUrl(p.productImage || p.product_image || p.image || p.mainImage || (Array.isArray(p.productImageList) ? p.productImageList[0] : null));

  // 3. ID MAPPING
  const pid = p.pid || p.productId || p.product_id || p.id;
  const safeId = pid ? String(pid) : "UNKNOWN";

  // 4. VARIANT EXTRACTION
  let variants = p.skuList || p.skus || p.variantList || p.variants || [];
  if (typeof variants === 'string' && variants.startsWith('[')) {
      try { variants = JSON.parse(variants); } catch(e) {}
  }
  const vArray = Array.isArray(variants) ? variants : [];
  const variantCount = parseInt(p.variantCount || p.variantsNum || p.skuCount || vArray.length || 0);

  // 5. NAMESPACE CONSTRUCTION
  const cjMapped = {
    cj: {
        id: safeId,
        name: String(p.nameEn || p.productNameEn || p.productName || p.title || "Unnamed Product"),
        image: image || "https://via.placeholder.com/600x600?text=No+Product+Image",
        images: Array.isArray(p.productImageList) ? p.productImageList.map(cleanUrl).filter(Boolean) : [image].filter(Boolean),
        variants: vArray,
        variantCount: variantCount,
        price: parseFloat(p.sellPrice || p.price || 0),
        cost: parseFloat(p.costPrice || p.sellPrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p),
        description: p.descriptionHtml || p.description || ""
    }
  };

  return cjMapped;
}

export function resolveShipping(data) {
  const method = data?.logistics?.[0] || data?.freight?.[0] || {};
  const fee = data?.shippingFee || data?.logisticFee || method.price || 0;
  const delivery = data?.deliveryTime || data?.logisticTime || method.deliveryTime || "7-15 Days";

  return {
    cost: parseFloat(fee),
    delivery: String(delivery),
    name: data?.logisticName || method.logisticsName || "Standard Shipping"
  };
}

export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
