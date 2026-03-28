import { Request, Response } from "express";
import { aiService } from "../services/aiService";

export const startInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobRole } = req.body;
    
    if (!jobRole) {
      res.status(400).json({ error: "Job role is required." });
      return;
    }

    const firstQuestionPrompt = "Start the interview by introducing yourself and asking the first question.";
    
    const response = await aiService.generateInterviewResponse(
      [], 
      firstQuestionPrompt, 
      jobRole
    );

    res.json({ message: response });
  } catch (error: any) {
    console.error("❌ Start Interview Error:", error);
    res.status(500).json({ error: error.message || "Failed to start interview" });
  }
};

export const continueInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { history, answer, jobRole } = req.body;
    
    if (!jobRole || !answer || !Array.isArray(history)) {
      res.status(400).json({ error: "history, answer, and jobRole are required." });
      return;
    }

    const response = await aiService.generateInterviewResponse(
      history, 
      answer, 
      jobRole
    );

    res.json({ message: response });
  } catch (error: any) {
    console.error("❌ Continue Interview Error:", error);
    res.status(500).json({ error: error.message || "Failed to continue interview" });
  }
};
