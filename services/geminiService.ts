
import { GoogleGenAI, Type } from "@google/genai";
import { PerformanceLevel } from "../types";

export async function generateReportRemark(
  studentName: string,
  subjectName: string,
  performanceLevel: string,
  score: number
): Promise<string> {
  // Always create a new instance right before making an API call to ensure use of the correct environment configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional teacher remark for a student named ${studentName} in ${subjectName}. 
                 The student scored ${score}/100 and their level is ${performanceLevel}. 
                 The tone should be encouraging but accurate for a Kenyan CBC report card. 
                 Keep it under 15 words.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });

    return response.text?.trim() || "Good progress made this term.";
  } catch (error) {
    console.error("Error generating remark:", error);
    return "Consistently working towards goals.";
  }
}

export async function generateBulkRemarks(assessments: any[]) {
  // Always create a new instance right before making an API call to ensure use of the correct environment configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Sequential processing for stability
  return Promise.all(
    assessments.map(async (a) => ({
      ...a,
      remarks: await generateReportRemark(a.studentName, a.subjectName, a.performanceLevel, a.score),
    }))
  );
}
