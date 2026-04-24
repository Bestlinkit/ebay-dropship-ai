async function testSEOHardening() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Cotton tshirt br nbsp shortsleeved mens plus size",
                description: "High quality cotton tshirt for mens. <br>Casual summer style. Breathable and comfortable fit. Supplier direct factory price china."
            })
        });
        const data = await response.json();
        console.log("=== TITLES ===");
        console.log(data.data.titles);
        console.log("=== TAGS ===");
        console.log(data.data.tags);
    } catch (e) {
        console.error(e.message);
    }
}
testSEOHardening();
