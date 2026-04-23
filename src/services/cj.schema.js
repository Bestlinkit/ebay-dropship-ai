/**
 * CJ Unified Data Contract (v19.0 - THE "CDN RECONSTRUCTION" VERSION)
 * Mandate: Absolute Image Resolution. Correct Portal Linking. Logistics Accuracy.
 */

/**
 * 🏗️ NAMESPACED MAPPING
 */
export function normalizeProduct(raw = {}, cjData = {}) {
  // Combine sources, prioritize detailed data
  const p = { ...raw, ...cjData };
  
  // LOG FOR USER DIAGNOSTICS (Visible in Browser Console)
  console.log("CJ_DATA_AUDIT:", p);

  // --- 🛠️ HELPER: UNIVERSAL IMAGE SANITIZER (v19.0) ---
  const sanitizeUrl = (url) => {
    if (!url) return null;
    
    let target = url;
    if (typeof url === 'object') {
        target = url.url || url.image || url.src || url.productImage || null;
    }
    
    if (typeof target !== "string") return null;
    
    let clean = target.trim();
    if (!clean || clean === "[object Object]" || clean === "undefined") return null;
    
    if (clean.startsWith('http')) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    
    // CJ SPECIFIC RECONSTRUCTION:
    // If it looks like a path (e.g. "20240501/123.jpg" or "/20240501/...")
    // Prefix with the validated CJ CDN
    const cjCDN = "https://cc-west-usa.oss-accelerate.aliyuncs.com";
    
    if (clean.startsWith('/')) {
        return `${cjCDN}${clean}`;
    }
    
    // If it's a date-based relative path (common in CJ)
    if (/^\d{8}\//.test(clean) || /^\d{4}-\d{2}-\d{2}/.test(clean)) {
        return `${cjCDN}/${clean}`;
    }
    
    // Fallback prefixing
    if (clean.includes('.') && !clean.startsWith('http')) {
        // If it has a domain-like structure, assume it's naked
        if (clean.includes('alicdn.com') || clean.includes('aliyuncs.com')) {
            return `https://${clean}`;
        }
        return `${cjCDN}/${clean}`;
    }
    
    return clean;
  };

  // --- ✅ FIX IMAGE MAPPING ---
  const findImage = (obj) => {
      const candidates = [
          obj.productImage, obj.product_image, obj.image, obj.mainImage, 
          obj.main_image, obj.product_image_url, obj.imageUrl, obj.image_url
      ];
      
      for (let c of candidates) {
          const s = sanitizeUrl(c);
          if (s && s.length > 10 && !s.includes("[object")) return s;
      }
      
      if (Array.isArray(obj.productImageList) && obj.productImageList.length > 0) {
          const s = sanitizeUrl(obj.productImageList[0]);
          if (s) return s;
      }
      return null;
  };

  const image = findImage(p) || "https://via.placeholder.com/600x600?text=Image+Processing...";

  // --- ✅ FIX VARIANT EXTRACTION ---
  let variants = p.skuList || p.skus || p.variantList || p.variants || p.variant_list || p.productSkus || [];
  if (typeof variants === 'string' && variants.startsWith('[')) {
      try { variants = JSON.parse(variants); } catch(e) {}
  }
  
  const vArray = Array.isArray(variants) ? variants : [];
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

  // Final Gallery Hardening: Ensure no broken strings leaked in
  const gallery = Array.from(new Set([cjMapped.cj.image, ...cjMapped.cj.images]))
      .filter(img => typeof img === 'string' && img.startsWith('http') && img.length > 15 && !img.includes('[object'));
  
  cjMapped.cj.images = gallery;

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
