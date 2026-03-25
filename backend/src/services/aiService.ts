import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables.");
} else {
  console.log("✅ GEMINI_API_KEY is detected (length: " + GEMINI_API_KEY.length + ")");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * AI Service to handle all interactions with Google Gemini
 */
export const aiService = {
  /**
   * Generates text based on a prompt (using Gemini 1.5 Flash)
   */
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction 
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("❌ Gemini generateText error:", error);
      throw error; // Throw the original error so we can see the real message
    }
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
