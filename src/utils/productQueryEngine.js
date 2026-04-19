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
    
    // 1. CLEANING: Remove symbols and numbers, keep words and spaces
    let clean = title.toLowerCase().replace(/[^\w\s]/g, ' '); // Replace symbols with space
    clean = clean.replace(/\d+/g, ' '); // Replace numbers with space
    
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    
    // 2. BRAND STRIPPING (Rule v6.4 - CJ Broad)
    const filteredWords = words.filter(word => {
        // Remove if in Brand list
        if (DICTIONARIES.BRANDS.includes(word)) return false;
        return true;
    });

    // Final fallback: Use everything if we stripped too much
    const result = filteredWords.join(' ').trim();
    
    // Mandate: DO NOT over-shorten queries
    return result || title.toLowerCase();
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

