async function testSEONorm() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Cotton tshirt br nbsp shortsleeved &nbsp; mens",
                description: "Best product tshirt ever. <br><b>Bold</b> mens cotton tshirt."
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
testSEONorm();
