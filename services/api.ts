import type { 
  SensorData, 
  ScanResponse, 
  PredictionResponse, 
  GuidanceResponse, 
  PatientHistoryResponse,
  Language
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Submit scan data to backend
  async submitScan(data: SensorData): Promise<ScanResponse> {
    return this.request<ScanResponse>('/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get AI prediction for vitals
  async getPrediction(data: SensorData): Promise<PredictionResponse> {
    return this.request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get AI guidance in specified language
  async getGuidance(
    riskLevel: string, 
    vitals: SensorData,
    language: Language = 'en'
  ): Promise<GuidanceResponse> {
    return this.request<GuidanceResponse>('/guidance', {
      method: 'POST',
      body: JSON.stringify({
        risk_level: riskLevel,
        vitals,
        language,
      }),
    });
  }

  // Get patient history
  async getPatientHistory(patientId: string): Promise<PatientHistoryResponse> {
    return this.request<PatientHistoryResponse>(`/patient-history?patientId=${patientId}`, {
      method: 'GET',
    });
  }

  // Check if API is available
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
