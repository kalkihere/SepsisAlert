'use client';

import { cn } from '@/lib/utils';
import { Heart, Droplets, Thermometer } from 'lucide-react';

interface VitalCardProps {
  type: 'heartRate' | 'spo2' | 'temperature';
  value: number | undefined;
  unit: string;
  label: string;
  isConnected?: boolean;
  className?: string;
}

const vitalConfig = {
  heartRate: {
    icon: Heart,
    color: 'text-[var(--risk-red)]',
    bgColor: 'bg-[var(--risk-red)]/15',
    borderColor: 'border-[var(--risk-red)]/30',
    glowColor: 'var(--glow-red)',
    normalRange: { min: 60, max: 100 },
  },
  spo2: {
    icon: Droplets,
    color: 'text-[var(--accent)]',
    bgColor: 'bg-[var(--accent)]/15',
    borderColor: 'border-[var(--accent)]/30',
    glowColor: 'var(--glow-blue)',
    normalRange: { min: 95, max: 100 },
  },
  temperature: {
    icon: Thermometer,
    color: 'text-[var(--risk-amber)]',
    bgColor: 'bg-[var(--risk-amber)]/15',
    borderColor: 'border-[var(--risk-amber)]/30',
    glowColor: 'var(--glow-amber)',
    normalRange: { min: 36.1, max: 37.2 },
  },
};

function getVitalStatus(type: keyof typeof vitalConfig, value: number | undefined): 'normal' | 'warning' | 'critical' | 'unknown' {
  if (value === undefined) return 'unknown';
  
  const config = vitalConfig[type];
  const { min, max } = config.normalRange;
  
  if (type === 'heartRate') {
    if (value < 50 || value > 130) return 'critical';
    if (value < min || value > 110) return 'warning';
  } else if (type === 'spo2') {
    if (value < 90) return 'critical';
    if (value < min) return 'warning';
  } else if (type === 'temperature') {
    if (value > 39 || value < 35) return 'critical';
    if (value > 38 || value < 35.5) return 'warning';
  }
  
  return 'normal';
}

export function VitalCard({ type, value, unit, label, isConnected = false, className }: VitalCardProps) {
  const config = vitalConfig[type];
  const Icon = config.icon;
  const status = getVitalStatus(type, value);
  
  const statusStyles = {
    normal: 'ring-[var(--primary)]/30',
    warning: 'ring-[var(--risk-amber)]/50 animate-pulse',
    critical: 'ring-[var(--risk-red)]/60 animate-pulse',
    unknown: 'ring-[var(--border)]',
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center glass-panel p-6 transition-all duration-300 glow-card',
        status !== 'unknown' && `ring-2 ${statusStyles[status]}`,
        className
      )}
    >
      {/* Connection indicator */}
      <div className={cn(
        'absolute top-3 right-3 h-2.5 w-2.5 rounded-full',
        isConnected ? 'bg-[var(--primary)] shadow-[0_0_8px_var(--glow-green)]' : 'bg-[var(--muted)]'
      )}>
        {isConnected && (
          <span className="absolute inset-0 rounded-full bg-[var(--primary)] animate-online-pulse" />
        )}
      </div>
      
      {/* Icon */}
      <div className={cn('mb-3 rounded-full p-3', config.bgColor)}>
        <Icon className={cn(
          'h-8 w-8', 
          config.color,
          type === 'heartRate' && value !== undefined && 'animate-heartbeat'
        )} />
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'text-4xl font-bold tabular-nums',
          value !== undefined ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {value !== undefined ? (type === 'temperature' ? value.toFixed(1) : value) : '--'}
        </span>
        <span className="text-lg text-muted-foreground">{unit}</span>
      </div>
      
      {/* Label */}
      <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
      
      {/* Status indicator */}
      {status !== 'unknown' && (
        <div className={cn(
          'mt-3 rounded-full px-3 py-1 text-xs font-semibold border',
          status === 'normal' && 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30',
          status === 'warning' && 'bg-[var(--risk-amber)]/15 text-[var(--risk-amber)] border-[var(--risk-amber)]/30',
          status === 'critical' && 'bg-[var(--risk-red)]/15 text-[var(--risk-red)] border-[var(--risk-red)]/30'
        )}>
          {status === 'normal' && 'Normal'}
          {status === 'warning' && 'Elevated'}
          {status === 'critical' && 'Critical'}
        </div>
      )}
    </div>
  );
}

// Compact version for history/lists
export function VitalCardCompact({ type, value, unit }: Omit<VitalCardProps, 'label' | 'className'>) {
  const config = vitalConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 border',
      config.bgColor,
      config.borderColor
    )}>
      <Icon className={cn('h-4 w-4', config.color)} />
      <span className="font-semibold tabular-nums text-foreground">
        {value !== undefined ? (type === 'temperature' ? value.toFixed(1) : value) : '--'}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}
