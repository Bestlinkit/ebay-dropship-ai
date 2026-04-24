async function testSEO() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Men Running Shoes",
                description: "Breathable mesh sneakers for sports."
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
testSEO();
