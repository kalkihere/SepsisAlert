'use client';

import { RiskBadge } from '@/components/risk-indicator';
import { VitalCardCompact } from '@/components/vital-card';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, CloudOff, Check } from 'lucide-react';
import type { ScanResult } from '@/types';

interface ScanHistoryItemProps {
  scan: ScanResult;
  patientName?: string;
  onClick?: () => void;
  className?: string;
}

export function ScanHistoryItem({ scan, patientName, onClick, className }: ScanHistoryItemProps) {
  const date = new Date(scan.timestamp);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, 'PPp');

  const glowClass = scan.riskLevel === 'RED' 
    ? 'hover:shadow-[0_0_15px_var(--glow-red)]' 
    : scan.riskLevel === 'AMBER' 
      ? 'hover:shadow-[0_0_15px_var(--glow-amber)]' 
      : 'hover:shadow-[0_0_15px_var(--glow-green)]';

  return (
    <div 
      className={cn(
        'glass-panel p-4 transition-all cursor-pointer hover:border-[var(--primary)]/50 hover:translate-y-[-2px]',
        glowClass,
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Patient name if provided */}
          {patientName && (
            <p className="font-semibold text-base truncate mb-1 text-foreground">{patientName}</p>
          )}
          
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span title={fullDate}>{timeAgo}</span>
            
            {/* Sync status */}
            {scan.synced ? (
              <span className="flex items-center gap-1 text-[var(--primary)]">
                <Check className="h-3 w-3" />
                <span className="text-xs">Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[var(--risk-amber)]">
                <CloudOff className="h-3 w-3" />
                <span className="text-xs">Pending</span>
              </span>
            )}
          </div>

          {/* Vitals */}
          <div className="flex flex-wrap gap-2">
            <VitalCardCompact 
              type="heartRate" 
              value={scan.vitals.heartRate} 
              unit="BPM"
            />
            <VitalCardCompact 
              type="spo2" 
              value={scan.vitals.spo2} 
              unit="%"
            />
            <VitalCardCompact 
              type="temperature" 
              value={scan.vitals.temperature} 
              unit="°C"
            />
          </div>
        </div>

        {/* Risk indicator */}
        <div className="flex flex-col items-end gap-2">
          <RiskBadge riskLevel={scan.riskLevel} />
          <span className="text-2xl font-bold text-muted-foreground">
            {scan.riskScore}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
export function ScanHistoryItemSkeleton() {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="flex-1">
          <div className="h-4 w-32 bg-[var(--secondary)] rounded mb-3" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-[var(--secondary)] rounded" />
            <div className="h-8 w-16 bg-[var(--secondary)] rounded" />
            <div className="h-8 w-18 bg-[var(--secondary)] rounded" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-16 bg-[var(--secondary)] rounded-full" />
          <div className="h-8 w-12 bg-[var(--secondary)] rounded" />
        </div>
      </div>
    </div>
  );
}
