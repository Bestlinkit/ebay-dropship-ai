/**
 * 🧠 CJ SEARCH INTELLIGENCE ENGINE (v5.0 - STRICT TITLE SEARCH)
 * Mandate: Zero-modification retrieval to maximize discovery volume.
 */

export const deconstructTitle = (title) => {
    const raw = title || "";
    return {
        gender: "unisex", 
        product_type: null, 
        attributes: [], 
        queries: { 
            strict: raw, 
            expanded: raw, 
            broad: raw 
        } 
    };
};

/**
 * 🔒 VALIDATION UTILS (v5.0 - ALLOW ALL)
 */
export const validateMatch = (ebayData, cjData) => {
    // Post-v5.0 Rule: Never filter out CJ results at the retrieval layer.
    // Let the user decide relevance via manual inspection.
    return true;
};

