'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';
import { VitalCard } from '@/components/vital-card';
import { RiskIndicator } from '@/components/risk-indicator';
import { BluetoothSensorConnector } from '@/components/bluetooth-sensor-connector';
import { PatientForm } from '@/components/patient-form';
import { GuidancePanel } from '@/components/guidance-panel';
import { useTranslation } from '@/hooks/use-language';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { initDB, savePatient, saveScan, getPendingSyncCount, addPendingSync, searchPatients } from '@/lib/db';
import { getMockPrediction, getMockGuidance } from '@/services/mockData';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Patient, VitalSigns, RiskLevel, GuidanceResponse } from '@/types';

type ScanStep = 'patient' | 'vitals' | 'results';

export default function ScanPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  
  // State
  const [step, setStep] = useState<ScanStep>('patient');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Partial<VitalSigns>>({});
  const [riskLevel, setRiskLevel] = useState<RiskLevel | undefined>();
  const [riskScore, setRiskScore] = useState<number | undefined>();
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  
  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Initialize DB
  useEffect(() => {
    initDB().then(() => {
      getPendingSyncCount().then(setPendingSync);
    });
  }, []);

  // Search patients
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle patient selection
  const handleSelectPatient = useCallback((selectedPatient: Patient) => {
    setPatient(selectedPatient);
    setStep('vitals');
  }, []);

  // Handle new patient submission
  const handleNewPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await savePatient(newPatient);
      setPatient(newPatient);
      setStep('vitals');
      toast.success('Patient registered successfully');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to save patient');
    }
  }, []);

  // Handle vitals update from Bluetooth
  const handleVitalsUpdate = useCallback((newVitals: Partial<VitalSigns>) => {
    setVitals(prev => ({ ...prev, ...newVitals }));
  }, []);

  // Analyze vitals
  const analyzeVitals = useCallback(async () => {
    if (!vitals.heartRate || !vitals.spo2 || !vitals.temperature) {
      toast.error('Please collect all vital signs before analyzing');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get prediction (mock for now)
      const prediction = getMockPrediction(vitals.heartRate, vitals.spo2, vitals.temperature);
      setRiskScore(prediction.risk_score);
      setRiskLevel(prediction.risk_level);

      // Get guidance
      const guidanceResponse = getMockGuidance(prediction.risk_level);
      setGuidance(guidanceResponse);

      setStep('results');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze vitals');
    } finally {
      setIsAnalyzing(false);
    }
  }, [vitals]);

  // Save scan results
  const saveScanResults = useCallback(async () => {
    if (!patient || !vitals.heartRate || !vitals.spo2 || !vitals.temperature || !riskLevel || riskScore === undefined) {
      return;
    }

    setIsSaving(true);

    try {
      const scanResult = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: patient.id,
        vitals: vitals as VitalSigns,
        riskScore,
        riskLevel,
        timestamp: new Date().toISOString(),
        synced: isOnline,
        guidance: guidance ? {
          message: guidance.guidance.en,
          language: 'en' as const,
          urgencyLevel: guidance.urgency_level,
          actions: guidance.recommended_actions,
        } : undefined,
      };

      await saveScan(scanResult);

      // If offline, add to pending sync
      if (!isOnline) {
        await addPendingSync({
          id: `sync_${scanResult.id}`,
          type: 'scan',
          data: scanResult,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
        setPendingSync(prev => prev + 1);
      }

      toast.success('Scan saved successfully');
      router.push(`/scan/${scanResult.id}`);
    } catch (error) {
      console.error('Error saving scan:', error);
      toast.error('Failed to save scan');
    } finally {
      setIsSaving(false);
    }
  }, [patient, vitals, riskLevel, riskScore, guidance, isOnline, router]);

  const hasAllVitals = vitals.heartRate && vitals.spo2 && vitals.temperature;

  const steps: ScanStep[] = ['patient', 'vitals', 'results'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack backHref="/" pendingSync={pendingSync} />

      <main className="container px-4 py-6 space-y-6 pb-32">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === s 
                  ? 'gradient-button text-[#0B0F14] shadow-[0_0_15px_var(--glow-green)]' 
                  : i < currentStepIndex
                    ? 'bg-[var(--primary)] text-[#0B0F14]'
                    : 'bg-[var(--secondary)] text-muted-foreground'
              }`}>
                {i < currentStepIndex ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              {i < 2 && (
                <div className={`w-12 h-1 mx-1 rounded transition-colors ${
                  i < currentStepIndex
                    ? 'bg-[var(--primary)]'
                    : 'bg-[var(--secondary)]'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Patient Selection */}
        {step === 'patient' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Select or Register Patient</h2>
            
            {/* Search existing patients */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search patients by name, village, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-14 text-base bg-[var(--secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
              />
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="glass-panel overflow-hidden">
                <div className="p-3 border-b border-[#1F2A36]">
                  <p className="text-sm text-muted-foreground">Search Results</p>
                </div>
                <div className="p-3 space-y-2">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all hover:shadow-[0_0_15px_var(--glow-green)]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.age} years, {p.gender} {p.village && `• ${p.village}`}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* New patient toggle */}
            <Button
              variant={showNewPatientForm ? 'secondary' : 'outline'}
              onClick={() => setShowNewPatientForm(!showNewPatientForm)}
              className={`w-full h-14 ${!showNewPatientForm ? 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10' : ''}`}
            >
              {showNewPatientForm ? 'Cancel New Patient' : 'Register New Patient'}
            </Button>

            {/* New patient form */}
            {showNewPatientForm && (
              <PatientForm
                onSubmit={handleNewPatient}
                onCancel={() => setShowNewPatientForm(false)}
              />
            )}
          </div>
        )}

        {/* Step 2: Vital Signs Collection */}
        {step === 'vitals' && (
          <div className="space-y-6">
            {/* Patient info */}
            {patient && (
              <div className="glass-panel p-4 border-[var(--primary)]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.age} years, {patient.gender}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('patient')} className="text-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10">
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Bluetooth connector */}
            <BluetoothSensorConnector onVitalsUpdate={handleVitalsUpdate} />

            {/* Vital cards */}
            <div className="grid grid-cols-3 gap-3">
              <VitalCard
                type="heartRate"
                value={vitals.heartRate}
                unit={t('bpm')}
                label={t('heartRate')}
                isConnected={!!vitals.heartRate}
              />
              <VitalCard
                type="spo2"
                value={vitals.spo2}
                unit="%"
                label={t('spo2')}
                isConnected={!!vitals.spo2}
              />
              <VitalCard
                type="temperature"
                value={vitals.temperature}
                unit="°C"
                label={t('temperature')}
                isConnected={!!vitals.temperature}
              />
            </div>

            {/* Missing vitals warning */}
            {!hasAllVitals && (
              <div className="flex items-center gap-3 glass-panel p-4 border-[var(--risk-amber)]/30">
                <div className="h-10 w-10 rounded-full bg-[var(--risk-amber)]/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-[var(--risk-amber)]" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect sensors or use simulate button to collect all vital signs
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="space-y-6">
            {/* Risk indicator */}
            <div className="flex justify-center py-4">
              <RiskIndicator 
                riskLevel={riskLevel} 
                riskScore={riskScore}
                size="lg"
              />
            </div>

            {/* Vitals summary */}
            <div className="grid grid-cols-3 gap-3">
              <VitalCard
                type="heartRate"
                value={vitals.heartRate}
                unit={t('bpm')}
                label={t('heartRate')}
                isConnected={true}
              />
              <VitalCard
                type="spo2"
                value={vitals.spo2}
                unit="%"
                label={t('spo2')}
                isConnected={true}
              />
              <VitalCard
                type="temperature"
                value={vitals.temperature}
                unit="°C"
                label={t('temperature')}
                isConnected={true}
              />
            </div>

            {/* AI Guidance */}
            <GuidancePanel 
              guidance={guidance} 
              riskLevel={riskLevel!}
            />
          </div>
        )}
      </main>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F14]/95 backdrop-blur-lg border-t border-[#1F2A36] p-4 safe-bottom">
        <div className="container flex gap-3">
          {step !== 'patient' && (
            <Button
              variant="outline"
              onClick={() => setStep(step === 'results' ? 'vitals' : 'patient')}
              className="h-14 border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
          )}
          
          {step === 'vitals' && (
            <Button
              onClick={analyzeVitals}
              disabled={!hasAllVitals || isAnalyzing}
              className="flex-1 h-14 text-base font-semibold gradient-button border-0 text-[#0B0F14] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Vitals
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          )}

          {step === 'results' && (
            <Button
              onClick={saveScanResults}
              disabled={isSaving}
              className="flex-1 h-14 text-base font-semibold gradient-button border-0 text-[#0B0F14] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {t('saveScan')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
