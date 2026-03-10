'use client';

import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useTranslation } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  showBack?: boolean;
  backHref?: string;
  pendingSync?: number;
  className?: string;
}

export function AppHeader({ showBack, backHref = '/', className }: AppHeaderProps) {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full bg-[#0A0E12]',
      className
    )}>
      <div className="flex h-14 items-center justify-between px-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          {showBack && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="mr-1 h-9 w-9 hover:bg-white/5 rounded-xl">
                <ArrowLeft className="h-5 w-5 text-white" />
                <span className="sr-only">Go back</span>
              </Button>
            </Link>
          )}
          
          <div className="flex items-center gap-2.5">
            {/* Logo - Heartbeat line icon */}
            <div className="flex h-9 w-9 items-center justify-center">
              <svg 
                viewBox="0 0 32 32" 
                className="w-7 h-7"
                fill="none"
              >
                <path 
                  d="M2 16 L8 16 L11 8 L14 24 L17 12 L20 20 L23 16 L30 16" 
                  stroke="#0A84FF"
                  strokeWidth="2.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="icon-glow-blue"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight text-white tracking-tight">{t('appName')}</span>
              <span className="text-[10px] text-[#8E8E93] leading-tight">{t('tagline')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online status indicator - pill style */}
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
            isOnline 
              ? 'bg-[#1C242E] text-[#30D158]' 
              : 'bg-[#1C242E] text-[#FF453A]'
          )}>
            {isOnline ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-online-pulse absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#30D158]" />
                </span>
                <Wifi className="h-3.5 w-3.5" />
                <span>{t('online')}</span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF453A]" />
                </span>
                <span>{t('offline')}</span>
              </>
            )}
          </div>

          {/* Settings */}
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-white/5"
            >
              <Settings className="h-5 w-5 text-[#8E8E93]" />
              <span className="sr-only">{t('settings')}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
