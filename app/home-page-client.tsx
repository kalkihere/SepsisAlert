'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/app-header';
import { ScanHistoryItem, ScanHistoryItemSkeleton } from '@/components/scan-history-item';
import { useTranslation } from '@/hooks/use-language';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { initDB, getRecentScans, getPendingSyncCount, getAllPatients } from '@/lib/db';
import { syncService } from '@/services/sync';
import Link from 'next/link';
import { 
  Plus, 
  Users,
  Activity,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { ScanResult, Patient } from '@/types';

export function HomePageClient() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingSync, setPendingSync] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load data
  useEffect(() => {
    async function loadData() {
      try {
        await initDB();
        const [scans, patientList, syncCount] = await Promise.all([
          getRecentScans(5),
          getAllPatients(),
          getPendingSyncCount(),
        ]);
        setRecentScans(scans);
        setPatients(patientList);
        setPendingSync(syncCount);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingSync > 0) {
      syncService.syncAll().then(async () => {
        const count = await getPendingSyncCount();
        setPendingSync(count);
      });
    }
  }, [isOnline, pendingSync]);

  // Get patient name for scan
  const getPatientName = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  }, [patients]);

  // Stats
  const todayScans = recentScans.filter(s => {
    const today = new Date();
    const scanDate = new Date(s.timestamp);
    return scanDate.toDateString() === today.toDateString();
  }).length;

  const highRiskScans = recentScans.filter(s => s.riskLevel === 'RED').length;

  return (
    <div className="min-h-screen bg-[#0A0E12]">
      <AppHeader pendingSync={pendingSync} />

      <main className="px-3 py-5 space-y-4 max-w-lg mx-auto">
        {/* Quick Actions - Two large buttons */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/scan" className="block">
            <button className="action-button-primary w-full h-28 flex flex-col items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-semibold text-white">{t('newScan')}</span>
            </button>
          </Link>
          
          <Link href="/patients" className="block">
            <button className="action-button-secondary w-full h-28 flex flex-col items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-white/80" />
              </div>
              <span className="text-base font-semibold text-white">{t('patientHistory')}</span>
            </button>
          </Link>
        </section>

        {/* Stats Cards - Three metric cards */}
        <section className="grid grid-cols-3 gap-3">
          {/* Today's Scans - Blue glow */}
          <div className="glass-panel-glow-blue p-4 text-center">
            <Activity className="h-7 w-7 mx-auto mb-2 text-[#0A84FF] icon-glow-blue" />
            <p className="text-3xl font-bold text-white">{todayScans}</p>
            <p className="text-xs text-[#8E8E93] mt-1">{"Today's Scans"}</p>
          </div>
          
          {/* High Risk - Red glow */}
          <div className="glass-panel-glow-red p-4 text-center">
            <AlertTriangle className="h-7 w-7 mx-auto mb-2 text-[#FF453A] icon-glow-red" />
            <p className="text-3xl font-bold text-white">{highRiskScans}</p>
            <p className="text-xs text-[#8E8E93] mt-1">High Risk</p>
          </div>
          
          {/* Pending Sync - Amber glow */}
          <div className="glass-panel-glow-amber p-4 text-center">
            <Clock className="h-7 w-7 mx-auto mb-2 text-[#FFD60A] icon-glow-amber" />
            <p className="text-3xl font-bold text-white">{pendingSync}</p>
            <p className="text-xs text-[#8E8E93] mt-1">Pending Sync</p>
          </div>
        </section>

        {/* Recent Scans - Frosted glass panel */}
        <section className="glass-panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-white">
              <Clock className="h-5 w-5 text-[#8E8E93]" />
              Recent Scans
            </h2>
            <Link href="/history">
              <button className="flex items-center gap-1 text-sm text-[#0A84FF] hover:text-[#3BA0FF] transition-colors">
                {t('viewAll')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                <ScanHistoryItemSkeleton />
                <ScanHistoryItemSkeleton />
                <ScanHistoryItemSkeleton />
              </div>
            ) : recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <Link key={scan.id} href={`/scan/${scan.id}`}>
                    <ScanHistoryItem 
                      scan={scan} 
                      patientName={getPatientName(scan.patientId)}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                {/* Empty state heartbeat icon */}
                <div className="relative mx-auto mb-5 w-16 h-16">
                  <svg 
                    viewBox="0 0 64 64" 
                    className="w-full h-full text-[#3A424D]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {/* Heart monitor line */}
                    <path 
                      d="M4 32 L16 32 L20 32 L24 18 L28 46 L32 26 L36 38 L40 32 L60 32" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="opacity-60"
                    />
                  </svg>
                </div>
                <p className="text-base font-medium text-white">{t('noScans')}</p>
                <p className="text-sm mt-1.5 text-[#8E8E93]">Start your first scan to see results here</p>
              </div>
            )}
          </div>
        </section>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed bottom-4 left-3 right-3 max-w-lg mx-auto glass-panel p-4 glow-amber">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#FFD60A]/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-[#FFD60A]" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{"You're Offline"}</p>
                <p className="text-xs text-[#8E8E93]">
                  Scans will be saved locally and synced when connected
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
