
export type TransportType = 'Flight' | 'Train' | 'Car' | 'Bus';
export type Language = 'en' | 'cn';

export interface TripContext {
  from: string;
  to: string;
  date: string;
}

export interface TripSegment {
  id: string;
  type: 'transit' | 'security' | 'main' | 'transfer' | 'arrival';
  title: string;
  description: string;
  startTime: string;
  duration: number; // minutes
  location?: string;
  warning?: string;
}

export interface TravelOption {
  id: string;
  transportType: TransportType;
  totalCost: number;
  totalDuration: number;
  score: number;
  segments: TripSegment[];
  compliance?: boolean;
}

export interface TravelPreferences {
  budget: number;
  transport: string;
  seats: string;
  allowRedEye: boolean;
  businessCompliance: boolean;
  nicheInterests?: string[];
}

export interface TripPlanResponse {
  options: TravelOption[];
  localInfo: {
    weather: string;
    tips: string;
    emergency: string;
  };
  groundingSources?: { web?: { uri: string; title: string }; maps?: { uri: string; title: string } }[];
}

export interface ItineraryDay {
  day: number;
  activities: {
    time: string;
    location: string;
    description: string;
    travelTip: string;
    mapUrl?: string;
  }[];
}
