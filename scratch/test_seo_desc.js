async function testSEODesc() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Men Cotton T-Shirt Casual Plus Size",
                description: "Product information: High quality cotton tshirt for mens. Casual summer style. Plus size fit with short sleeve. Supplier direct factory price china."
            })
        });
        const data = await response.json();
        console.log(data.data.description);
    } catch (e) {
        console.error(e.message);
    }
}
testSEODesc();
