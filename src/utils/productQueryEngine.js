/**
 * 🧠 CJ SEARCH INTELLIGENCE ENGINE (v4.0 - FINAL DETERMINISTIC)
 * Mandate: Constraint-based matching to eliminate marketplace noise.
 */

const DICTIONARIES = {
    GENDER: ['men', 'women', 'unisex', 'kids', 'boy', 'girl'],
    PRODUCT_TYPES: [
        'sneakers', 'shoes', 'boots', 'jacket', 'watch', 'bag', 
        't-shirt', 'hoodie', 'jeans', 'oxfords', 'loafers', 
        'sandals', 'flats', 'heels', 'backpack', 'wallet',
        'sunglasses', 'belt', 'hat', 'cap', 'socks'
    ],
    ATTRIBUTES: [
        'mesh', 'leather', 'lightweight', 'casual', 'sport', 
        'waterproof', 'breathable', 'cushioned', 'running',
        'walking', 'formal', 'slip-on', 'lace-up'
    ],
    IGNORE_BRANDS: [
        'nike', 'adidas', 'puma', 'reebok', 'under armour', 
        'skechers', 'new balance', 'asics', 'converse', 'vans',
        'bruno marc', 'timberland', 'dr martens', 'levis',
        'calvin klein', 'tommy hilfiger', 'ralph lauren',
        'gucci', 'prada', 'michael kors', 'clarks', 'ecco'
    ]
};

export const deconstructTitle = (title) => {
    if (!title) return { gender: null, product_type: null, attributes: [], clean_query: "" };

    let processed = title.toLowerCase().trim();

    // 1. BRAND HANDLING (Strict Start-of-Title Stripping)
    for (const brand of DICTIONARIES.IGNORE_BRANDS) {
        if (processed.startsWith(brand)) {
            processed = processed.replace(brand, '').trim();
            break; 
        }
    }

    // 2. GENDER EXTRACTION
    let gender = null;
    for (const g of DICTIONARIES.GENDER) {
        if (processed.includes(g)) {
            gender = g;
            break;
        }
    }

    // 3. PRODUCT TYPE EXTRACTION (Strict Dictionary Match)
    let productType = null;
    for (const type of DICTIONARIES.PRODUCT_TYPES) {
        if (processed.includes(type)) {
            productType = type;
            break;
        }
    }

    // 4. ATTRIBUTE EXTRACTION (Optional)
    const attributes = [];
    for (const attr of DICTIONARIES.ATTRIBUTES) {
        if (processed.includes(attr)) {
            attributes.push(attr);
            if (attributes.length >= 2) break;
        }
    }

    // 5. CLEAN QUERY GENERATION
    // Rule: Gender + Product Type + 1-2 Attributes Max
    const queryParts = [];
    if (gender) queryParts.push(gender);
    if (productType) queryParts.push(productType);
    attributes.slice(0, 2).forEach(attr => queryParts.push(attr));

    return {
        gender,
        product_type: productType,
        attributes,
        clean_query: queryParts.join(' ').trim() || processed.split(' ').slice(0, 3).join(' ')
    };
};

/**
 * 🔒 VALIDATION UTILS
 */
export const validateMatch = (ebayData, cjData) => {
    // 🔒 HARD RULES (Deterministic Matching)
    // Both must have a detected product_type for high-precision validation
    if (!ebayData.product_type || !cjData.product_type) return false;

    // RULE: Category mismatch is a FATAL rejection
    if (ebayData.product_type !== cjData.product_type) return false;

    // RULE: Gender mismatch (unless unisex) is a FATAL rejection
    if (ebayData.gender && cjData.gender) {
        if (ebayData.gender !== cjData.gender && 
            ebayData.gender !== 'unisex' && 
            cjData.gender !== 'unisex') {
            return false;
        }
    }

    return true;
};
