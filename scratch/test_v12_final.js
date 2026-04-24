async function testV12Pipeline() {
    try {
        console.log("TESTING: Turmeric Body Scrub (v12.0 Strict Pipeline)");
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Turmeric Body Scrub Cleansing Exfoliating",
                description: "Turmeric body scrub for skin brightening and moisturizing. High quality natural exfoliator."
            })
        });
        const data = await response.json();
        
        if (!data.success) {
            console.error("FAIL:", data.status, data.reason);
            return;
        }

        console.log("=== CATEGORY ===");
        console.log(data.data.category);
        
        console.log("=== TITLES (Strict v12) ===");
        console.log(data.data.titles);
        
        console.log("=== TAGS (Min 2 Words, No Garbage) ===");
        console.log(data.data.tags);
        
        console.log("=== DESCRIPTION ===");
        console.log(data.data.description);

    } catch (e) {
        console.error(e.message);
    }
}
testV12Pipeline();
