'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Language } from '@/types';

const STORAGE_KEY = 'sepsis-alert-language';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && ['en', 'hi', 'bn'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return { language, setLanguage };
}

// Translation strings
export const translations = {
  en: {
    appName: 'SepsisAlert',
    tagline: 'Early Sepsis Screening',
    newScan: 'New Scan',
    patientHistory: 'Patient History',
    settings: 'Settings',
    language: 'Language',
    syncStatus: 'Sync Status',
    offline: 'Offline',
    online: 'Online',
    pendingSync: 'Pending Sync',
    connectSensors: 'Connect Sensors',
    heartRate: 'Heart Rate',
    spo2: 'SpO2',
    temperature: 'Temperature',
    bpm: 'BPM',
    riskLevel: 'Risk Level',
    highRisk: 'HIGH RISK',
    mediumRisk: 'MEDIUM RISK',
    lowRisk: 'LOW RISK',
    startScan: 'Start Scan',
    stopScan: 'Stop Scan',
    saveScan: 'Save Scan',
    patientName: 'Patient Name',
    patientAge: 'Age',
    patientGender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    village: 'Village',
    phone: 'Phone Number',
    submit: 'Submit',
    cancel: 'Cancel',
    guidance: 'AI Guidance',
    recommendedActions: 'Recommended Actions',
    scanHistory: 'Scan History',
    noScans: 'No scans recorded',
    lastScan: 'Last Scan',
    viewAll: 'View All',
    simulateSensors: 'Simulate Sensors',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  hi: {
    appName: 'सेप्सिस अलर्ट',
    tagline: 'प्रारंभिक सेप्सिस जांच',
    newScan: 'नई जांच',
    patientHistory: 'मरीज का इतिहास',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    syncStatus: 'सिंक स्थिति',
    offline: 'ऑफलाइन',
    online: 'ऑनलाइन',
    pendingSync: 'सिंक लंबित',
    connectSensors: 'सेंसर कनेक्ट करें',
    heartRate: 'हृदय गति',
    spo2: 'ऑक्सीजन',
    temperature: 'तापमान',
    bpm: 'बीपीएम',
    riskLevel: 'जोखिम स्तर',
    highRisk: 'उच्च जोखिम',
    mediumRisk: 'मध्यम जोखिम',
    lowRisk: 'कम जोखिम',
    startScan: 'जांच शुरू करें',
    stopScan: 'जांच रोकें',
    saveScan: 'जांच सहेजें',
    patientName: 'मरीज का नाम',
    patientAge: 'उम्र',
    patientGender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    village: 'गांव',
    phone: 'फ़ोन नंबर',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    guidance: 'AI मार्गदर्शन',
    recommendedActions: 'अनुशंसित कार्य',
    scanHistory: 'जांच इतिहास',
    noScans: 'कोई जांच दर्ज नहीं',
    lastScan: 'अंतिम जांच',
    viewAll: 'सभी देखें',
    simulateSensors: 'सेंसर सिमुलेट करें',
    connecting: 'कनेक्ट हो रहा है...',
    connected: 'कनेक्टेड',
    disconnected: 'डिस्कनेक्टेड',
  },
  bn: {
    appName: 'সেপসিস অ্যালার্ট',
    tagline: 'প্রাথমিক সেপসিস স্ক্রিনিং',
    newScan: 'নতুন স্ক্যান',
    patientHistory: 'রোগীর ইতিহাস',
    settings: 'সেটিংস',
    language: 'ভাষা',
    syncStatus: 'সিঙ্ক স্থিতি',
    offline: 'অফলাইন',
    online: 'অনলাইন',
    pendingSync: 'সিঙ্ক মুলতুবি',
    connectSensors: 'সেন্সর সংযুক্ত করুন',
    heartRate: 'হৃদস্পন্দন',
    spo2: 'অক্সিজেন',
    temperature: 'তাপমাত্রা',
    bpm: 'বিপিএম',
    riskLevel: 'ঝুঁকির মাত্রা',
    highRisk: 'উচ্চ ঝুঁকি',
    mediumRisk: 'মাঝারি ঝুঁকি',
    lowRisk: 'কম ঝুঁকি',
    startScan: 'স্ক্যান শুরু করুন',
    stopScan: 'স্ক্যান বন্ধ করুন',
    saveScan: 'স্ক্যান সংরক্ষণ করুন',
    patientName: 'রোগীর নাম',
    patientAge: 'বয়স',
    patientGender: 'লিঙ্গ',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    village: 'গ্রাম',
    phone: 'ফোন নম্বর',
    submit: 'জমা দিন',
    cancel: 'বাতিল করুন',
    guidance: 'AI নির্দেশিকা',
    recommendedActions: 'সুপারিশকৃত পদক্ষেপ',
    scanHistory: 'স্ক্যান ইতিহাস',
    noScans: 'কোন স্ক্যান রেকর্ড নেই',
    lastScan: 'শেষ স্ক্যান',
    viewAll: 'সব দেখুন',
    simulateSensors: 'সেন্সর সিমুলেট করুন',
    connecting: 'সংযোগ হচ্ছে...',
    connected: 'সংযুক্ত',
    disconnected: 'সংযোগ বিচ্ছিন্ন',
  },
};

export function useTranslation() {
  const { language, setLanguage } = useLanguage();

  const t = useCallback((key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  }, [language]);

  return { t, language, setLanguage };
}
