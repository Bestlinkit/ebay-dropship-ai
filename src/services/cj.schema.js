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

        // 1. IMAGE HANDLING (v6.4 - FORCE DISPLAY)
        let allImages = [];
        // Priority: bigImage -> image_urls -> productImages -> productImage -> image
        const imageSource = raw.bigImage || raw.image_urls || raw.productImages || raw.productImage || raw.image || "";
        
        if (typeof imageSource === 'string' && imageSource.length > 5) {
            // Split by semicolon and clean each URL
            allImages = imageSource.split(';')
                .map(url => url.trim())
                .filter(url => url.length > 5);
        } else if (Array.isArray(imageSource)) {
            allImages = imageSource;
        } else if (imageSource) {
            allImages = [imageSource];
        }

        const gallery = [];
        allImages.forEach(img => {
            if (typeof img !== 'string' || img.length < 5) return;
            
            let safeUrl = img.trim();
            
            // Prepend CDN if it's a relative path
            if (!safeUrl.startsWith('http') && !safeUrl.startsWith('//')) {
                safeUrl = CJ_CDN + safeUrl;
            }
            
            if (safeUrl.startsWith('//')) safeUrl = 'https:' + safeUrl;
            
            // Force HTTPS
            if (safeUrl.startsWith('http://')) {
                safeUrl = safeUrl.replace('http://', 'https://');
            }
            
            if (safeUrl.startsWith('https://')) {
                gallery.push(safeUrl);
            }
        });

        // Dedup gallery
        const uniqueGallery = Array.from(new Set(gallery));
        
        // Fallback placeholder if zero images
        const PLACEHOLDER = "https://images.unsplash.com/photo-1594732806283-bc9a9af95a70?q=80&w=1000&auto=format&fit=crop";
        const mainImage = uniqueGallery[0] || PLACEHOLDER;

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
                         (variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : 0);
        
        const realRating = raw.productRating || raw.rating || null;
        const description = raw.productDesc || raw.description || raw.remark || "";

        // 3. WAREHOUSE / ORIGIN (v6.4 Rule)
        let warehouseName = raw.warehouseName || raw.warehouse || "Global";
        let origin = raw.shippingFrom || (warehouseName.toUpperCase().includes('US') ? 'US' : 'CN');
        
        // Final fallback for Origin logic
        if (!origin || origin === 'UNKNOWN') {
            origin = 'CN (default)';
        }

        return {
            ...CJ_PRODUCT_CONTRACT,
            product_id: id,
            sku: sku,
            title: title,
            price: price,
            stock: realStock,
            rating: realRating,
            description: description,
            warehouse: warehouseName,
            shipping: {
                from: origin,
                delivery_days: raw.deliveryTime || "7-15"
            },
            mainImage: mainImage,
            gallery: uniqueGallery.length > 0 ? uniqueGallery : [PLACEHOLDER],
            images: uniqueGallery.length > 0 ? uniqueGallery : [PLACEHOLDER],
            has_variants: variants.length > 0,
            variants: variants,
            raw: raw
        };
    } catch (e) {
        console.error("[CJ Contract] Normalization Fault:", e);
        return null;
    }
};
