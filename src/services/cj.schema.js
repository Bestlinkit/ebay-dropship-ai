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
  rating: 4.8, // Fallback if not in API
  stock: 0,
  warehouse: "Global",
  shipping: {
    from: "CN",
    delivery_days: "7-15"
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
        
        // Handle images defensively
        let images = [];
        if (raw.productImage) images.push(raw.productImage);
        if (raw.bigImage) images.push(raw.bigImage);
        if (Array.isArray(raw.images)) images = [...images, ...raw.images];
        if (raw.image && typeof raw.image === 'string') images.push(raw.image);
        
        const uniqueImages = Array.from(new Set(images.filter(img => typeof img === 'string' && img.length > 0)));

        const variants = Array.isArray(raw.productVariants || raw.variants) 
            ? (raw.productVariants || raw.variants).map(v => ({
                sku_id: v.vid || v.variantId || v.sku || id,
                attributes: v.variantKey || v.variantName || "Standard",
                price: parseFloat(v.variantSellPrice || v.sellPrice || price),
                stock: parseInt(v.variantInventory || v.inventory || 100)
            }))
            : [];

        return {
            ...CJ_PRODUCT_CONTRACT,
            product_id: id,
            title: title,
            price: price,
            stock: variants.reduce((acc, v) => acc + v.stock, 0) || parseInt(raw.warehouseInventoryNum || 100),
            images: uniqueImages,
            has_variants: variants.length > 0,
            variants: variants,
            // Enhanced attributes for scoring
            raw_source: raw
        };
    } catch (e) {
        console.error("[CJ Contract] Normalization Fault:", e);
        return null;
    }
};
