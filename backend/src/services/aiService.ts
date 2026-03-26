import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing! Gemini AI features will NOT work.");
} else if (GEMINI_API_KEY.includes(" ")) {
  console.error("❌ GEMINI_API_KEY contains spaces! This will likely cause authentication failures.");
} else {
  console.log("✅ GEMINI_API_KEY detected (Length: " + GEMINI_API_KEY.length + ", Format OK)");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * AI Service to handle all interactions with Google Gemini
 */
export const aiService = {
  /**
   * Generates text based on a prompt (using Gemini Flash Latest)
   */
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction 
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        lastError = error;
        // If it's a 404 (model not found), log and try the next one
        if (error.message?.includes("404") || error.status === 404) {
          console.warn(`⚠️ Model ${modelName} not found or unsupported. Trying next...`);
          continue;
        }
        // If it's another error (like 429 quota), throw so the controller can catch it
        console.error(`❌ Gemini error with ${modelName}:`, error);
        throw error;
      }
    }
    
    throw lastError || new Error("All AI models failed to respond.");
  },

  /**
   * Generates vector embeddings for a given text
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      console.error("❌ Gemini getEmbedding error:", error);
      throw error;
    }
  }
};
