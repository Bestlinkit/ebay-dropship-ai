/**
 * 🧠 CJ SEARCH INTELLIGENCE ENGINE (v6.1 - DETERMINISTIC FALLBACK)
 * Mandate: Broad retrieval via exact match + deterministic keyword fallback.
 */

const DICTIONARIES = {
    GENDER: ['men', 'women', 'unisex', 'kids', 'boy', 'girl'],
    PRODUCT_TYPES: ['jeans', 'sneakers', 'shoes', 'dress', 'jacket', 'hoodie', 'watch', 'bag', 'shirt', 't-shirt', 'boots', 'sandals', 'loafers', 'oxfords'],
    ATTRIBUTES: ['straight', 'slim', 'casual', 'denim', 'leather', 'oversized', 'vintage', 'mesh', 'lightweight', 'waterproof', 'breathable', 'formal'],
    BRANDS: ['nike', 'adidas', 'puma', 'reebok', 'skechers', 'levis', 'zara', 'h&m', 'gucci', 'prada', 'clarks', 'ecco', 'timberland']
};

export const extractCoreKeywords = (title) => {
    if (!title) return "";
    
    // 1. CLEANING (v2 Rule): lowercase, remove apostrophes and symbols
    // Replace symbols and apostrophes with space to prevent word merging
    let clean = title.toLowerCase().replace(/[^\w\s]/g, ' '); 
    
    // Split and filter out empty strings and single characters (except maybe 'a' if common, but 2+ is safer)
    const words = clean.split(/\s+/).filter(word => word.length >= 2);
    
    // 2. BREADTH Mandate: Keep ALL core words. 
    // Do not aggressively prune categories or brands here; let fallback handling handle depth.
    const result = words.join(' ').trim();
    
    // Final check: Never return empty if title exists
    return result || title.toLowerCase().trim();
};

export const deconstructTitle = (title) => {
    const raw = title || "";
    const fallback = extractCoreKeywords(raw);
    
    return {
        gender: "unisex", 
        product_type: DICTIONARIES.PRODUCT_TYPES.find(t => raw.toLowerCase().includes(t)) || null, 
        attributes: [], 
        queries: { 
            strict: raw, 
            fallback: fallback 
        } 
    };
};

/**
 * 🔒 VALIDATION UTILS (v6.1 - RANK NOT FILTER)
 */
export const validateMatch = (ebayData, cjData) => {
    // Post-v6.1 Rule: Never filter out results.
    // Ranking layer in cj.service.js handles sorting.
    return true;
};

