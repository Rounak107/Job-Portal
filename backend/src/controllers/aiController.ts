import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const aiController = {
  /**
   * Optimize a CV section
   */
  optimizeCVSection: async (req: Request, res: Response) => {
    try {
      const { text, sectionType } = req.body;
      if (!text) return res.status(400).json({ message: "Text is required" });

      const systemInstruction = `You are an expert career coach and ATS optimization specialist. 
      The user will provide text for a resume section titled "${sectionType || 'Experience'}". 
      Transform this into 3-5 high-impact, professional bullet points using action verbs. 
      Keep it concise and industry-standard. Do not include introductory text, just the bullet points.`;

      const optimizedText = await aiService.generateText(text, systemInstruction);
      res.json({ optimizedText });
    } catch (error: any) {
      res.status(500).json({ message: "AI Optimization failed", error: error.message });
    }
  },

  /**
   * Generate a full CV based on user data
   */
  generateCV: async (req: Request, res: Response) => {
    try {
      const { name, currentProfession, targetRole, experienceLevel, additionalInfo } = req.body;
      
      const systemInstruction = `You are an expert AI Resume Builder. 
      Generate a complete, professional, ATS-friendly CV formatted in Markdown.
      Include sections for: Summary/Objective, Core Competencies/Skills, Professional Experience, and Education.
      Please make it highly tailored to the target role. DO NOT wrap the response in markdown code blocks, just return the raw markdown text.`;

      const prompt = `Candidate Details:
      - Name: ${name || 'Candidate'}
      - Current Profession: ${currentProfession || 'Not specified'}
      - Target Role: ${targetRole || 'Not specified'}
      - Experience Level: ${experienceLevel || 'Not specified'}
      - Additional Information/Highlights: ${additionalInfo || 'None provided'}
      
      Please generate a comprehensive and impressive CV based on these details. Expand on the details intelligently to sound professional.`;

      const generatedCV = await aiService.generateText(prompt, systemInstruction);
      res.json({ generatedCV });
    } catch (error: any) {
      res.status(500).json({ message: "CV Generation failed", error: error.message });
    }
  },

  /**
   * Handle AI Interview Chat
   */
  interviewChat: async (req: Request, res: Response) => {
    try {
      const { message, history, jobTitle, jobDescription } = req.body;
      if (!message) return res.status(400).json({ message: "Message is required" });

      const systemInstruction = `You are a professional HR manager interviewing a candidate for the position of "${jobTitle || 'Job Applicant'}".
      Job Description context: ${jobDescription || 'Standard industry role'}.
      
      Your goal is to conduct a realistic, friendly, but challenging interview. 
      Ask ONE relevant behavioral or technical question at a time. 
      Wait for the candidate's response before asking the next one.
      If the candidate's answer is brief, ask for more detail.
      
      Format: Keep your responses concise (under 3 sentences) to maintain a natural conversation flow.`;

      // In a real implementation, we would send the history as well. 
      // For now, we append history to the prompt for simplicity.
      const fullPrompt = history ? `${history}\nCandidate: ${message}\nInterviewer:` : `Candidate: ${message}\nInterviewer:`;

      const aiResponse = await aiService.generateText(fullPrompt, systemInstruction);
      res.json({ aiResponse });
    } catch (error: any) {
      res.status(500).json({ message: "Interview chat failed", error: error.message });
    }
  }
};
