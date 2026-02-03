import { TripPlanResponse, TravelPreferences, Language } from "../types";

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
 * 调用后端 API 的通用函数
 */
const callBackendAPI = async (action: string, params: any) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new GeminiError(
        errorData.error || `API request failed with status ${response.status}`,
        errorData.code,
        errorData.status
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof GeminiError) {
      throw error;
    }
    throw new GeminiError(error.message || 'Network error occurred', 500);
  }
};

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
      const is429 = errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("resource_exhausted") || err.code === 429;
      
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
    if (typeof window === 'undefined') return null;
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
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`vm_cache_${key}`, JSON.stringify({
        val,
        expiry: Date.now() + ttl
      }));
    } catch (e) { /* ignore storage full errors */ }
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
    return await callBackendAPI('generateTravelPlans', {
      from,
      to,
      date,
      preferences,
      lang,
      userLocation
    });
  });
};

export const getVisaRequirements = async (origin: string, destination: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('getVisaRequirements', { origin, destination, lang });
    return result.text;
  });
};

export const getSmartAlerts = async (destination: string, lang: Language): Promise<any[]> => {
  const cacheKey = `alerts_${destination}_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(async () => {
    return await callBackendAPI('getSmartAlerts', { destination, lang });
  });
  
  cache.set(cacheKey, data, 1800000); // 30 mins cache
  return data;
};

export const generateTouristGuide = async (
  destination: string, 
  days: number, 
  preferences: string,
  isNiche: boolean,
  lang: Language
): Promise<any> => {
  return fetchWithRetry(async () => {
    return await callBackendAPI('generateTouristGuide', {
      destination,
      days,
      preferences,
      isNiche,
      lang
    });
  });
};

export const getLuggageAdvisor = async (airline: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('getLuggageAdvisor', { airline, lang });
    return result.text;
  });
};

export const analyzeBudgetSplit = async (expenses: any[], lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('analyzeBudgetSplit', { expenses, lang });
    return result.text;
  });
};

export const generateTravelReportSummary = async (tripDetails: any, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('generateTravelReportSummary', { tripDetails, lang });
    return result.text;
  });
};

export const suggestMeetingTimes = async (arrivalInfo: string, meetings: string, lang: Language): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('suggestMeetingTimes', { arrivalInfo, meetings, lang });
    return result.text;
  });
};

export const generatePackingList = async (destination: string, purpose: string, days: number, lang: Language): Promise<string[]> => {
  return fetchWithRetry(async () => {
    return await callBackendAPI('generatePackingList', { destination, purpose, days, lang });
  });
};

export const getDailyTravelInsight = async (lang: Language): Promise<{text: string, sources: any[]}> => {
  const cacheKey = `insight_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry(async () => {
    return await callBackendAPI('getDailyTravelInsight', { lang });
  });
  
  cache.set(cacheKey, data, 3600000); // 1 hour cache
  return data;
};

export const generateDestinationVideo = async (destination: string) => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('generateDestinationVideo', { destination });
    // 将 base64 数据转换为 blob URL
    const blob = new Blob([Uint8Array.from(atob(result.videoData), c => c.charCodeAt(0))], { type: result.mimeType });
    return URL.createObjectURL(blob);
  });
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('translateText', { text, targetLang });
    return result.text;
  });
};

export const translateImage = async (base64Data: string, mimeType: string, lang: Language) => {
  return fetchWithRetry(async () => {
    const result = await callBackendAPI('translateImage', { base64Data, mimeType, lang });
    return result.text;
  });
};
