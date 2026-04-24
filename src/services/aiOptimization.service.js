/**
 * 🤖 AI Listing Optimization Service (v7.0 - Strict Reliability)
 * Uses the new 'data' wrapper contract.
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
    
    // STEP 7: FRONTEND SAFETY FIX
    // Backend returns { success, data: { titles, description, tags } }
    const titles = Array.isArray(result.data?.titles) ? result.data.titles : [];
    
    return {
        ...result,
        titles // Ensure titles is always available at top level for component ease
    };

  } catch (error) {
    console.error("AI Service Fault:", error);
    // Silent Fallback structure matching the contract
    return {
        success: false,
        data: {
            titles: [snapshot.title, `New ${snapshot.title}`, `${snapshot.title} - Premium Quality`],
            description: snapshot.description,
            tags: []
        },
        titles: [snapshot.title, `New ${snapshot.title}`, `${snapshot.title} - Premium Quality`]
    };
  }
}
