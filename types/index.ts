// Patient and Scan Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  village?: string;
  phone?: string;
  createdAt: string;
}

export interface VitalSigns {
  heartRate: number;
  spo2: number;
  temperature: number;
}

export interface SensorData {
  patient_id: string;
  heart_rate: number;
  spo2: number;
  temperature: number;
  timestamp: string;
}

export type RiskLevel = 'RED' | 'AMBER' | 'GREEN';

export interface ScanResult {
  id: string;
  patientId: string;
  vitals: VitalSigns;
  riskScore: number;
  riskLevel: RiskLevel;
  timestamp: string;
  synced: boolean;
  guidance?: AIGuidance;
}

export interface AIGuidance {
  message: string;
  language: 'en' | 'hi' | 'bn';
  urgencyLevel: 'immediate' | 'urgent' | 'routine';
  actions: string[];
}

// API Response Types
export interface ScanResponse {
  success: boolean;
  scanId: string;
  message?: string;
}

export interface PredictionResponse {
  risk_score: number;
  risk_level: RiskLevel;
  vitals_summary: {
    heart_rate: number;
    spo2: number;
    temperature: number;
  };
  confidence: number;
}

export interface GuidanceResponse {
  guidance: {
    en: string;
    hi: string;
    bn: string;
  };
  urgency_level: 'immediate' | 'urgent' | 'routine';
  recommended_actions: string[];
}

export interface PatientHistoryResponse {
  patient: Patient;
  scans: ScanResult[];
}

// Bluetooth Types
export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  type: 'heart_rate' | 'spo2' | 'temperature' | 'multi';
}

export interface BluetoothState {
  isSupported: boolean;
  isScanning: boolean;
  connectedDevices: BluetoothDevice[];
  error?: string;
}

// Offline Sync Types
export interface PendingSync {
  id: string;
  type: 'scan' | 'patient';
  data: ScanResult | Patient;
  createdAt: string;
  retryCount: number;
}

// App State Types
export type Language = 'en' | 'hi' | 'bn';

export interface AppState {
  isOnline: boolean;
  language: Language;
  currentPatient?: Patient;
  pendingSyncs: number;
}
