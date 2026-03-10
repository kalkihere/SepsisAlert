'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from '@/hooks/use-language';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { usePWAInstall } from '@/hooks/use-pwa-install';
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
  HeartPulse,
  Download,
  Smartphone,
  Monitor,
  Share,
  Plus,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import type { Language } from '@/types';

export function SettingsPageClient() {
  const { t, language, setLanguage } = useTranslation();
  const isOnline = useOnlineStatus();
  const { isInstalled, isIOS, isAndroid, installApp, canPrompt } = usePWAInstall();
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

        {/* Install App Section */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-[#1F2A36]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#30D158]/20 to-[#0A84FF]/20 flex items-center justify-center">
                <Download className="h-4 w-4 text-[#30D158]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Install App</h2>
                <p className="text-xs text-muted-foreground">Add SepsisAlert to your device</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {isInstalled ? (
              /* Already installed state */
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#30D158]/10 border border-[#30D158]/30">
                <CheckCircle2 className="h-6 w-6 text-[#30D158] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#30D158]">App Installed</p>
                  <p className="text-sm text-muted-foreground">SepsisAlert is installed on your device</p>
                </div>
              </div>
            ) : (
              <>
                {/* Native install button (Chrome / supported browsers) */}
                {canPrompt && (
                  <Button
                    onClick={installApp}
                    className="w-full gradient-button border-0 text-[#0B0F14] h-12 text-base font-semibold"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Install SepsisAlert
                  </Button>
                )}

                {/* Platform-specific instructions */}
                <div className="space-y-3">
                  {/* iOS Instructions */}
                  <div className={`rounded-lg border p-4 ${
                    isIOS 
                      ? 'border-[#0A84FF]/40 bg-[#0A84FF]/10' 
                      : 'border-[#1F2A36] bg-[#141B24]/50'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4 text-[#8E8E93]" />
                      <span className="text-sm font-semibold text-white">iPhone / iPad (Safari)</span>
                      {isIOS && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A84FF]/30 text-[#0A84FF] font-semibold">Your Device</span>}
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#0A84FF]">1</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Open this page in <span className="font-semibold text-white">Safari</span> browser
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#0A84FF]">2</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6] flex items-center gap-1 flex-wrap">
                          Tap the <Share className="h-4 w-4 text-[#0A84FF] inline" /> <span className="font-semibold text-white">Share</span> button at the bottom
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#0A84FF]">3</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6] flex items-center gap-1 flex-wrap">
                          Scroll down and tap <Plus className="h-4 w-4 text-[#0A84FF] inline" /> <span className="font-semibold text-white">&quot;Add to Home Screen&quot;</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#0A84FF]">4</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Tap <span className="font-semibold text-white">&quot;Add&quot;</span> to confirm
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Android Instructions */}
                  <div className={`rounded-lg border p-4 ${
                    isAndroid && !canPrompt 
                      ? 'border-[#30D158]/40 bg-[#30D158]/10' 
                      : 'border-[#1F2A36] bg-[#141B24]/50'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4 text-[#8E8E93]" />
                      <span className="text-sm font-semibold text-white">Android (Chrome)</span>
                      {isAndroid && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30D158]/30 text-[#30D158] font-semibold">Your Device</span>}
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#30D158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#30D158]">1</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Open this page in <span className="font-semibold text-white">Chrome</span> browser
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#30D158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#30D158]">2</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6] flex items-center gap-1 flex-wrap">
                          Tap the <MoreVertical className="h-4 w-4 text-[#30D158] inline" /> <span className="font-semibold text-white">menu</span> (top right)
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#30D158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#30D158]">3</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Tap <span className="font-semibold text-white">&quot;Install app&quot;</span> or <span className="font-semibold text-white">&quot;Add to Home screen&quot;</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Instructions */}
                  <div className="rounded-lg border border-[#1F2A36] bg-[#141B24]/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Monitor className="h-4 w-4 text-[#8E8E93]" />
                      <span className="text-sm font-semibold text-white">Desktop (Chrome / Edge)</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#BF5AF2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#BF5AF2]">1</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Look for the <Download className="h-3.5 w-3.5 text-[#BF5AF2] inline" /> <span className="font-semibold text-white">install icon</span> in the address bar
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded bg-[#BF5AF2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#BF5AF2]">2</span>
                        </div>
                        <p className="text-sm text-[#BDC1C6]">
                          Click <span className="font-semibold text-white">&quot;Install&quot;</span> to add SepsisAlert to your desktop
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits info */}
                <div className="rounded-lg bg-[#0A84FF]/5 border border-[#0A84FF]/15 p-3">
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    <span className="font-semibold text-[#0A84FF]">Why install?</span> The installed app works offline, loads faster, and provides a native app-like experience for screening patients in areas with limited connectivity.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>


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
