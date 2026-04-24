async function testContextLocking() {
    try {
        console.log("TESTING: Turmeric Body Scrub (Skincare Context)");
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Turmeric Body Scrub Cleansing Exfoliating Skin Brightening",
                description: "Turmeric body scrub for skin brightening and moisturizing. Natural exfoliator with organic turmeric. Apply to skin and massage. Rinse well. Product information: high quality supplier factory china."
            })
        });
        const data = await response.json();
        
        if (!data.success) {
            console.error("FAIL:", data.error);
            return;
        }

        console.log("=== CONTEXT ===");
        console.log(data.data.context);
        
        console.log("=== CATEGORY ===");
        console.log(data.data.category);

        console.log("=== TITLES ===");
        console.log(data.data.titles);
        
        console.log("=== TAGS ===");
        console.log(data.data.tags);
        
        console.log("=== DESCRIPTION ===");
        console.log(data.data.description);

        // Fail-safe check
        const isLeaked = data.data.titles.some(t => t.toLowerCase().includes('shirt') || t.toLowerCase().includes('cotton'));
        console.log("Validation: No Apparel Leakage:", !isLeaked);

    } catch (e) {
        console.error(e.message);
    }
}
testContextLocking();
