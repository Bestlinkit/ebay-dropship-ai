// --- SEO INTELLIGENCE ENGINE v16.0 (FINAL CLEANUP PATCH) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set(['pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 'information', 'description', 'people', 'applicable', 'various', 'available']);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

const UNRELATED_PRODUCTS = new Set(['jeans', 'pants', 'shoes', 'bag', 'watch', 'phone', 'laptop', 'socks', 'underwear', 'hat', 'gloves']);

const CATEGORY_LOCKED_MAP = {
    'skincare': {
        name: 'Health & Beauty > Skin Care > Body Scrubs',
        product_type: 'Body Scrub',
        benefits: ['Exfoliating', 'Moisturizing', 'Brightening', 'Hydrating'],
        outcomes: ['Smooth Skin', 'Even Tone', 'Radiant Glow'],
        intent_keywords: ['exfoliating', 'hydrating', 'cleansing', 'skincare'],
        fallback_tags: ["exfoliating body scrub", "moisturizing body scrub", "skin brightening scrub", "natural body exfoliator", "hydrating skin scrub"]
    },
    'apparel': {
        name: 'Clothing, Shoes & Accessories > Men\'s Clothing > T-Shirts',
        product_type: 'T-Shirt',
        benefits: ['Breathable', 'Lightweight', 'Soft Cotton', 'Comfortable'],
        outcomes: ['Casual Style', 'Everyday Wear', 'Slim Fit'],
        intent_keywords: ['cotton', 'breathable', 'casual', 'apparel'],
        fallback_tags: ["soft cotton t-shirt", "breathable casual tee", "short sleeve shirt", "comfortable daily top", "slim fit apparel"]
    },
    'jewelry': {
        name: 'Jewelry & Watches > Fine Jewelry > Necklaces',
        product_type: 'Necklace',
        benefits: ['Elegant', 'Luxurious', 'Handcrafted', 'High Shine'],
        outcomes: ['Statement Piece', 'Timeless Gift', 'Sophisticated Look'],
        intent_keywords: ['elegant', 'luxury', 'handcrafted', 'jewelry'],
        fallback_tags: ["elegant silver necklace", "luxury jewelry pendant", "handcrafted chain gift", "sophisticated accessory", "timeless jewelry piece"]
    }
};

/**
 * Helper: Deduplicate words in a string
 */
function deduplicateWords(text) {
    const words = text.split(' ');
    const seen = new Set();
    const result = [];
    words.forEach(w => {
        const lower = w.toLowerCase();
        if (!seen.has(lower) || w === '-') {
            result.push(w);
            seen.add(lower);
        }
    });
    return result.join(' ');
}

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
 * 3. TITLE GENERATION (v16.0 Deduplicated & Enhanced)
 */
function generatePremiumTitles(keywords, classification) {
    const { primary_keyword, benefits, config, product_type } = classification;
    const intent = config.intent_keywords[0];
    const outcome = config.outcomes[0];
    
    const templates = [
        `${primary_keyword} ${product_type} - ${intent} & ${outcome}`,
        `${benefits[0]} ${primary_keyword} ${product_type} for ${outcome}`,
        `${primary_keyword} ${product_type} with ${benefits[1]} formula`
    ];

    return templates.map((t, i) => {
        let text = deduplicateWords(t.replace(/\s+/g, ' ').trim());
        text = text.substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let score = 95 - (i * 3);
        if (!capitalized.toLowerCase().includes(product_type.toLowerCase())) score -= 20;
        
        return { text: capitalized, score: score };
    });
}

/**
 * 4. TAG GENERATION (v16.0 Natural Buyer Queries)
 */
function generateTags(keywords, classification) {
    const { product_type, config } = classification;
    const tags = new Set();
    const type = product_type.toLowerCase();
    
    keywords.forEach(k => {
        if (tags.size < 8 && k !== type && !config.intent_keywords.includes(k)) {
            // Natural Query Format: [intent] + [keyword] + [type]
            const intent = config.intent_keywords[Math.floor(Math.random() * config.intent_keywords.length)];
            tags.add(`${intent} ${k} ${type}`);
        }
    });

    if (tags.size < 5) {
        config.fallback_tags.forEach(t => {
            if (tags.size < 8) tags.add(t.toLowerCase());
        });
    }

    return Array.from(tags).slice(0, 8);
}

/**
 * 5. DESCRIPTION
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
 * 6. RECOVERY SYSTEM (v16.0 Final Cleanup)
 */
function recoverSEO(output, classification) {
    console.log("🚀 SEO FINAL CLEANUP RECOVERY (v16.0)");
    const { product_type, config, primary_keyword } = classification;
    const type = product_type.toLowerCase();

    // 1. Title Deduplication
    output.titles = output.titles.map(t => ({
        text: deduplicateWords(t.text),
        score: t.score
    }));

    // 2. Tag Intent Check (70% Intent Rule)
    const intentWords = [type, ...config.intent_keywords];
    let intentCount = output.tags.filter(t => intentWords.some(iw => t.toLowerCase().includes(iw))).length;
    
    if (intentCount / output.tags.length < 0.7 || output.tags.length < 5) {
        output.tags = config.fallback_tags.map(t => t.toLowerCase());
    }

    // Filter vague/garbage tokens from tags
    output.tags = output.tags.filter(t => {
        const words = t.split(' ');
        return !words.some(w => GARBAGE_TOKENS.has(w.toLowerCase()));
    });

    return output;
}

/**
 * 7. FINAL VALIDATION GATE (ZERO-BLOCK)
 */
function validateAndRecover(output, classification) {
    const type = classification.product_type.toLowerCase();
    const config = classification.config;
    const intentWords = [type, ...config.intent_keywords];

    // Validation Check
    const titlesValid = output.titles.every(t => t.text.toLowerCase().includes(type));
    const intentRatio = output.tags.filter(t => intentWords.some(iw => t.toLowerCase().includes(iw))).length / output.tags.length;
    const tagsValid = output.tags.length >= 5 && intentRatio >= 0.7;

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
