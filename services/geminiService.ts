
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanResponse, TravelPreferences } from "../types";

// Always create a fresh instance to ensure the latest API key is used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Utility to extract JSON from a potential markdown code block
 */
const parseJsonFromText = (text: string) => {
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
  const prompt = `Plan a highly detailed travel itinerary from ${from} to ${to} on ${date}. 
  Preferences: Transport: ${preferences.transport}, Budget: ${preferences.budget}, Seats: ${preferences.seats}, Allow Red-eye: ${preferences.allowRedEye}.
  Provide 2 travel options. Each option MUST include full-link timing:
  1. Departure: Home to Hub (airport/station) with predicted transit time using local transit data.
  2. Terminal Logistics: Specific predictions for Check-in, Security lines, and estimated walking time to gate/platform based on hub size.
  3. Main Leg: Real-time flight/train simulation with carrier details (price, availability) using Google Search.
  4. Arrival: Hub to destination center logistics, including immigration/customs time for international routes.
  
  Local Information Needed:
  - Weather: 3-day forecast for destination.
  - Tips: Guide on local transport cards (IC cards, passes), SIM card/eSIM availability at the hub.
  - Practicalities: Power socket type (e.g., Type A/C), Voltage (e.g., 100V), and Currency tips.
  - Emergency: Local emergency numbers (Police, Ambulance) and Embassy contact if cross-border.

  Compliance Check: Determine if each option fits a typical corporate budget of ¥5000 and standard cabin classes.
  Use Google Search for latest schedules and prices. Use Google Maps for terminal/hub layout logic.
  
  IMPORTANT: Return the response strictly in JSON format matching this structure:
  {
    "options": [
      {
        "id": "string",
        "transportType": "string",
        "totalCost": number,
        "totalDuration": number,
        "score": number,
        "compliance": boolean,
        "segments": [{ "id": "string", "type": "transit|security|main|arrival", "title": "string", "description": "string", "startTime": "string", "duration": number, "warning": "string" }]
      }
    ],
    "localInfo": {
      "weather": "string",
      "tips": "string",
      "emergency": "string",
      "practicalities": "string"
    }
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: userLocation
        }
      }
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
    contents: `Check current visa requirements for a traveler from ${origin} visiting ${destination}. Include stay duration limits, required documents, and whether an e-visa or visa-on-arrival is available. Use Google Search for the most up-to-date policy.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Visa information currently unavailable.";
};

export const getSmartAlerts = async (destination: string): Promise<any[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identify 3 high-impact travel alerts for ${destination} for the next 7 days. 
    1. Check for extreme weather or natural events using Google Search.
    2. Check for major events (concerts, marathons, holidays) that might cause transport delays or price spikes.
    3. Identify any significant price trends for airfare or accommodation to ${destination}.
    Return ONLY a JSON array of objects: [{id: number, title: string, desc: string, type: 'warning'|'event'|'price', color: 'amber'|'rose'|'indigo'}]`,
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
    contents: `Provide specific carry-on and checked luggage rules for ${airline}. Include weight limits, dimensions, and unique restrictions for lithium batteries or liquids. Use Google Search. Output in clean Markdown.`,
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
  const prompt = `Generate a ${days}-day ${isNiche ? 'unique/niche' : 'classic'} tourist guide for ${destination}. 
  Interests: ${preferences}. Optimize sequence geographically. Include transport modes (walk/bus/taxi) between each location.
  Include local practical info like typical power socket types and currency tips.
  
  IMPORTANT: Return strictly a JSON array: 
  [{ "day": number, "activities": [{ "time": "string", "location": "string", "description": "string", "travelTip": "string", "mapUrl": "string" }] }]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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
    prompt: `A beautiful cinematic travel montage of ${destination}, high quality, vibrant colors, 4k resolution, smooth transitions, peaceful and inviting atmosphere.`,
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
        { text: "Act as a professional travel translator. Translate all visible text in this image into English. If it is a menu, organize it by category. If it is a sign, explain the instructions. If it is a document, summarize the key details." }
      ]
    }
  });
  return response.text;
};

export const analyzeBudgetSplit = async (expenses: any[]): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these group travel expenses and provide a clear settlement plan: ${JSON.stringify(expenses)}. Identify exactly who owes whom how much to equalize the debts. Output a concise and friendly Markdown response.`
  });
  return response.text || "Settlement calculation unavailable.";
};

export const generateTravelReportSummary = async (tripDetails: any): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize this business trip for a formal expense report: ${JSON.stringify(tripDetails)}. Highlight the total cost, major outcomes, and mention any policy deviations. Keep it professional and concise.`
  });
  return response.text || "Report summary generation failed.";
};

export const suggestMeetingTimes = async (arrivalInfo: string, meetings: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on arrival logistics: "${arrivalInfo}", suggest an optimized business schedule for these meetings: "${meetings}". Account for transit to the city center, check-in time, and jet lag recovery. Return a Markdown schedule.`
  });
  return response.text || '';
};

export const generatePackingList = async (destination: string, purpose: string, days: number): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a comprehensive packing list for ${days} days in ${destination} for ${purpose}. Consider the current seasonal climate and local activities. Return a JSON array of strings.`,
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
    contents: `Translate the following travel-related text to ${targetLang}: "${text}". Return only the translation.`
  });
  return response.text || '';
};

export const getDailyTravelInsight = async (): Promise<{text: string, sources: any[]}> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Identify one significant travel-related news item, trending destination alert, or unique safety tip for world travelers today. Use Google Search to ensure the insight is based on current events from the last 24-48 hours. Return a concise Markdown response.",
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text || "Safe travels! Always double-check local transit advisories before your journey.",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
