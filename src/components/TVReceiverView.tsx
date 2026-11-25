import { useEffect, useState } from 'react';
import { Check, Copy, Gamepad2, Tv, Wifi } from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { GamepadInputState } from '../types';
import { GalacticShiftGame } from './GalacticShiftGame';

interface TVReceiverViewProps {
  copy: AppCopy;
  tvModeCode: string | null;
  connectedControllers: number;
  liveGamepadState: GamepadInputState;
  onRegisterAsTv: () => void;
  onSwitchToPhone: () => void;
}

export function TVReceiverView({
  copy,
  tvModeCode,
  connectedControllers,
  liveGamepadState,
  onRegisterAsTv,
  onSwitchToPhone,
}: TVReceiverViewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onRegisterAsTv();
  }, [onRegisterAsTv]);

  const handleCopyTvLink = async () => {
    const tvUrl = `${window.location.origin}/?mode=tv`;
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="space-y-6">
      {/* TV Receiver Pairing Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#131720] p-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <Tv className="h-6 w-6 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{copy.tv.title}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {copy.tv.subtitle}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  connectedControllers > 0 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <Wifi
                className={`h-4 w-4 ${
                  connectedControllers > 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
                aria-hidden="true"
              />
              <span className="font-semibold text-slate-100">
                {connectedControllers > 0
                  ? `${copy.tv.controllerLinked} (${connectedControllers})`
                  : copy.tv.waitingForPhone}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTvLink}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/12 bg-[#1A2130] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-[#232D40] transition-colors whitespace-nowrap"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" aria-hidden="true" />
                )}
                <span>{copied ? copy.tv.linkCopied : copy.tv.copyLink}</span>
              </button>

              <button
                type="button"
                onClick={onSwitchToPhone}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                <span>{copy.tv.openPhoneMode}</span>
              </button>
            </div>
          </div>
        </div>

        {/* High-Contrast 4-Digit Pairing Code Panel */}
        <div className="lg:col-span-4 flex flex-col justify-center rounded-2xl border border-emerald-400/25 bg-[#111922] p-6 text-center">
          <p className="text-xs font-semibold text-emerald-400">
            {copy.tv.pairingCodeHeading}
          </p>
          <div className="mt-2 font-mono-tabular text-4xl sm:text-5xl font-bold tracking-[0.22em] text-white">
            {tvModeCode || '----'}
          </div>
          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            {copy.tv.pairingInstructions}
          </p>
        </div>
      </div>

      {/* Full-Width Live Playable TV Game Canvas */}
      <GalacticShiftGame
        copy={copy}
        gamepadState={liveGamepadState}
        allowLocalKeyboard
      />
    </div>
  );
}
