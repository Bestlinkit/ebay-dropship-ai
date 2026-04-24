// --- SEO INTELLIGENCE RECOVERY ENGINE v14.0 (ZERO-BLOCK PIPELINE) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set(['pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 'information', 'description']);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

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
        if (w.length > 3 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w) && !MISLEADING_TOKENS.has(w) && !seen.has(w)) {
            keywords.push(w);
            seen.add(w);
        }
    });

    return keywords.slice(0, 10);
}

/**
 * 3. TITLE GENERATION
 */
function generatePremiumTitles(keywords, classification) {
    const { primary_keyword, benefits, config } = classification;
    const outcome = config.outcomes[0];
    
    const templates = [
        { t: `${primary_keyword} - ${benefits[0]} & ${outcome}`, s: 98 },
        { t: `${benefits[1]} ${primary_keyword} for ${outcome}`, s: 95 },
        { t: `${primary_keyword} with ${benefits[2]} Formula`, s: 92 }
    ];

    return templates.map(obj => {
        const text = obj.t.replace(/\s+/g, ' ').trim().substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { text: capitalized, score: obj.s };
    });
}

/**
 * 4. TAG GENERATION (RECOVERY AWARE)
 */
function generateTags(keywords, classification) {
    const { primary_keyword } = classification;
    const tags = new Set();
    
    keywords.forEach(k => {
        if (tags.size < 8 && !primary_keyword.includes(k)) {
            const safeTag = `${k} ${primary_keyword}`.trim();
            if (safeTag.split(' ').length >= 2) tags.add(safeTag);
        }
    });

    if (tags.size < 5) {
        classification.benefits.forEach(b => {
            if (tags.size < 8) tags.add(`${b.toLowerCase()} ${primary_keyword}`);
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
 * 6. RECOVERY SYSTEM (v14.0)
 */
function recoverSEO(output, classification) {
    console.log("🚀 SEO RECOVERY ACTIVE (v14.0)");
    const { primary_keyword, config } = classification;
    const primary = primary_keyword.toLowerCase();

    // 1. Title Recovery
    const typeWord = primary.split(' ')[0];
    output.titles = output.titles.map((t, i) => {
        if (!t.text.toLowerCase().includes(typeWord)) {
            const fallbackT = `${classification.benefits[i % 3]} ${primary} for ${config.outcomes[0]}`;
            return { text: fallbackT.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), score: 90 - (i * 2) };
        }
        return t;
    });

    // 2. Tag Recovery (Auto Clean + Rebuild)
    let cleanedTags = output.tags.filter(t => {
        const words = t.split(' ');
        const isMisleading = words.some(w => MISLEADING_TOKENS.has(w));
        return words.length >= 2 && !isMisleading;
    });

    if (cleanedTags.length < 5) {
        const rebuiltTags = config.fallback_tags.map(t => t.toLowerCase());
        cleanedTags = Array.from(new Set([...cleanedTags, ...rebuiltTags])).slice(0, 8);
    }

    output.tags = cleanedTags;
    return output;
}

/**
 * 7. FINAL VALIDATION GATE (ZERO-BLOCK)
 */
function validateAndRecover(output, classification) {
    const primary = classification.primary_keyword.toLowerCase();
    const typeWord = primary.split(' ')[0];

    // Validation Check
    const titlesValid = output.titles.every(t => t.text.toLowerCase().includes(typeWord));
    const tagsValid = output.tags.length >= 5 && output.tags.every(t => {
        const words = t.split(' ');
        return words.length >= 2 && !words.some(w => MISLEADING_TOKENS.has(w));
    });

    if (!titlesValid || !tagsValid) {
        return { 
            valid: true, // Always return true for Zero-Block pipeline
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
