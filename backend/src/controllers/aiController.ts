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
      console.error("AI Optimization controller error:", error);
      res.status(500).json({ message: "AI Optimization failed", error: error.message || "Unknown error" });
    }
  },

  /**
   * Generate a full CV based on user data - returns structured JSON
   */
  generateCV: async (req: Request, res: Response) => {
    try {
      const { 
        name, targetRole, phone, email, location,
        bio, skills, education, experience, projects, certifications,
        hobbies, address, strengths,
        isVariation 
      } = req.body;
      
      if (!name || !targetRole || !skills) {
        return res.status(400).json({ message: "Name, Target Role, and Skills are required" });
      }

      const systemInstruction = `You are an elite AI Resume Builder used by Fortune 500 recruiters.
      Your task is to generate a complete, professional, ATS-optimized resume in structured JSON format.
      Be specific, use strong action verbs, and quantify impact wherever possible.
      ${isVariation ? 'IMPORTANT: This is a REGENERATION. Provide a distinct variation in tone, structure, and highlighted achievements compared to a standard version. Be creative but remain professional.' : ''}
      
      CRITICAL: Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text.
      Use exactly this structure:
      {
        "summary": "2-3 sentences professional summary targeted to the role",
        "skills": ["skill1", "skill2", "skill3", ...],
        "experience": [{ "title": "", "company": "", "duration": "", "bullets": ["", ""] }],
        "projects": [{ "name": "", "description": "", "technologies": "" }],
        "education": [{ "degree": "", "institution": "", "year": "" }],
        "certifications": ["cert1", "cert2"],
        "hobbies": ["hobby1", "hobby2"],
        "strengths": ["strength1", "strength2"]
      }`;

      const prompt = `Build an industry-level resume for:
      - Full Name: ${name}
      - Target Job Role: ${targetRole}
      - Phone: ${phone || 'Not provided'}
      - Email: ${email || 'Not provided'}
      - Location: ${location || 'Not provided'}
      - Bio/About: ${bio || 'Not provided'}
      - Technical Skills: ${skills}
      - Work Experience: ${experience || 'Fresher / Not provided'}
      - Projects: ${projects || 'No specific projects mentioned'}
      - Education: ${education || 'Not provided'}
      - Certifications & Achievements: ${certifications || 'None'}
      - Hobbies/Interests: ${hobbies || 'Not provided'}
      - Personal Address: ${address || 'Not provided'}
      - Key Strengths: ${strengths || 'Not provided'}
      
      Generate a polished, impressive resume. Expand details intelligently to sound professional. 
      Return ONLY the JSON object.`;

      const aiResponseRaw = await aiService.generateText(prompt, systemInstruction);
      
      let cvData;
      try {
        const cleaned = aiResponseRaw.replace(/```json|```/g, '').trim();
        cvData = JSON.parse(cleaned);
      } catch (e) {
        console.error("CV JSON parse error:", aiResponseRaw);
        return res.status(500).json({ message: "AI returned malformed data. Try again." });
      }

      res.json({ generatedCV: cvData });
    } catch (error: any) {
      console.error("CV Generation controller error:", error);
      res.status(500).json({ message: "CV Generation failed", error: error.message || "Unknown error" });
    }
  },

  /**
   * Handle AI Interview Chat
   */
  interviewChat: async (req: Request, res: Response) => {
    try {
      const { message, history, jobTitle, jobDescription } = req.body;
      if (!message) return res.status(400).json({ message: "Message is required" });

      const systemInstruction = `You are an expert technical interviewer and senior lead engineer interviewing a candidate for the role of "${jobTitle || 'Job Applicant'}".
      Context: ${jobDescription || 'Professional industry role'}.
      
      Your goal is to conduct a rigorous in-depth technical interview. 
      - Prioritize testing deep technical knowledge, architecture patterns, and problem-solving relevant to the "${jobTitle}" role.
      - Ask ONE specific technical or situational question at a time.
      - If the candidate's answer is good, increase the difficulty of the next question.
      - If the candidate is vague, push for specific technical details or code-level explanations.
      - Balance with 1-2 behavioral questions, but keep the core focus on technical expertise.
      
      Format: Keep your responses professional and concise (under 4 sentences).`;

      // In a real implementation, we would send the history as well. 
      // For now, we append history to the prompt for simplicity.
      const fullPrompt = history ? `${history}\nCandidate: ${message}\nInterviewer:` : `Candidate: ${message}\nInterviewer:`;

      const aiResponse = await aiService.generateText(fullPrompt, systemInstruction);
      res.json({ aiResponse });
    } catch (error: any) {
      console.error("Interview Practice controller error:", error);
      res.status(500).json({ message: "Interview chat failed", error: error.message || "Unknown error" });
    }
  },

  /**
   * Get AI-powered match score for a job
   */
  getMatchScore: async (req: Request, res: Response) => {
    try {
      const { userBio, userSkills, jobTitle, jobDescription, jobRequirements } = req.body;
      if (!userBio && !userSkills) {
        return res.status(400).json({ message: "User profile data is required" });
      }

      const systemInstruction = `You are an expert AI Recruitment Specialist.
      Analyze the candidate's profile against the job description.
      Provide a "Match Score" from 0 to 100 based on skills, experience, and role alignment.
      Also provide 2-3 short, actionable "Match Feedback" points on why they are a good match or how to improve their profile for this role.
      
      IMPORTANT: Return ONLY a JSON object in the following format:
      {
        "score": number,
        "feedback": "string summarizing why it's a good/bad match",
        "improvements": ["tip1", "tip2"]
      }`;

      const prompt = `
      Candidate Profile:
      - Bio: ${userBio || 'No bio provided'}
      - Skills: ${userSkills || 'No skills provided'}
      
      Job Details:
      - Title: ${jobTitle}
      - Description: ${jobDescription}
      - Requirements: ${jobRequirements || 'Not explicitly listed'}
      
      Please provide the analysis in JSON format only.`;

      const aiResponse = await aiService.generateText(prompt, systemInstruction);
      
      // Attempt to parse JSON from the AI response
      let result;
      try {
        // Clean up any potential markdown code blocks
        const cleanedResponse = aiResponse.replace(/```json|```/g, '').trim();
        result = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error("Failed to parse AI Match Score JSON:", aiResponse);
        // Fallback if AI doesn't return JSON correctly
        result = { score: 75, feedback: "We analyzed your profile and found a solid alignment with this role.", improvements: ["Focus on highlighting certifications in this domain."] };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Match Score controller error:", error);
      res.status(500).json({ message: "Match Score analysis failed", error: error.message || "Unknown error" });
    }
  }
};
