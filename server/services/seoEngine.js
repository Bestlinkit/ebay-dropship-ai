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

// --- PHASE 1: DETERMINISTIC ENGINE ---

/**
 * Clean title: remove filler, remove duplicates, trim.
 */
function cleanTitle(title) {
    if (!title) return "";
    let words = title.toLowerCase().split(/\s+/);
    let seen = new Set();
    let result = [];

    words.forEach(word => {
        // Remove symbols
        let clean = word.replace(/[^a-z0-9]/g, '');
        if (clean && !STOPWORDS.has(clean) && !seen.has(clean)) {
            result.push(clean);
            seen.add(clean);
        }
    });

    return result.join(' ').substring(0, 80);
}

/**
 * Extract meaningful keywords (Nouns/Adjectives)
 */
function extractKeywords(title, description) {
    const text = (title + " " + (description || "")).toLowerCase();
    const words = text.split(/\s+/);
    const seen = new Set();
    const keywords = [];

    words.forEach(word => {
        let clean = word.replace(/[^a-z0-9]/g, '');
        if (clean.length > 2 && !STOPWORDS.has(clean) && !seen.has(clean)) {
            keywords.push(clean);
            seen.add(clean);
        }
    });

    return keywords;
}

/**
 * Generate 3 SEO titles based on templates
 */
function generateDeterministicTitles(keywords) {
    if (keywords.length === 0) return ["New Product Listing"];

    const audience = keywords.find(k => ['men', 'women', 'kids', 'baby', 'adult'].includes(k)) || "";
    const type = keywords[0] || "Item";
    const features = keywords.slice(1, 4).join(' ');

    const titles = [
        // Template A (Primary): {Audience} {Feature} {Product Type}
        `${audience} ${features} ${type}`.trim(),
        
        // Template B (Intent): {Product Type} for {Use Case} {Audience}
        `${type} for ${keywords.slice(4, 6).join(' ')} ${audience}`.trim(),
        
        // Template C (Conversion): {Feature} {Product Type} - High Quality
        `${features} ${type} - Premium Quality`.trim()
    ];

    return titles.map(t => {
        let cleaned = t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return cleaned.substring(0, 80);
    });
}

/**
 * Generate 5-10 tags
 */
function generateTags(keywords) {
    const single = keywords.slice(0, 5);
    const combos = [];
    if (keywords.length >= 2) {
        combos.push(`${keywords[0]} ${keywords[1]}`);
        combos.push(`${keywords[0]} ${keywords[2]}`);
    }
    return [...single, ...combos].slice(0, 10);
}

/**
 * Clean description into structured HTML
 */
function cleanDescription(html) {
    if (!html) return "<h2>Product Details</h2><p>No description available.</p>";

    // Remove broken HTML and supplier junk
    let text = html.replace(/<[^>]*>?/gm, ' ')
                   .replace(/supplier|wholesale|dropship|factory|direct/gi, '')
                   .replace(/\s+/g, ' ')
                   .trim();

    // Split into sentences for bullets
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const overview = sentences.slice(0, 2).join('. ') + '.';
    const features = sentences.slice(2, 6);
    const specs = sentences.slice(6, 10);

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
        const words = title.toLowerCase().split(/\s+/);
        words.forEach(word => {
            let clean = word.replace(/[^a-z0-9]/g, '');
            if (clean && !STOPWORDS.has(clean)) {
                map[clean] = (map[clean] || 0) + 1;
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
    const matchCount = words.filter(w => demandKeywords.includes(w.replace(/[^a-z0-9]/g, ''))).length;
    score += Math.min(40, matchCount * 10);

    // Readability (20 pts)
    const seen = new Set();
    const hasDupes = words.some(w => seen.has(w) || (seen.add(w) && false));
    if (!hasDupes) score += 20;

    // Length optimization (20 pts)
    if (title.length >= 60 && title.length <= 80) score += 20;
    else if (title.length > 40) score += 10;

    // Formatting (20 pts)
    if (/^[A-Z]/.test(title)) score += 10;
    if (words.length >= 5) score += 10;

    return score;
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

module.exports = {
    cleanTitle,
    extractKeywords,
    generateDeterministicTitles,
    generateTags,
    cleanDescription,
    buildFrequencyMap,
    scoreTitle,
    getCategoryFallback
};
