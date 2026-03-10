'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ScanHistoryItem, ScanHistoryItemSkeleton } from '@/components/scan-history-item';
import { useTranslation } from '@/hooks/use-language';
import { initDB, getRecentScans, getAllPatients } from '@/lib/db';
import { 
  Activity, 
  Filter,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ScanResult, Patient, RiskLevel } from '@/types';

export function HistoryPageClient() {
  const { t } = useTranslation();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await initDB();
        const [scanData, patientData] = await Promise.all([
          getRecentScans(50),
          getAllPatients(),
        ]);
        setScans(scanData);
        setPatients(patientData);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const getPatientName = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  }, [patients]);

  const filteredScans = filterRisk === 'ALL' 
    ? scans 
    : scans.filter(s => s.riskLevel === filterRisk);

  const groupedScans = filteredScans.reduce((groups, scan) => {
    const date = new Date(scan.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scan);
    return groups;
  }, {} as Record<string, ScanResult[]>);

  const sortedDates = Object.keys(groupedScans).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack backHref="/" />

      <main className="container px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('scanHistory')}</h1>
          
          <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as RiskLevel | 'ALL')}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="RED">High Risk</SelectItem>
              <SelectItem value="AMBER">Medium Risk</SelectItem>
              <SelectItem value="GREEN">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <ScanHistoryItemSkeleton />
            <ScanHistoryItemSkeleton />
            <ScanHistoryItemSkeleton />
          </div>
        ) : filteredScans.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-16 bg-background py-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="space-y-3">
                  {groupedScans[date].map((scan) => (
                    <Link key={scan.id} href={`/scan/${scan.id}`}>
                      <ScanHistoryItem 
                        scan={scan}
                        patientName={getPatientName(scan.patientId)}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('noScans')}</p>
            <p className="text-sm mt-1">
              {filterRisk !== 'ALL' 
                ? `No ${filterRisk.toLowerCase()} risk scans found`
                : 'Start your first scan to see results here'
              }
            </p>
            {filterRisk !== 'ALL' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFilterRisk('ALL')}
              >
                Show All Scans
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
