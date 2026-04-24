async function testV13Live() {
    try {
        console.log("LIVE TEST: Turmeric Body Scrub (v13.0 Pipeline)");
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Turmeric Body Scrub Cleansing Exfoliating",
                description: "Turmeric body scrub for skin brightening and moisturizing. High quality natural exfoliator."
            })
        });
        const data = await response.json();
        console.log("RESULT:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}
testV13Live();
