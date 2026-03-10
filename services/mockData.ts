import type { 
  Patient, 
  ScanResult, 
  PredictionResponse, 
  GuidanceResponse, 
  RiskLevel 
} from '@/types';

// Mock patient data
export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'male',
    village: 'Chandpur',
    phone: '9876543210',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'p2',
    name: 'Sunita Devi',
    age: 32,
    gender: 'female',
    village: 'Ramgarh',
    phone: '9876543211',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'p3',
    name: 'Mohammed Ali',
    age: 58,
    gender: 'male',
    village: 'Sultanpur',
    phone: '9876543212',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock scan history
export const mockScans: ScanResult[] = [
  {
    id: 's1',
    patientId: 'p1',
    vitals: { heartRate: 88, spo2: 96, temperature: 37.2 },
    riskScore: 25,
    riskLevel: 'GREEN',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    synced: true,
  },
  {
    id: 's2',
    patientId: 'p1',
    vitals: { heartRate: 110, spo2: 92, temperature: 38.5 },
    riskScore: 65,
    riskLevel: 'AMBER',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    synced: true,
  },
  {
    id: 's3',
    patientId: 'p2',
    vitals: { heartRate: 125, spo2: 88, temperature: 39.2 },
    riskScore: 85,
    riskLevel: 'RED',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    synced: true,
  },
  {
    id: 's4',
    patientId: 'p3',
    vitals: { heartRate: 75, spo2: 98, temperature: 36.8 },
    riskScore: 12,
    riskLevel: 'GREEN',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    synced: true,
  },
];

// Calculate risk based on vitals
export function calculateRisk(heartRate: number, spo2: number, temperature: number): { 
  riskScore: number; 
  riskLevel: RiskLevel 
} {
  let score = 0;

  // Heart rate scoring (normal: 60-100)
  if (heartRate < 50 || heartRate > 130) score += 35;
  else if (heartRate < 60 || heartRate > 110) score += 20;
  else if (heartRate > 100) score += 10;

  // SpO2 scoring (normal: 95-100)
  if (spo2 < 90) score += 40;
  else if (spo2 < 92) score += 25;
  else if (spo2 < 95) score += 15;

  // Temperature scoring (normal: 36.1-37.2°C)
  if (temperature > 39 || temperature < 35) score += 35;
  else if (temperature > 38.5 || temperature < 35.5) score += 25;
  else if (temperature > 37.5) score += 10;

  // Determine risk level
  let riskLevel: RiskLevel;
  if (score >= 70) riskLevel = 'RED';
  else if (score >= 40) riskLevel = 'AMBER';
  else riskLevel = 'GREEN';

  return { riskScore: Math.min(100, score), riskLevel };
}

// Mock prediction response
export function getMockPrediction(heartRate: number, spo2: number, temperature: number): PredictionResponse {
  const { riskScore, riskLevel } = calculateRisk(heartRate, spo2, temperature);
  
  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    vitals_summary: {
      heart_rate: heartRate,
      spo2: spo2,
      temperature: temperature,
    },
    confidence: 0.85 + Math.random() * 0.1,
  };
}

// Mock guidance messages
export function getMockGuidance(riskLevel: RiskLevel): GuidanceResponse {
  const guidance: Record<RiskLevel, GuidanceResponse> = {
    RED: {
      guidance: {
        en: 'URGENT: Patient shows signs of severe sepsis. Refer immediately to the nearest hospital. Monitor vital signs continuously during transport.',
        hi: 'तत्काल: रोगी में गंभीर सेप्सिस के लक्षण दिख रहे हैं। तुरंत निकटतम अस्पताल में रेफर करें। परिवहन के दौरान महत्वपूर्ण संकेतों की लगातार निगरानी करें।',
        bn: 'জরুরি: রোগী গুরুতর সেপসিসের লক্ষণ দেখাচ্ছে। অবিলম্বে নিকটতম হাসপাতালে রেফার করুন। পরিবহনের সময় প্রাণের লক্ষণগুলি ক্রমাগত পর্যবেক্ষণ করুন।',
      },
      urgency_level: 'immediate',
      recommended_actions: [
        'Call emergency services immediately',
        'Keep patient hydrated',
        'Monitor breathing',
        'Record vital signs every 5 minutes',
        'Prepare for hospital transport',
      ],
    },
    AMBER: {
      guidance: {
        en: 'CAUTION: Patient shows moderate risk indicators. Schedule follow-up within 24 hours. Consider medical consultation if symptoms worsen.',
        hi: 'सावधानी: रोगी में मध्यम जोखिम संकेतक दिख रहे हैं। 24 घंटे के भीतर फॉलो-अप शेड्यूल करें। यदि लक्षण बिगड़ें तो चिकित्सा परामर्श पर विचार करें।',
        bn: 'সতর্কতা: রোগী মাঝারি ঝুঁকির সূচক দেখাচ্ছে। ২৪ ঘণ্টার মধ্যে ফলো-আপ নির্ধারণ করুন। লক্ষণ খারাপ হলে চিকিৎসা পরামর্শ বিবেচনা করুন।',
      },
      urgency_level: 'urgent',
      recommended_actions: [
        'Monitor vital signs every 2 hours',
        'Ensure adequate hydration',
        'Check for fever progression',
        'Schedule follow-up scan',
        'Contact PHC if symptoms persist',
      ],
    },
    GREEN: {
      guidance: {
        en: 'STABLE: Patient vital signs are within normal range. Continue regular monitoring. Schedule routine follow-up as needed.',
        hi: 'स्थिर: रोगी के महत्वपूर्ण संकेत सामान्य सीमा में हैं। नियमित निगरानी जारी रखें। आवश्यकतानुसार नियमित फॉलो-अप शेड्यूल करें।',
        bn: 'স্থিতিশীল: রোগীর প্রাণের লক্ষণ স্বাভাবিক সীমার মধ্যে আছে। নিয়মিত পর্যবেক্ষণ চালিয়ে যান। প্রয়োজনে রুটিন ফলো-আপ নির্ধারণ করুন।',
      },
      urgency_level: 'routine',
      recommended_actions: [
        'Continue normal care routine',
        'Maintain hygiene practices',
        'Ensure proper nutrition',
        'Schedule next screening in 1 week',
      ],
    },
  };

  return guidance[riskLevel];
}
