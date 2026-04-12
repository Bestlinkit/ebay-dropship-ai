import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Pro-Grade AI Intelligence Service (V5.2.1)
 * Optimized for high-velocity marketing copy and market research.
 */
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generates conversion-optimized marketing scripts for multiple channels.
   */
  async generateMarketingScript(product, channel = 'Email') {
    if (!product) return null;

    const prompt = `
      Product: ${product.title}
      Price: ${product.price}
      Niche: ${product.category || 'General'}
      
      Create a high-impact, professional marketing script for the channel: ${channel}.
      Use an "Ultra-Pro" tone—authoritative, persuasive, and sleek.
      
      Structure for ${channel}:
      - Catchy Subject/Headline
      - 3 Body Bullet points focusing on ROI and Value
      - Strong Call to Action (CTA)
      
      Return as JSON with keys: 'headline', 'bullets', 'cta'.
    `;

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("AI Marketing Script failed", error);
      return {
        headline: `Limited Time: ${product.title}`,
        bullets: [
          "Premium quality guaranteed",
          "Best-in-class performance",
          "Highly trending this season"
        ],
        cta: "Claim Offer Now"
      };
    }
  }

  /**
   * Generates video marketing scripts (8 scenes) for the Video Lab.
   */
  async generateVideoScript(product) {
    if (!product) return null;

    const prompt = `
      Product: ${product.title}
      Description: ${product.description || ''}
      Price: ${product.price}
      
      Generate a viral high-conversion short-form video script for eBay.
      The video will have 8 scenes, 3s each (24s total).
      For each scene, provide a punchy text overlay.
      Follow this structure:
      1. Hook (Scene 1)
      2. Problem/Need (Scene 2)
      3. Agitation (Scene 3)
      4. Solution/Feature 1 (Scene 4)
      5. Feature 2 (Scene 5)
      6. Result/Benefit (Scene 6)
      7. Social Proof/Trust (Scene 7)
      8. Urgency CTA (Scene 8)

      Return ONLY a JSON array of 8 strings.
    `;

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      // Ensure we get an array
      const scenes = JSON.parse(cleanJson);
      return Array.isArray(scenes) ? scenes : [
         "STOP SCROLLING!", "Need a change?", "Experience the difference.", 
         "Top-tier quality.", "Fast shipping.", "Join the elite.", 
         "5-Star Rated.", "Get yours now!"
      ];
    } catch (error) {
      console.error("AI Video Script failed", error);
      return [
        "STOP SCROLLING!",
        "Tired of mediocre results?",
        "You deserve better.",
        "Meet the ultimate solution.",
        "Pro-grade performance.",
        "Transform your routine.",
        "Loved by 5000+ happy users.",
        "Order now - Free shipping!"
      ];
    }
  }
}

export default new AIService();
