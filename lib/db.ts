import type { Patient, ScanResult, PendingSync } from '@/types';

const DB_NAME = 'SepsisAlertDB';
const DB_VERSION = 1;

interface SepsisAlertDB {
  patients: Patient;
  scans: ScanResult;
  pendingSync: PendingSync;
}

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Patients store
      if (!database.objectStoreNames.contains('patients')) {
        const patientStore = database.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('name', 'name', { unique: false });
        patientStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Scans store
      if (!database.objectStoreNames.contains('scans')) {
        const scanStore = database.createObjectStore('scans', { keyPath: 'id' });
        scanStore.createIndex('patientId', 'patientId', { unique: false });
        scanStore.createIndex('timestamp', 'timestamp', { unique: false });
        scanStore.createIndex('synced', 'synced', { unique: false });
      }

      // Pending sync store
      if (!database.objectStoreNames.contains('pendingSync')) {
        const syncStore = database.createObjectStore('pendingSync', { keyPath: 'id' });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Generic CRUD operations
async function getStore(storeName: keyof SepsisAlertDB, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const database = await initDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

// Patient operations
export async function savePatient(patient: Patient): Promise<void> {
  const store = await getStore('patients', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(patient);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const store = await getStore('patients');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPatients(): Promise<Patient[]> {
  const store = await getStore('patients');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const patients = await getAllPatients();
  const lowerQuery = query.toLowerCase();
  return patients.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.village?.toLowerCase().includes(lowerQuery) ||
    p.phone?.includes(query)
  );
}

// Scan operations
export async function saveScan(scan: ScanResult): Promise<void> {
  const store = await getStore('scans', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(scan);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getScan(id: string): Promise<ScanResult | undefined> {
  const store = await getStore('scans');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPatientScans(patientId: string): Promise<ScanResult[]> {
  const store = await getStore('scans');
  const index = store.index('patientId');
  return new Promise((resolve, reject) => {
    const request = index.getAll(patientId);
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsyncedScans(): Promise<ScanResult[]> {
  const store = await getStore('scans');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () =>
      resolve((request.result as ScanResult[]).filter((s) => !s.synced));
    request.onerror = () => reject(request.error);
  });
}

export async function markScanSynced(id: string): Promise<void> {
  const scan = await getScan(id);
  if (scan) {
    scan.synced = true;
    await saveScan(scan);
  }
}

// Pending sync operations
export async function addPendingSync(sync: PendingSync): Promise<void> {
  const store = await getStore('pendingSync', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(sync);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncs(): Promise<PendingSync[]> {
  const store = await getStore('pendingSync');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingSync(id: string): Promise<void> {
  const store = await getStore('pendingSync', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncCount(): Promise<number> {
  const syncs = await getPendingSyncs();
  return syncs.length;
}

// Recent scans for dashboard
export async function getRecentScans(limit: number = 10): Promise<ScanResult[]> {
  const store = await getStore('scans');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}
