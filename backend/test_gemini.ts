import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

console.log("-----------------------------------------");
console.log("🔍 Testing Gemini API Connectivity");
console.log("-----------------------------------------");

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY not found in .env");
  process.exit(1);
}

console.log(`✅ API Key Found (Length: ${GEMINI_API_KEY.length})`);

if (GEMINI_API_KEY.includes(" ")) {
  console.error("❌ ERROR: API Key contains spaces!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testConnection() {
  try {
    console.log("📡 Sending test prompt to Gemini 1.5 Flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Hello, I am Gemini and I am ready to help!'");
    const response = await result.response;
    const text = response.text();
    console.log("-----------------------------------------");
    console.log("🤖 Gemini Response:");
    console.log(text);
    console.log("-----------------------------------------");
    console.log("✨ SUCCESS: Connectivity verified!");
  } catch (error: any) {
    console.error("❌ FAILED: Gemini API Error:");
    console.error(error.message || error);
    process.exit(1);
  }
}

testConnection();
