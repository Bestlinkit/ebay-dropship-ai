async function testSEOQC() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Cotton Oversized T-Shirt null pbproduct",
                description: "Best product ever. Premium quality. Men cotton tshirt for summer streetwear."
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
testSEOQC();
