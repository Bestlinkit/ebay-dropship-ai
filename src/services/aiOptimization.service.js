/**
 * 🤖 AI Listing Optimization Service (v4.0 - Ebay Builder Mode)
 * Uses Gemini to transform supplier data into high-converting eBay listings.
 * REAL AI OR FAIL - NO FAKE DATA
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

  const BRIDGE_BASE = 'http://localhost:3001';
  
  try {
    const response = await fetch(`${BRIDGE_BASE}/api/ai/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI optimization failed. Please retry.`);
    }

    const data = await response.json();
    
    // STEP 7: STRICT FAIL RULE - NO FAKE DATA
    if (!data.success && !data.titles) {
        throw new Error(data.error || "AI optimization failed. Please retry.");
    }

    return data;
  } catch (error) {
    console.error("AI Service Fault:", error);
    throw error;
  }
}
