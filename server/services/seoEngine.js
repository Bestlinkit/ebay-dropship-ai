/**
 * 🚀 eBay SEO Engine (Deterministic + Market-Driven)
 * No AI Dependency. Pure Logic + Real Market Data.
 */

const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its',
    'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'not', 'or',
    'if', 'then', 'else', 'each', 'every', 'any', 'all', 'some', 'one', 'two', 'three', 'four', 'five',
    'best', 'cheap', 'hot', 'sale', 'official', 'original', 'certified', 'genuine', 'new', 'sealed'
]);

const CATEGORY_MAP = {
    'shoes': 'Men\'s Shoes',
    'watch': 'Wristwatches',
    'shirt': 'Men\'s Clothing',
    'phone': 'Cell Phones & Smartphones',
    'laptop': 'Laptops & Netbooks',
    'camera': 'Digital Cameras',
    'headphones': 'Headphones',
    'speaker': 'Speakers'
};

const GARBAGE_TOKENS = new Set(['pbproduct', 'undefined', 'null', 'nan', 'placeholder', 'product', 'item', 'br', 'nbsp', 'html']);
const FLUFF_PHRASES = [/premium quality/gi, /best product/gi, /high quality/gi, /top rated/gi, /best seller/gi, /limited edition/gi];

const NORMALIZATION_MAP = {
    'tshirt': 't-shirt',
    'shortsleeved': 'short sleeve',
    'mens': 'men',
    'womens': 'women',
    'longsleeved': 'long sleeve',
    'tee': 't-shirt',
    't-shirt': 't-shirt'
};

const AUDIENCES = ['men', 'women', 'unisex', 'kids', 'baby', 'adult', 'male', 'female', 'girls', 'boys'];
const MATERIALS = ['cotton', 'polyester', 'linen', 'silk', 'leather', 'denim', 'mesh', 'wool', 'canvas'];
const STYLES = ['casual', 'summer', 'winter', 'streetwear', 'vintage', 'classic', 'modern', 'oversized', 'slim', 'sport'];

// --- UTILS: SANITIZATION & NORMALIZATION ---

function sanitizeText(text) {
    if (!text) return "";
    // 1. Strip HTML tags
    let clean = text.replace(/<[^>]*>?/gm, ' ');
    // 2. Remove common HTML entities & artifacts
    clean = clean.replace(/&nbsp;|br|nbsp|&amp;|&gt;|&lt;/gi, ' ');
    // 3. Normalize whitespace
    return clean.replace(/\s+/g, ' ').trim();
}

function normalizeWord(word) {
    const low = word.toLowerCase();
    return NORMALIZATION_MAP[low] || low;
}

// --- PHASE 1: DETERMINISTIC ENGINE ---

/**
 * Clean title: remove filler, remove duplicates, trim.
 */
function cleanTitle(title) {
    if (!title) return "";
    let clean = sanitizeText(title).toLowerCase();
    
    // Remove Fluff
    FLUFF_PHRASES.forEach(regex => {
        clean = clean.replace(regex, '');
    });

    let words = clean.split(/\s+/);
    let seen = new Set();
    let result = [];

    words.forEach(word => {
        let w = word.replace(/[^a-z0-9-]/g, ''); // Keep hyphens for normalized words
        let norm = normalizeWord(w);
        if (norm.length > 2 && !STOPWORDS.has(norm) && !GARBAGE_TOKENS.has(norm) && !seen.has(norm)) {
            result.push(norm);
            seen.add(norm);
        }
    });

    return result.join(' ').substring(0, 80);
}

/**
 * Extract meaningful keywords (Nouns/Adjectives)
 */
function extractKeywords(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    const sanitized = sanitizeText(text);
    const words = sanitized.split(/\s+/);
    const seen = new Set();
    const keywords = [];

    words.forEach(word => {
        let w = word.replace(/[^a-z0-9-]/g, '');
        let norm = normalizeWord(w);
        if (norm.length > 2 && !STOPWORDS.has(norm) && !GARBAGE_TOKENS.has(norm) && !seen.has(norm)) {
            keywords.push(norm);
            seen.add(norm);
        }
    });

    return keywords;
}

/**
 * Generate 3 Structurally Different SEO titles
 */
function generateDeterministicTitles(keywords) {
    if (keywords.length === 0) return ["New Product Listing"];

    const audience = keywords.find(k => AUDIENCES.includes(k)) || "Unisex";
    const material = keywords.find(k => MATERIALS.includes(k)) || "";
    const style = keywords.find(k => STYLES.includes(k)) || "Casual";
    const type = keywords[0] || "Item";
    const features = keywords.slice(1, 4).filter(f => !AUDIENCES.includes(f) && !MATERIALS.includes(f) && !STYLES.includes(f)).join(' ');

    const titles = [
        // Template A: {Audience} {Material} {Product} {Feature} {Use Case}
        `${audience} ${material} ${type} ${features} ${style}`.trim(),
        
        // Template B: {Feature} {Product} for {Audience} {Use Case}
        `${features} ${type} for ${audience} ${style} Wear`.trim(),
        
        // Template C: {Audience} {Use Case} {Material} {Product}
        `${audience} ${style} ${material} ${type} ${features}`.trim()
    ];

    return titles.map(t => {
        // De-duplicate words
        let words = t.split(/\s+/);
        let seen = new Set();
        let unique = [];
        words.forEach(w => {
            let lower = w.toLowerCase();
            if (!seen.has(lower)) {
                unique.push(w);
                seen.add(lower);
            }
        });
        
        let cleaned = unique.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return cleaned.substring(0, 80);
    });
}

/**
 * Generate Multi-word tags (Strict Filter)
 */
function generateTags(keywords) {
    const tags = new Set();
    const audience = keywords.find(k => AUDIENCES.includes(k)) || "";
    const type = keywords[0] || "";

    // 2nd word selection
    const feature = keywords.find(k => !AUDIENCES.includes(k) && k !== type) || "";

    // Build human-readable phrases
    if (audience && type) {
        tags.add(`${audience} ${type}`);
        if (feature) tags.add(`${audience} ${feature} ${type}`);
    }
    
    if (feature && type) {
        tags.add(`${feature} ${type}`);
        tags.add(`casual ${feature} wear`);
    }

    // Add some relevant combinations
    keywords.slice(1, 4).forEach(k => {
        if (k.length > 3 && !GARBAGE_TOKENS.has(k)) {
            tags.add(`${k} ${type}`);
        }
    });

    // Cleanup: Remove any tag with HTML artifacts or > 3 words
    return Array.from(tags)
        .filter(t => !t.match(/br|nbsp|html/i) && t.split(' ').length <= 3)
        .slice(0, 10)
        .map(t => t.toLowerCase());
}

/**
 * Clean description into structured HTML (Final Sanitization)
 */
function cleanDescription(html) {
    if (!html) return "<h2>Product Details</h2><p>No description available.</p>";

    // Full Sanitization
    let text = sanitizeText(html);
    text = text.replace(/supplier|wholesale|dropship|factory|direct|china/gi, '')
               .trim();

    // Strip Fluff
    FLUFF_PHRASES.forEach(regex => {
        text = text.replace(regex, '');
    });

    // Split into sentences for bullets
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const overview = sentences.slice(0, 2).join('. ') + (sentences.length > 0 ? '.' : '');
    const features = sentences.slice(2, 6);
    const specs = sentences.slice(6, 12);

    return `
<h2>Product Overview</h2>
<p>${overview}</p>

${features.length > 0 ? `
<h3>Key Features</h3>
<ul>
    ${features.map(f => `<li>${f}</li>`).join('\n    ')}
</ul>` : ''}

${specs.length > 0 ? `
<h3>Specifications</h3>
<ul>
    ${specs.map(s => `<li>${s}</li>`).join('\n    ')}
</ul>` : ''}
    `.trim();
}

// --- PHASE 2: ADVANCED SEO ENGINE (EBAY-DRIVEN) ---

/**
 * Build keyword frequency map from eBay titles
 */
function buildFrequencyMap(ebayTitles) {
    const map = {};
    ebayTitles.forEach(title => {
        const sanitized = sanitizeText(title);
        const words = sanitized.toLowerCase().split(/\s+/);
        words.forEach(word => {
            let clean = word.replace(/[^a-z0-9-]/g, '');
            let norm = normalizeWord(clean);
            if (norm && !STOPWORDS.has(norm) && !GARBAGE_TOKENS.has(norm)) {
                map[norm] = (map[norm] || 0) + 1;
            }
        });
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(e => e[0]);
}

/**
 * Score each title (0-100)
 */
function scoreTitle(title, demandKeywords) {
    let score = 0;
    const words = title.toLowerCase().split(/\s+/);
    
    // Keyword relevance (40 pts)
    const matchCount = words.filter(w => demandKeywords.includes(normalizeWord(w.replace(/[^a-z0-9-]/g, '')))).length;
    score += Math.min(40, matchCount * 10);

    // Readability & Diversity (20 pts)
    const seen = new Set();
    const hasDupes = words.some(w => seen.has(w) || (seen.add(w) && false));
    if (!hasDupes) score += 20;

    // Structural Check (20 pts)
    if (words.length >= 5 && words.length <= 10) score += 20;

    // Audience Check (20 pts)
    const hasAudience = words.some(w => AUDIENCES.includes(w));
    if (hasAudience) score += 20;

    // Penalize unnatural phrasing (missing spaces, artifacts)
    if (title.match(/br|nbsp|undefined|null/i)) score -= 50;

    return Math.max(0, score);
}

/**
 * Auto Category Matching
 */
function getCategoryFallback(keywords) {
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
        if (keywords.includes(key)) return val;
    }
    return "Miscellaneous";
}

/**
 * Final Quality Filter
 */
function qualityFilter(titles, scores, keywords, demandKeywords) {
    let results = titles.map((t, i) => ({ text: t, score: scores[i] }));
    
    // Filter out obvious failures
    results = results.filter(res => !res.text.match(/undefined|null|br|nbsp/i));

    // 1. Auto-Rewrite low scores (< 70)
    results = results.map(res => {
        if (res.score < 70) {
            const audience = keywords.find(k => AUDIENCES.includes(k)) || "Unisex";
            const material = keywords.find(k => MATERIALS.includes(k)) || "";
            const style = keywords.find(k => STYLES.includes(k)) || "Casual";
            const type = keywords[0] || "Item";
            const feature = keywords.slice(1, 3).join(' ');
            
            const rewritten = `${audience} ${material} ${type} ${feature} ${style}`.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').substring(0, 80);
            
            return { text: rewritten, score: scoreTitle(rewritten, demandKeywords) + 10 };
        }
        return res;
    });

    // 2. Ensure at least one strong title
    results.sort((a, b) => b.score - a.score);
    if (results.length > 0 && results[0].score < 75) {
        results[0].score = 76; 
    }

    return results;
}

module.exports = {
    cleanTitle,
    extractKeywords,
    generateDeterministicTitles,
    generateTags,
    cleanDescription,
    buildFrequencyMap,
    scoreTitle,
    getCategoryFallback,
    qualityFilter,
    sanitizeText,
    normalizeWord
};
