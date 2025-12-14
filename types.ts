export interface Lead {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  roofAge: number;
  roofType: 'Asphalt' | 'Composite' | 'Tile' | 'Metal';
  condition: 'Critical' | 'Poor' | 'Fair' | 'Good';
  satelliteConfidence: number; // 0-100
  lastScanned: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  // Extended Analysis Data
  surfaceArea: number; // sq ft
  pitch: string; // e.g., "6/12"
  damageVector: 'Hail' | 'Wind' | 'Thermal' | 'Organic Growth' | 'None';
  estimatedValue: number;
  competitorActivity: 'None' | 'Low' | 'Moderate' | 'High';
  // CRM Status
  status: 'New' | 'Claimed' | 'Archived' | 'Secured' | 'Lost' | 'Booked';
  inspectionType?: 'Satellite' | 'Drone';
  // Operations
  assignedTeam?: 'Alpha' | 'Bravo' | 'Charlie';
  teamProgress?: number;
  // Deep Scan Intel
  ownerName?: string;
  insuranceCarrier?: string;
  isIntelDecrypted?: boolean;
  // Negotiation
  negotiationMessages?: ChatMessage[];
  homeownerMood?: 'Skeptical' | 'Busy' | 'Interested' | 'Angry' | 'Price-Conscious';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Rival {
  id: string;
  lat: number;
  lng: number;
  targetLeadId: string;
  speed: number;
}

export interface ScanRegion {
  city: string;
  state: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  PAUSED = 'PAUSED',
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  xp?: number;
}

export type WeatherCondition = 'CLEAR' | 'WIND' | 'HAIL';