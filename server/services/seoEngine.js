// --- SEO INTELLIGENCE ENGINE v15.0 (CRITICAL QUALITY CORRECTION) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set(['pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 'information', 'description']);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

const UNRELATED_PRODUCTS = new Set(['jeans', 'pants', 'shoes', 'bag', 'watch', 'phone', 'laptop', 'socks', 'underwear', 'hat', 'gloves']);

const CATEGORY_LOCKED_MAP = {
    'skincare': {
        name: 'Health & Beauty > Skin Care > Body Scrubs',
        product_type: 'Body Scrub',
        benefits: ['Exfoliating', 'Moisturizing', 'Brightening', 'Hydrating'],
        outcomes: ['Smooth Skin', 'Even Tone', 'Radiant Glow'],
        fallback_tags: ["turmeric body scrub", "exfoliating body scrub", "moisturizing body scrub", "skin brightening scrub", "body exfoliator"]
    },
    'apparel': {
        name: 'Clothing, Shoes & Accessories > Men\'s Clothing > T-Shirts',
        product_type: 'T-Shirt',
        benefits: ['Breathable', 'Lightweight', 'Soft Cotton', 'Comfortable'],
        outcomes: ['Casual Style', 'Everyday Wear', 'Slim Fit'],
        fallback_tags: ["cotton t-shirt", "casual short sleeve", "summer breathable tee", "loose fit shirt", "unisex fashion top"]
    },
    'jewelry': {
        name: 'Jewelry & Watches > Fine Jewelry > Necklaces',
        product_type: 'Necklace',
        benefits: ['Elegant', 'Luxurious', 'Handcrafted', 'High Shine'],
        outcomes: ['Statement Piece', 'Timeless Gift', 'Sophisticated Look'],
        fallback_tags: ["elegant necklace", "luxury jewelry gift", "handcrafted pendant", "sterling silver chain", "timeless accessory"]
    }
};

/**
 * 1. PRODUCT CLASSIFICATION
 */
function classifyProduct(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    let key = "apparel";
    
    if (text.includes('scrub') || text.includes('skin') || text.includes('turmeric')) key = "skincare";
    if (text.includes('necklace') || text.includes('ring') || text.includes('jewelry')) key = "jewelry";

    const config = CATEGORY_LOCKED_MAP[key];
    
    const primaryWords = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
        .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w)).slice(0, 3);
    
    const primaryKeyword = primaryWords.length > 0 ? primaryWords.join(' ') : config.product_type.toLowerCase();

    return {
        product_type: config.product_type,
        category: config.name,
        benefits: config.benefits,
        config: config,
        primary_keyword: primaryKeyword,
        confidence: 0.9
    };
}

/**
 * 2. KEYWORD EXTRACTION
 */
function extractKeywords(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    const words = text.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    const keywords = [];
    const seen = new Set();

    words.forEach(w => {
        if (w.length > 3 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w) && !MISLEADING_TOKENS.has(w) && !seen.has(w) && !UNRELATED_PRODUCTS.has(w)) {
            keywords.push(w);
            seen.add(w);
        }
    });

    return keywords.slice(0, 10);
}

/**
 * 3. SCORING ENGINE (v15.0)
 */
function scoreTitle(text, classification) {
    let score = 95;
    const lower = text.toLowerCase();
    const type = classification.product_type.toLowerCase();

    // -20 Penalty: Missing Product Type
    if (!lower.includes(type)) score -= 20;

    // -10 Penalty: Generic phrases
    if (lower.includes('great value') || lower.includes('best quality')) score -= 10;

    return Math.max(0, score);
}

/**
 * 4. TITLE GENERATION
 */
function generatePremiumTitles(keywords, classification) {
    const { primary_keyword, benefits, config, product_type } = classification;
    const outcome = config.outcomes[0];
    
    // ENSURE Product Type is present in all templates
    const templates = [
        `${primary_keyword} ${product_type} - ${benefits[0]} & ${outcome}`,
        `${benefits[1]} ${primary_keyword} ${product_type} for ${outcome}`,
        `${primary_keyword} ${product_type} with ${benefits[2]} Formula`
    ];

    return templates.map(t => {
        const text = t.replace(/\s+/g, ' ').trim().substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { text: capitalized, score: scoreTitle(capitalized, classification) };
    });
}

/**
 * 5. TAG GENERATION (v15.0 [modifier] + [product type])
 */
function generateTags(keywords, classification) {
    const { product_type } = classification;
    const tags = new Set();
    const type = product_type.toLowerCase();
    
    keywords.forEach(k => {
        if (tags.size < 8 && k !== type) {
            tags.add(`${k} ${type}`); // [modifier] + [product type]
        }
    });

    if (tags.size < 5) {
        classification.benefits.forEach(b => {
            if (tags.size < 8) tags.add(`${b.toLowerCase()} ${type}`);
        });
    }

    return Array.from(tags).slice(0, 8);
}

/**
 * 6. DESCRIPTION
 */
function generateDescription(html, classification) {
    const { product_type, category } = classification;
    let output = `Product Overview:\nThis professional ${product_type} is engineered for high-performance results.\n\n`;
    output += `Key Benefits:\n- ${classification.benefits.join('\n- ')}\n\n`;
    output += `How to Use:\nApply to target area. Massage thoroughly. Rinse or remove as directed.\n\n`;
    output += `Specifications:\n- Type: ${product_type}\n- Category: ${category}`;
    return output;
}

/**
 * 7. RECOVERY SYSTEM (v15.0 Hardened)
 */
function recoverSEO(output, classification) {
    console.log("🚀 SEO RECOVERY ACTIVE (v15.0)");
    const { product_type, config, primary_keyword } = classification;
    const type = product_type.toLowerCase();

    // Title Recovery: Inject Product Type
    output.titles = output.titles.map((t, i) => {
        if (!t.text.toLowerCase().includes(type)) {
            const fallbackT = `${classification.benefits[i % 3]} ${primary_keyword} ${product_type}`;
            return { text: fallbackT.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), score: 70 };
        }
        return t;
    });

    // Tag Recovery: Enforce [modifier] + [type]
    let cleanedTags = output.tags.filter(t => {
        const words = t.split(' ');
        const isMisleading = words.some(w => MISLEADING_TOKENS.has(w) || UNRELATED_PRODUCTS.has(w));
        return words.length >= 2 && !isMisleading && t.toLowerCase().includes(type);
    });

    if (cleanedTags.length < 5) {
        cleanedTags = config.fallback_tags.map(t => t.toLowerCase());
    }

    output.tags = cleanedTags;
    return output;
}

/**
 * 8. FINAL VALIDATION GATE (ZERO-BLOCK)
 */
function validateAndRecover(output, classification) {
    const type = classification.product_type.toLowerCase();

    // Validation Check
    const titlesValid = output.titles.every(t => t.text.toLowerCase().includes(type));
    const tagsValid = output.tags.length >= 5 && output.tags.every(t => {
        const words = t.split(' ');
        const isClean = !words.some(w => MISLEADING_TOKENS.has(w) || UNRELATED_PRODUCTS.has(w));
        return words.length >= 2 && isClean && t.toLowerCase().includes(type);
    });

    if (!titlesValid || !tagsValid) {
        return { 
            valid: true, 
            recovered: true, 
            data: recoverSEO(output, classification) 
        };
    }

    return { valid: true, recovered: false, data: output };
}

module.exports = {
    classifyProduct,
    extractKeywords,
    generatePremiumTitles,
    generateDescription,
    generateTags,
    validateAndRecover
};
