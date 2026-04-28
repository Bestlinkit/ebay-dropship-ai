// --- SEO INTELLIGENCE ENGINE v17.0 (STRICT MODE) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set([
    'pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 
    'information', 'description', 'people', 'applicable', 'various', 'available', 
    'type', 'standard', 'specifications', 'simple', 'style', 'transparent', 
    'fashion', 'creative', 'modern', 'new', 'beautiful', 'cute', 'mini', 'portable', 'hot', 'style', 'design'
]);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

const UNRELATED_PRODUCTS = new Set(['pbproduct', 'br', 'nbsp', 'description', 'information']);

/**
 * 6. DEDUPLICATION: Remove repeated words globally (allowing prepositions)
 */
function deduplicateWords(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const seen = new Set();
    const result = [];
    const allowRepeat = new Set(['for', 'and', '&', '-', 'with', 'to', 'in', 'of']);
    
    for (let w of words) {
        const lower = w.toLowerCase();
        if (!seen.has(lower) || allowRepeat.has(lower)) {
            result.push(w);
            seen.add(lower);
        }
    }
    return result.join(' ');
}

/**
 * Helper: Extract hard attributes from text for products
 */
function extractHardAttributes(text) {
    const attrs = { material: '', size: '', color: '', usage: '' };
    
    const materials = ['ceramic', 'glass', 'wood', 'metal', 'stainless steel', 'plastic', 'leather', 'cotton', 'polyester', 'nylon', 'silicone', 'aluminum', 'copper', 'linen', 'canvas'];
    const matMatch = materials.find(m => text.includes(m));
    if (matMatch) attrs.material = matMatch.charAt(0).toUpperCase() + matMatch.slice(1);

    const sizeMatch = text.match(/\b(\d+(?:\.\d+)?\s*(ml|oz|cm|inch|mm|kg|g|lb|L|liter|gallon|fl oz))\b/i);
    if (sizeMatch) attrs.size = sizeMatch[1].toLowerCase();

    const colors = ['red', 'blue', 'green', 'black', 'white', 'pink', 'gold', 'silver', 'brown', 'grey', 'gray', 'purple', 'yellow', 'orange', 'beige', 'clear', 'transparent', 'multicolor'];
    const colMatch = colors.find(c => text.includes(` ${c} `) || text.startsWith(`${c} `) || text.endsWith(` ${c}`));
    if (colMatch) attrs.color = colMatch.trim().charAt(0).toUpperCase() + colMatch.trim().slice(1);
    
    const usages = ['home', 'office', 'outdoor', 'kitchen', 'bathroom', 'travel', 'car', 'garden', 'gym', 'sports', 'party'];
    const usageMatch = usages.filter(u => text.includes(u)).slice(0, 2);
    if (usageMatch.length > 0) {
        attrs.usage = usageMatch.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(' & ');
    }
    
    return attrs;
}

/**
 * 1. STRICT PRODUCT CLASSIFICATION
 */
function classifyProduct(title, description, forcedCategoryName = null, locked_product_type = null) {
    const safeTitle = typeof title === 'string' ? title : String(title || "");
    const safeDescription = typeof description === 'string' ? description : String(description || "");
    const safeForced = typeof forcedCategoryName === 'string' ? forcedCategoryName : null;

    const text = (safeTitle + " " + (safeDescription || "")).toLowerCase();
    
    // Extract PRIMARY_KEYWORD strictly from original title (e.g. "coffee mug")
    const primaryWords = safeTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
        .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w));
    
    const primaryKeyword = primaryWords.length > 0 ? primaryWords.slice(0, 3).join(' ') : safeTitle.substring(0, 30);
        
    // Lock product identity (IMMUTABLE)
    let product_type = locked_product_type;
    
    // Safety fallback just in case it wasn't passed
    if (!product_type) {
        if (safeForced) {
            product_type = safeForced.split('>').pop().trim();
        } else {
            product_type = primaryKeyword;
        }
    }

    // Extract Hard Attributes
    const attrs = extractHardAttributes(text);

    return {
        product_type: product_type,
        category: safeForced || "Uncategorized",
        primary_keyword: primaryKeyword,
        original_title: safeTitle,
        extracted_attrs: attrs
    };
}

/**
 * 2. KEYWORD EXTRACTION
 */
function extractKeywords(title, description) {
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
 * 3. STRICT TITLE GENERATION
 * Format: [Core Product] + [Key Attribute] + [Use Case]
 */
function generatePremiumTitles(keywords, classification) {
    const { primary_keyword, product_type, extracted_attrs } = classification;
    const attrs = extracted_attrs;
    
    // Core Product
    // Use the exact product type if available, otherwise the strictly extracted primary keyword
    let coreProduct = product_type;
    if (coreProduct.split(' ').length > 5) {
        coreProduct = primary_keyword; // Use concise keyword if fallback product_type is an entire messy title
    }

    const keyAttr = [attrs.material, attrs.color, attrs.size].filter(Boolean).join(' ');
    const useCase = attrs.usage ? `for ${attrs.usage}` : '';
    
    // Build titles following strict structure
    let templates = [
        `${coreProduct} ${keyAttr} ${useCase}`.trim().replace(/\s+/g, ' '),
        `${attrs.material || ''} ${coreProduct} ${attrs.size || ''} ${useCase}`.trim().replace(/\s+/g, ' '),
        `${coreProduct} - ${keyAttr || ''} ${useCase}`.trim().replace(/\s+/g, ' ')
    ].filter(t => t.length > 0);
    
    const primaryLower = primary_keyword.toLowerCase();

    return templates.map((t, i) => {
        // Run strict deduplication before output
        let text = deduplicateWords(t);
        text = text.substring(0, 80).trim();
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let score = 95 - (i * 3);
        
        return { text: capitalized, score: score };
    });
}

/**
 * 4. STRICT TAG GENERATION
 * Rule: Each tag must include product_type OR synonym. No word salad.
 */
function generateTags(keywords, classification) {
    const { product_type, extracted_attrs, primary_keyword } = classification;
    const finalTags = new Set();
    
    let coreProduct = product_type.toLowerCase();
    if (coreProduct.split(' ').length > 4) {
        coreProduct = primary_keyword.toLowerCase();
    }
    
    // High-value structured tags
    finalTags.add(coreProduct);
    if (extracted_attrs.material) finalTags.add(`${extracted_attrs.material} ${coreProduct}`.toLowerCase());
    if (extracted_attrs.size) finalTags.add(`${extracted_attrs.size} ${coreProduct}`.toLowerCase());
    if (extracted_attrs.color) finalTags.add(`${extracted_attrs.color} ${coreProduct}`.toLowerCase());
    if (extracted_attrs.usage) finalTags.add(`${coreProduct} for ${extracted_attrs.usage}`.toLowerCase());
    finalTags.add(`${coreProduct} set`);
    finalTags.add(`premium ${coreProduct}`);

    const resultTags = Array.from(finalTags)
        .map(t => deduplicateWords(t).trim())
        .filter(t => t.length > 0 && t.length <= 40);

    return resultTags.slice(0, 10);
}

/**
 * 5. DESCRIPTION GENERATION
 */
function generateDescription(html, classification) {
    const { product_type, category, extracted_attrs } = classification;
    let output = `Product Overview:\nThis high-quality ${product_type} is engineered for daily use.\n\n`;
    
    const features = [];
    if (extracted_attrs.material) features.push(`Made with durable ${extracted_attrs.material}`);
    if (extracted_attrs.size) features.push(`Convenient size/capacity: ${extracted_attrs.size}`);
    if (extracted_attrs.color) features.push(`Color profile: ${extracted_attrs.color}`);
    if (extracted_attrs.usage) features.push(`Ideal for ${extracted_attrs.usage}`);
    if (features.length === 0) features.push('Premium quality construction', 'Versatile design');
    
    output += `Key Features:\n- ${features.join('\n- ')}\n\n`;
    output += `Ideal For:\nPerfect for daily use and various applications.\n\n`;
    output += `Specifications:\n- Type: ${product_type}\n- Category: ${category}`;
    return output;
}

/**
 * 6. STRICT RECOVERY SYSTEM
 */
function recoverSEO(output, classification) {
    console.log("🚀 SEO STRICT MODE RECOVERY TRIGGERED");
    const { primary_keyword, extracted_attrs } = classification;

    // Fallback rule: Safe title = [Core Product] + key attributes
    const keyAttr = [extracted_attrs.material, extracted_attrs.color, extracted_attrs.size].filter(Boolean).join(' ');
    const safeTitleText = deduplicateWords(`${primary_keyword} ${keyAttr}`).trim().substring(0, 80);
    const safeTitleCapitalized = safeTitleText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    output.titles = [{ text: safeTitleCapitalized, score: 100 }];

    // Fallback tags: MUST include product_type
    const typeLower = primary_keyword.toLowerCase();
    const fallbackTags = [
        typeLower,
        `${extracted_attrs.material || 'premium'} ${typeLower}`,
        `${extracted_attrs.size || 'quality'} ${typeLower}`,
        `${typeLower} set`
    ].map(t => deduplicateWords(t.toLowerCase().trim())).filter(t => t.length > 0 && t.length <= 40);
    
    output.tags = fallbackTags.slice(0, 5);
    return output;
}

/**
 * 7. HARD VALIDATION GATE (CRITICAL)
 */
function validateAndRecover(output, classification) {
    const typeLower = classification.product_type.toLowerCase();
    const primaryLower = classification.primary_keyword.toLowerCase();

    // 1. Hard Validation: If generated_title does NOT include primary_keyword -> REJECT
    const titlesValid = output.titles.length > 0 && output.titles.every(t => {
        const lower = t.text.toLowerCase();
        return lower.includes(primaryLower) || lower.includes(typeLower);
    });

    // 2. Strict Tag Validation: ALL tags MUST include product_type keyword (or primary_keyword)
    const tagsValid = output.tags.length > 0 && output.tags.every(tag => {
        const lower = tag.toLowerCase();
        return lower.includes(typeLower) || lower.includes(primaryLower);
    });
    
    // 3. Keyword anchor enforcement: Ensure PRIMARY_KEYWORD appears in at least 2 tags
    const primaryTagCount = output.tags.filter(t => t.toLowerCase().includes(primaryLower)).length;

    if (!titlesValid || !tagsValid || primaryTagCount < 2) {
        console.warn("⚠️ STRICT SEO VALIDATION FAILED - TRIGGERING SAFE FALLBACK");
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
