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
    const words = title.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    
    // 1. BRAND STRIPPING (Rule v6.1)
    const filteredWords = words.filter((word, index) => {
        // Remove if contains apostrophe (e.g. Levi's)
        if (word.includes("'")) return false;
        // Remove if in Brand list
        if (DICTIONARIES.BRANDS.includes(word)) return false;
        // Remove if purely numeric (Model Number)
        if (/^\d+$/.test(word)) return false;
        return true;
    });

    const cleanInput = filteredWords.join(' ');

    // 2. EXTRACTION
    let gender = DICTIONARIES.GENDER.find(g => cleanInput.includes(g)) || "";
    let productType = DICTIONARIES.PRODUCT_TYPES.find(t => cleanInput.includes(t)) || "";
    
    // Extract up to 2 approved attributes
    const attributes = DICTIONARIES.ATTRIBUTES
        .filter(attr => cleanInput.includes(attr))
        .slice(0, 2);

    // Format: <gender> <attributes> <product_type>
    const result = `${gender} ${attributes.join(' ')} ${productType}`.trim().replace(/\s+/g, ' ');
    
    // Final fallback if extraction was too aggressive
    return result || filteredWords.slice(0, 3).join(' ');
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

