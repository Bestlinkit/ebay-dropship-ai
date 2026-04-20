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
        
        // CJ CDN Base
        const CJ_CDN = "https://cc-west-usa.oss-us-west-1.aliyuncs.com/";

        // 1. IMAGE SYSTEM (v7.0 - MULTI-IMAGE GALLERY)
        let allImages = [];
        const imageKeys = ['bigImage', 'image_urls', 'productImages', 'productImage', 'image'];
        
        imageKeys.forEach(key => {
            const val = raw[key];
            if (typeof val === 'string' && val.length > 5) {
                val.split(';').forEach(url => allImages.push(url.trim()));
            } else if (Array.isArray(val)) {
                allImages = [...allImages, ...val];
            }
        });

        const imageGallery = [];
        allImages.forEach(img => {
            if (typeof img !== 'string' || img.length < 5) return;
            let safeUrl = img.trim();
            if (!safeUrl.startsWith('http') && !safeUrl.startsWith('//')) safeUrl = CJ_CDN + safeUrl;
            if (safeUrl.startsWith('//')) safeUrl = 'https:' + safeUrl;
            if (safeUrl.startsWith('http://')) safeUrl = safeUrl.replace('http://', 'https://');
            if (safeUrl.startsWith('https://')) imageGallery.push(safeUrl);
        });

        // Dedup and fulfill min-3 rule
        const uniqueGallery = Array.from(new Set(imageGallery));
        const finalGallery = [...uniqueGallery];
        const PLACEHOLDER = "https://images.unsplash.com/photo-1594732806283-bc9a9af95a70?q=80&w=1000&auto=format&fit=crop";
        
        if (finalGallery.length === 0) {
            for (let i = 0; i < 3; i++) finalGallery.push(PLACEHOLDER);
        } else {
            while (finalGallery.length < 3) {
                finalGallery.push(finalGallery[0]);
            }
        }

        // 2. LOGISTICS INFERENCE
        let warehouseName = raw.warehouseName || raw.warehouse || "Global";
        let origin = "GLOBAL (default)";
        if (warehouseName.toUpperCase().includes('CN')) origin = "CN";
        else if (warehouseName.toUpperCase().includes('US')) origin = "US";
        else if (raw.shippingFrom?.toUpperCase() === 'CN') origin = "CN";
        else if (raw.shippingFrom?.toUpperCase() === 'US') origin = "US";

        // 3. VARIANT FLATTENING (v7.0)
        const variants = (Array.isArray(raw.productVariants || raw.variants) ? (raw.productVariants || raw.variants) : [])
            .map(v => ({
                sku_id: v.vid || v.variantId || v.variantSku || v.sku || id,
                attributes: v.variantKey || v.variantName || v.nameEn || "Standard",
                price: parseFloat(v.variantSellPrice || v.sellPrice || price),
                stock: parseInt(v.variantInventory || v.inventory || 0),
                image: v.variantImage ? (v.variantImage.startsWith('http') ? v.variantImage : CJ_CDN + v.variantImage) : finalGallery[0]
            }));

        const realStock = raw.warehouseInventoryNum !== undefined ? parseInt(raw.warehouseInventoryNum) : 
                         (variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : 0);

        return {
            ...CJ_PRODUCT_CONTRACT,
            product_id: id,
            sku: sku,
            title: title,
            price: price,
            stock: realStock,
            rating: raw.productRating || raw.rating || null,
            description: raw.description || raw.productDesc || raw.remark || raw.nameEn || "",
            warehouse: warehouseName,
            shipping: {
                from: origin,
                delivery_days: raw.deliveryTime || "7-15 Days (Est.)",
                shipping_cost: raw.shippingFee || raw.shippingCost || null
            },
            mainImage: finalGallery[0],
            gallery: finalGallery,
            images: finalGallery,
            has_variants: variants.length > 0,
            variants: variants,
            cj_url: `https://cjdropshipping.com/product/${id}`,
            raw: raw
        };
    } catch (e) {
        console.error("[CJ v7.0] Normalization Vault Failure:", e);
        return null;
    }
};
