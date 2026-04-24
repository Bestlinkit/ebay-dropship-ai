/**
 * 🤖 AI Listing Optimization Service (v6.0 - High Precision)
 * Directly targets the flattened backend response.
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
        description: snapshot.description,
        category: snapshot.category || "General"
      }),
    });

    const result = await response.json();
    
    // STEP 6: FRONTEND GUARD (CRITICAL)
    if (result.success && !Array.isArray(result.titles)) {
      throw new Error("INVALID_AI_RESPONSE");
    }

    return result;

  } catch (error) {
    console.error("AI Service Fault:", error);
    // Silent Fallback
    return {
        success: false,
        titles: [snapshot.title, `Premium ${snapshot.title}`, `${snapshot.title} - High Quality`],
        description: snapshot.description,
        tags: []
    };
  }
}
