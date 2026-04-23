const CJ_CDN = "cc-west-usa.oss-us-west-1.aliyuncs.com";
const PLACEHOLDER = "https://images.unsplash.com/photo-1594732806283-bc9a9af95a70?q=80&w=1000&auto=format&fit=crop";

/**
 * CJ Unified Data Contract (v2.0 - Practical Mode)
 * Mandate: Stability > Everything.
 * Guaranteed object structure for UI rendering.
 */
export const CJ_PRODUCT_CONTRACT = {
  id: "",
  title: "Unnamed Product",
  description: "",
  images: [PLACEHOLDER],
  variants: [],
  price: 0,
  cjCost: 0,
  origin: "China",
  warehouse: "CHINA",
  shipping: {
    status: "fallback",
    cost: 0,
    method: "Unavailable",
    deliveryTime: "N/A"
  }
};

/**
 * 🧱 SAFE NORMALIZATION LAYER
 * Always returns a valid object matching CJ_PRODUCT_CONTRACT.
 */
export const normalizeProduct = (raw, existing = null) => {
    // Phase 8: Return default contract if raw is invalid
    if (!raw) return existing || { ...CJ_PRODUCT_CONTRACT };

    try {
        // --- HELPER SYSTEM (Phase 5: Numeric Safety) ---
        const toStr = (val, fallback = "") => {
            if (val === null || val === undefined) return fallback;
            return String(val).trim() || fallback;
        };

        const toNum = (val, fallback = 0) => {
            const n = parseFloat(val);
            return isNaN(n) ? fallback : n;
        };

        // 🧠 PHASE 9: TITLE PRIORITY
        const id = toStr(raw.pid || raw.id || raw.productId || raw.product_id, "");
        const title = toStr(
            raw.productName || raw.productNameEn || raw.nameEn || raw.title, 
            existing?.title || "Unnamed Product"
        );

        // 🖼️ PHASE 3: IMAGE STABILITY
        let rawImages = [];
        if (Array.isArray(raw.productImageEnList)) rawImages = raw.productImageEnList;
        else if (Array.isArray(raw.productImageList)) rawImages = raw.productImageList;
        else if (raw.productImage) rawImages = [raw.productImage];
        else if (raw.image) rawImages = [raw.image];

        const gallery = rawImages.map(img => {
            let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || "");
            if (!url) return null;
            if (!url.startsWith('http') && !url.startsWith('//')) url = `https://${CJ_CDN}/${url.replace(/^\/+/, '')}`;
            if (url.startsWith('//')) url = 'https:' + url;
            return url;
        }).filter(Boolean);

        // Image priority logic (Phase 2)
        const finalImages = gallery.length > 0 ? gallery : (existing?.images?.length > 0 ? existing.images : [PLACEHOLDER]);

        // 🧩 PHASE 3: VARIANT HANDLING
        const variantSource = raw.productVariants || raw.variants || raw.variantList || raw.productVariantSkuList || [];
        const variants = (Array.isArray(variantSource) ? variantSource : []).map(v => {
            let vImg = toStr(v.variantImage || v.image);
            if (vImg && !vImg.startsWith('http') && !vImg.startsWith('//')) vImg = `https://${CJ_CDN}/${vImg.replace(/^\/+/, '')}`;
            if (vImg && vImg.startsWith('//')) vImg = 'https:' + vImg;

            return {
                sku: toStr(v.variantSku || v.sku || id),
                price: toNum(v.variantSellPrice || v.sellPrice || v.variantPrice || raw.sellPrice || 0),
                image: vImg || finalImages[0], // Phase 3 Fallback
                stock: toNum(v.variantInventory || v.inventory || v.num || 0),
                warehouse: toStr(v.warehouseName || v.warehouse || raw.warehouseName || "CHINA")
            };
        });

        // 🚚 PHASE 4 & 6: SHIPPING & ORIGIN
        // Origin Priority: variant.warehouse > product.warehouse > fallback
        const rawWarehouse = toStr(variants[0]?.warehouse || raw.warehouseName || raw.warehouse || "CHINA").toUpperCase();
        const origin = rawWarehouse.includes('US') ? "United States" : "China";

        // Step 1: Extract ONLY ONE valid method from CJ detail
        let shipping = existing?.shipping || { ...CJ_PRODUCT_CONTRACT.shipping };
        
        if (raw.logisticName && raw.logisticTime && raw.shippingFee !== undefined) {
            shipping = {
                cost: toNum(raw.shippingFee),
                method: toStr(raw.logisticName),
                deliveryTime: toStr(raw.logisticTime),
                status: "resolved"
            };
        }

        const cjCost = toNum(raw.sellPrice || raw.variantSellPrice || raw.price || 0);

        return {
            id: id,
            title: title,
            description: toStr(raw.descriptionHtml || raw.description || raw.productDesc || existing?.description || ""),
            images: finalImages,
            variants: variants,
            price: toNum(raw.price || existing?.price || cjCost), // targetPrice/ebayPrice logic
            cjCost: cjCost,
            origin: origin,
            warehouse: rawWarehouse,
            shipping: shipping
        };
    } catch (e) {
        console.error("[CJ NORMALIZATION FAULT]", e);
        return existing || { ...CJ_PRODUCT_CONTRACT };
    }
};

// Backwards compatibility export
export const normalizeToContract = normalizeProduct;
