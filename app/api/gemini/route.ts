import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// 确保 API Key 只在后端使用
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 错误处理工具
 */
const handleApiError = (err: any) => {
  const errorStr = JSON.stringify(err).toLowerCase();
  
  if (errorStr.includes("404") || errorStr.includes("not found") || errorStr.includes("entity was not found")) {
    return NextResponse.json(
      { error: "API Key missing or invalid. Please check server configuration.", code: 404 },
      { status: 404 }
    );
  }

  if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("resource_exhausted")) {
    return NextResponse.json(
      { error: "Service is temporarily busy (Quota Exceeded). Please wait a moment.", code: 429, status: "RESOURCE_EXHAUSTED" },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: err.message || "An unexpected error occurred", code: err.code, status: err.status },
    { status: 500 }
  );
};

/**
 * 解析 JSON 响应
 */
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

/**
 * 指数退避重试工具
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const ai = getAI();

    switch (action) {
      case 'generateTravelPlans': {
        const { from, to, date, preferences, lang, userLocation } = params;
        const targetLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';
        const prompt = `Plan a travel itinerary from ${from} to ${to} on ${date}. 
        Preferences: ${preferences.transport}, Budget: ¥${preferences.budget}.
        CRITICAL: All generated descriptions, tips, and titles MUST be in ${targetLang}. 
        Maintain English JSON keys. Provide 2 travel options.
        Format: {
          "options": [{ "id": "s", "transportType": "s", "totalCost": 0, "totalDuration": 0, "compliance": true, "segments": [{ "id": "s", "type": "transit|security|main|arrival", "title": "s", "description": "s", "startTime": "s", "duration": 0 }] }],
          "localInfo": { "weather": "s", "tips": "s", "emergency": "s" }
        }`;

        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }, { googleMaps: {} }],
              toolConfig: userLocation ? {
                retrievalConfig: { latLng: userLocation }
              } : undefined
            }
          });
        });

        const data = parseJsonFromText(response.text || '{}');
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          data.groundingSources = response.candidates[0].groundingMetadata.groundingChunks;
        }
        return NextResponse.json(data);
      }

      case 'getVisaRequirements': {
        const { origin, destination, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Provide current visa requirements from ${origin} to ${destination} in ${targetLang}. Use Google Search.`,
            config: { tools: [{ googleSearch: {} }] }
          });
        });
        return NextResponse.json({ text: response.text || "" });
      }

      case 'getSmartAlerts': {
        const { destination, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `3 high-impact travel alerts for ${destination} in ${targetLang}. Return JSON array: [{id: 1, title: "s", desc: "s", type: "warning|event|price", color: "amber|rose|indigo"}]`,
            config: { tools: [{ googleSearch: {} }] }
          });
        });
        const data = parseJsonFromText(response.text || '[]');
        return NextResponse.json(data);
      }

      case 'generateTouristGuide': {
        const { destination, days, preferences, isNiche, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const prompt = `Generate a ${days}-day ${isNiche ? 'niche' : 'classic'} guide for ${destination} in ${targetLang}. 
        Interests: ${preferences}. JSON array: [{ "day": 1, "activities": [{ "time": "s", "location": "s", "description": "s", "travelTip": "s", "mapUrl": "s" }] }]`;

        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleMaps: {} }] }
          });
        });
        return NextResponse.json(parseJsonFromText(response.text || '[]'));
      }

      case 'getLuggageAdvisor': {
        const { airline, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Luggage rules for ${airline} in ${targetLang}. Use Google Search.`,
            config: { tools: [{ googleSearch: {} }] }
          });
        });
        return NextResponse.json({ text: response.text || "" });
      }

      case 'analyzeBudgetSplit': {
        const { expenses, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze expenses and show who owes what in ${targetLang}: ${JSON.stringify(expenses)}.`
          });
        });
        return NextResponse.json({ text: response.text || "" });
      }

      case 'generateTravelReportSummary': {
        const { tripDetails, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a summary for this expense report in ${targetLang}: ${JSON.stringify(tripDetails)}.`
          });
        });
        return NextResponse.json({ text: response.text || "" });
      }

      case 'suggestMeetingTimes': {
        const { arrivalInfo, meetings, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest business schedule based on arrival: "${arrivalInfo}" and meetings: "${meetings}" in ${targetLang}.`
          });
        });
        return NextResponse.json({ text: response.text || '' });
      }

      case 'generatePackingList': {
        const { destination, purpose, days, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Packing list for ${days} days in ${destination} for ${purpose} in ${targetLang}. Return JSON array of strings.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          });
        });
        return NextResponse.json(JSON.parse(response.text || '[]'));
      }

      case 'getDailyTravelInsight': {
        const { lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify one major travel news or tip for today in ${targetLang} using Google Search.`,
            config: { tools: [{ googleSearch: {} }] }
          });
        });
        return NextResponse.json({
          text: response.text || "",
          sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        });
      }

      case 'generateDestinationVideo': {
        const { destination } = params;
        const operation = await fetchWithRetry(async () => {
          return await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `A beautiful cinematic travel montage of ${destination}, high quality, vibrant colors.`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
          });
        });
        
        let currentOperation = operation;
        while (!currentOperation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
        }
        
        const downloadLink = currentOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
          throw new Error('Video generation failed');
        }
        
        // 在后端获取视频并返回 base64 或 URL
        const apiKey = process.env.GEMINI_API_KEY!;
        const res = await fetch(`${downloadLink}&key=${apiKey}`);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        
        return NextResponse.json({ 
          videoData: base64,
          mimeType: blob.type 
        });
      }

      case 'translateText': {
        const { text, targetLang } = params;
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate to ${targetLang}: "${text}".`
          });
        });
        return NextResponse.json({ text: response.text || '' });
      }

      case 'translateImage': {
        const { base64Data, mimeType, lang } = params;
        const targetLang = lang === 'cn' ? 'Chinese' : 'English';
        const response = await fetchWithRetry(async () => {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: `Translate all text in this image into ${targetLang}.` }
              ]
            }
          });
        });
        return NextResponse.json({ text: response.text });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return handleApiError(error);
  }
}
