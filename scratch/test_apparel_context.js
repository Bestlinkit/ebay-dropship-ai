async function testApparelContext() {
    try {
        console.log("TESTING: Men Cotton T-Shirt (Apparel Context)");
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Men Cotton T-Shirt Short Sleeve Casual",
                description: "Comfortable cotton t-shirt for men. Soft fabric, breathable design. Perfect for summer daily wear."
            })
        });
        const data = await response.json();
        
        console.log("=== CONTEXT ===");
        console.log(data.data.context);
        
        console.log("=== CATEGORY ===");
        console.log(data.data.category);

        console.log("=== TITLES ===");
        console.log(data.data.titles);
        
        console.log("=== TAGS ===");
        console.log(data.data.tags);

    } catch (e) {
        console.error(e.message);
    }
}
testApparelContext();
