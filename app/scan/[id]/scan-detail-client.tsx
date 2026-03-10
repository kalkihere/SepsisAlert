'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { VitalCard } from '@/components/vital-card';
import { RiskIndicator } from '@/components/risk-indicator';
import { GuidancePanel } from '@/components/guidance-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-language';
import { initDB, getScan, getPatient } from '@/lib/db';
import { getMockGuidance } from '@/services/mockData';
import { format } from 'date-fns';
import { 
  User, 
  Calendar, 
  Clock,
  CloudOff,
  Check,
  FileText,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import type { ScanResult, Patient, GuidanceResponse } from '@/types';

export function ScanDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { t } = useTranslation();
  
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!id) notFound();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        await initDB();
        const scanData = await getScan(id);
        
        if (!scanData) {
          notFound();
          return;
        }
        
        setScan(scanData);
        
        const patientData = await getPatient(scanData.patientId);
        setPatient(patientData || null);
        
        const guidanceData = getMockGuidance(scanData.riskLevel);
        setGuidance(guidanceData);
        
      } catch (error) {
        console.error('Error loading scan:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showBack backHref="/" />
        <main className="container px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!scan) {
    return notFound();
  }

  const scanDate = new Date(scan.timestamp);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader showBack backHref="/" />

      <main className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scan Results</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span>{format(scanDate, 'PPP')}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{format(scanDate, 'p')}</span>
            </div>
          </div>
          
          {scan.synced ? (
            <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              <Check className="h-4 w-4" />
              <span>Synced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
              <CloudOff className="h-4 w-4" />
              <span>Pending Sync</span>
            </div>
          )}
        </div>

        {patient && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} years, {patient.gender}
                    {patient.village && ` • ${patient.village}`}
                  </p>
                </div>
                <Link href={`/patients/${patient.id}`}>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center py-4">
          <RiskIndicator 
            riskLevel={scan.riskLevel} 
            riskScore={scan.riskScore}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <VitalCard
            type="heartRate"
            value={scan.vitals.heartRate}
            unit={t('bpm')}
            label={t('heartRate')}
            isConnected={true}
          />
          <VitalCard
            type="spo2"
            value={scan.vitals.spo2}
            unit="%"
            label={t('spo2')}
            isConnected={true}
          />
          <VitalCard
            type="temperature"
            value={scan.vitals.temperature}
            unit="°C"
            label={t('temperature')}
            isConnected={true}
          />
        </div>

        <GuidancePanel 
          guidance={guidance} 
          riskLevel={scan.riskLevel}
        />

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-14"
            onClick={() => router.push('/scan')}
          >
            New Scan
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 h-14"
            onClick={() => {
              alert('Report generation coming soon!');
            }}
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate Report
          </Button>
        </div>
      </main>
    </div>
  );
}
