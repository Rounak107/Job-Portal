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
    // 2026 Model Support: 1.5 is deprecated (404), Flash Latest (Gemini 3) has strict quotas (429).
    const modelsToTry = ["gemini-2.5-flash", "gemini-3-flash", "gemini-flash-latest"];
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
          console.warn(`⚠️ Model ${modelName} not found (404). Trying next...`);
          continue;
        }
        // If it's a 429 (Quota), throw a friendly message
        if (error.message?.includes("429") || error.message?.includes("quota")) {
          throw new Error(`Google AI Rate Limit Exceeded. Please wait 60 seconds and try again. (Model: ${modelName})`);
        }
        
        console.error(`❌ Gemini error with ${modelName}:`, error);
        throw error;
      }
    }
    
    throw lastError || new Error("All AI models failed or are deprecated.");
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
  },

  /**
   * Generates response for AI Voice Interview
   */
  async generateInterviewResponse(history: { role: string, text: string }[], currentAnswer: string, jobRole: string): Promise<string> {
    const systemInstruction = `You are a professional technical and HR interviewer for the role: ${jobRole}.
    Keep your responses short, conversational, and spoken-language friendly.
    Ask one question at a time. Do not provide a list of questions.
    Provide brief constructive feedback on the previous answer before asking the next question.
    Only ask questions relevant to the role. Keep the interview flowing naturally.`;

    let convo = history.map(h => `${h.role === 'model' ? 'Interviewer' : 'Applicant'}: ${h.text}`).join('\n');
    const prompt = `Conversation so far:\n${convo}\n\nApplicant: ${currentAnswer}\n\nInterviewer:`;
    
    return this.generateText(prompt, systemInstruction);
  }
};
