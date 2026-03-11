'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VitalSigns } from '@/types';

// BLE UUIDs — MUST match the ESP32 firmware (Sepsis_Alert.ino)
const SERVICE_UUID           = '12345678-1234-1234-1234-123456789abc';
const CHARACTERISTIC_UUID    = 'abcd1234-5678-1234-5678-123456789abc';

export type MeasurementStatus = 
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'PLACE_FINGER'
  | 'MEASURING_HR'
  | 'MEASURING_SPO2'
  | 'MEASURING_TEMP'
  | 'DONE'
  | 'STOPPED'
  | 'ERROR';

export type MeasurementCommand = 'ALL' | 'HR' | 'TEM';

export interface UseBluetoothReturn {
  // Connection state
  isSupported: boolean;
  isScanning: boolean;
  isConnected: boolean;
  deviceName: string | null;
  
  // Measurement state
  isMeasuring: boolean;
  measurementStatus: MeasurementStatus;
  statusMessage: string;
  measurementProgress: number; // 0-100
  
  // Data
  currentVitals: Partial<VitalSigns>;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startMeasurement: (type?: MeasurementCommand) => Promise<void>;
  stopMeasurement: () => Promise<void>;
  simulateReading: () => void;
}

// Human-readable status messages
const STATUS_MESSAGES: Record<MeasurementStatus, string> = {
  IDLE: 'Ready',
  CONNECTING: 'Connecting to ESP32...',
  CONNECTED: 'Connected — Ready to scan',
  PLACE_FINGER: 'Place finger on sensor...',
  MEASURING_HR: 'Measuring heart rate...',
  MEASURING_SPO2: 'Measuring SpO2...',
  MEASURING_TEMP: 'Measuring temperature...',
  DONE: 'Measurement complete!',
  STOPPED: 'Measurement stopped',
  ERROR: 'Error occurred',
};

// Progress values for each status (approximate)
const STATUS_PROGRESS: Record<MeasurementStatus, number> = {
  IDLE: 0,
  CONNECTING: 0,
  CONNECTED: 0,
  PLACE_FINGER: 5,
  MEASURING_HR: 30,
  MEASURING_SPO2: 65,
  MEASURING_TEMP: 85,
  DONE: 100,
  STOPPED: 0,
  ERROR: 0,
};

/**
 * Parse the ESP32 response string from Sepsis_Alert.ino
 * 
 * HR command returns: "BPM: 78BPM AVG: 75SP02 97.3"
 * TEM command returns: "Tem36.8"
 */
function parseESP32Response(data: string): Partial<VitalSigns> {
  const vitals: Partial<VitalSigns> = {};

  console.log('[BLE] Raw response:', data);

  // Parse Heart Rate response: "BPM: 78BPM AVG: 75SP02 97.3"
  // Extract BPM AVG value
  const avgBpmMatch = data.match(/BPM AVG:\s*([\d.]+)/i);
  if (avgBpmMatch) {
    const hr = Math.round(parseFloat(avgBpmMatch[1]));
    if (hr > 0 && hr < 255) {
      vitals.heartRate = hr;
    }
  }

  // Fallback: Extract simple BPM if AVG not found
  if (!vitals.heartRate) {
    const bpmMatch = data.match(/BPM:\s*([\d.]+)/i);
    if (bpmMatch) {
      const hr = Math.round(parseFloat(bpmMatch[1]));
      if (hr > 0 && hr < 255) {
        vitals.heartRate = hr;
      }
    }
  }

  // Extract SpO2 value: "SP02 97.3" or "SPO2 97.3"
  const spo2Match = data.match(/SP[O0]2\s*([\d.]+)/i);
  if (spo2Match) {
    const spo2 = Math.round(parseFloat(spo2Match[1]));
    if (spo2 >= 80 && spo2 <= 100) {
      vitals.spo2 = spo2;
    }
  }

  // Extract Temperature: "Tem36.8"
  const tempMatch = data.match(/Tem([\d.]+)/i);
  if (tempMatch) {
    const temp = parseFloat(tempMatch[1]);
    if (temp > 0 && temp < 50) {
      vitals.temperature = Math.round(temp * 10) / 10;
    }
  }

  console.log('[BLE] Parsed vitals:', vitals);
  return vitals;
}

export function useBluetooth(): UseBluetoothReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementStatus, setMeasurementStatus] = useState<MeasurementStatus>('IDLE');
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [currentVitals, setCurrentVitals] = useState<Partial<VitalSigns>>({});
  const [error, setError] = useState<string | null>(null);

  // Refs for BLE objects (don't need re-renders)
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCommandRef = useRef<MeasurementCommand | null>(null);

  // Check Web Bluetooth support
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator);
  }, []);

  // Status message derived from status
  const statusMessage = error 
    ? `Error: ${error}` 
    : STATUS_MESSAGES[measurementStatus];

  // Clear progress interval
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Handle notification from ESP32 (single characteristic sends all data)
  const handleNotification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const data = decoder.decode(value).trim();
    
    console.log('[BLE] Notification received:', data);

    const parsedVitals = parseESP32Response(data);
    const command = pendingCommandRef.current;

    if (Object.keys(parsedVitals).length > 0) {
      setCurrentVitals(prev => ({ ...prev, ...parsedVitals }));
    }

    // If we got HR data and command was "ALL", we need temperature next
    if (command === 'ALL' && parsedVitals.heartRate && !parsedVitals.temperature) {
      // HR + SpO2 done, now request temperature
      setMeasurementStatus('MEASURING_TEMP');
      setMeasurementProgress(70);

      // Send TEM command after a brief delay
      setTimeout(async () => {
        try {
          if (characteristicRef.current) {
            const encoder = new TextEncoder();
            await characteristicRef.current.writeValue(encoder.encode('TEM'));
            console.log('[BLE] Sent follow-up TEM command');
          }
        } catch (err) {
          console.error('[BLE] Error sending TEM command:', err);
        }
      }, 500);
      return;
    }

    // If we got temperature data (either from ALL follow-up or standalone TEM)
    if (parsedVitals.temperature) {
      setMeasurementStatus('DONE');
      setMeasurementProgress(100);
      setIsMeasuring(false);
      clearProgressInterval();
      pendingCommandRef.current = null;
      return;
    }

    // If HR-only command and we got HR data
    if (command === 'HR' && parsedVitals.heartRate) {
      setMeasurementStatus('DONE');
      setMeasurementProgress(100);
      setIsMeasuring(false);
      clearProgressInterval();
      pendingCommandRef.current = null;
      return;
    }

    // If TEM-only command and we got temp data
    if (command === 'TEM' && parsedVitals.temperature) {
      setMeasurementStatus('DONE');
      setMeasurementProgress(100);
      setIsMeasuring(false);
      clearProgressInterval();
      pendingCommandRef.current = null;
      return;
    }
  }, [clearProgressInterval]);

  // Connect to ESP32
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Bluetooth is not supported on this browser');
      return;
    }

    setError(null);
    setIsScanning(true);
    setMeasurementStatus('CONNECTING');

    try {
      // Request the ESP32 device — matches "ESP32_CHAT" or "SepsisAlert" names
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { namePrefix: 'ESP32' },
          { namePrefix: 'SepsisAlert' },
        ],
        optionalServices: [SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('GATT server not available');
      }

      // Connect to GATT server
      const server = await device.gatt.connect();
      
      // Get the service
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Get the single characteristic (read/write/notify)
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      // Subscribe to notifications
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);
      await characteristic.startNotifications();

      // Store refs
      deviceRef.current = device;
      serverRef.current = server;
      characteristicRef.current = characteristic;

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.log('[BLE] Device disconnected');
        setIsConnected(false);
        setDeviceName(null);
        setMeasurementStatus('IDLE');
        setIsMeasuring(false);
        clearProgressInterval();
        deviceRef.current = null;
        serverRef.current = null;
        characteristicRef.current = null;
        pendingCommandRef.current = null;
      });

      setDeviceName(device.name || 'ESP32 Device');
      setIsConnected(true);
      setMeasurementStatus('CONNECTED');

      console.log('[BLE] Connected to:', device.name);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      if (message.includes('cancelled') || message.includes('canceled')) {
        // User cancelled the scan dialog — not an error
        setMeasurementStatus('IDLE');
      } else {
        setError(message);
        setMeasurementStatus('ERROR');
      }
      console.error('[BLE] Connection error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isSupported, handleNotification, clearProgressInterval]);

  // Start measurement
  const startMeasurement = useCallback(async (type: MeasurementCommand = 'ALL') => {
    if (!characteristicRef.current || !isConnected) {
      setError('Not connected to ESP32');
      return;
    }

    setError(null);
    setCurrentVitals({}); // Reset vitals
    setIsMeasuring(true);
    setMeasurementProgress(0);

    // For "ALL" command, we first send "HR", then follow up with "TEM" after HR completes
    // The ESP32 firmware only understands "HR" and "TEM" commands
    const actualCommand = type === 'ALL' ? 'HR' : type;
    pendingCommandRef.current = type; // Store the original command intent

    try {
      const encoder = new TextEncoder();
      await characteristicRef.current.writeValue(encoder.encode(actualCommand));
      console.log('[BLE] Sent command:', actualCommand, '(intent:', type, ')');

      // Update status based on command
      if (actualCommand === 'HR') {
        setMeasurementStatus('MEASURING_HR');
      } else if (actualCommand === 'TEM') {
        setMeasurementStatus('MEASURING_TEMP');
      }

      // Start progress animation
      clearProgressInterval();
      const totalDuration = type === 'ALL' ? 30000 : type === 'HR' ? 24000 : 5000;
      const startTime = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(95, (elapsed / totalDuration) * 100);
        setMeasurementProgress(prev => Math.max(prev, progress));
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send command';
      setError(message);
      setIsMeasuring(false);
      clearProgressInterval();
      pendingCommandRef.current = null;
    }
  }, [isConnected, clearProgressInterval]);

  // Stop measurement
  const stopMeasurement = useCallback(async () => {
    // The teammate's firmware doesn't have a STOP command,
    // so we just reset the UI state
    setIsMeasuring(false);
    setMeasurementStatus('STOPPED');
    clearProgressInterval();
    pendingCommandRef.current = null;
  }, [clearProgressInterval]);

  // Disconnect
  const disconnect = useCallback(() => {
    clearProgressInterval();
    
    if (serverRef.current?.connected) {
      serverRef.current.disconnect();
    }

    deviceRef.current = null;
    serverRef.current = null;
    characteristicRef.current = null;
    pendingCommandRef.current = null;
    
    setIsConnected(false);
    setDeviceName(null);
    setIsMeasuring(false);
    setMeasurementStatus('IDLE');
    setMeasurementProgress(0);
    setCurrentVitals({});
  }, [clearProgressInterval]);

  // Simulate sensor readings for testing (keeps working without ESP32)
  const simulateReading = useCallback(() => {
    setCurrentVitals({});
    setMeasurementStatus('MEASURING_HR');
    setIsMeasuring(true);
    setMeasurementProgress(0);
    setError(null);

    // Simulate the measurement timeline
    const baseHeartRate = 70 + Math.floor(Math.random() * 50);
    const baseSpo2 = 94 + Math.floor(Math.random() * 6);
    const baseTemp = 36.5 + (Math.random() * 2.5);

    // Phase 1: HR (1.5s)
    setTimeout(() => {
      setMeasurementProgress(35);
      setCurrentVitals(prev => ({ ...prev, heartRate: baseHeartRate }));
      setMeasurementStatus('MEASURING_SPO2');
    }, 1500);

    // Phase 2: SpO2 (3s)
    setTimeout(() => {
      setMeasurementProgress(65);
      setCurrentVitals(prev => ({ ...prev, spo2: baseSpo2 }));
      setMeasurementStatus('MEASURING_TEMP');
    }, 3000);

    // Phase 3: Temperature (4.5s)
    setTimeout(() => {
      setMeasurementProgress(100);
      setCurrentVitals(prev => ({ ...prev, temperature: Math.round(baseTemp * 10) / 10 }));
      setMeasurementStatus('DONE');
      setIsMeasuring(false);
    }, 4500);

    // Smooth progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      if (progress >= 95) {
        clearInterval(interval);
        return;
      }
      setMeasurementProgress(prev => Math.max(prev, progress));
    }, 100);

    setTimeout(() => clearInterval(interval), 5000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
    };
  }, [clearProgressInterval]);

  return {
    isSupported,
    isScanning,
    isConnected,
    deviceName,
    isMeasuring,
    measurementStatus,
    statusMessage,
    measurementProgress,
    currentVitals,
    error,
    connect,
    disconnect,
    startMeasurement,
    stopMeasurement,
    simulateReading,
  };
}
