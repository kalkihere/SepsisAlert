import { apiService } from './api';
import { 
  getUnsyncedScans, 
  markScanSynced, 
  getPendingSyncs, 
  removePendingSync,
  addPendingSync
} from '@/lib/db';
import type { ScanResult, PendingSync } from '@/types';

class SyncService {
  private issyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  // Subscribe to sync status updates
  subscribe(callback: (status: SyncStatus) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(status: SyncStatus) {
    this.listeners.forEach(cb => cb(status));
  }

  // Check if online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Sync all pending data
  async syncAll(): Promise<SyncResult> {
    if (this.issyncing) {
      return { success: false, synced: 0, failed: 0, message: 'Sync already in progress' };
    }

    if (!this.isOnline()) {
      return { success: false, synced: 0, failed: 0, message: 'No internet connection' };
    }

    this.issyncing = true;
    this.notify({ status: 'syncing', progress: 0 });

    let synced = 0;
    let failed = 0;

    try {
      // Sync unsynced scans
      const unsyncedScans = await getUnsyncedScans();
      const total = unsyncedScans.length;

      for (let i = 0; i < unsyncedScans.length; i++) {
        const scan = unsyncedScans[i];
        try {
          await this.syncScan(scan);
          synced++;
        } catch (error) {
          console.error('Failed to sync scan:', scan.id, error);
          failed++;
        }
        this.notify({ status: 'syncing', progress: ((i + 1) / total) * 100 });
      }

      // Process pending syncs
      const pendingSyncs = await getPendingSyncs();
      for (const pending of pendingSyncs) {
        try {
          await this.processPendingSync(pending);
          await removePendingSync(pending.id);
          synced++;
        } catch (error) {
          console.error('Failed to process pending sync:', pending.id, error);
          // Increment retry count
          pending.retryCount++;
          if (pending.retryCount < 3) {
            await addPendingSync(pending);
          }
          failed++;
        }
      }

      this.notify({ status: 'complete', progress: 100 });
      return { success: true, synced, failed };

    } catch (error) {
      this.notify({ status: 'error', progress: 0, error: String(error) });
      return { success: false, synced, failed, message: String(error) };
    } finally {
      this.issyncing = false;
    }
  }

  // Sync a single scan
  private async syncScan(scan: ScanResult): Promise<void> {
    await apiService.submitScan({
      patient_id: scan.patientId,
      heart_rate: scan.vitals.heartRate,
      spo2: scan.vitals.spo2,
      temperature: scan.vitals.temperature,
      timestamp: scan.timestamp,
    });
    await markScanSynced(scan.id);
  }

  // Process a pending sync item
  private async processPendingSync(pending: PendingSync): Promise<void> {
    if (pending.type === 'scan') {
      await this.syncScan(pending.data as ScanResult);
    }
    // Add other sync types as needed
  }

  // Setup auto-sync on connection restore
  setupAutoSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncAll();
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline()) {
        this.syncAll();
      }
    }, 5 * 60 * 1000);
  }
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  message?: string;
}

export const syncService = new SyncService();
