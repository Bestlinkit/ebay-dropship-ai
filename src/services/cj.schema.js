/**
 * CJ Unified Data Contract (v24.0 - THE "CDN FORCED" VERSION)
 * Mandate: Fix images by handling relative paths and protocol-less URLs.
 */

export function normalizeProduct(raw = {}, cjData = {}) {
  const p = { ...raw, ...cjData };
  
  // 1. SMART SANITIZER
  const cleanUrl = (url) => {
      if (!url) return null;
      if (typeof url !== 'string') {
          if (url.url) return cleanUrl(url.url);
          return null;
      }
      let s = url.trim();
      if (!s || s === "[object Object]") return null;
      
      // Handle // protocol-less
      if (s.startsWith('//')) return `https:${s}`;
      
      // Handle relative paths (e.g. 20240423/...)
      if (!s.startsWith('http')) {
          // Check if it looks like a path (contains slashes and an extension)
          if (s.includes('/') && (s.includes('.jpg') || s.includes('.png') || s.includes('.jpeg') || s.includes('.webp'))) {
              return `https://img.cjdropshipping.com/${s.startsWith('/') ? s.slice(1) : s}`;
          }
      }
      
      return s;
  };

  // 2. PARSE GALLERY
  let gallery = p.productImageList || p.productImages || [];
  if (typeof gallery === "string") {
      try {
          gallery = gallery.includes("[") ? JSON.parse(gallery) : gallery.split(",");
      } catch {
          gallery = [gallery];
      }
  }
  const galleryArray = Array.isArray(gallery) ? gallery : [];

  // 3. PRODUCT IMAGE RESOLUTION
  const image = 
    cleanUrl(p.productImage) || 
    cleanUrl(p.product_image) || 
    cleanUrl(p.image) || 
    cleanUrl(p.mainImage) ||
    cleanUrl(galleryArray[0]) || 
    "";

  // 4. ID MAPPING
  const pid = p.pid || p.productId || p.product_id || p.id;
  const safeId = pid ? String(pid) : "UNKNOWN";

  // 5. NAMESPACE CONSTRUCTION
  const cjMapped = {
    cj: {
        id: safeId,
        name: String(p.productNameEn || p.nameEn || p.productName || p.title || p.name || "Unnamed Product"),
        image: image || "https://via.placeholder.com/600x600?text=No+Product+Image",
        images: galleryArray.map(cleanUrl).filter(Boolean).length > 0 
                ? galleryArray.map(cleanUrl).filter(Boolean) 
                : [image].filter(Boolean),
        variants: Array.isArray(p.skuList || p.variantList || p.skus || p.variants) ? (p.skuList || p.variantList || p.skus || p.variants) : [],
        variantCount: parseInt(p.variantCount || p.variantsNum || p.skuList?.length || 0),
        price: parseFloat(p.sellPrice || p.price || p.lowPrice || 0),
        cost: parseFloat(p.costPrice || p.purchasePrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p),
        description: p.productDescription || p.descriptionHtml || p.description || p.content || ""
    }
  };

  return cjMapped;
}

export function resolveShipping(data) {
  const method = data?.logistics?.[0] || data?.freight?.[0] || {};
  return {
    cost: parseFloat(data?.shippingFee || method.price || 0),
    delivery: String(data?.deliveryTime || method.deliveryTime || "7-15 Days"),
    name: data?.logisticName || method.logisticsName || "Standard Shipping"
  };
}

export const sanitizeProduct = (p) => p;
export const validateProduct = (p) => p && (p.id || p.cj?.id);
export const normalizeToContract = normalizeProduct;
