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

const FLUFF_WORDS = ['new', 'fashion', 'top', 'hot', 'sale', 'trendy', 'high', 'quality', 'best', 'seller', '2024', '2023', '2025', 'free', 'shipping', 'brand', 'authentic', 'original', 'style', 'mode'];

export const extractCoreKeywords = (title) => {
    if (!title) return "";
    
    // 1. CLEANING: lowercase, remove apostrophes and symbols
    let clean = title.toLowerCase().replace(/[^\w\s]/g, ' '); 
    
    // Split and filter out empty strings, single characters, and FLUFF
    const words = clean.split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !FLUFF_WORDS.includes(word));
    
    // 2. BREADTH Mandate: Keep ALL core words. 
    const result = words.join(' ').trim();
    
    // Final check: Never return empty if title exists
    return result || title.toLowerCase().trim();
};

export const generateSearchSteps = (title) => {
    const core = extractCoreKeywords(title);
    const words = core.split(' ');
    
    return [
        title,           // Step 0: Raw Title (most specific)
        core,            // Step 1: Core Keywords (sanitized)
        words.slice(0, 4).join(' '), // Step 2: First 4 words
        words.slice(0, 2).join(' ')  // Step 3: First 2 words (broadest)
    ].filter(Boolean);
};

export const deconstructTitle = (title) => {
    const raw = title || "";
    const fallback = extractCoreKeywords(raw);
    const steps = generateSearchSteps(raw);
    
    return {
        gender: "unisex", 
        product_type: DICTIONARIES.PRODUCT_TYPES.find(t => raw.toLowerCase().includes(t)) || null, 
        attributes: [], 
        queries: { 
            strict: raw, 
            fallback: fallback,
            steps: steps
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

