// --- DETERMINISTIC SEO ENGINE v11.0 (PREMIUM MARKET INTELLIGENCE) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated']);

const CATEGORY_LOCKED_MAP = {
    'skincare': {
        name: 'Health & Beauty > Skin Care > Body Scrubs',
        benefits: ['Smooth Skin', 'Even Skin Tone', 'Glowing Skin', 'Moisturizing', 'Exfoliating'],
        outcomes: ['Reveals Radiant Skin', 'Deep Cleansing Action', 'Hydrating Formula']
    },
    'apparel': {
        name: 'Clothing, Shoes & Accessories > Men\'s Clothing > T-Shirts',
        benefits: ['All-Day Comfort', 'Breathable Fit', 'Classic Style', 'Soft Material'],
        outcomes: ['Perfect for Summer', 'Casual Everyday Wear', 'Versatile Look']
    },
    'jewelry': {
        name: 'Jewelry & Watches > Fine Jewelry > Necklaces',
        benefits: ['Elegant Design', 'High Shine', 'Luxury Gift', 'Handmade Detail'],
        outcomes: ['Statement Piece', 'Timeless Beauty', 'Sophisticated Style']
    }
};

/**
 * STEP 1: PRODUCT CLASSIFICATION
 */
function classifyProduct(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    let type = "";
    let confidence = 0;

    if (text.includes('scrub') || text.includes('skin') || text.includes('turmeric')) {
        type = "Body Scrub";
        confidence = 0.95;
    } else if (text.includes('t-shirt') || text.includes('tee') || text.includes('shirt')) {
        type = "T-Shirt";
        confidence = 0.95;
    } else if (text.includes('necklace') || text.includes('gold') || text.includes('ring')) {
        type = "Jewelry";
        confidence = 0.9;
    } else {
        type = "Unknown";
        confidence = 0.3;
    }

    return {
        product_type: type,
        category: CATEGORY_LOCKED_MAP[type.toLowerCase().replace(' ', '')]?.name || "Miscellaneous",
        audience: text.includes('women') ? 'Women' : (text.includes('men') ? 'Men' : 'Unisex'),
        use_case: text.includes('summer') ? 'Summer' : (text.includes('party') ? 'Occasion' : 'Daily'),
        confidence
    };
}

/**
 * STEP 2: KEYWORD EXTRACTION (STRICT)
 */
function extractKeywords(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    const words = text.replace(/[^a-z0-9 ]/g, '').split(/\s+/);
    const keywords = [];
    const seen = new Set();

    words.forEach(w => {
        if (w.length > 3 && !STOPWORDS.has(w) && !seen.has(w) && !w.match(/img|url|http|br|nbsp/)) {
            keywords.push(w);
            seen.add(w);
        }
    });

    return keywords.slice(0, 10);
}

/**
 * STEP 3 & 4: TITLE GENERATION & VALIDATION
 */
function generatePremiumTitles(keywords, classification) {
    const { product_type, audience, use_case } = classification;
    const type = product_type;
    const attr1 = keywords[0] || "";
    const attr2 = keywords[1] || "";
    
    // Benefit-driven outcomes
    const contextMap = CATEGORY_LOCKED_MAP[type.toLowerCase().replace(' ', '')] || { benefits: ["Quality"], outcomes: ["Great Value"] };
    const benefit = contextMap.benefits[0];
    const outcome = contextMap.outcomes[0];

    const templates = [
        `${attr1} ${type} for ${benefit} & ${outcome}`,
        `${type} - ${attr1} ${attr2} for ${audience} ${use_case} Use`,
        `${benefit} ${attr1} ${type} with ${outcome}`
    ];

    const titles = templates.map(t => {
        const text = t.replace(/\s+/g, ' ').trim().substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        // Scoring (Simplified for deterministic engine)
        let score = 80;
        if (capitalized.toLowerCase().includes(type.toLowerCase().split(' ')[0])) score += 10;
        if (capitalized.length > 50) score += 5;
        
        return { text: capitalized, score };
    });

    // Final Validation
    return titles.filter(t => t.text.toLowerCase().includes(type.toLowerCase().split(' ')[0]));
}

/**
 * STEP 6: DESCRIPTION (RAW TEXT ONLY)
 */
function generateDescription(html, classification, keywords) {
    const { product_type } = classification;
    const text = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    
    let output = `Product Overview:\nThis ${product_type} is engineered for professional results and lasting quality.\n\n`;
    output += `Key Benefits:\n- ${keywords.slice(0, 3).join(' / ')} Enhancements\n- Premium Ingredient Profile\n- Market-Leading Performance\n\n`;
    output += `How to Use:\nApply as needed for optimal results. Follow standard safety guidelines.\n\n`;
    output += `Specifications:\n- Type: ${product_type}\n- Category: ${classification.category}\n- Keywords: ${keywords.slice(0, 5).join(', ')}`;

    return output;
}

/**
 * STEP 7: TAG GENERATION
 */
function generateTags(keywords) {
    const tags = new Set();
    keywords.forEach(k => {
        if (tags.size < 8) tags.add(k.toLowerCase());
    });
    return Array.from(tags);
}

module.exports = {
    classifyProduct,
    extractKeywords,
    generatePremiumTitles,
    generateDescription,
    generateTags
};
