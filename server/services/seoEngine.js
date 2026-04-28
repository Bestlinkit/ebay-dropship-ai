// --- SEO INTELLIGENCE ENGINE v16.0 (FINAL CLEANUP PATCH) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set(['pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 'information', 'description', 'people', 'applicable', 'various', 'available', 'type', 'standard', 'specifications']);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

const UNRELATED_PRODUCTS = new Set(['pbproduct', 'br', 'nbsp', 'description', 'information']);

const CATEGORY_LOCKED_MAP = {
    'skincare': {
        name: 'Health & Beauty > Skin Care > Body Scrubs',
        product_type: 'Body Scrub',
        benefits: ['Smooth Skin', 'Even Tone', 'Radiant Glow', 'Deep Clean'],
        outcomes: ['Silky Texture', 'Youthful Glow', 'Healthy Skin'],
        intent_keywords: ['exfoliating', 'hydrating', 'cleansing', 'moisturizing'],
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
    },
    'shoes': {
        name: 'Clothing, Shoes & Accessories > Men\'s Shoes > Casual Shoes',
        product_type: 'Shoes',
        benefits: ['Ergonomic', 'Lightweight', 'Breathable', 'Durable'],
        outcomes: ['Stylish Walk', 'Daily Comfort', 'Perfect Fit'],
        intent_keywords: ['comfortable', 'handmade', 'leather', 'walking'],
        fallback_tags: ["handmade men shoes", "comfortable leather footwear", "casual walking shoes", "durable mens sneakers", "stylish breathable shoes"]
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
 * Helper: Extract hard attributes from text for generic products
 */
function extractHardAttributes(text) {
    const attrs = { material: '', size: '', color: '', usage: '' };
    
    // Materials
    const materials = ['ceramic', 'glass', 'wood', 'metal', 'stainless steel', 'plastic', 'leather', 'cotton', 'polyester', 'nylon', 'silicone', 'aluminum', 'copper', 'linen', 'canvas'];
    const matMatch = materials.find(m => text.includes(m));
    if (matMatch) attrs.material = matMatch.charAt(0).toUpperCase() + matMatch.slice(1);

    // Size/Capacity (e.g., 300ml, 12oz, 15cm)
    const sizeMatch = text.match(/\b(\d+(?:\.\d+)?\s*(ml|oz|cm|inch|mm|kg|g|lb|L|liter|gallon|fl oz))\b/i);
    if (sizeMatch) attrs.size = sizeMatch[1].toLowerCase();

    // Color
    const colors = ['red', 'blue', 'green', 'black', 'white', 'pink', 'gold', 'silver', 'brown', 'grey', 'gray', 'purple', 'yellow', 'orange', 'beige', 'clear', 'transparent', 'multicolor'];
    const colMatch = colors.find(c => text.includes(` ${c} `) || text.startsWith(`${c} `) || text.endsWith(` ${c}`));
    if (colMatch) attrs.color = colMatch.trim().charAt(0).toUpperCase() + colMatch.trim().slice(1);
    
    // Usage
    const usages = ['home', 'office', 'outdoor', 'kitchen', 'bathroom', 'travel', 'car', 'garden', 'gym', 'sports', 'party'];
    const usageMatch = usages.filter(u => text.includes(u)).slice(0, 2);
    if (usageMatch.length > 0) {
        attrs.usage = usageMatch.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(' & ');
    }
    
    return attrs;
}

/**
 * 1. PRODUCT CLASSIFICATION
 */
function classifyProduct(title, description, forcedCategoryName = null) {
    // 🛡️ TYPE GUARD (Requirement 1)
    const safeTitle = typeof title === 'string' ? title : String(title || "");
    const safeDescription = typeof description === 'string' ? description : String(description || "");
    const safeForced = typeof forcedCategoryName === 'string' ? forcedCategoryName : null;

    const text = (safeTitle + " " + (safeDescription || "")).toLowerCase();
    
    let matchedKey = null;
    
    // Use forcedCategoryName if provided to map to our internal config keys
    if (safeForced) {
        const lowerForced = safeForced.toLowerCase();
        if (lowerForced.includes('skin') || lowerForced.includes('beauty') || lowerForced.includes('bath')) matchedKey = "skincare";
        else if (lowerForced.includes('jewelry') || lowerForced.includes('neck') || lowerForced.includes('ring')) matchedKey = "jewelry";
        else if (lowerForced.includes('shoe') || lowerForced.includes('footwear')) matchedKey = "shoes";
        else if (lowerForced.includes('shirt') || lowerForced.includes('cloth') || lowerForced.includes('apparel')) matchedKey = "apparel";
    } else {
        if (text.includes('scrub') || text.includes('skin') || text.includes('turmeric')) matchedKey = "skincare";
        else if (text.includes('necklace') || text.includes('ring') || text.includes('jewelry') || text.includes('pendant')) matchedKey = "jewelry";
        else if (text.includes('shoe') || text.includes('sneaker') || text.includes('boot') || text.includes('footwear')) matchedKey = "shoes";
        else if (text.includes('shirt') || text.includes('apparel') || text.includes('clothing')) matchedKey = "apparel";
    }

    const primaryWords = safeTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
        .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w)).slice(0, 3);
        
    // Lock product identity (Requirement 1)
    let product_type;
    if (safeForced) {
        product_type = safeForced.split('>').pop().trim();
    } else {
        product_type = matchedKey ? CATEGORY_LOCKED_MAP[matchedKey].product_type : (primaryWords.length > 0 ? primaryWords.join(' ') : "Item");
    }
    const typeLower = product_type.toLowerCase();

    let config;
    if (matchedKey) {
        config = CATEGORY_LOCKED_MAP[matchedKey];
    } else {
        // Extract Hard Attributes for GENERIC_CONFIG (Requirement 3)
        const attrs = extractHardAttributes(text);
        const keyAttributes = [attrs.material, attrs.color, attrs.size].filter(Boolean);
        const attributeStr = keyAttributes.length > 0 ? keyAttributes.join(' ') : 'Premium';
        const usageStr = attrs.usage ? `for ${attrs.usage}` : 'for Daily Use';
        
        config = {
            name: safeForced || "Uncategorized",
            product_type: product_type,
            benefits: keyAttributes.length > 0 ? keyAttributes : ['High Quality', 'Durable'],
            outcomes: [usageStr, 'Perfect Gift', 'Great Value'],
            intent_keywords: keyAttributes.map(k => k.toLowerCase()).concat(['new']),
            fallback_tags: [`${attributeStr.toLowerCase()} ${typeLower}`, `${typeLower} ${usageStr.toLowerCase()}`].map(t => t.substring(0, 80)),
            is_dynamic: true,
            extracted_attrs: attrs
        };
    }

    const primaryKeyword = primaryWords.length > 0 ? primaryWords.join(' ') : config.product_type.toLowerCase();

    return {
        product_type: product_type,
        category: safeForced || config.name,
        benefits: config.benefits,
        config: config,
        primary_keyword: primaryKeyword,
        confidence: matchedKey ? 1.0 : 0.8
    };
}

/**
 * 2. KEYWORD EXTRACTION
 */
function extractKeywords(title, description) {
    // 🛡️ TYPE GUARD (Requirement 1)
    const safeTitle = typeof title === 'string' ? title : String(title || "");
    const safeDescription = typeof description === 'string' ? description : String(description || "");

    const text = (safeTitle + " " + (safeDescription || "")).toLowerCase();
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
    const intent = config.intent_keywords;
    const outcome = config.outcomes[0];
    
    let templates = [];

    if (product_type === "Body Scrub") {
        // Specialized Structure: [Function] + Body Scrub + [Benefit] + [Optional: Skin Care]
        templates = [
            `${intent[0]} Body Scrub ${benefits[0]} Skin Care`,
            `${intent[1]} Body Scrub for ${benefits[1]}`,
            `${intent[2]} Body Scrub - ${benefits[2]}`
        ];
    } else if (config.is_dynamic) {
        // Generic Structure: [Core Product Name] + [Key Attribute] + [Use Case]
        const attrs = config.extracted_attrs;
        const keyAttr = [attrs.material, attrs.color, attrs.size].filter(Boolean).join(' ');
        const useCase = attrs.usage ? `for ${attrs.usage}` : '';
        
        // Use primary keywords alongside product type
        const baseTitle = `${primary_keyword} ${product_type}`;
        
        templates = [
            `${baseTitle} ${keyAttr} ${useCase}`.trim().replace(/\s+/g, ' '),
            `${attrs.material || 'Quality'} ${baseTitle} ${attrs.size || ''} ${useCase}`.trim().replace(/\s+/g, ' '),
            `${baseTitle} - ${keyAttr || 'Premium'} ${useCase}`.trim().replace(/\s+/g, ' ')
        ];
    } else {
        templates = [
            `${primary_keyword} ${product_type} - ${intent[0]} & ${outcome}`,
            `${benefits[0]} ${primary_keyword} ${product_type} for ${outcome}`,
            `${primary_keyword} ${product_type} with ${benefits[1]} formula`
        ];
    }

    const type = product_type.toLowerCase();

    return templates.map((t, i) => {
        let text = deduplicateWords(t.replace(/\s+/g, ' ').trim());
        
        // Block-list: Must NOT start with "Bath Scrub Body"
        if (text.toLowerCase().startsWith("bath scrub body")) {
            text = text.replace(/Bath Scrub Body/i, "Exfoliating Body Scrub");
        }

        text = text.substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let score = 95 - (i * 3);
        
        // Strict Validation: Must include product type
        if (!capitalized.toLowerCase().includes(type)) score -= 30;
        
        // Must include 1 function keyword (skip for dynamic)
        if (!config.is_dynamic && intent && intent.length > 0) {
            const hasFunction = intent.some(f => capitalized.toLowerCase().includes(f));
            if (!hasFunction) score -= 20;
        }

        return { text: capitalized, score: score };
    });
}

/**
 * 4. TAG GENERATION (v16.0 Natural Buyer Queries)
 */
function generateTags(keywords, classification) {
    const { product_type, config } = classification;
    const finalTags = new Set();
    const type = product_type.toLowerCase();
    
    const candidateTags = [];

    // Build candidates from keywords and classification intent
    keywords.forEach(k => {
        config.intent_keywords.forEach(intent => {
            candidateTags.push(`${intent} ${k} ${type}`);
            candidateTags.push(`${k} ${type}`);
            candidateTags.push(`${intent} ${type}`);
        });
    });

    // Add fallback tags
    config.fallback_tags.forEach(t => candidateTags.push(t.toLowerCase()));

    for (let tag of candidateTags) {
        if (finalTags.size >= 10) break;

        // 1. Lowercase
        tag = tag.toLowerCase().trim();

        // 2. Word Count (2-4 words)
        const words = tag.split(/\s+/);
        if (words.length < 2 || words.length > 4) continue;

        // 3. Reject Filler/Garbage
        if (words.some(w => GARBAGE_TOKENS.has(w))) continue;

        // 4. Deduplicate words within tag
        const uniqueWords = Array.from(new Set(words));
        if (uniqueWords.length !== words.length) continue; // Reject if duplicated words in tag

        // 5. Human Search Test (Heuristic: Must contain product type or key intent)
        const hasCoreNoun = tag.includes(type);
        if (!hasCoreNoun) continue;

        // 6. Global Similarity Filter (Remove mirrored or overly similar tags)
        const sortedTag = uniqueWords.sort().join(' ');
        let isDuplicate = false;
        for (let existing of finalTags) {
            const existingSorted = existing.split(' ').sort().join(' ');
            if (existingSorted === sortedTag) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            finalTags.add(tag);
        }
    }

    return Array.from(finalTags).slice(0, 8);
}

/**
 * 5. DESCRIPTION
 */
function generateDescription(html, classification) {
    const { product_type, category, config } = classification;
    let output = `Product Overview:\nThis ${config.is_dynamic ? 'high-quality' : 'professional'} ${product_type} is engineered for ${config.is_dynamic ? 'daily use' : 'high-performance results'}.\n\n`;
    
    if (config.is_dynamic) {
        const attrs = config.extracted_attrs;
        const features = [];
        if (attrs.material) features.push(`Made with durable ${attrs.material}`);
        if (attrs.size) features.push(`Convenient size/capacity: ${attrs.size}`);
        if (attrs.color) features.push(`Color profile: ${attrs.color}`);
        if (attrs.usage) features.push(`Ideal for ${attrs.usage}`);
        if (features.length === 0) features.push('Premium quality construction', 'Versatile design');
        
        output += `Key Features:\n- ${features.join('\n- ')}\n\n`;
        output += `Ideal For:\nPerfect for daily use and various applications.\n\n`;
    } else {
        output += `Key Benefits:\n- ${classification.benefits.join('\n- ')}\n\n`;
        output += `How to Use:\nApply to target area. Massage thoroughly. Rinse or remove as directed.\n\n`;
    }
    
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
    const intentKeywords = config.intent_keywords;

    // 1. Strict Title Validation
    const titlesValid = output.titles.every(t => {
        const lower = t.text.toLowerCase();
        const hasType = lower.includes(type);
        const hasIntent = intentKeywords.some(ik => lower.includes(ik));
        return hasType && hasIntent;
    });

    // 2. Strict Tag Validation
    const tagsValid = output.tags.every(tag => {
        const words = tag.split(' ');
        const isCorrectLength = words.length >= 2 && words.length <= 4;
        const noGarbage = !words.some(w => GARBAGE_TOKENS.has(w.toLowerCase()));
        const isLowercase = tag === tag.toLowerCase();
        return isCorrectLength && noGarbage && isLowercase;
    }) && output.tags.length >= 5;

    if (!titlesValid || !tagsValid) {
        console.warn("⚠️ SEO VALIDATION FAILED - TRIGGERING RECOVERY");
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
