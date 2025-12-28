
import { GoogleGenAI, Type } from "@google/genai";

export const getMatchCommentary = async (results: { name: string, score: number }[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const winner = sortedResults[0];
  
  const prompt = `
    The space competition 'Cosmic Drift' just ended.
    Results: ${sortedResults.map(r => `${r.name}: ${r.score} pts`).join(', ')}.
    The winner is ${winner.name}.
    Write a short, sophisticated, and slightly witty commentary for the match result in Korean. 
    Target audience: 30s urban professionals. Keep it under 150 characters.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text || "경기가 종료되었습니다. 모두 훌륭한 비행이었습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "통신 불안정으로 인해 AI 해설이 일시 중단되었습니다. 승자에게 축하를!";
  }
};
