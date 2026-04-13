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

  /**
   * Consolidates Optimization Intelligence
   * Returns: { titles: [{title, rank},...], description, category, tags, pricingStrategy }
   */
  /**
   * Consolidates Optimization Intelligence (V6.5 - Luminous Engine)
   */
  async optimizeListing(baselineTitle, currentPrice, competitorPrices = []) {
    const pricesStr = Array.isArray(competitorPrices) && competitorPrices.stats 
        ? `Avg: $${competitorPrices.stats.avg}, Min: $${competitorPrices.stats.min}` 
        : "No direct market data found";
    
    const prompt = `
      ACT AS EBAY LISTING ARCHITECT.
      
      CORE SPECS:
      TITLE: ${baselineTitle}
      STAGED PRICE: $${currentPrice}
      COMPETITOR LANDSCAPE: ${pricesStr}

      OBJECTIVES:
      1. TITLES: Generate EXACTLY 5 high-rank title profiles. MAX 80 CHARS.
      2. DESCRIPTION: Create a PREMIUM HTML SELL-PITCH. 
         - REMOVE all existing image links (<img> tags).
         - REMOVE promotional noise (e.g., "FAST SHIPPING", "BEST PRICE").
         - FOCUS on benefits, specs, and trust.
      3. TAGS: 10 hyper-niche SEO keywords.
      4. STRATEGY: Data-driven pricing logic.

      OUTPUT STRUCTURE (JSON ONLY):
      {
        "titles": [
          {"title": "...", "rank": 99},
          {"title": "...", "rank": 95},
          {"title": "...", "rank": 92},
          {"title": "...", "rank": 88},
          {"title": "...", "rank": 85}
        ],
        "description": "<div class='premium-listing'>...</div>",
        "tags": ["...", "..."],
        "pricingStrategy": "...",
        "aiVerdict": "High-velocity match."
      }
    `;

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      
      // Improved robust JSON extraction
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON object found in response");
      
      const cleanJson = text.substring(jsonStart, jsonEnd).trim();
      const parsed = JSON.parse(cleanJson);
      
      // Ensure strict compliance post-generation
      parsed.titles = (parsed.titles || []).map(t => ({
          ...t,
          title: t.title.substring(0, 80)
      }));
      
      return parsed;
    } catch (error) {
      console.error("AI Suite Synchronization Failed", error);
      return {
        titles: [{ title: baselineTitle.substring(0, 80), rank: 95 }],
        description: `<p>${baselineTitle}</p>`,
        mainCategory: "General Merchandise",
        subCategory: "Uncategorized",
        tags: ["SEO", "Optimized", "Best Seller"],
        pricingStrategy: "Analyze market data for further precision."
      };
    }
  }

  /**
   * Crafts a visual prompt for the Nano Banana AI engine.
   */
  async generateImagePrompt(title, style = "primary") {
    const templates = {
      primary: `Photorealistic close-up of the product ${title} in professional studio lighting, clean minimal background, 8k resolution, commercial photography.`,
      presentation: `A professional presentation of ${title} being used in a real-world high-end environment, lifestyle shot, bokeh background, appealing to a luxury audience.`,
      ingredients: `An artistic display of the components and ingredients of ${title}, flat-lay style, natural lighting, organic feel, detailed textures.`
    };

    const prompt = templates[style] || templates.primary;
    
    try {
      const response = await this.model.generateContent(`Refine this visual prompt for an AI image generator: "${prompt}"`);
      return response.response.text().trim();
    } catch {
      return prompt;
    }
  }

  async generateProductImageVariations(sourceUrl, title = "product", style = "primary") {
    const hfToken = import.meta.env.VITE_HF_API_KEY;
    if (!hfToken) {
        console.warn("HF Token missing, falling back to demo images.");
        return Array(8).fill(0).map((_, i) => `${sourceUrl}&variant=${i}`);
    }

    try {
        const visualPrompt = await this.generateImagePrompt(title, style);
        // Generate 4 high-quality variations instead of 8 for performance
        const variations = [];
        for (let i = 0; i < 4; i++) {
            const seed = Math.floor(Math.random() * 100000);
            const response = await fetch(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                {
                    headers: { Authorization: `Bearer ${hfToken}` },
                    method: "POST",
                    body: JSON.stringify({ 
                        inputs: `${visualPrompt}, seed: ${seed}`,
                        parameters: { negative_prompt: "deformed, blurry, bad anatomy" }
                    }),
                }
            );
            const blob = await response.blob();
            variations.push(URL.createObjectURL(blob));
        }
        return variations;
    } catch (e) {
        console.error("Nano Banana generation failed", e);
        return Array(4).fill(0).map((_, i) => `${sourceUrl}&variant=${i}`);
    }
  }

  /**
   * Generates viral marketing copy for specific social channels.
   */
  async generateMarketingCopy(productTitle, channel = 'tiktok') {
    const prompts = {
      tiktok: `Create a viral TikTok ad script for "${productTitle}". Include a high-energy HOOK, the VALUE PROP, and a CTA. Format as JSON: { "headline": "...", "body": "...", "cta": "..." }`,
      facebook: `Create a high-conversion Facebook ad for "${productTitle}". Focus on EMOTIONAL BENEFITS and SCARCITY. Format as JSON: { "headline": "...", "body": "...", "cta": "..." }`,
      instagram: `Create an aesthetic Instagram caption for "${productTitle}". Use STORYTELLING and EMOJIS. Format as JSON: { "headline": "...", "body": "...", "cta": "..." }`,
      google: `Create a high-CTR Google Search ad for "${productTitle}". Focus on FEATURES and RELIABILITY. Format as JSON: { "headline": "...", "body": "...", "cta": "..." }`
    };

    const prompt = prompts[channel.toLowerCase()] || prompts.tiktok;

    try {
        const response = await this.model.generateContent(prompt);
        const responseData = response.response.text();
        // Basic cleanup of GPT-style markdown if present
        const jsonStr = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("AI Marketing Fail:", e);
        return {
            headline: `${productTitle} - Limited Offer`,
            body: `Experience the best of ${productTitle}. Highly rated and currently trending in your area. Secure yours while stocks last.`,
            cta: "Shop Now"
        };
    }
  }
}

export default new AIService();
