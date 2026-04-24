/**
 * 🤖 AI Listing Optimization Service (v5.5 - Stability Mode)
 * Uses direct fetch and native fallback logic.
 * REAL DATA ONLY.
 */

export async function optimizeListing(snapshot) {
  const BRIDGE_BASE = 'http://localhost:3001';
  
  try {
    const response = await fetch(`${BRIDGE_BASE}/api/ai/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        title: snapshot.title,
        description: snapshot.description 
      }),
    });

    const result = await response.json();
    
    // STEP 3: BACKEND RESPONSE CONTRACT (STRICT)
    // Even if success is false, we get 'data' (fallback) from backend.
    return result;

  } catch (error) {
    console.error("AI Service Fault:", error);
    // Final UI-level safety fallback
    return {
        success: false,
        error: "NETWORK_ERROR",
        data: {
            titles: [{ text: snapshot.title, score: 70 }],
            description: snapshot.description,
            tags: []
        }
    };
  }
}
