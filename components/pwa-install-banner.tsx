'use client';

import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, X, Share, MoreVertical, Plus } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, installApp, dismissInstall, canPrompt } = usePWAInstall();

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) return null;

  return (
    <div className="relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="glass-panel p-4 mx-3 mt-3 glow-blue relative">
        {/* Dismiss button */}
        <button
          onClick={dismissInstall}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          aria-label="Dismiss install banner"
        >
          <X className="h-3.5 w-3.5 text-white/60" />
        </button>

        <div className="flex items-start gap-3.5">
          {/* App icon */}
          <div className="h-12 w-12 rounded-2xl gradient-button flex items-center justify-center flex-shrink-0 shadow-lg">
            <Download className="h-5 w-5 text-[#0B0F14]" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-sm font-bold text-white leading-tight">
              Install SepsisAlert
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              {isIOS
                ? 'Add to your home screen for quick access & offline use'
                : 'Install the app for quick access & offline screening'
              }
            </p>

            {/* iOS manual instructions */}
            {isIOS ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#BDC1C6]">
                  <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#0A84FF]">1</span>
                  </div>
                  <span className="flex items-center gap-1">
                    Tap the Share button
                    <Share className="h-3.5 w-3.5 text-[#0A84FF] inline" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#BDC1C6]">
                  <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#0A84FF]">2</span>
                  </div>
                  <span className="flex items-center gap-1">
                    Select &quot;Add to Home Screen&quot;
                    <Plus className="h-3.5 w-3.5 text-[#0A84FF] inline" />
                  </span>
                </div>
              </div>
            ) : canPrompt ? (
              /* Chrome/Android install button */
              <button
                onClick={installApp}
                className="mt-3 gradient-button px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Install Now
              </button>
            ) : (
              /* Fallback instructions for other browsers */
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#BDC1C6]">
                  <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#0A84FF]">1</span>
                  </div>
                  <span className="flex items-center gap-1">
                    Tap the menu
                    <MoreVertical className="h-3.5 w-3.5 text-[#0A84FF] inline" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#BDC1C6]">
                  <div className="h-5 w-5 rounded bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#0A84FF]">2</span>
                  </div>
                  <span>&quot;Install app&quot; or &quot;Add to Home Screen&quot;</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
