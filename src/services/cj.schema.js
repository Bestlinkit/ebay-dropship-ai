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

        // 4. DEBUG VERIFICATION (MANDATORY)
        console.log("RAW CJ DATA", raw);

        // 🧠 PHASE 9: TITLE PRIORITY
        const id = toStr(raw.pid || raw.id || raw.productId || raw.product_id, "");
        const title = toStr(
            raw.productName || raw.productNameEn || raw.nameEn || raw.title || raw.product_name || raw.product_name_en, 
            existing?.title || "Unnamed Product"
        );

        // 🖼️ PHASE 1: IMAGE FAILURE FIX
        let rawImages = [];
        if (Array.isArray(raw.productImageList)) rawImages = raw.productImageList;
        else if (Array.isArray(raw.images)) rawImages = raw.images;
        else if (Array.isArray(raw.productImages)) rawImages = raw.productImages;
        else if (Array.isArray(raw.productImageEnList)) rawImages = raw.productImageEnList;
        else if (raw.productImage) rawImages = [raw.productImage];
        else if (raw.image) rawImages = [raw.image];
        else if (raw.product_image) rawImages = [raw.product_image];

        const gallery = rawImages.map(img => {
            let url = typeof img === 'string' ? img : (img.variantImage || img.image_url || img.variant_image || "");
            if (!url) return null;
            if (!url.startsWith('http') && !url.startsWith('//')) url = `https://${CJ_CDN}/${url.replace(/^\/+/, '')}`;
            if (url.startsWith('//')) url = 'https:' + url;
            return url;
        }).filter(Boolean);

        // Image priority logic (Phase 1)
        const finalImages = gallery.length > 0 ? gallery : (existing?.images?.length > 0 ? existing.images : [PLACEHOLDER]);

        // 🧩 PHASE 2: VARIANT MISMATCH FIX
        const variantSource = raw.variants || raw.skus || raw.productVariants || raw.variantList || raw.productVariantSkuList || raw.skuList || [];
        const variants = (Array.isArray(variantSource) ? variantSource : []).map(v => {
            let vImg = toStr(v.variantImage || v.image || v.variant_image);
            if (vImg && !vImg.startsWith('http') && !vImg.startsWith('//')) vImg = `https://${CJ_CDN}/${vImg.replace(/^\/+/, '')}`;
            if (vImg && vImg.startsWith('//')) vImg = 'https:' + vImg;

            return {
                sku: toStr(v.variantSku || v.sku || v.sku_id || id),
                price: toNum(v.variantSellPrice || v.sellPrice || v.variantPrice || v.price || raw.sellPrice || 0),
                image: vImg || finalImages[0], // Phase 3 Fallback
                stock: toNum(v.variantInventory || v.inventory || v.num || v.quantity || 0),
                warehouse: toStr(v.warehouseName || v.warehouse || v.warehouse_name || raw.warehouseName || "CHINA")
            };
        });

        // 🚚 PHASE 3: SHIPPING RESOLUTION FIX
        // Origin Priority: variant.warehouse > product.warehouse > fallback
        const rawWarehouse = toStr(variants[0]?.warehouse || raw.warehouseName || raw.warehouse || "CHINA").toUpperCase();
        const origin = rawWarehouse.includes('US') ? "United States" : "China";

        // Extract from CJ detail API response fields
        let shipping = existing?.shipping || { ...CJ_PRODUCT_CONTRACT.shipping };
        
        if (raw.logisticName || raw.logisticTime || raw.shippingFee !== undefined) {
            shipping = {
                cost: toNum(raw.shippingFee || raw.shipping_fee || 0),
                method: toStr(raw.logisticName || raw.logistic_name || "Standard"),
                deliveryTime: toStr(raw.logisticTime || raw.logistic_time || "7-15 Days"),
                status: "resolved"
            };
        }

        const cjCost = toNum(raw.sellPrice || raw.variantSellPrice || raw.price || raw.product_price || 0);

        return {
            id: id,
            title: title,
            description: toStr(raw.descriptionHtml || raw.description || raw.productDesc || raw.product_desc || existing?.description || ""),
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
