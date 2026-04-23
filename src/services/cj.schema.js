/**
 * CJ Unified Data Contract (v23.0 - STABLE GALLERY VERSION)
 * Mandate: Fix images and gallery without breaking discovery.
 */

export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, trust enrichment (cjData) for detail fields
  const p = { ...raw, ...cjData };
  
  // 1. SIMPLE SANITIZER
  const cleanUrl = (url) => {
      if (!url) return null;
      if (typeof url !== 'string') {
          if (url.url) return cleanUrl(url.url);
          return null;
      }
      let s = url.trim();
      if (!s || s === "[object Object]") return null;
      if (s.startsWith('//')) return `https:${s}`;
      return s;
  };

  // 2. PARSE GALLERY (Crucial for images)
  let gallery = p.productImageList || [];
  if (typeof gallery === "string") {
      try {
          gallery = gallery.includes("[")
              ? JSON.parse(gallery)
              : gallery.split(",");
      } catch {
          gallery = [];
      }
  }
  const galleryArray = Array.isArray(gallery) ? gallery : [];

  // 3. PRODUCT IMAGE RESOLUTION
  // Priority: raw field -> first of gallery
  const image = 
    cleanUrl(p.productImage) || 
    cleanUrl(p.product_image) || 
    cleanUrl(p.image) || 
    cleanUrl(galleryArray[0]) || 
    "";

  // 4. ID MAPPING
  const pid = p.pid || p.productId || p.product_id || p.id;
  const safeId = pid ? String(pid) : "UNKNOWN";

  // 5. VARIANT EXTRACTION
  let variants = p.skuList || p.skus || p.variantList || p.variants || [];
  if (typeof variants === 'string' && variants.startsWith('[')) {
      try { variants = JSON.parse(variants); } catch(e) {}
  }
  const vArray = Array.isArray(variants) ? variants : [];
  const variantCount = parseInt(p.variantCount || p.variantsNum || p.skuCount || vArray.length || 0);

  // 6. NAMESPACE CONSTRUCTION
  const cjMapped = {
    cj: {
        id: safeId,
        name: String(p.nameEn || p.productNameEn || p.productName || p.title || "Unnamed Product"),
        image: image || "https://via.placeholder.com/600x600?text=No+Product+Image",
        images: galleryArray.map(cleanUrl).filter(Boolean).length > 0 
                ? galleryArray.map(cleanUrl).filter(Boolean) 
                : [image].filter(cleanUrl),
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
