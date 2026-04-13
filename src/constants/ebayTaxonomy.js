/**
 * Official eBay US Primary Category Mapping (Production Rules)
 * Used for deterministic auto-matching based on product title signatures.
 */
export const CATEGORY_MAP = {
    // Health & Beauty
    "cream": 26395,
    "serum": 26395,
    "skin": 26395,
    "moisturizer": 26395,
    "lotion": 26395,
    "shampoo": 26395,
    "makeup": 26395,
    "fragrance": 26395,
    "vitamin": 26395,
    "supplement": 26395,
    "face": 26395,
    "beauty": 26395,

    // Fashion (Clothing, Shoes & Accs)
    "shoe": 11450,
    "sneaker": 11450,
    "boot": 11450,
    "shirt": 11450,
    "t-shirt": 11450,
    "dress": 11450,
    "watch": 31387, // Jewelry & Watches > Watches
    "necklace": 281, // Jewelry
    "ring": 281,
    "bag": 11450,
    "backpack": 11450,
    "hoodie": 11450,
    "jeans": 11450,

    // Home & Garden
    "garden": 11700,
    "kitchen": 11700,
    "furniture": 11700,
    "lamp": 11700,
    "decor": 11700,
    "bedding": 11700,
    "towel": 11700,
    "pet": 1281, // Pet Supplies
    "dog": 1281,
    "cat": 1281,
    "tool": 631, // Home Improvement

    // Electronics & Tech
    "phone": 15032, // Cell Phones & Accessories
    "case": 15032,
    "iphone": 15032,
    "samsung": 15032,
    "computer": 58058, // Computers/Tablets & Networking
    "laptop": 58058,
    "mouse": 58058,
    "keyboard": 58058,
    "monitor": 58058,
    "camera": 625, // Cameras & Photo
    "headphone": 11232, // Consumer Electronics > Audio
    "speaker": 11232,
    "charger": 11232,

    // Toys & Games
    "toy": 220,
    "game": 1249, // Video Games
    "console": 1249,
    "puzzle": 220,
    "lego": 220,

    // Sporting Goods
    "sport": 382,
    "fitness": 382,
    "gym": 382,
    "yoga": 382,
    "bike": 382,
    "fishing": 382,
    
    // Baby
    "baby": 2984
};

/**
 * Deterministic Matcher
 * Returns the most relevant Primary Category ID based on title keywords.
 */
export const matchPrimaryCategory = (title) => {
    if (!title) return null;
    const words = title.toLowerCase().split(/\s+/);
    
    // Priority 1: Direct phrase matches
    for (const [key, id] of Object.entries(CATEGORY_MAP)) {
        if (title.toLowerCase().includes(key)) return id;
    }

    return null; // Fallback to Uncategorized or suggest manual selection
};

export const PRIMARY_CATEGORIES = [
    { id: 26395, name: "Health & Beauty" },
    { id: 11450, name: "Clothing, Shoes & Accessories" },
    { id: 11700, name: "Home & Garden" },
    { id: 58058, name: "Computers/Tablets & Networking" },
    { id: 15032, name: "Cell Phones & Accessories" },
    { id: 625,   name: "Cameras & Photo" },
    { id: 11232, name: "Consumer Electronics" },
    { id: 31387, name: "Jewelry & Watches" },
    { id: 220,   name: "Toys & Hobbies" },
    { id: 1249,  name: "Video Games & Consoles" },
    { id: 382,   name: "Sporting Goods" },
    { id: 2984,  name: "Baby" },
    { id: 631,   name: "Tools & Home Improvement" }
];
