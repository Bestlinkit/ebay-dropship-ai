async function testV13Quality() {
    try {
        console.log("TESTING: Turmeric Body Scrub (v13.0 Quality Pipeline)");
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

        console.log("=== TITLES (Score Distribution) ===");
        console.log(data.data.titles);
        
        console.log("=== TAGS (Primary Priority) ===");
        console.log(data.data.tags);
        
        console.log("=== DESCRIPTION ===");
        console.log(data.data.description);

    } catch (e) {
        console.error(e.message);
    }
}
testV13Quality();
