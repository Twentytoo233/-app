
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanResponse, TravelPreferences } from "../types";

// Always create a fresh instance to ensure the latest API key is used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Utility to extract JSON from a potential markdown code block
 */
const parseJsonFromText = (text: string) => {
  if (!text) throw new Error("Empty response from model");
  try {
    // If it's already pure JSON
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from markdown blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON", e2);
      }
    }
    // Last ditch: try to find anything between { and }
    const bracketMatch = text.match(/\{[\s\S]*\}/);
    if (bracketMatch) {
        try {
            return JSON.parse(bracketMatch[0]);
        } catch (e3) {
            console.error("Failed to parse bracketed JSON", e3);
        }
    }
    throw new Error("Could not parse JSON from response");
  }
};

export const generateTravelPlans = async (
  from: string,
  to: string,
  date: string,
  preferences: TravelPreferences,
  userLocation?: { latitude: number; longitude: number }
): Promise<TripPlanResponse> => {
  const ai = getAI();
  const prompt = `Plan a travel itinerary from ${from} to ${to} on ${date}. 
  Preferences: ${preferences.transport}, Budget: ¥${preferences.budget}.
  Provide 2 travel options in JSON format. Include:
  1. Full logistics: Home to Hub, Terminal (Security/Check-in), Main Leg (carrier/price), and Arrival Hub to Center.
  2. Local info: 3-day weather, transport card tips, power sockets, and emergency numbers.
  3. Compliance: Check if fits ¥5000 corporate budget.
  
  Format: {
    "options": [{ "id": "s", "transportType": "s", "totalCost": 0, "totalDuration": 0, "compliance": true, "segments": [{ "id": "s", "type": "transit|security|main|arrival", "title": "s", "description": "s", "startTime": "s", "duration": 0 }] }],
    "localInfo": { "weather": "s", "tips": "s", "emergency": "s", "practicalities": "s" }
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      toolConfig: userLocation ? {
        retrievalConfig: {
          latLng: userLocation
        }
      } : undefined
    }
  });

  const text = response.text || '{}';
  const data = parseJsonFromText(text);
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    data.groundingSources = groundingChunks;
  }
  return data;
};

export const getVisaRequirements = async (origin: string, destination: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Current visa requirements for traveler from ${origin} to ${destination}. Use Google Search.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Visa information currently unavailable.";
};

export const getSmartAlerts = async (destination: string): Promise<any[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `3 high-impact travel alerts for ${destination} for next 7 days (weather, events, prices). Return JSON array: [{id: 1, title: "s", desc: "s", type: "warning|event|price", color: "amber|rose|indigo"}]`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return parseJsonFromText(response.text || '[]');
};

export const getLuggageAdvisor = async (airline: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Luggage rules for ${airline} (carry-on, checked, batteries). Use Google Search.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "No specific rules found.";
};

export const generateTouristGuide = async (
  destination: string, 
  days: number, 
  preferences: string,
  isNiche: boolean
): Promise<any> => {
  const ai = getAI();
  const prompt = `Generate a ${days}-day ${isNiche ? 'niche' : 'classic'} guide for ${destination}. 
  Interests: ${preferences}. JSON array: [{ "day": 1, "activities": [{ "time": "s", "location": "s", "description": "s", "travelTip": "s", "mapUrl": "s" }] }]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }]
    }
  });
  return parseJsonFromText(response.text || '[]');
};

export const generateDestinationVideo = async (destination: string) => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A beautiful cinematic travel montage of ${destination}, high quality, vibrant colors.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const translateImage = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Translate all text in this image into English. Summarize if document, categorize if menu." }
      ]
    }
  });
  return response.text;
};

export const analyzeBudgetSplit = async (expenses: any[]): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze expenses and show who owes what to whom: ${JSON.stringify(expenses)}. Concise Markdown.`
  });
  return response.text || "Settlement calculation unavailable.";
};

export const generateTravelReportSummary = async (tripDetails: any): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Professional summary for expense report: ${JSON.stringify(tripDetails)}.`
  });
  return response.text || "Report summary generation failed.";
};

export const suggestMeetingTimes = async (arrivalInfo: string, meetings: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest business schedule based on arrival: "${arrivalInfo}" and meetings: "${meetings}". Markdown.`
  });
  return response.text || '';
};

export const generatePackingList = async (destination: string, purpose: string, days: number): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Packing list for ${days} days in ${destination} for ${purpose}. JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to ${targetLang}: "${text}". Return only translation.`
  });
  return response.text || '';
};

export const getDailyTravelInsight = async (): Promise<{text: string, sources: any[]}> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Identify one major travel news or tip for today using Google Search. Concise Markdown.",
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text || "Safe travels! Check local advisories before your journey.",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
