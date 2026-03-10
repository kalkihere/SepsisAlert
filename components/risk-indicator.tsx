'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { RiskLevel } from '@/types';

interface RiskIndicatorProps {
  riskLevel: RiskLevel | undefined;
  riskScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const riskConfig = {
  RED: {
    icon: AlertTriangle,
    label: 'HIGH RISK',
    bgColor: 'bg-[var(--risk-red)]/15',
    textColor: 'text-[var(--risk-red)]',
    borderColor: 'border-[var(--risk-red)]',
    glowColor: 'shadow-[0_0_20px_var(--glow-red)]',
  },
  AMBER: {
    icon: AlertCircle,
    label: 'MEDIUM RISK',
    bgColor: 'bg-[var(--risk-amber)]/15',
    textColor: 'text-[var(--risk-amber)]',
    borderColor: 'border-[var(--risk-amber)]',
    glowColor: 'shadow-[0_0_20px_var(--glow-amber)]',
  },
  GREEN: {
    icon: CheckCircle2,
    label: 'LOW RISK',
    bgColor: 'bg-[var(--risk-green)]/15',
    textColor: 'text-[var(--risk-green)]',
    borderColor: 'border-[var(--risk-green)]',
    glowColor: 'shadow-[0_0_20px_var(--glow-green)]',
  },
};

const sizeConfig = {
  sm: {
    container: 'h-16 w-16',
    icon: 'h-6 w-6',
    text: 'text-xs',
    score: 'text-lg',
  },
  md: {
    container: 'h-28 w-28',
    icon: 'h-10 w-10',
    text: 'text-sm',
    score: 'text-2xl',
  },
  lg: {
    container: 'h-40 w-40',
    icon: 'h-14 w-14',
    text: 'text-base',
    score: 'text-4xl',
  },
};

export function RiskIndicator({ 
  riskLevel, 
  riskScore, 
  size = 'md', 
  showLabel = true,
  className 
}: RiskIndicatorProps) {
  if (!riskLevel) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-full border-4 border-dashed border-[var(--border)] bg-[var(--secondary)]',
        sizeConfig[size].container,
        className
      )}>
        <span className="text-muted-foreground text-sm">--</span>
      </div>
    );
  }

  const config = riskConfig[riskLevel];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Main indicator circle */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-full border-4 transition-all duration-500',
          sizes.container,
          config.bgColor,
          config.borderColor,
          config.glowColor,
          riskLevel === 'RED' && 'animate-pulse-glow'
        )}
      >
        {/* Pulse ring for RED */}
        {riskLevel === 'RED' && (
          <div className={cn(
            'absolute inset-0 rounded-full border-4 border-[var(--risk-red)] opacity-50 animate-ping'
          )} />
        )}
        
        {/* Icon or Score */}
        {riskScore !== undefined ? (
          <div className="flex flex-col items-center">
            <span className={cn('font-bold tabular-nums', sizes.score, config.textColor)}>
              {riskScore}%
            </span>
          </div>
        ) : (
          <Icon className={cn(sizes.icon, config.textColor)} />
        )}
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className={cn(
          'font-bold tracking-wide',
          sizes.text,
          config.textColor
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact badge version with glow
export function RiskBadge({ riskLevel, className }: { riskLevel: RiskLevel; className?: string }) {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold border',
      config.bgColor,
      config.textColor,
      config.borderColor,
      riskLevel === 'RED' && 'shadow-[0_0_10px_var(--glow-red)]',
      riskLevel === 'AMBER' && 'shadow-[0_0_10px_var(--glow-amber)]',
      riskLevel === 'GREEN' && 'shadow-[0_0_10px_var(--glow-green)]',
      className
    )}>
      <Icon className="h-4 w-4" />
      <span className="text-sm">{riskLevel}</span>
    </div>
  );
}
