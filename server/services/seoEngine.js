// --- DETERMINISTIC SEO ENGINE v9.5 (KEYWORD DIVERSITY & REALISM) ---

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'best', 'premium', 'high-quality', 'excellent', 'great', 'information', 'professional', 'supplier', 'factory', 'china', 'daily', 'high quality']);

const AUDIENCES = ['men', 'women', 'unisex', 'kids', 'adults', 'toddlers', 'babies'];
const MATERIALS = ['cotton', 'polyester', 'silk', 'linen', 'leather', 'denim', 'wool', 'acrylic', 'nylon', 'spandex', 'mesh'];
const STYLES = ['casual', 'formal', 'vintage', 'modern', 'streetwear', 'classic', 'luxury', 'oversized', 'slim fit', 'loose fit'];
const USE_CASES = ['summer', 'winter', 'running', 'daily', 'party', 'outdoor', 'indoor', 'office', 'sports', 'beach'];
const PRODUCT_TYPES = ['t-shirt', 'tee', 'shirt', 'top', 'hoodie', 'shoes', 'watch', 'jacket', 'pants'];

const NORMALIZATION_MAP = {
    'mens': 'men',
    'womens': 'women',
    'tshirt': 't-shirt',
    'tee': 't-shirt',
    'shortsleeved': 'short sleeve',
    'longsleeved': 'long sleeve',
    'plus-size': 'plus size',
    'plus': 'plus size'
};

const GARBAGE_TOKENS = new Set(['br', 'nbsp', 'amp', 'nbsp;', 'undefined', 'null', 'nan', 'pbproduct', 'url', 'img', 'width', 'height']);

// --- UTILS ---

function sanitizeText(text) {
    if (!text) return "";
    let clean = text.replace(/<[^>]*>?/gm, ' ');
    clean = clean.replace(/&nbsp;|\bbr\b|\bnbsp\b|&amp;|&gt;|&lt;|http\S+|\bundefined\b|\bnull\b|\bnan\b|\bpbproduct\b/gi, ' ');
    return clean.replace(/\s+/g, ' ').trim();
}

function normalizeWord(word) {
    const low = word.toLowerCase();
    return NORMALIZATION_MAP[low] || low;
}

function removeDuplicates(str) {
    const words = str.split(/\s+/);
    const seen = new Set();
    return words.filter(w => {
        const low = w.toLowerCase();
        if (seen.has(low)) return false;
        seen.add(low);
        return true;
    }).join(' ');
}

// --- ENGINE ---

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

function generateDeterministicTitles(keywords) {
    if (keywords.length === 0) return ["New Product Listing"];

    const audience = keywords.find(k => AUDIENCES.includes(k)) || "Unisex";
    const material = keywords.find(k => MATERIALS.includes(k)) || "Soft";
    const style = keywords.find(k => STYLES.includes(k)) || "Casual";
    const useCase = keywords.find(k => USE_CASES.includes(k)) || "Summer";
    
    // Mandate Product Type
    const typeCandidates = keywords.filter(k => PRODUCT_TYPES.includes(k));
    const type = typeCandidates[0] || "T-Shirt";
    const typeSynonyms = ["t-shirt", "tee", "shirt", "top"];

    // Build Angle 1: Strict Structure
    // [Audience] + [Material] + [Product Type] + [Style] + [Use Case]
    const title1 = `${audience} ${material} ${type} ${style} ${useCase}`.trim();

    // Angle 2: Trend/Synonym
    const altType = typeSynonyms.find(s => s !== type) || "Tee";
    const feature = keywords.find(k => !AUDIENCES.includes(k) && !MATERIALS.includes(k) && !STYLES.includes(k) && !USE_CASES.includes(k) && k !== type) || "";
    const title2 = `${audience} ${altType} ${feature} ${style} ${useCase}`.trim();

    // Angle 3: Direct Keyword Angle
    const title3 = `${material} ${type} for ${audience} ${style} ${useCase}`.trim();

    return [title1, title2, title3].map(t => {
        const deDuped = removeDuplicates(t);
        const capitalized = deDuped.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return capitalized.substring(0, 80);
    });
}

function generateTags(keywords) {
    const finalTags = [];
    const keywordCounters = {};
    
    const audience = keywords.find(k => AUDIENCES.includes(k)) || "unisex";
    const typeCandidates = keywords.filter(k => PRODUCT_TYPES.includes(k));
    const type = typeCandidates[0] || "t-shirt";
    const material = keywords.find(k => MATERIALS.includes(k)) || "cotton";
    const style = keywords.find(k => STYLES.includes(k)) || "casual";
    const useCase = keywords.find(k => USE_CASES.includes(k)) || "daily";

    const typeSynonyms = ["t-shirt", "tee", "shirt", "top", "apparel", "clothing"];

    const combinations = [
        `${material} ${type}`,
        `${audience} ${typeSynonyms[1]}`, // tee
        `${style} ${typeSynonyms[2]}`, // shirt
        `${useCase} ${typeSynonyms[3]}`, // top
        `${audience} ${style} ${type}`,
        `${material} ${style} ${typeSynonyms[4]}`, // apparel
        `${useCase} casual ${typeSynonyms[5]}`, // clothing
        `${audience} ${useCase} wear`,
        `${material} breathable ${type}`,
        `${style} ${audience} item`,
        `${type} for ${useCase}`,
        `soft ${material} ${typeSynonyms[1]}`,
        `trendy ${audience} ${typeSynonyms[2]}`,
        `lightweight ${material} ${typeSynonyms[3]}`,
        `outdoor ${style} ${typeSynonyms[0]}`
    ];

    combinations.forEach(c => {
        if (finalTags.length >= 12) return;
        
        const words = c.split(' ').filter(w => w !== "");
        
        // 1. Check for back-to-back duplicates
        let hasBackToBack = false;
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i] === words[i+1]) hasBackToBack = true;
        }
        if (hasBackToBack) return;

        // 2. Strict Diversity Check: 40% limit from start
        let canAdd = true;
        words.forEach(w => {
            const count = keywordCounters[w] || 0;
            // Allow first instance always, then check limit
            if (count > 0 && (count + 1) / (finalTags.length + 1) > 0.41) {
                canAdd = false;
            }
        });

        if (canAdd) {
            finalTags.push(c.trim());
            words.forEach(w => {
                keywordCounters[w] = (keywordCounters[w] || 0) + 1;
            });
        }
    });

    return finalTags.slice(0, 12).map(t => t.toLowerCase());
}

function cleanDescription(html, titleKeywords = []) {
    if (!html) return "Product Overview:\nNo description available.";

    let text = sanitizeText(html);
    text = text.replace(/product information:|description:|supplier|wholesale|dropship|factory|direct|china/gi, '')
               .replace(/\s+/g, ' ')
               .trim();

    const attributes = {
        Material: MATERIALS.find(m => text.toLowerCase().includes(m)) || titleKeywords.find(k => MATERIALS.includes(k)) || "",
        Style: STYLES.find(s => text.toLowerCase().includes(s)) || titleKeywords.find(k => STYLES.includes(k)) || "",
        Fit: ['oversized', 'slim', 'plus size', 'loose', 'regular'].find(f => text.toLowerCase().includes(f)) || "",
        Sleeve: ['short sleeve', 'long sleeve', 'sleeveless'].find(s => text.toLowerCase().includes(s)) || ""
    };

    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15 && !s.match(/color|size|package|img|url/i));
    
    const overview = sentences.length > 0 
        ? sentences.slice(0, 2).join('. ') + '.'
        : `This ${attributes.Material || ''} ${titleKeywords[0] || 'item'} is perfect for ${attributes.Style || 'daily'} wear.`;

    const features = sentences.slice(2, 7);

    let output = `Product Overview:\n${overview}\n\n`;
    output += `Key Features:\n${features.map(f => `- ${f}`).join('\n')}\n\n`;

    const specs = Object.entries(attributes).filter(([k, v]) => v !== "");
    if (specs.length > 0) {
        output += `Specifications:\n${specs.map(([k, v]) => `- ${k}: ${v.charAt(0).toUpperCase() + v.slice(1)}`).join('\n')}\n\n`;
    }

    output += `Package Includes:\n- 1 x ${titleKeywords[0] || 'Product'} Item\n- Secure Packaging`;

    return output.trim();
}

function scoreTitle(title, marketKeywords = []) {
    let score = 75;
    const words = title.toLowerCase().split(/\s+/);
    
    // 1. Penalty: Duplicates
    const seen = new Set();
    words.forEach(w => {
        if (seen.has(w)) score -= 25;
        seen.add(w);
    });

    // 2. Penalty: Missing Product Type
    if (!PRODUCT_TYPES.some(t => title.toLowerCase().includes(t))) score -= 40;

    // 3. Reward: Market Match
    marketKeywords.forEach(k => {
        if (title.toLowerCase().includes(k.toLowerCase())) score += 5;
    });

    // 4. Reward: Structure
    if (AUDIENCES.some(a => title.toLowerCase().includes(a))) score += 5;
    if (MATERIALS.some(m => title.toLowerCase().includes(m))) score += 5;

    return Math.min(100, Math.max(0, score));
}

function buildFrequencyMap(titles) {
    const map = {};
    titles.forEach(t => {
        const words = sanitizeText(t).toLowerCase().split(/\s+/);
        words.forEach(w => {
            if (w.length > 3 && !STOPWORDS.has(w)) {
                map[w] = (map[w] || 0) + 1;
            }
        });
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(e => e[0]);
}

function getCategoryFallback(keywords) {
    const CATEGORY_MAP = {
        'shoes': 'Men\'s Shoes',
        'watch': 'Wristwatches',
        'shirt': 'Men\'s Clothing',
        't-shirt': 'Men\'s Clothing',
        'tee': 'Men\'s Clothing',
        'phone': 'Cell Phones & Smartphones',
        'laptop': 'Laptops & Netbooks',
        'camera': 'Digital Cameras',
        'headphones': 'Headphones',
        'speaker': 'Speakers'
    };
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
        if (keywords.includes(key)) return val;
    }
    return "Miscellaneous";
}

function validateSEO(data) {
    // 1. Check for duplicates in titles
    for (const title of data.titles) {
        const words = title.toLowerCase().split(' ');
        if (new Set(words).size !== words.length) return false;
        
        // 2. Ensure product type exists
        if (!PRODUCT_TYPES.some(pt => title.toLowerCase().includes(pt))) return false;
    }
    
    // 3. Check tag diversity
    const allTagWords = data.tags.join(' ').split(' ');
    const counts = {};
    allTagWords.forEach(w => counts[w] = (counts[w] || 0) + 1);
    const maxAllowed = Math.ceil(data.tags.length * 0.4);
    if (Object.values(counts).some(c => c > maxAllowed)) {
        // We let it slide if tags are very few, but for 6-12 tags it's a fail
        if (data.tags.length >= 6) return false;
    }

    return true;
}

function qualityFilter(titles, scores, keywords, demandKeywords) {
    let results = titles.map((t, i) => ({ text: t, score: scores[i] }));
    
    // Filter out obvious failures
    results = results.filter(res => !res.text.match(/undefined|null|br|nbsp/i));

    // Auto-Rewrite low scores or failing validation
    results = results.map(res => {
        if (res.score < 75 || !PRODUCT_TYPES.some(pt => res.text.toLowerCase().includes(pt))) {
            const audience = keywords.find(k => AUDIENCES.includes(k)) || "Unisex";
            const material = keywords.find(k => MATERIALS.includes(k)) || "Soft";
            const style = keywords.find(k => STYLES.includes(k)) || "Casual";
            const type = keywords.find(k => PRODUCT_TYPES.includes(k)) || "T-Shirt";
            
            const rewritten = `${audience} ${material} ${type} ${style} Wear`.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').substring(0, 80);
            
            return { text: rewritten, score: scoreTitle(rewritten, demandKeywords) };
        }
        return res;
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 3);
}

module.exports = {
    extractKeywords,
    generateDeterministicTitles,
    generateTags,
    cleanDescription,
    scoreTitle,
    buildFrequencyMap,
    getCategoryFallback,
    qualityFilter,
    validateSEO,
    sanitizeText,
    normalizeWord
};
