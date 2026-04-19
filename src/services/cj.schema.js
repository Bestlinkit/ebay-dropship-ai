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
        
        if (!id || !title) return null;

        const price = parseFloat(raw.sellPrice || raw.variantSellPrice || raw.price || 0);
        
        // Handle images defensively (v4.5 - Protocol Security)
        let images = [];
        const rawImages = [raw.productImage, raw.bigImage, raw.image, ...(Array.isArray(raw.images) ? raw.images : [])];
        
        rawImages.forEach(img => {
            if (typeof img === 'string' && img.length > 0) {
                // Fix missing protocol
                let safeUrl = img;
                if (safeUrl.startsWith('//')) safeUrl = 'https:' + safeUrl;
                images.push(safeUrl);
            }
        });
        
        const uniqueImages = Array.from(new Set(images));

        const variants = Array.isArray(raw.productVariants || raw.variants) 
            ? (raw.productVariants || raw.variants).map(v => ({
                sku_id: v.vid || v.variantId || v.sku || id,
                attributes: v.variantKey || v.variantName || "Standard",
                price: parseFloat(v.variantSellPrice || v.sellPrice || price),
                stock: parseInt(v.variantInventory || v.inventory || 0)
            }))
            : [];

        // TRUTH EXTRACTION
        const realStock = raw.warehouseInventoryNum !== undefined ? parseInt(raw.warehouseInventoryNum) : 
                         (variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : null);
        
        const realRating = raw.productRating || raw.rating || null;

        return {
            ...CJ_PRODUCT_CONTRACT,
            product_id: id,
            title: title,
            price: price,
            stock: realStock,
            rating: realRating,
            warehouse: raw.warehouseName || raw.warehouse || "Global",
            shipping: {
                from: raw.shippingFrom || (raw.warehouseName?.includes('US') ? 'US' : 'CN'),
                delivery_days: raw.deliveryTime || "7-15"
            },
            images: uniqueImages,
            has_variants: variants.length > 0,
            variants: variants,
            raw_source: raw
        };
    } catch (e) {
        console.error("[CJ Contract] Normalization Fault:", e);
        return null;
    }
};
