'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBluetooth } from '@/hooks/use-bluetooth';
import { useTranslation } from '@/hooks/use-language';
import { 
  Bluetooth, 
  BluetoothConnected, 
  BluetoothOff, 
  Heart, 
  Droplets, 
  Thermometer,
  RefreshCw,
  Loader2,
  Wifi
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
    connectedDevices,
    currentVitals,
    error,
    connectDevice,
    disconnectAll,
    simulateReading,
  } = useBluetooth();

  // Notify parent of vital updates
  if (onVitalsUpdate && (currentVitals.heartRate || currentVitals.spo2 || currentVitals.temperature)) {
    onVitalsUpdate(currentVitals);
  }

  const sensors = [
    {
      type: 'heart_rate' as const,
      label: t('heartRate'),
      icon: Heart,
      color: 'text-[var(--risk-red)]',
      bgColor: 'bg-[var(--risk-red)]/15',
      borderColor: 'border-[var(--risk-red)]/30',
      connected: connectedDevices.some(d => d.type === 'heart_rate'),
    },
    {
      type: 'spo2' as const,
      label: t('spo2'),
      icon: Droplets,
      color: 'text-[var(--accent)]',
      bgColor: 'bg-[var(--accent)]/15',
      borderColor: 'border-[var(--accent)]/30',
      connected: connectedDevices.some(d => d.type === 'spo2'),
    },
    {
      type: 'temperature' as const,
      label: t('temperature'),
      icon: Thermometer,
      color: 'text-[var(--risk-amber)]',
      bgColor: 'bg-[var(--risk-amber)]/15',
      borderColor: 'border-[var(--risk-amber)]/30',
      connected: connectedDevices.some(d => d.type === 'temperature'),
    },
  ];

  return (
    <div className={cn('glass-panel overflow-hidden', className)}>
      <div className="p-4 border-b border-[#1F2A36]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              isConnected 
                ? 'bg-[var(--primary)]/20 shadow-[0_0_10px_var(--glow-green)]' 
                : 'bg-[var(--secondary)]'
            )}>
              {isConnected ? (
                <BluetoothConnected className="h-5 w-5 text-[var(--primary)]" />
              ) : (
                <Bluetooth className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('connectSensors')}</h3>
              <p className="text-sm text-muted-foreground">
                {connectedDevices.length} {t('connected').toLowerCase()}
              </p>
            </div>
          </div>
          
          {isConnected && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={disconnectAll}
              className="text-[var(--risk-red)] hover:text-[var(--risk-red)] hover:bg-[var(--risk-red)]/10"
            >
              <BluetoothOff className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Sensor buttons */}
        <div className="grid grid-cols-3 gap-3">
          {sensors.map((sensor) => {
            const Icon = sensor.icon;
            return (
              <Button
                key={sensor.type}
                variant="ghost"
                className={cn(
                  'h-auto flex-col gap-2 py-4 border transition-all',
                  sensor.connected 
                    ? 'bg-[var(--primary)]/15 border-[var(--primary)] shadow-[0_0_15px_var(--glow-green)]' 
                    : `${sensor.bgColor} ${sensor.borderColor} hover:border-[var(--primary)]`
                )}
                onClick={() => connectDevice(sensor.type)}
                disabled={isScanning || !isSupported}
              >
                {isScanning ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Icon className={cn(
                    'h-6 w-6',
                    sensor.connected ? 'text-[var(--primary)]' : sensor.color
                  )} />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  sensor.connected ? 'text-[var(--primary)]' : 'text-foreground'
                )}>{sensor.label}</span>
                <span className={cn(
                  'text-[10px]',
                  sensor.connected ? 'text-[var(--primary)]/70' : 'text-muted-foreground'
                )}>
                  {sensor.connected ? t('connected') : 'Tap to connect'}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-[var(--risk-red)]/15 border border-[var(--risk-red)]/30 p-3 text-sm text-[var(--risk-red)]">
            {error}
          </div>
        )}

        {/* Not supported message */}
        {!isSupported && (
          <div className="rounded-lg bg-[var(--risk-amber)]/15 border border-[var(--risk-amber)]/30 p-3 text-sm text-[var(--risk-amber)]">
            Web Bluetooth is not supported on this device. Use the simulate button for testing.
          </div>
        )}

        {/* Simulate button for testing */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 bg-[var(--secondary)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)]"
            onClick={simulateReading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('simulateSensors')}
          </Button>
        </div>

        {/* Connected devices list */}
        {connectedDevices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Connected Devices:</p>
            <div className="space-y-1">
              {connectedDevices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center gap-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3 py-2 text-sm"
                >
                  <div className="relative">
                    <Wifi className="h-4 w-4 text-[var(--primary)]" />
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-online-pulse" />
                  </div>
                  <span className="font-medium text-foreground">{device.name}</span>
                  <span className="text-muted-foreground">({device.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
