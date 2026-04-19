/**
 * CJ Unified Data Contract (v1.0 - Single Source of Truth)
 * Mandate: Stability > Intelligence. 
 * All CJ API responses must normalize to this schema before reaching the UI.
 */
export const CJ_PRODUCT_CONTRACT = {
  product_id: "",
  title: "",
  price: 0,
  currency: "USD",
  rating: null, // TRUTH: Null if not in CJ data
  stock: null,  // TRUTH: Null if not in CJ data
  warehouse: null,
  shipping: {
    from: null,
    delivery_days: null
  },
  images: [],
  has_variants: false,
  variants: [] // Array of { sku_id, attributes, price, stock }
};

/**
 * Normalizes a candidate object into the strict CJ_PRODUCT_CONTRACT.
 * @param {Object} raw 
 * @returns {Object} Normalized product or null if critical fields are missing.
 */
export const normalizeToContract = (raw) => {
    if (!raw) return null;

    try {
        const id = raw.pid || raw.id || raw.productId;
        const title = raw.productNameEn || raw.productName || raw.nameEn || raw.title;
        const sku = raw.productSku || raw.sku || id;
        
        if (!id || !title) return null;

        const price = parseFloat(raw.sellPrice || raw.variantSellPrice || raw.price || 0);
        
        // CJ CDN Base (v4.7 Fix)
        const CJ_CDN = "https://cc-west-usa.oss-us-west-1.aliyuncs.com/";

        // 1. IMAGE HANDLING (v4.7 - Split & Protocol Guard)
        let allImages = [];
        const imageSource = raw.image_urls || raw.productImages || raw.productImage || raw.bigImage || raw.image || "";
        
        if (typeof imageSource === 'string' && imageSource.includes(';')) {
            allImages = imageSource.split(';').filter(url => url.length > 5);
        } else if (Array.isArray(imageSource)) {
            allImages = imageSource;
        } else if (imageSource) {
            allImages = [imageSource];
        }

        // Add additional array sources if they exist
        if (Array.isArray(raw.images)) {
            allImages = [...allImages, ...raw.images];
        }

        const gallery = [];
        allImages.forEach(img => {
            if (typeof img !== 'string' || img.length < 5) return;
            
            let safeUrl = img.trim();
            
            // Prepend CDN if it's a relative path (e.g. 2024/.../img.png)
            if (!safeUrl.startsWith('http') && !safeUrl.startsWith('//')) {
                safeUrl = CJ_CDN + safeUrl;
            }
            
            // Fix missing protocol
            if (safeUrl.startsWith('//')) safeUrl = 'https:' + safeUrl;
            
            // FINAL ENFORCEMENT: If still no https://, it's invalid per v4.7 rules
            if (!safeUrl.startsWith('https://')) {
                // If it starts with http://, we upgrade it.
                if (safeUrl.startsWith('http://')) {
                    safeUrl = safeUrl.replace('http://', 'https://');
                } else {
                    return; // DISCARD PER RULE: "Ensure ALL URLs start with https://"
                }
            }
            
            gallery.push(safeUrl);
        });

        const uniqueGallery = Array.from(new Set(gallery));
        const mainImage = uniqueGallery[0] || "INVALID_IMAGE";

        // 2. VARIANT SYNC
        const variants = Array.isArray(raw.productVariants || raw.variants) 
            ? (raw.productVariants || raw.variants).map(v => ({
                sku_id: v.vid || v.variantId || v.variantSku || v.sku || id,
                attributes: v.variantKey || v.variantName || "Standard",
                price: parseFloat(v.variantSellPrice || v.sellPrice || price),
                stock: parseInt(v.variantInventory || v.inventory || 0),
                image: v.variantImage ? (v.variantImage.startsWith('http') ? v.variantImage : CJ_CDN + v.variantImage) : mainImage
            }))
            : [];

        // TRUTH EXTRACTION
        const realStock = raw.warehouseInventoryNum !== undefined ? parseInt(raw.warehouseInventoryNum) : 
                         (variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : null);
        
        const realRating = raw.productRating || raw.rating || null;
        const description = raw.productDesc || raw.description || raw.remark || "";

        return {
            ...CJ_PRODUCT_CONTRACT,
            product_id: id,
            sku: sku,
            title: title,
            price: price,
            stock: realStock,
            rating: realRating,
            description: description,
            warehouse: raw.warehouseName || raw.warehouse || "Global",
            shipping: {
                from: raw.shippingFrom || (raw.warehouseName?.includes('US') ? 'US' : 'CN'),
                delivery_days: raw.deliveryTime || "7-15"
            },
            mainImage: mainImage,
            gallery: uniqueGallery,
            images: uniqueGallery, // Back-compat
            has_variants: variants.length > 0,
            variants: variants,
            raw: raw // Explicitly store raw response as requested
        };
    } catch (e) {
        console.error("[CJ Contract] Normalization Fault:", e);
        return null;
    }
};
