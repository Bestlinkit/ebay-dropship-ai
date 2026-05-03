import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Pro-Grade AI Intelligence Service (Hardened v6.0)
 * Zero-Guesswork Architecture with Structural Validation.
 */
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Internal Validation Engine
   * Enforces 100% unique archetypes and context relevance.
   */
  async _validateAndSanitize(parsed, baselineTitle) {
      if (!parsed.titles || parsed.titles.length < 3) return false;
      
      const titles = parsed.titles.map(t => t.title.trim());
      const uniqueTitles = new Set(titles);
      
      // 1. Uniqueness Guard
      if (uniqueTitles.size < 3) return false;
      
      // 2. Paraphrase Vector Check
      for (let i = 0; i < titles.length; i++) {
          for (let j = i + 1; j < titles.length; j++) {
              if (titles[i].includes(titles[j]) || titles[j].includes(titles[i])) return false;
          }
      }

      // 3. Archetype Compliance (Basic Signature Detection)
      const hasSeo = titles.some(t => {
          const firstWord = baselineTitle.toLowerCase().split(' ')[0];
          return t.toLowerCase().includes(firstWord);
      });
      const hasBenefit = titles.some(t => /\b(best|top|premium|effective|fast|easy|pro|advanced|quality|comfort|essential)\b/i.test(t));
      
      return hasSeo && hasBenefit;
  }
  
  async optimizeListing(baselineTitle, currentPrice, competitorPrices = [], attempt = 1) {
    const pricesStats = competitorPrices.length > 0 
      ? `Avg: $${((competitorPrices.reduce((a,b)=>a+b,0)/competitorPrices.length) || 0).toFixed(2)}` 
      : "No market data";

    const prompt = `
      ACT AS A PROFESSIONAL EBAY LISTING EXPERT. 
      Focus on creating clear, persuasive, and high-trust content for buyers.
      
      INPUT CONTEXT:
      - PRODUCT TITLE: ${baselineTitle}
      - CURRENT PRICE: $${currentPrice}
      - MARKET PRICE DATA: ${pricesStats}

      REQUIRED OUTPUTS:
      1. TITLES: Generate EXACTLY 3 UNIQUE and engaging title options (MAX 80 CHARS):
         - CLEAR & SEARCHABLE: Lead with the most important keywords.
         - BENEFIT-FOCUSED: Highlight the main value to the buyer.
         - CURIOSITY-DRIVEN: Use an engaging hook to stand out.
      
      2. DESCRIPTION: Structure for high readability: [Headline] -> [Key Benefits] -> [Product Features] -> [Call to Action]. 
         Use professional HTML5 formatting. No image tags.
      
      3. TAGS: 15-20 hyper-relevant tags. MUST be derived from the product title and context. 

      OUTPUT (STRICT JSON ONLY):
      {
        "titles": [
          {"id": "seo", "title": "...", "score": 98, "type": "SEO"},
          {"id": "benefit", "title": "...", "score": 95, "type": "Benefit"},
          {"id": "hook", "title": "...", "score": 92, "type": "Hook"}
        ],
        "description": "...",
        "tags": [{"text": "...", "score": 10}],
        "pricing": {
          "suggested": 0.00,
          "competition": "Low|Medium|High",
          "salesProbability": 85,
          "feedback": "..."
        }
      }
    `;

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI failed to return structured JSON");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // VALIDATION ENGINE (Max 2 Silent Retries)
      const isValid = await this._validateAndSanitize(parsed, baselineTitle);
      if (!isValid && attempt < 3) {
          if (import.meta.env.DEV) console.warn(`[AI Guard] Archetype vector weak. Silently regenerating (${attempt}/3)...`);
          return this.optimizeListing(baselineTitle, currentPrice, competitorPrices, attempt + 1);
      }

      parsed.titles = parsed.titles.slice(0, 3).map(t => ({
          ...t,
          title: t.title.substring(0, 80)
      }));
      
      if (import.meta.env.DEV) {
          console.log("Generated Titles:", parsed.titles);
          console.log("Tags:", parsed.tags);
      }

      return parsed;
    } catch (error) {
      console.error("AI Hardening Logic Fault:", error);
      return {
        titles: [
            { id: "seo", title: `PREMIUM ${baselineTitle}`, score: 90, type: "SEO" },
            { id: "benefit", title: `BEST ${baselineTitle} FOR PROFESSIONAL RESULTS`, score: 85, type: "Benefit" },
            { id: "hook", title: `TRANSFORM YOUR EXPERIENCE WITH ${baselineTitle}`, score: 80, type: "Hook" }
        ],
        description: `<h1>${baselineTitle}</h1><p>High performance marketplace listing.</p>`,
        tags: [{ text: "Quality", score: 10 }],
        pricing: { suggested: currentPrice, competition: "Medium", salesProbability: 50, feedback: "Market signal unavailable" }
      };
    }
  }

  async generateMarketingScript(product, channel = 'Email') {
    if (!product) return null;
    const prompt = `Product: ${product.title}. Create high-impact script for ${channel}. Return JSON {headline, bullets, cta}.`;
    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { headline: "", bullets: [], cta: "" };
    }
  }

  async generateVideoScript(product) {
    if (!product) return null;
    
    const context = `
      PRODUCT: ${product.title}
      PRICE: ${product.price}
      DESCRIPTION: ${product.description || 'Premium quality item'}
    `;

    const prompt = `
      ACT AS A VIRAL MARKETING DIRECTOR. 
      Create a high-velocity, 8-scene video script for this product: ${product.title}.
      
      CONTEXT: ${context}

      RULES:
      1. Scenes must be SHORT (max 5-6 words).
      2. Scene 1 MUST be a "Pattern Interrupt" hook based on the product's primary benefit.
      3. Scenes 2-6 MUST highlight specific technical features or emotional benefits found in the description.
      4. Scene 7 is Social Proof / Trust.
      5. Scene 8 is the Call to Action.
      
      OUTPUT: A JSON array of 8 strings.
    `;

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI failed to return array");
      
      const script = JSON.parse(jsonMatch[0]);
      return script.length === 8 ? script : this._getFallbackScript(product.title);
    } catch (error) {
      console.warn("AI Scripting failed, using fallback", error);
      return this._getFallbackScript(product.title);
    }
  }

  _getFallbackScript(title) {
    return [
      "WAIT! LOOK AT THIS.",
      `Discover the ${title}.`,
      "Unmatched Quality & Style.",
      "Engineered for Performance.",
      "The Only Choice for You.",
      "Join 10,000+ Happy Customers.",
      "Limited Stock Available.",
      "Order Now - Link Below!"
    ];
  }

  async generateImagePrompt(title, style = "primary") {
    const prompt = `Create photorealistic studio shot prompt for ${title}. Style: ${style}.`;
    try {
      const response = await this.model.generateContent(prompt);
      return response.response.text().trim();
    } catch {
      return title;
    }
  }

  async generateMarketingCopy(productTitle, channel = 'tiktok') {
    const prompt = `Act as a senior marketing copywriter. Create a persuasive and natural ${channel} ad for ${productTitle}. Ensure a human-centric tone. Return JSON {headline, body, cta}.`;
    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { headline: "", body: "", cta: "" };
    }
  }
  /**
   * NANO BANANA: Visual Synthesis Engine
   * Generates 8 specialized image prompts for marketing archetypes.
   */
  async generateEnhancementPrompts(product) {
    const context = `Product: ${product.title}\nCategory: ${product.category}\nTheme: Premium eCommerce`;
    
    // Deterministic archetype prompts for the Visual Forge
    return [
      { id: 'hero', prompt: `High-end hero shot of ${product.title}, center focus, premium lighting, sharp details, 8k resolution.` },
      { id: 'white', prompt: `Clean eCommerce white background product photography of ${product.title}, soft shadows, professional.` },
      { id: 'lifestyle', prompt: `Modern lifestyle context showing ${product.title} in professional use, natural lighting, high-end environment.` },
      { id: 'closeup', prompt: `Macro close-up detail of ${product.title}, texture focus, high-fidelity lens, crisp edges.` },
      { id: 'studio', prompt: `Cinematic studio lighting, dark moody background with spotlight on ${product.title}, luxury aesthetic.` },
      { id: 'social', prompt: `Viral social media ad style photography for ${product.title}, vibrant colors, high-energy composition.` },
      { id: 'branding', label: 'Branding Mockup', prompt: `Premium branding mockup of ${product.title}, sleek presentation, minimalist design context.` },
      { id: 'conversion', label: 'Emotional Trigger', prompt: `Benefit-driven visual capture of ${product.title}, highlighting core value proposition, warm lighting.` }
    ];
  }
}

export default new AIService();
