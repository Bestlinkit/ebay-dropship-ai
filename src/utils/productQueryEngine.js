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
    if (!title) return { 
        gender: "unisex", 
        product_type: null, 
        attributes: [], 
        queries: { strict: "", expanded: "", broad: "" } 
    };

    let processed = title.toLowerCase().trim();

    // 1. BRAND HANDLING (Strict Start-of-Title Stripping)
    for (const brand of DICTIONARIES.IGNORE_BRANDS) {
        if (processed.startsWith(brand)) {
            processed = processed.replace(brand, '').trim();
            break; 
        }
    }

    // 2. GENDER EXTRACTION (Default: Unisex)
    let gender = "unisex";
    for (const g of DICTIONARIES.GENDER) {
        if (processed.includes(g)) {
            gender = g;
            break;
        }
    }

    // 3. PRODUCT TYPE EXTRACTION
    let productType = null;
    for (const type of DICTIONARIES.PRODUCT_TYPES) {
        if (processed.includes(type)) {
            productType = type;
            break;
        }
    }

    // 4. ATTRIBUTE EXTRACTION
    const attributes = [];
    for (const attr of DICTIONARIES.ATTRIBUTES) {
        if (processed.includes(attr)) {
            attributes.push(attr);
            if (attributes.length >= 3) break;
        }
    }

    // 5. QUERY EXPANSION LAYER (v4.5)
    const queries = {
        strict: `${gender === 'unisex' ? '' : gender} ${productType || ''}`.trim(),
        expanded: `${gender === 'unisex' ? '' : gender} ${attributes[0] || ''} ${productType || ''}`.trim(),
        broad: `${attributes.slice(0, 2).join(' ')} ${productType || ''}`.trim()
    };

    // Fallback if type extraction failed
    if (!productType) {
        const words = processed.split(' ').slice(0, 3);
        queries.strict = words.join(' ');
        queries.expanded = words.join(' ');
        queries.broad = words.join(' ');
    }

    return {
        gender,
        product_type: productType,
        attributes,
        queries
    };
};

/**
 * 🔒 VALIDATION UTILS (v4.6 - Broad Discovery)
 */
export const validateMatch = (ebayData, cjData) => {
    if (!ebayData || !cjData) return false;
    
    // v4.6 Broad Intent Discovery (Non-Destructive)
    // We allow all candidates to pass through to the UI.
    // The alignmentScore will handle ranking.
    return true;
};
