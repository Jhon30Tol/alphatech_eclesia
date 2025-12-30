
import { GoogleGenAI } from "@google/genai";

export const getAIInsights = async (metrics: any) => {
  try {
    // Corrected initialization: Always use { apiKey: process.env.API_KEY } directly as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Como um consultor de negócios especializado em SaaS, analise os seguintes dados de desempenho:
      ${JSON.stringify(metrics)}
      
      Forneça um resumo curto (3-4 frases) em Português do Brasil sobre o estado atual do negócio e uma recomendação estratégica.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly accessing .text property as per GenerateContentResponse guidelines.
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights da IA:", error);
    return "Desculpe, não foi possível gerar insights no momento. Verifique sua conexão ou chave de API.";
  }
};
