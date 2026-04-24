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
        
        // Validation Checks
        const hasTshirt = data.data.titles.every(t => t.toLowerCase().includes('shirt') || t.toLowerCase().includes('tee'));
        console.log("Validation: All titles have product type:", hasTshirt);
        
        const allWords = data.data.tags.join(' ').split(' ');
        const counts = {};
        allWords.forEach(w => counts[w] = (counts[w] || 0) + 1);
        const maxFreq = Math.max(...Object.values(counts));
        console.log("Validation: Max keyword frequency in tags:", maxFreq, `(Total tags: ${data.data.tags.length})`);
    } catch (e) {
        console.error(e.message);
    }
}
testSEOHardening();
