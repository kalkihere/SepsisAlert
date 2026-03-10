'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Globe,
  Phone
} from 'lucide-react';
import type { GuidanceResponse, Language, RiskLevel } from '@/types';

interface GuidancePanelProps {
  guidance: GuidanceResponse | null;
  riskLevel: RiskLevel;
  isLoading?: boolean;
  className?: string;
}

const urgencyConfig = {
  immediate: {
    icon: AlertTriangle,
    color: 'text-[var(--risk-red)]',
    bgColor: 'bg-[var(--risk-red)]/15',
    borderColor: 'border-[var(--risk-red)]/30',
    glowColor: 'shadow-[0_0_20px_var(--glow-red)]',
    label: 'Immediate Action Required',
  },
  urgent: {
    icon: Clock,
    color: 'text-[var(--risk-amber)]',
    bgColor: 'bg-[var(--risk-amber)]/15',
    borderColor: 'border-[var(--risk-amber)]/30',
    glowColor: 'shadow-[0_0_20px_var(--glow-amber)]',
    label: 'Urgent - Follow Up Within 24h',
  },
  routine: {
    icon: CheckCircle2,
    color: 'text-[var(--primary)]',
    bgColor: 'bg-[var(--primary)]/15',
    borderColor: 'border-[var(--primary)]/30',
    glowColor: 'shadow-[0_0_20px_var(--glow-green)]',
    label: 'Routine Care',
  },
};

export function GuidancePanel({ guidance, riskLevel, isLoading, className }: GuidancePanelProps) {
  const { t, language, setLanguage } = useTranslation();

  if (isLoading) {
    return (
      <div className={cn('glass-panel animate-pulse', className)}>
        <div className="p-4 border-b border-[#1F2A36]">
          <div className="h-6 w-48 bg-[var(--secondary)] rounded" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-20 bg-[var(--secondary)] rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
            <div className="h-4 bg-[var(--secondary)] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!guidance) {
    return (
      <div className={cn('glass-panel', className)}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--accent)]/20 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <p className="text-muted-foreground">
            Complete a scan to receive AI guidance
          </p>
        </div>
      </div>
    );
  }

  const urgency = urgencyConfig[guidance.urgency_level];
  const UrgencyIcon = urgency.icon;

  return (
    <div className={cn('glass-panel overflow-hidden', urgency.glowColor, className)}>
      <div className="p-4 border-b border-[#1F2A36]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <h3 className="font-semibold text-foreground">{t('guidance')}</h3>
          </div>
          
          {/* Language selector */}
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              {(['en', 'hi', 'bn'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium transition-all',
                    language === lang 
                      ? 'bg-[var(--primary)] text-[#0B0F14]' 
                      : 'bg-[var(--secondary)] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Urgency badge */}
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-3 border',
          urgency.bgColor,
          urgency.borderColor
        )}>
          <UrgencyIcon className={cn('h-5 w-5', urgency.color)} />
          <span className={cn('font-semibold', urgency.color)}>
            {urgency.label}
          </span>
        </div>

        {/* Main guidance message */}
        <div className={cn(
          'rounded-xl p-4 text-base leading-relaxed border',
          urgency.bgColor,
          urgency.borderColor
        )}>
          <p className="font-medium text-foreground">
            {guidance.guidance[language]}
          </p>
        </div>

        {/* Recommended actions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t('recommendedActions')}
          </h4>
          <ul className="space-y-2">
            {guidance.recommended_actions.map((action, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)] px-4 py-3 transition-all hover:border-[var(--primary)]/50"
              >
                <ChevronRight className={cn('h-5 w-5 mt-0.5 flex-shrink-0', urgency.color)} />
                <span className="text-sm text-foreground">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Emergency contact for RED level */}
        {riskLevel === 'RED' && (
          <Button 
            className="w-full h-14 text-base font-bold bg-[var(--risk-red)] hover:bg-[var(--risk-red)]/90 text-white shadow-[0_0_20px_var(--glow-red)]"
            onClick={() => window.location.href = 'tel:102'}
          >
            <Phone className="h-5 w-5 mr-2" />
            Call Emergency Services (102)
          </Button>
        )}
      </div>
    </div>
  );
}
