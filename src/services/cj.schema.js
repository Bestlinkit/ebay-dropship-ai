/**
 * CJ Unified Data Contract (v18.0 - TYPE SAFE & IMAGE RECOVERY)
 * Mandate: Absolute Type Safety. Object-to-String Image Conversion. Recursive Field Search.
 */

/**
 * 🏗️ NAMESPACED MAPPING
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };
  
  // LOG FOR USER DIAGNOSTICS (Visible in Browser Console)
  console.log("CJ_DATA_AUDIT:", p);

  // --- 🛠️ HELPER: UNIVERSAL IMAGE SANITIZER ---
  const sanitizeUrl = (url) => {
    if (!url) return null;
    
    let target = url;
    // CRITICAL FIX: Handle cases where API returns an object instead of a string
    if (typeof url === 'object') {
        target = url.url || url.image || url.src || url.productImage || null;
    }
    
    if (typeof target !== "string") return null;
    
    let clean = target.trim();
    if (!clean || clean === "[object Object]") return null;
    
    if (clean.startsWith('http')) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    
    // CJ Specific: If it's a relative path starting with /
    if (clean.startsWith('/')) return `https://cc-west-usa.oss-accelerate.aliyuncs.com${clean}`;
    
    // If it's a naked domain/path
    if (clean.includes('.') && !clean.startsWith('http')) return `https://${clean}`;
    
    return clean;
  };

  // --- ✅ FIX IMAGE MAPPING (EXHAUSTIVE & TYPE SAFE) ---
  const findImage = (obj) => {
      const candidates = [
          obj.productImage, obj.product_image, obj.image, obj.mainImage, 
          obj.main_image, obj.product_image_url, obj.imageUrl, obj.image_url
      ];
      
      for (let c of candidates) {
          if (typeof c === 'string' && c.length > 5) return c;
          if (typeof c === 'object' && c?.url) return c.url;
      }
      
      if (Array.isArray(obj.productImageList) && obj.productImageList.length > 0) {
          return obj.productImageList[0];
      }
      return null;
  };

  const rawImage = findImage(p);
  const image = sanitizeUrl(rawImage) || "https://via.placeholder.com/600x600?text=No+Image+Available";

  // --- ✅ FIX VARIANT EXTRACTION ---
  let variants = p.skuList || p.skus || p.variantList || p.variants || p.variant_list || p.productSkus || [];
  // Some APIs return skus as a stringified JSON
  if (typeof variants === 'string' && variants.startsWith('[')) {
      try { variants = JSON.parse(variants); } catch(e) {}
  }
  
  const vArray = Array.isArray(variants) ? variants : [];
  
  // Exhaustive Variant Count
  const variantCount = parseInt(p.variantCount || p.variantsNum || p.variant_count || p.skuCount || vArray.length || 0);

  // --- ✅ FIX DESCRIPTION MAPPING ---
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
        name: String(p.nameEn || p.productNameEn || p.productName || p.name || p.title || p.productTitle || "Unnamed Product"),
        image: image,
        images: vArray.length > 0 
            ? [image, ...vArray.map(v => sanitizeUrl(v.variantImage || v.image || v.url)).filter(Boolean)]
            : (Array.isArray(p.productImageList) ? p.productImageList.map(img => sanitizeUrl(img)).filter(Boolean) : [image]),
        variants: vArray,
        variantCount: variantCount,
        price: parseFloat(p.sellPrice || p.price || p.productPrice || 0),
        cost: parseFloat(p.costPrice || p.sellPrice || 0),
        raw: p,
        warehouse: p.warehouseName || p.warehouse || "CN",
        shipping: resolveShipping(p),
        description: description
    }
  };

  // Unified Gallery: Merge all possible image sources
  const uniqueImages = new Set([cjMapped.cj.image, ...cjMapped.cj.images]);
  cjMapped.cj.images = Array.from(uniqueImages).filter(img => typeof img === 'string' && img.length > 10);

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
