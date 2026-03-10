'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from '@/hooks/use-language';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { syncService } from '@/services/sync';
import { getPendingSyncCount, initDB } from '@/lib/db';
import { toast } from 'sonner';
import { 
  Globe, 
  RefreshCw,
  Trash2,
  Info,
  Loader2,
  CloudOff,
  Wifi,
  HeartPulse
} from 'lucide-react';
import type { Language } from '@/types';

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const isOnline = useOnlineStatus();
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    initDB().then(() => {
      getPendingSyncCount().then(setPendingSync);
    });
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      if (result.success) {
        toast.success(`Synced ${result.synced} items`);
        const count = await getPendingSyncCount();
        setPendingSync(count);
      } else {
        toast.error(result.message || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      indexedDB.deleteDatabase('SepsisAlertDB');
      toast.success('Local data cleared');
      window.location.reload();
    }
  };

  const languages: { value: Language; label: string; native: string }[] = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'hi', label: 'Hindi', native: 'हिंदी' },
    { value: 'bn', label: 'Bengali', native: 'বাংলা' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack backHref="/" pendingSync={pendingSync} />

      <main className="container px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>

        {/* Language Settings */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-[#1F2A36]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                <Globe className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t('language')}</h2>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <RadioGroup
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
              className="space-y-3"
            >
              {languages.map((lang) => (
                <div 
                  key={lang.value} 
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    language === lang.value 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_10px_var(--glow-green)]' 
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                  onClick={() => setLanguage(lang.value)}
                >
                  <RadioGroupItem value={lang.value} id={lang.value} className="h-5 w-5 border-[var(--primary)] text-[var(--primary)]" />
                  <Label htmlFor={lang.value} className="flex-1 cursor-pointer">
                    <span className="font-medium text-foreground">{lang.label}</span>
                    <span className="text-muted-foreground ml-2">({lang.native})</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-[#1F2A36]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t('syncStatus')}</h2>
                <p className="text-xs text-muted-foreground">Manage offline data synchronization</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Connection status */}
            <div className={`flex items-center justify-between rounded-lg p-4 border ${
              isOnline 
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30' 
                : 'bg-[var(--risk-amber)]/10 border-[var(--risk-amber)]/30'
            }`}>
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <div className="relative">
                    <Wifi className="h-5 w-5 text-[var(--primary)]" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--primary)] animate-online-pulse" />
                  </div>
                ) : (
                  <CloudOff className="h-5 w-5 text-[var(--risk-amber)]" />
                )}
                <div>
                  <p className={`font-medium ${isOnline ? 'text-[var(--primary)]' : 'text-[var(--risk-amber)]'}`}>
                    {isOnline ? t('online') : t('offline')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingSync} items pending sync
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleSync}
                disabled={!isOnline || isSyncing || pendingSync === 0}
                size="sm"
                className="gradient-button border-0 text-[#0B0F14] disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            <div className="h-px bg-[#1F2A36]" />

            {/* Clear data */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--risk-red)]">Clear Local Data</p>
                <p className="text-sm text-muted-foreground">
                  Remove all locally stored data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="border-[var(--risk-red)] text-[var(--risk-red)] hover:bg-[var(--risk-red)]/10 hover:text-[var(--risk-red)]"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-[#1F2A36]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                <Info className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <h2 className="font-semibold text-foreground">About</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-button flex items-center justify-center">
                <HeartPulse className="h-6 w-6 text-[#0B0F14]" />
              </div>
              <div>
                <p className="font-bold text-foreground">SepsisAlert</p>
                <p className="text-sm text-muted-foreground">Early Sepsis Screening System</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Version 1.0.0</p>
              <p>Designed for ASHA workers in rural healthcare settings</p>
            </div>
            
            <div className="h-px bg-[#1F2A36]" />
            
            <p className="text-xs text-muted-foreground">
              This application uses AI to help screen patients for sepsis. 
              Results should always be verified by qualified medical professionals.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
