const sourcingService = {
  detectCategory(title) {
    if (!title) return null;
    const t = title.toLowerCase();
    const categories = [
        { id: 'soap', keywords: ['soap', 'cleanser', 'bar', 'wash', 'turmeric', 'kojic'] },
        { id: 'wellness', keywords: ['therapy', 'massager', 'skincare', 'facial', 'red light'] },
        { id: 'jeans', keywords: ['jeans', 'denim', 'pants', 'trousers', 'slim fit'] },
        { id: 'shoes', keywords: ['shoes', 'sneakers', 'boots', 'sandals', 'footwear'] },
        { id: 'shirt', keywords: ['shirt', 't-shirt', 'tee', 'top', 'blouse', 'hoodie'] },
        { id: 'home', keywords: ['organizer', 'blender', 'kitchen', 'home', 'storage', 'lamp'] },
        { id: 'auto', keywords: ['car', 'dash cam', 'vacuum', 'organizer', 'charger', 'safety'] },
        { id: 'pets', keywords: ['dog', 'cat', 'pet', 'grooming', 'interactive', 'leash'] },
        { id: 'fitness', keywords: ['yoga', 'jump rope', 'resistance', 'gym', 'workout'] },
        { id: 'electronics', keywords: ['phone', 'tablet', 'laptop', 'charger', 'cable', 'magnetic', 'wireless'] }
    ];
    for (const cat of categories) {
        if (cat.keywords.some(kw => t.includes(kw))) return cat.id;
    }
    return null;
  },
  extractSearchTiers(title) {
    if (!title) return [];
    const t = title.toLowerCase();
    const stopwords = [
        'with', 'from', 'best', 'sale', 'free', 'shipping', '2026', 'new', 'hot', 'top', 
        'rated', 'high', 'quality', 'vibrant', 'limited', 'stock', 'original', 'official',
        'vitamin', 'citrus', 'premium', 'ultra', 'professional'
    ];
    const clean = t.replace(/[^\w\s]/gi, ' ');
    let words = clean.split(/\s+/).filter(w => w.length > 3 && !stopwords.includes(w));
    const category = this.detectCategory(title);
    const tiers = [];
    if (category) {
        const attributes = words.filter(w => !category.includes(w) && !w.includes(category));
        if (attributes.length > 0) tiers.push(`${attributes[0]} ${category}`);
        if (attributes.length > 1) tiers.push(`${attributes[0]} ${attributes[1]} ${category}`);
        tiers.push(category);
    } else {
        if (words.length >= 2) tiers.push(words.slice(0, 2).join(' '));
        if (words.length >= 3) tiers.push(words.slice(0, 3).join(' '));
        if (words.length > 0) tiers.push(words[0]);
    }
    return [...new Set(tiers.map(s => s.trim().toLowerCase()))].filter(Boolean).slice(0, 3);
  }
};

const testTitles = [
    "Turmeric Kojic Acid Soap Bar Vitamin C Brightening Dark Spots Acne Face Body",
    "Magnetic Wireless Charger for iPhone 15 14 13 Pro Max Fast Charging Station",
    "Professional Dog Grooming Clippers Low Noise Rechargable Pet Hair Shaver",
    "Ultra Slim Fit Men's Denim Jeans Classic Blue Stretch Trousers 2026 New",
    "Portable Blender for Shakes and Smoothies Rechargeable Mini Juicer Cup"
];

console.log("=== Intent Reduction Test Results ===\n");
testTitles.forEach(title => {
    console.log(`Original: "${title}"`);
    console.log(`Intent Tiers:`, sourcingService.extractSearchTiers(title));
    console.log("-------------------\n");
});
