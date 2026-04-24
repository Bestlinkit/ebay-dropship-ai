async function testPremiumPipeline() {
    try {
        console.log("TESTING: Turmeric Body Scrub (v11.0 Premium Pipeline)");
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

        console.log("=== CONTEXT ===");
        console.log(data.data.context);
        
        console.log("=== TITLES (Benefit Driven) ===");
        console.log(data.data.titles);
        
        console.log("=== TAGS (Max 8) ===");
        console.log(data.data.tags);
        
        console.log("=== DESCRIPTION (Structured) ===");
        console.log(data.data.description);

    } catch (e) {
        console.error(e.message);
    }
}
testPremiumPipeline();
