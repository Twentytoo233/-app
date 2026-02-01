
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanResponse, TravelPreferences, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Custom error class for API issues
 */
export class GeminiError extends Error {
  constructor(public message: string, public code?: number, public status?: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Utility for exponential backoff retries with smarter 429 handling
 */
const fetchWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 4, initialDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorStr = JSON.stringify(err).toLowerCase();
      const is429 = errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("resource_exhausted") || err.status === 429;
      
      if (is429 && i < maxRetries - 1) {
        // Increase delay significantly for 429s (jittered exponential backoff)
        const delay = (initialDelay * Math.pow(2, i)) + (Math.random() * 1000);
        console.warn(`Quota exceeded (429). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

/**
 * Simple cache wrapper with persistence check
 */
const cache = {
  get: (key: string) => {
    try {
      const data = sessionStorage.getItem(`vm_cache_${key}`);
      if (!data) return null;
      const { val, expiry } = JSON.parse(data);
      if (Date.now() > expiry) {
        sessionStorage.removeItem(`vm_cache_${key}`);
        return null;
      }
      return val;
    } catch { return null; }
  },
  set: (key: string, val: any, ttl = 300000) => {
    try {
      sessionStorage.setItem(`vm_cache_${key}`, JSON.stringify({
        val,
        expiry: Date.now() + ttl
      }));
    } catch (e) { /* ignore storage full errors */ }
  }
};

const handleApiError = async (err: any) => {
  const errorStr = JSON.stringify(err).toLowerCase();
  
  if (errorStr.includes("404") || errorStr.includes("not found") || errorStr.includes("entity was not found")) {
    const aistudio = (window as any).aistudio;
    if (aistudio) await aistudio.openSelectKey();
    throw new GeminiError("API Key missing or invalid. Please re-select your key.", 404);
  }

  if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("resource_exhausted")) {
    throw new GeminiError("Service is temporarily busy (Quota Exceeded). Please wait a moment.", 429, "RESOURCE_EXHAUSTED");
  }

  throw new GeminiError(err.message || "An unexpected error occurred", err.code, err.status);
};

const parseJsonFromText = (text: string) => {
  if (!text) throw new Error("Empty response from model");
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try { return JSON.parse(match[1]); } catch (e2) {}
    }
    const bracketMatch = text.match(/\{[\s\S]*\}/);
    if (bracketMatch) {
        try { return JSON.parse(bracketMatch[0]); } catch (e3) {}
    }
    throw new Error("Could not parse JSON from response");
  }
};

export const generateTravelPlans = async (
  from: string,
  to: string,
  date: string,
  preferences: TravelPreferences,
  lang: Language,
  userLocation?: { latitude: number; longitude: number }
): Promise<TripPlanResponse> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';
      const prompt = `Plan a travel itinerary from ${from} to ${to} on ${date}. 
      Preferences: ${preferences.transport}, Budget: ¥${preferences.budget}.
      CRITICAL: All generated descriptions, tips, and titles MUST be in ${targetLang}. 
      Maintain English JSON keys. Provide 2 travel options.
      Format: {
        "options": [{ "id": "s", "transportType": "s", "totalCost": 0, "totalDuration": 0, "compliance": true, "segments": [{ "id": "s", "type": "transit|security|main|arrival", "title": "s", "description": "s", "startTime": "s", "duration": 0 }] }],
        "localInfo": { "weather": "s", "tips": "s", "emergency": "s" }
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
          toolConfig: userLocation ? {
            retrievalConfig: { latLng: userLocation }
          } : undefined
        }
      });

      const data = parseJsonFromText(response.text || '{}');
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        data.groundingSources = response.candidates[0].groundingMetadata.groundingChunks;
      }
      return data;
    } catch (err) { return handleApiError(err); }
  });
};

export const getVisaRequirements = async (origin: string, destination: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide current visa requirements from ${origin} to ${destination} in ${targetLang}. Use Google Search.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      return response.text || "";
    } catch (err) { return handleApiError(err); }
  });
};

export const getSmartAlerts = async (destination: string, lang: Language): Promise<any[]> => {
  const cacheKey = `alerts_${destination}_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `3 high-impact travel alerts for ${destination} in ${targetLang}. Return JSON array: [{id: 1, title: "s", desc: "s", type: "warning|event|price", color: "amber|rose|indigo"}]`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const data = parseJsonFromText(response.text || '[]');
      cache.set(cacheKey, data, 1800000); // 30 mins cache
      return data;
    } catch (err) { return handleApiError(err); }
  });
};

export const generateTouristGuide = async (
  destination: string, 
  days: number, 
  preferences: string,
  isNiche: boolean,
  lang: Language
): Promise<any> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const prompt = `Generate a ${days}-day ${isNiche ? 'niche' : 'classic'} guide for ${destination} in ${targetLang}. 
      Interests: ${preferences}. JSON array: [{ "day": 1, "activities": [{ "time": "s", "location": "s", "description": "s", "travelTip": "s", "mapUrl": "s" }] }]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleMaps: {} }] }
      });
      return parseJsonFromText(response.text || '[]');
    } catch (err) { return handleApiError(err); }
  });
};

export const getLuggageAdvisor = async (airline: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Luggage rules for ${airline} in ${targetLang}. Use Google Search.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      return response.text || "";
    } catch (err) { return handleApiError(err); }
  });
};

export const analyzeBudgetSplit = async (expenses: any[], lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze expenses and show who owes what in ${targetLang}: ${JSON.stringify(expenses)}.`
      });
      return response.text || "";
    } catch (err) { return handleApiError(err); }
  });
};

export const generateTravelReportSummary = async (tripDetails: any, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a summary for this expense report in ${targetLang}: ${JSON.stringify(tripDetails)}.`
      });
      return response.text || "";
    } catch (err) { return handleApiError(err); }
  });
};

export const suggestMeetingTimes = async (arrivalInfo: string, meetings: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest business schedule based on arrival: "${arrivalInfo}" and meetings: "${meetings}" in ${targetLang}.`
      });
      return response.text || '';
    } catch (err) { return handleApiError(err); }
  });
};

export const generatePackingList = async (destination: string, purpose: string, days: number, lang: Language): Promise<string[]> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Packing list for ${days} days in ${destination} for ${purpose} in ${targetLang}. Return JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (err) { return handleApiError(err); }
  });
};

export const getDailyTravelInsight = async (lang: Language): Promise<{text: string, sources: any[]}> => {
  const cacheKey = `insight_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify one major travel news or tip for today in ${targetLang} using Google Search.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const data = {
        text: response.text || "",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
      cache.set(cacheKey, data, 3600000); // 1 hour cache
      return data;
    } catch (err) { return handleApiError(err); }
  });
};

export const generateDestinationVideo = async (destination: string) => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A beautiful cinematic travel montage of ${destination}, high quality, vibrant colors.`,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (err) { return handleApiError(err); }
  });
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLang}: "${text}".`
      });
      return response.text || '';
    } catch (err) { return handleApiError(err); }
  });
};

export const translateImage = async (base64Data: string, mimeType: string, lang: Language) => {
  return fetchWithRetry(async () => {
    try {
      const ai = getAI();
      const targetLang = lang === 'cn' ? 'Chinese' : 'English';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: `Translate all text in this image into ${targetLang}.` }
          ]
        }
      });
      return response.text;
    } catch (err) { return handleApiError(err); }
  });
};
