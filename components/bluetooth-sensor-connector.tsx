'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBluetooth } from '@/hooks/use-bluetooth';
import { useTranslation } from '@/hooks/use-language';
import { useEffect } from 'react';
import { 
  Bluetooth, 
  BluetoothConnected, 
  BluetoothOff, 
  Heart, 
  Droplets, 
  Thermometer,
  RefreshCw,
  Loader2,
  Play,
  Square,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';

interface BluetoothSensorConnectorProps {
  onVitalsUpdate?: (vitals: { heartRate?: number; spo2?: number; temperature?: number }) => void;
  className?: string;
}

export function BluetoothSensorConnector({ onVitalsUpdate, className }: BluetoothSensorConnectorProps) {
  const { t } = useTranslation();
  const {
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
  } = useBluetooth();

  // Notify parent of vital updates
  useEffect(() => {
    if (onVitalsUpdate && (currentVitals.heartRate || currentVitals.spo2 || currentVitals.temperature)) {
      onVitalsUpdate(currentVitals);
    }
  }, [currentVitals, onVitalsUpdate]);

  // Status icon
  const getStatusIcon = () => {
    switch (measurementStatus) {
      case 'PLACE_FINGER':
        return <Fingerprint className="h-5 w-5 text-[var(--risk-amber)] animate-pulse" />;
      case 'MEASURING_HR':
        return <Heart className="h-5 w-5 text-[var(--risk-red)] animate-pulse" />;
      case 'MEASURING_SPO2':
        return <Droplets className="h-5 w-5 text-[var(--accent)] animate-pulse" />;
      case 'MEASURING_TEMP':
        return <Thermometer className="h-5 w-5 text-[var(--risk-amber)] animate-pulse" />;
      case 'DONE':
        return <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-[var(--risk-red)]" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('glass-panel overflow-hidden', className)}>
      {/* Header — Connection Status */}
      <div className="p-4 border-b border-[#1F2A36]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center transition-all',
              isConnected 
                ? 'bg-[var(--primary)]/20 shadow-[0_0_10px_var(--glow-green)]' 
                : 'bg-[var(--secondary)]'
            )}>
              {isScanning ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : isConnected ? (
                <BluetoothConnected className="h-5 w-5 text-[var(--primary)]" />
              ) : (
                <Bluetooth className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isConnected ? 'ESP32 Connected' : t('connectSensors')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? deviceName || 'ESP32_CHAT'
                  : 'Connect your ESP32 sensor device'
                }
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={disconnect}
              className="text-[var(--risk-red)] hover:text-[var(--risk-red)] hover:bg-[var(--risk-red)]/10"
            >
              <BluetoothOff className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={connect}
              disabled={isScanning || !isSupported}
              className="text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-1" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Connection Button (when not connected) */}
        {!isConnected && (
          <Button
            onClick={connect}
            disabled={isScanning || !isSupported}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] hover:opacity-90 text-[#0B0F14] border-0 transition-all"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Searching for ESP32...
              </>
            ) : (
              <>
                <Bluetooth className="h-5 w-5 mr-2" />
                Connect to ESP32 Device
              </>
            )}
          </Button>
        )}

        {/* Start Measurement (when connected) */}
        {isConnected && !isMeasuring && measurementStatus !== 'DONE' && (
          <Button
            onClick={() => startMeasurement('ALL')}
            className="w-full h-14 text-base font-semibold gradient-button border-0 text-[#0B0F14] transition-all active:scale-[0.98]"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Full Scan
          </Button>
        )}

        {/* Stop Measurement */}
        {isMeasuring && (
          <Button
            onClick={stopMeasurement}
            variant="outline"
            className="w-full h-12 border-[var(--risk-red)]/50 text-[var(--risk-red)] hover:bg-[var(--risk-red)]/10"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Measurement
          </Button>
        )}

        {/* Measurement Complete - Scan Again */}
        {isConnected && !isMeasuring && measurementStatus === 'DONE' && (
          <Button
            onClick={() => startMeasurement('ALL')}
            variant="outline"
            className="w-full h-12 border-[var(--primary)]/50 text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Scan Again
          </Button>
        )}

        {/* Progress Bar & Status */}
        {(isMeasuring || measurementStatus === 'DONE' || measurementStatus === 'PLACE_FINGER') && (
          <div className="space-y-3">
            {/* Status Message */}
            <div className="flex items-center gap-3 py-2">
              {getStatusIcon()}
              <span className={cn(
                "text-sm font-medium",
                measurementStatus === 'DONE' ? 'text-[var(--primary)]' :
                measurementStatus === 'ERROR' ? 'text-[var(--risk-red)]' :
                'text-foreground'
              )}>
                {statusMessage}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  measurementStatus === 'DONE' 
                    ? 'bg-[var(--primary)]' 
                    : measurementStatus === 'ERROR'
                      ? 'bg-[var(--risk-red)]'
                      : 'bg-gradient-to-r from-[var(--accent)] to-[var(--primary)]'
                )}
                style={{ width: `${measurementProgress}%` }}
              />
            </div>
            
            {/* Step indicators */}
            <div className="grid grid-cols-3 gap-1">
              <div className={cn(
                "text-center text-[10px] py-1 rounded",
                currentVitals.heartRate 
                  ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                  : measurementStatus === 'MEASURING_HR' 
                    ? 'text-[var(--risk-red)] bg-[var(--risk-red)]/10 animate-pulse' 
                    : 'text-muted-foreground'
              )}>
                {currentVitals.heartRate ? `❤ ${currentVitals.heartRate} BPM` : '❤ Heart Rate'}
              </div>
              <div className={cn(
                "text-center text-[10px] py-1 rounded",
                currentVitals.spo2 
                  ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                  : measurementStatus === 'MEASURING_SPO2' 
                    ? 'text-[var(--accent)] bg-[var(--accent)]/10 animate-pulse' 
                    : 'text-muted-foreground'
              )}>
                {currentVitals.spo2 ? `💧 ${currentVitals.spo2}%` : '💧 SpO2'}
              </div>
              <div className={cn(
                "text-center text-[10px] py-1 rounded",
                currentVitals.temperature 
                  ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                  : measurementStatus === 'MEASURING_TEMP' 
                    ? 'text-[var(--risk-amber)] bg-[var(--risk-amber)]/10 animate-pulse' 
                    : 'text-muted-foreground'
              )}>
                {currentVitals.temperature ? `🌡 ${currentVitals.temperature}°C` : '🌡 Temp'}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-[var(--risk-red)]/15 border border-[var(--risk-red)]/30 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--risk-red)] flex-shrink-0" />
            <span className="text-sm text-[var(--risk-red)]">{error}</span>
          </div>
        )}

        {/* Not supported message */}
        {!isSupported && (
          <div className="rounded-lg bg-[var(--risk-amber)]/15 border border-[var(--risk-amber)]/30 p-3 text-sm text-[var(--risk-amber)]">
            Web Bluetooth is not supported on this browser. Use Chrome on Android/Desktop.
          </div>
        )}

        {/* Connected device info */}
        {isConnected && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3 py-2 text-sm">
            <div className="relative">
              <Wifi className="h-4 w-4 text-[var(--primary)]" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-online-pulse" />
            </div>
            <span className="font-medium text-foreground">{deviceName}</span>
            <span className="text-muted-foreground text-xs">• BLE Connected</span>
          </div>
        )}

        {/* Simulate button (always available for testing/demo) */}
        <div className="pt-1">
          <Button
            variant="secondary"
            className="w-full bg-[var(--secondary)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)]"
            onClick={simulateReading}
            disabled={isMeasuring}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('simulateSensors')} (Demo)
          </Button>
        </div>
      </div>
    </div>
  );
}
