'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { BluetoothDevice, VitalSigns } from '@/types';

// Bluetooth GATT Service UUIDs
const HEART_RATE_SERVICE = 'heart_rate';
const HEART_RATE_MEASUREMENT = 'heart_rate_measurement';
const HEALTH_THERMOMETER_SERVICE = 'health_thermometer';
const TEMPERATURE_MEASUREMENT = 'temperature_measurement';
const PULSE_OXIMETER_SERVICE = '00001822-0000-1000-8000-00805f9b34fb';
const SPO2_MEASUREMENT = '00002a5e-0000-1000-8000-00805f9b34fb';

interface UseBluetoothReturn {
  isSupported: boolean;
  isScanning: boolean;
  isConnected: boolean;
  connectedDevices: BluetoothDevice[];
  currentVitals: Partial<VitalSigns>;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectDevice: (deviceType: 'heart_rate' | 'spo2' | 'temperature') => Promise<void>;
  disconnectAll: () => void;
  simulateReading: () => void;
}

export function useBluetooth(): UseBluetoothReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDevice[]>([]);
  const [currentVitals, setCurrentVitals] = useState<Partial<VitalSigns>>({});
  const [error, setError] = useState<string | null>(null);
  
  const devicesRef = useRef<Map<string, BluetoothDevice>>(new Map());
  const characteristicsRef = useRef<Map<string, BluetoothRemoteGATTCharacteristic>>(new Map());

  // Check for Web Bluetooth support
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator);
  }, []);

  // Parse heart rate from Bluetooth data
  const parseHeartRate = useCallback((value: DataView): number => {
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    
    if (rate16Bits) {
      return value.getUint16(1, true);
    }
    return value.getUint8(1);
  }, []);

  // Parse temperature from Bluetooth data
  const parseTemperature = useCallback((value: DataView): number => {
    // IEEE 11073 FLOAT format
    const exponent = value.getInt8(3);
    const mantissa = value.getInt8(0) | (value.getInt8(1) << 8) | (value.getInt8(2) << 16);
    return mantissa * Math.pow(10, exponent);
  }, []);

  // Handle heart rate notifications
  const handleHeartRateNotification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      const heartRate = parseHeartRate(value);
      setCurrentVitals(prev => ({ ...prev, heartRate }));
    }
  }, [parseHeartRate]);

  // Handle temperature notifications
  const handleTemperatureNotification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      const temperature = parseTemperature(value);
      setCurrentVitals(prev => ({ ...prev, temperature }));
    }
  }, [parseTemperature]);

  // Handle SpO2 notifications
  const handleSpO2Notification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      // SpO2 is typically in the first byte
      const spo2 = value.getUint8(1);
      setCurrentVitals(prev => ({ ...prev, spo2 }));
    }
  }, []);

  // Connect to a specific type of device
  const connectDevice = useCallback(async (deviceType: 'heart_rate' | 'spo2' | 'temperature') => {
    if (!isSupported) {
      setError('Web Bluetooth is not supported on this device');
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      let filters: BluetoothLEScanFilter[] = [];
      let optionalServices: BluetoothServiceUUID[] = [];

      switch (deviceType) {
        case 'heart_rate':
          filters = [{ services: [HEART_RATE_SERVICE] }];
          optionalServices = [HEART_RATE_SERVICE];
          break;
        case 'temperature':
          filters = [{ services: [HEALTH_THERMOMETER_SERVICE] }];
          optionalServices = [HEALTH_THERMOMETER_SERVICE];
          break;
        case 'spo2':
          filters = [{ services: [PULSE_OXIMETER_SERVICE] }];
          optionalServices = [PULSE_OXIMETER_SERVICE];
          break;
      }

      const device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices,
      });

      if (!device.gatt) {
        throw new Error('GATT server not available');
      }

      const server = await device.gatt.connect();
      let service: BluetoothRemoteGATTService;
      let characteristic: BluetoothRemoteGATTCharacteristic;

      switch (deviceType) {
        case 'heart_rate':
          service = await server.getPrimaryService(HEART_RATE_SERVICE);
          characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
          characteristic.addEventListener('characteristicvaluechanged', handleHeartRateNotification);
          await characteristic.startNotifications();
          break;
        case 'temperature':
          service = await server.getPrimaryService(HEALTH_THERMOMETER_SERVICE);
          characteristic = await service.getCharacteristic(TEMPERATURE_MEASUREMENT);
          characteristic.addEventListener('characteristicvaluechanged', handleTemperatureNotification);
          await characteristic.startNotifications();
          break;
        case 'spo2':
          service = await server.getPrimaryService(PULSE_OXIMETER_SERVICE);
          characteristic = await service.getCharacteristic(SPO2_MEASUREMENT);
          characteristic.addEventListener('characteristicvaluechanged', handleSpO2Notification);
          await characteristic.startNotifications();
          break;
      }

      const btDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || `${deviceType} Sensor`,
        connected: true,
        type: deviceType === 'spo2' ? 'spo2' : deviceType,
      };

      devicesRef.current.set(device.id, btDevice);
      characteristicsRef.current.set(device.id, characteristic);
      
      setConnectedDevices(Array.from(devicesRef.current.values()));

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        devicesRef.current.delete(device.id);
        characteristicsRef.current.delete(device.id);
        setConnectedDevices(Array.from(devicesRef.current.values()));
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to device';
      setError(message);
      console.error('Bluetooth connection error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isSupported, handleHeartRateNotification, handleTemperatureNotification, handleSpO2Notification]);

  // Scan for all available devices
  const scanForDevices = useCallback(async () => {
    if (!isSupported) {
      setError('Web Bluetooth is not supported on this device');
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [HEART_RATE_SERVICE, HEALTH_THERMOMETER_SERVICE, PULSE_OXIMETER_SERVICE],
      });

      console.log('Found device:', device.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan for devices';
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }, [isSupported]);

  // Disconnect all devices
  const disconnectAll = useCallback(() => {
    characteristicsRef.current.forEach((char) => {
      try {
        char.stopNotifications();
      } catch (e) {
        console.error('Error stopping notifications:', e);
      }
    });
    
    devicesRef.current.clear();
    characteristicsRef.current.clear();
    setConnectedDevices([]);
    setCurrentVitals({});
  }, []);

  // Simulate sensor readings for testing
  const simulateReading = useCallback(() => {
    const baseHeartRate = 70 + Math.floor(Math.random() * 50);
    const baseSpo2 = 94 + Math.floor(Math.random() * 6);
    const baseTemp = 36.5 + (Math.random() * 2.5);

    setCurrentVitals({
      heartRate: baseHeartRate,
      spo2: baseSpo2,
      temperature: Math.round(baseTemp * 10) / 10,
    });
  }, []);

  return {
    isSupported,
    isScanning,
    isConnected: connectedDevices.length > 0,
    connectedDevices,
    currentVitals,
    error,
    scanForDevices,
    connectDevice,
    disconnectAll,
    simulateReading,
  };
}
