/**
 * 🤖 AI Listing Optimization Service (v1.0)
 * Uses Gemini to transform supplier data into high-converting eBay listings.
 */

export async function optimizeListing(snapshot) {
  const prompt = `You are an eBay listing optimization expert.

Given a product title and description, generate:

1. Three optimized eBay titles:
- Max 80 characters
- Keyword-rich but natural
- No spam or repetition
- Follow eBay SEO best practices

2. Rank the titles based on:
- Search visibility
- Click-through potential
- Relevance

Return scores (0–100)

3. Rewrite the product description:
- Clear, structured, persuasive
- Use bullet points
- Highlight benefits

4. Generate 8–12 SEO tags:
- High intent keywords

INPUT:
Title: ${snapshot.title}
Description: ${snapshot.description}

OUTPUT FORMAT (STRICT JSON):

{
  "titles": [
    { "text": "", "score": 0 },
    { "text": "", "score": 0 },
    { "text": "", "score": 0 }
  ],
  "description": "",
  "tags": []
}`;

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error(`AI Optimization Request Failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Safety check: parse JSON if backend returns it as a string
    let result = data;
    if (typeof data === 'string') {
        result = JSON.parse(data);
    }
    
    // Extract result from potential Gemini wrapper structure if needed
    // Assuming /api/gemini returns the direct JSON result for now
    return result;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}
