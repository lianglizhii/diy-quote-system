import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// Helper to initialize the client securely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please select a valid API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateProductsToEnglish = async (products: Product[]): Promise<Product[]> => {
  const ai = getAiClient();

  const prompt = `
    You are a professional translator for an Electric Vehicle (EV) factory. 
    Translate the technical specifications and names of the following EV products from Chinese to English.
    Keep numerical values, model numbers, and technical units (V, Ah, W) unchanged.
    Translate fields: "name", "battery", "motor", "brakeTire", "seatDash", "controlFunc", "additional", "colors".
    Do not translate "id", "model", "price".
    
    Return the result strictly as a JSON array of objects matching the input structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: JSON.stringify(products) + "\n\n" + prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              model: { type: Type.STRING },
              name: { type: Type.STRING },
              battery: { type: Type.ARRAY, items: { type: Type.STRING } },
              motor: { type: Type.STRING },
              brakeTire: { type: Type.STRING },
              seatDash: { type: Type.STRING },
              controlFunc: { type: Type.STRING },
              additional: { type: Type.STRING },
              colors: { type: Type.ARRAY, items: { type: Type.STRING } },
              price: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return products;
    
    return JSON.parse(text) as Product[];

  } catch (error) {
    console.error("Translation failed:", error);
    // Fallback: return original if translation fails
    return products;
  }
};