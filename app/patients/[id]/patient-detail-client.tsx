'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendChart } from '@/components/trend-chart';
import { ScanHistoryItem, ScanHistoryItemSkeleton } from '@/components/scan-history-item';
import { useTranslation } from '@/hooks/use-language';
import { initDB, getPatient, getPatientScans } from '@/lib/db';
import { format } from 'date-fns';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Plus,
  Activity,
  TrendingUp,
  Loader2
} from 'lucide-react';
import type { Patient, ScanResult } from '@/types';

export function PatientDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { t } = useTranslation();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (!id) notFound();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        await initDB();
        const patientData = await getPatient(id);
        
        if (!patientData) {
          notFound();
          return;
        }
        
        setPatient(patientData);
        
        const scanData = await getPatientScans(id);
        setScans(scanData);
        
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showBack backHref="/patients" />
        <main className="container px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader showBack backHref="/patients" />

      <main className="container px-4 py-6 space-y-6">
        <Card className="border-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold">{patient.name}</h1>
                <p className="text-muted-foreground">
                  {patient.age} years old, {patient.gender}
                </p>
                
                <div className="mt-3 space-y-1.5 text-sm">
                  {patient.village && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{patient.village}</span>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${patient.phone}`} className="text-primary hover:underline">
                        {patient.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Registered {format(new Date(patient.createdAt), 'PP')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 h-12"
              onClick={() => router.push('/scan')}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Scan for {patient.name.split(' ')[0]}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-2">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{scans.length}</p>
              <p className="text-xs text-muted-foreground">Total Scans</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {scans.length > 0 ? `${scans[0].riskScore}%` : '--'}
              </p>
              <p className="text-xs text-muted-foreground">Latest Risk Score</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="history" className="text-base">{t('scanHistory')}</TabsTrigger>
            <TabsTrigger value="trends" className="text-base">Vital Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-4 space-y-3">
            {scans.length > 0 ? (
              scans.map((scan) => (
                <Link key={scan.id} href={`/scan/${scan.id}`}>
                  <ScanHistoryItem scan={scan} />
                </Link>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">{t('noScans')}</p>
                <p className="text-sm mt-1">Start a scan to see results here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trends" className="mt-4 space-y-4">
            {scans.length >= 2 ? (
              <>
                <TrendChart scans={scans} vitalType="heartRate" />
                <TrendChart scans={scans} vitalType="spo2" />
                <TrendChart scans={scans} vitalType="temperature" />
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Not enough data for trends</p>
                <p className="text-sm mt-1">At least 2 scans needed to show trends</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
