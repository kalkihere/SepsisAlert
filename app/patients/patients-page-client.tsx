'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-language';
import { initDB, getAllPatients, getPatientScans, searchPatients } from '@/lib/db';
import { format } from 'date-fns';
import { 
  Search, 
  User, 
  ChevronRight,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import { RiskBadge } from '@/components/risk-indicator';
import type { Patient, ScanResult } from '@/types';

interface PatientWithLastScan extends Patient {
  lastScan?: ScanResult;
  scanCount: number;
}

export function PatientsPageClient() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientWithLastScan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        await initDB();
        const patientList = await getAllPatients();
        
        const patientsWithScans = await Promise.all(
          patientList.map(async (patient) => {
            const scans = await getPatientScans(patient.id);
            return {
              ...patient,
              lastScan: scans[0],
              scanCount: scans.length,
            };
          })
        );
        
        patientsWithScans.sort((a, b) => {
          if (!a.lastScan && !b.lastScan) return 0;
          if (!a.lastScan) return 1;
          if (!b.lastScan) return -1;
          return new Date(b.lastScan.timestamp).getTime() - new Date(a.lastScan.timestamp).getTime();
        });
        
        setPatients(patientsWithScans);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPatients();
  }, []);

  const filteredPatients = searchQuery
    ? patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
      )
    : patients;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack backHref="/" />

      <main className="container px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('patientHistory')}</h1>
          <Link href="/scan">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Scan
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} years, {patient.gender}
                          {patient.village && ` • ${patient.village}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {patient.scanCount} scan{patient.scanCount !== 1 ? 's' : ''}
                          </span>
                          {patient.lastScan && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                Last: {format(new Date(patient.lastScan.timestamp), 'MMM d')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {patient.lastScan && (
                          <RiskBadge riskLevel={patient.lastScan.riskLevel} />
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {searchQuery ? 'No patients found' : 'No patients registered'}
              </p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Start a new scan to register patients'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
