async function testSEORawText() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Men Cotton T-Shirt Casual Plus Size",
                description: "Product information: High quality cotton tshirt for mens. <br>Casual summer style. Plus size fit with short sleeve. <b>Supplier direct</b> factory price china. <img>"
            })
        });
        const data = await response.json();
        console.log("--- RAW TEXT START ---");
        console.log(data.data.description);
        console.log("--- RAW TEXT END ---");
    } catch (e) {
        console.error(e.message);
    }
}
testSEORawText();
