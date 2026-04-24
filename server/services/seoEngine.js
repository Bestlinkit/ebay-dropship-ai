// --- DETERMINISTIC SEO ENGINE v10.0 (PRODUCT-AWARE & CONTEXT-LOCKED) ---

/**
 * STOPWORDS: Remove non-converting filler words.
 */
const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'product information', 'description']);

/**
 * CATEGORY_LOCKED_MAP: Product Type -> { Category, Keywords }
 */
const CATEGORY_LOCKED_MAP = {
    'skincare': {
        name: 'Beauty & Personal Care',
        sub: 'Skin Care',
        leaf: 'Body Scrubs',
        synonyms: ['scrub', 'cream', 'lotion', 'mask', 'serum', 'exfoliator', 'cleanser'],
        attributes: ['moisturizing', 'brightening', 'exfoliating', 'organic', 'natural', 'turmeric']
    },
    'apparel': {
        name: 'Clothing, Shoes & Accessories',
        sub: 'Men\'s Clothing',
        leaf: 'T-Shirts',
        synonyms: ['t-shirt', 'tee', 'shirt', 'top', 'hoodie', 'jacket', 'pants'],
        attributes: ['cotton', 'polyester', 'plus size', 'slim fit', 'oversized', 'casual']
    },
    'jewelry': {
        name: 'Jewelry & Watches',
        sub: 'Fine Jewelry',
        leaf: 'Necklaces & Pendants',
        synonyms: ['necklace', 'pendant', 'ring', 'bracelet', 'earrings'],
        attributes: ['gold', 'silver', 'diamond', 'luxury', 'gift', 'handmade']
    },
    'electronics': {
        name: 'Consumer Electronics',
        sub: 'Cell Phones & Accessories',
        leaf: 'Cell Phones & Smartphones',
        synonyms: ['phone', 'smartphone', 'laptop', 'tablet', 'headphones', 'speaker'],
        attributes: ['wireless', 'bluetooth', 'portable', 'fast charging', 'high definition']
    }
};

/**
 * 1. HARD PRODUCT TYPE DETECTION
 */
function detectProductContext(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    
    // Check for Skincare
    if (text.includes('scrub') || text.includes('skin') || text.includes('cream') || text.includes('lotion') || text.includes('turmeric')) {
        return { type: 'skincare', sub: text.includes('scrub') ? 'body scrub' : 'skincare' };
    }
    
    // Check for Jewelry
    if (text.includes('necklace') || text.includes('ring') || text.includes('gold') || text.includes('jewelry')) {
        return { type: 'jewelry', sub: 'jewelry' };
    }

    // Check for Electronics
    if (text.includes('phone') || text.includes('bluetooth') || text.includes('wireless') || text.includes('battery')) {
        return { type: 'electronics', sub: 'electronics' };
    }

    // Default to Apparel (as it's the largest category)
    return { type: 'apparel', sub: text.includes('t-shirt') ? 't-shirt' : 'apparel' };
}

/**
 * 2. SANITIZATION (CLEAN TEXT)
 */
function sanitizeText(text) {
    if (!text) return "";
    let clean = text.replace(/<[^>]*>?/gm, ' ');
    clean = clean.replace(/&nbsp;|\bbr\b|\bnbsp\b|&amp;|&gt;|&lt;|http\S+|\bundefined\b|\bnull\b|\bnan\b|\bpbproduct\b/gi, ' ');
    return clean.replace(/\s+/g, ' ').trim();
}

/**
 * 3. KEYWORD EXTRACTION (NO MEMORY LEAK)
 */
function extractKeywords(title, description) {
    const context = detectProductContext(title, description);
    const text = (title + " " + (description || "")).toLowerCase();
    const sanitized = sanitizeText(text);
    const words = sanitized.split(/\s+/);
    
    const keywords = [];
    const seen = new Set();

    words.forEach(word => {
        let w = word.replace(/[^a-z0-9-]/g, '');
        if (w.length > 3 && !STOPWORDS.has(w) && !seen.has(w)) {
            keywords.push(w);
            seen.add(w);
        }
    });

    // Add multi-word keywords for specific context
    if (context.type === 'skincare') {
        if (text.includes('body scrub')) keywords.unshift('body scrub');
        if (text.includes('skin brightening')) keywords.unshift('skin brightening');
        if (text.includes('turmeric')) keywords.unshift('turmeric');
    }

    return { keywords, context };
}

/**
 * 4. TITLE GENERATION (PRODUCT-AWARE)
 */
function generateDeterministicTitles(keywords, context) {
    if (keywords.length === 0) return ["Professional Product Listing"];

    const type = context.sub.toLowerCase();
    const typeDisplay = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Filter out keywords that are part of the type to avoid "T-Shirt T-Shirt"
    const uniqueAttrs = keywords.filter(k => k.toLowerCase() !== type && !type.includes(k.toLowerCase()));
    
    const mainAttr = uniqueAttrs[0] ? uniqueAttrs[0].charAt(0).toUpperCase() + uniqueAttrs[0].slice(1) : "";
    const secondaryAttr = uniqueAttrs[1] ? uniqueAttrs[1].charAt(0).toUpperCase() + uniqueAttrs[1].slice(1) : "";
    
    // Pattern: [Brand/Key Ingredient] [Product Type] [Benefit] [Use Case]
    const title1 = `${mainAttr} ${secondaryAttr} ${typeDisplay} Professional Grade`.replace(/\s+/g, ' ').trim().substring(0, 80);
    const title2 = `${typeDisplay} - ${uniqueAttrs.slice(0, 4).join(' ')}`.replace(/\s+/g, ' ').trim().substring(0, 80);
    const title3 = `${mainAttr} ${typeDisplay} for Daily Use`.replace(/\s+/g, ' ').trim().substring(0, 80);

    return [title1, title2, title3].map(t => t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
}

/**
 * 5. TAG GENERATION
 */
function generateTags(keywords, context) {
    const tags = new Set();
    const subType = context.sub.toLowerCase();

    // Core tags
    tags.add(subType);
    
    if (keywords.length > 0) {
        const k0 = keywords[0].toLowerCase();
        if (k0 !== subType && !subType.includes(k0)) {
            tags.add(`${k0} ${subType}`);
        } else {
            tags.add(k0);
        }
    }
    
    if (keywords.length > 1) {
        const k1 = keywords[1].toLowerCase();
        if (k1 !== subType && !subType.includes(k1)) {
            tags.add(`${k1} ${subType}`);
        }
    }
    
    // Attribute tags
    keywords.slice(0, 10).forEach(k => {
        const lowK = k.toLowerCase();
        if (lowK !== subType) tags.add(lowK);
    });

    return Array.from(tags).slice(0, 12).map(t => t.toLowerCase());
}

/**
 * 6. DESCRIPTION CLEANING (RAW TEXT)
 */
function cleanDescription(html, context) {
    if (!html) return "Product Overview:\nInformation coming soon.";

    let text = sanitizeText(html);
    
    // Sections
    const overview = `This ${context.sub} is designed for high-performance results and professional quality.`;
    
    const benefits = text.split('.').filter(s => s.length > 20).slice(0, 4);
    const use = "Apply evenly to the desired area. Massage gently in circular motions. Rinse thoroughly with warm water.";
    
    let output = `Product Overview:\n${overview}\n\n`;
    output += `Key Benefits:\n${benefits.map(b => `- ${b.trim()}`).join('\n')}\n\n`;
    output += `How to Use:\n${use}\n\n`;
    output += `Specifications:\n- Type: ${context.sub}\n- Category: ${CATEGORY_LOCKED_MAP[context.type]?.leaf || 'General'}`;

    return output;
}

/**
 * 7. VALIDATION & FALLBACK
 */
function validateSEO(data, context) {
    const type = context.sub.toLowerCase();
    return data.titles.every(t => t.toLowerCase().includes(type.split(' ')[0]));
}

module.exports = {
    detectProductContext,
    extractKeywords,
    generateDeterministicTitles,
    generateTags,
    cleanDescription,
    validateSEO,
    sanitizeText
};
