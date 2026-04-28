// --- SEO INTELLIGENCE ENGINE v17.0 (STRICT MODE) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality', 'limited edition', 'top rated', 'great value', 'quality', 'daily use']);

const GARBAGE_TOKENS = new Set(['pbproduct', 'br', 'nbsp', 'undefined', 'null', 'nan', 'water', 'product', 'information', 'description', 'people', 'applicable', 'various', 'available', 'type', 'standard', 'specifications']);

const MISLEADING_TOKENS = new Set(['facial', 'acid', 'ingredients', 'chemical', 'treatment', 'cheap', 'free', 'fake']);

const UNRELATED_PRODUCTS = new Set(['pbproduct', 'br', 'nbsp', 'description', 'information']);

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
function classifyProduct(title, description, forcedCategoryName = null) {
    const safeTitle = typeof title === 'string' ? title : String(title || "");
    const safeDescription = typeof description === 'string' ? description : String(description || "");
    const safeForced = typeof forcedCategoryName === 'string' ? forcedCategoryName : null;

    const text = (safeTitle + " " + (safeDescription || "")).toLowerCase();
    
    // Extract PRIMARY_KEYWORD strictly from original title (e.g. "coffee mug")
    const primaryWords = safeTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
        .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GARBAGE_TOKENS.has(w));
    
    const primaryKeyword = primaryWords.length > 0 ? primaryWords.slice(0, 3).join(' ') : safeTitle.substring(0, 30);
        
    // Lock product identity (IMMUTABLE)
    let product_type;
    if (safeForced) {
        // Use eBay category as the ONLY source of truth
        product_type = safeForced.split('>').pop().trim();
    } else {
        // Safe fallback rule: If product_type cannot be determined -> use original product title
        product_type = primaryKeyword;
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
 */
function generatePremiumTitles(keywords, classification) {
    const { primary_keyword, product_type, extracted_attrs, original_title } = classification;
    const attrs = extracted_attrs;
    const keyAttr = [attrs.material, attrs.color, attrs.size].filter(Boolean).join(' ');
    const useCase = attrs.usage ? `for ${attrs.usage}` : '';
    
    const baseTitle = `${primary_keyword} ${product_type}`.trim();
    
    // Generate strictly using product_type and extracted attributes
    let templates = [
        `${baseTitle} ${keyAttr} ${useCase}`.trim().replace(/\s+/g, ' '),
        `${attrs.material || ''} ${baseTitle} ${attrs.size || ''} ${useCase}`.trim().replace(/\s+/g, ' '),
        `${baseTitle} - ${keyAttr || ''} ${useCase}`.trim().replace(/\s+/g, ' ')
    ].filter(t => t.length > 0);
    
    if (templates.length === 0) templates.push(original_title);

    const primaryLower = primary_keyword.toLowerCase();

    return templates.map((t, i) => {
        let text = deduplicateWords(t);
        text = text.substring(0, 80);
        const capitalized = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let score = 95 - (i * 3);
        
        // Soft penalty here, strict rejection handled in validation gate
        if (!capitalized.toLowerCase().includes(primaryLower)) score -= 30;

        return { text: capitalized, score: score };
    });
}

/**
 * 4. STRICT TAG GENERATION
 */
function generateTags(keywords, classification) {
    const { product_type, extracted_attrs, primary_keyword } = classification;
    const finalTags = new Set();
    const typeLower = product_type.toLowerCase();
    const primaryLower = primary_keyword.toLowerCase();
    
    const candidateTags = [];

    // Build candidates strictly anchored to product_type and primary_keyword
    keywords.forEach(k => {
        candidateTags.push(`${k} ${typeLower}`);
        candidateTags.push(`${k} ${primaryLower}`);
    });
    if (extracted_attrs.material) candidateTags.push(`${extracted_attrs.material} ${typeLower}`);
    if (extracted_attrs.usage) candidateTags.push(`${typeLower} for ${extracted_attrs.usage}`);
    
    // Add exact matches
    candidateTags.push(typeLower);
    candidateTags.push(primaryLower);

    for (let tag of candidateTags) {
        if (finalTags.size >= 10) break;

        tag = tag.toLowerCase().trim();
        const words = tag.split(/\s+/);
        if (words.length > 4) continue;
        if (words.some(w => GARBAGE_TOKENS.has(w))) continue;
        
        // RULE: ALL tags MUST include product_type keyword (or primary_keyword as safe anchor)
        if (!tag.includes(typeLower) && !tag.includes(primaryLower)) continue;

        finalTags.add(tag);
    }
    
    // RULE: Ensure PRIMARY_KEYWORD appears in at least 2 tags
    const resultTags = Array.from(finalTags);
    let primaryCount = resultTags.filter(t => t.includes(primaryLower)).length;
    while (primaryCount < 2 && resultTags.length < 10) {
        const synth = `${primaryLower} ${typeLower}`.substring(0, 30);
        if (!resultTags.includes(synth)) {
            resultTags.push(synth);
            primaryCount++;
        } else {
            break;
        }
    }

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
    const { product_type, original_title, primary_keyword, extracted_attrs } = classification;
    const typeLower = product_type.toLowerCase();
    const primaryLower = primary_keyword.toLowerCase();

    // Fallback rule: Safe title = [Original Product Name] + key attributes
    const keyAttr = [extracted_attrs.material, extracted_attrs.color, extracted_attrs.size].filter(Boolean).join(' ');
    const safeTitle = `${original_title} ${keyAttr}`.substring(0, 80).trim();
    
    output.titles = [{ text: safeTitle, score: 100 }];

    // Fallback tags: MUST include product_type
    const fallbackTags = [
        typeLower,
        primaryLower,
        `${keyAttr} ${typeLower}`,
        `${primaryLower} ${typeLower}`,
        `${extracted_attrs.material || 'quality'} ${typeLower}`
    ].map(t => t.toLowerCase().trim()).filter(t => t.length > 0 && t !== ' ' && (t.includes(typeLower) || t.includes(primaryLower)));
    
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
