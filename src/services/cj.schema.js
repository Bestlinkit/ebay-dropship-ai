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
    delivery_days: null,
    options: [] // v13.0
  },
  images: [],
  has_variants: false,
  variants: [], // Array of { sku, color, size, price, inventory, image }
  sellabilityScore: null,
  rating: null
};

/**
 * Normalizes a candidate object into the strict CJ_PRODUCT_CONTRACT.
 * @param {Object} raw 
 * @param {Boolean} isDetail - If true, treats the source as the absolute Source of Truth (CJ Detail API).
 * @returns {Object} Normalized product or null if critical fields are missing.
 */
export const normalizeToContract = (raw, isDetail = false) => {
    if (!raw) return null;

    try {
        const id = raw.pid || raw.id || raw.productId;
        const title = raw.productNameEn || raw.productName || raw.nameEn || raw.title;
        const sku = raw.productSku || raw.sku || id;
        
        if (!id || !title) return null;

        const price = parseFloat(raw.sellPrice || raw.variantSellPrice || raw.price || 0);
        
        // CJ CDN Base
        const CJ_CDN = "https://cc-west-usa.oss-us-west-1.aliyuncs.com/";

        // 1. IMAGE SYSTEM (v12.1 - DETAIL PRIORITY)
        let allImages = [];
        const imageKeys = isDetail 
            ? ['productImages', 'imageUrls', 'variantImages', 'bigImage', 'image_urls'] 
            : ['bigImage', 'image_urls', 'productImages'];
        
        imageKeys.forEach(key => {
            const val = raw[key];
            if (typeof val === 'string' && val.length > 5) {
                val.split(';').forEach(url => allImages.push(url.trim()));
            } else if (Array.isArray(val)) {
                allImages = [...allImages, ...val.map(v => typeof v === 'string' ? v : (v.variantImage || v.image))];
            }
        });

        const imageGallery = [];
        allImages.forEach(img => {
            if (!img || typeof img !== 'string' || img.length < 5) return;
            let safeUrl = img.trim();
            if (!safeUrl.startsWith('http') && !safeUrl.startsWith('//')) safeUrl = CJ_CDN + safeUrl;
            if (safeUrl.startsWith('//')) safeUrl = 'https:' + safeUrl;
            if (safeUrl.startsWith('http://')) safeUrl = safeUrl.replace('http://', 'https://');
            if (safeUrl.startsWith('https://')) imageGallery.push(safeUrl);
        });

        // Dedup and fulfill min-3 rule
        let uniqueGallery = Array.from(new Set(imageGallery));
        
        // v13.0: Merge variant images into gallery
        const variantImages = (raw.productVariants || raw.variants || [])
            .map(v => v.variantImage)
            .filter(img => typeof img === 'string' && img.length > 5)
            .map(img => img.startsWith('http') ? img : CJ_CDN + img);
        
        uniqueGallery = Array.from(new Set([...uniqueGallery, ...variantImages]));
        
        const finalGallery = [...uniqueGallery];
        const PLACEHOLDER = "https://images.unsplash.com/photo-1594732806283-bc9a9af95a70?q=80&w=1000&auto=format&fit=crop";
        
        if (finalGallery.length === 0) {
            for (let i = 0; i < 3; i++) finalGallery.push(PLACEHOLDER);
        } else {
            // Keep actual images preferentially, only repeat if < 3
            while (finalGallery.length < 3) {
                finalGallery.push(finalGallery[0]);
            }
        }

        // 2. LOGISTICS INFERENCE (v13.0 ShipFrom)
        let warehouseName = raw.warehouseName || raw.warehouse || "Global";
        let shipFrom = raw.shippingFrom || raw.shipFrom || warehouseName;
        let origin = "GLOBAL";
        if (shipFrom.toUpperCase().includes('CN')) origin = "CN";
        else if (shipFrom.toUpperCase().includes('US')) origin = "US";

        // 3. VARIANT FLATTENING (v13.0)
        const variantSource = raw.productVariants || raw.variants || [];
        const variants = (Array.isArray(variantSource) ? variantSource : [])
            .map(v => ({
                id: v.vid || v.variantId || v.variantSku || v.sku || id,
                sku: v.variantSku || v.sku || id,
                color: v.variantKey || v.variantName || v.nameEn || "Standard",
                size: v.variantStandard || "Standard",
                price: parseFloat(v.variantSellPrice || v.sellPrice || price),
                inventory: parseInt(v.variantInventory || v.inventory || 0),
                image: v.variantImage ? (v.variantImage.startsWith('http') ? v.variantImage : CJ_CDN + v.variantImage) : finalGallery[0]
            }));

        // v13.0: Inventory Summation Rule
        const totalStock = variants.reduce((acc, v) => acc + (v.inventory || 0), 0);
        const realStock = totalStock > 0 ? totalStock : (parseInt(raw.warehouseInventoryNum) || 0);

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
                delivery_days: raw.deliveryTime || raw.shippingTime || "7-15 Days (Est.)",
                shipping_cost: raw.shippingFee || raw.shippingCost || null,
                isReal: isDetail && (raw.shippingFee !== undefined || raw.shippingCost !== undefined)
            },
            mainImage: finalGallery[0],
            gallery: finalGallery,
            has_variants: variants.length > 0,
            variants: variants,
            sellabilityScore: raw.sellabilityScore || null,
            rating: raw.productRating || raw.rating || null,
            cj_url: `https://cjdropshipping.com/product/${id}.html`,
            isEnriched: isDetail,
            raw: raw
        };
    } catch (e) {
        console.error("[CJ v7.0] Normalization Vault Failure:", e);
        return null;
    }
};
