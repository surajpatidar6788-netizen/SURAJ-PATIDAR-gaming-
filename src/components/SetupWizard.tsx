import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gamepad2,
  Languages,
  Radar,
  RefreshCw,
  Tv,
  Wifi,
} from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { PairedTVInfo } from '../hooks/useTVConnection';
import type { ConnectionStatus, DiscoveredTV, Language } from '../types';

interface SetupWizardProps {
  copy: AppCopy;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  connectionStatus: ConnectionStatus;
  pairedTv: PairedTVInfo | null;
  discoveredTvs: DiscoveredTV[];
  isScanning: boolean;
  lastError: string | null;
  onScanTvs: () => void;
  onPairWithCode: (code: string) => void;
  onClearError: () => void;
  onLaunchController: () => void;
  onOpenTvMode: () => void;
}

type FallbackTab = 'companion' | 'android' | 'ios' | 'hdmi';

const HERO_IMAGE_SRC = '/src/assets/images/tv_gamepad_setup_hero_1795604365146.jpg';

export function SetupWizard({
  copy,
  language,
  onSelectLanguage,
  connectionStatus,
  pairedTv,
  discoveredTvs,
  isScanning,
  lastError,
  onScanTvs,
  onPairWithCode,
  onClearError,
  onLaunchController,
  onOpenTvMode,
}: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fallbackTab, setFallbackTab] = useState<FallbackTab>('companion');
  const [codeInput, setCodeInput] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codeInput.trim();
    if (!trimmed) return;
    onClearError();
    onPairWithCode(trimmed);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Split (Full 1440px presence, 2-column balanced stretch on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#131720] p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold text-emerald-400">
              {copy.setup.stepPrefix} {step} / 3 · {copy.setup.steps[step - 1]}
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              {copy.setup.heroTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {copy.setup.heroSubtitle}
            </p>
          </div>

          {/* Interactive 3-step segmented navigation */}
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-[#0B0D12] p-1.5 border border-white/[0.06]">
            {([1, 2, 3] as const).map((s) => {
              const isCurrent = step === s;
              const isDone = step > s || (s === 3 && connectionStatus === 'connected');
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStep(s)}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isCurrent
                      ? 'bg-[#1D2432] text-white'
                      : isDone
                        ? 'text-emerald-400 hover:bg-white/[0.04]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="font-mono-tabular text-xs opacity-80">{s}.</span>
                  <span className="truncate">{copy.setup.steps[s - 1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Showcase Frame */}
        <div className="lg:col-span-6 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131720] min-h-[210px] lg:min-h-[270px]">
          {!imgFailed ? (
            <img
              src={HERO_IMAGE_SRC}
              alt="Smartphone gamepad wirelessly connected to a 4K living room smart television"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#141B29] to-[#0B0D12] p-6 text-center">
              <Tv className="h-12 w-12 text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-200">{copy.brandName}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D12]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-200 font-medium">
              {pairedTv ? `${copy.status.pairedWith}: ${pairedTv.name}` : copy.tv.gameTitle}
            </div>
            {connectionStatus === 'connected' && (
              <button
                type="button"
                onClick={onLaunchController}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
              >
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                <span>{copy.setup.launchController}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Step Workspace */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#131720] p-5 sm:p-7">
        {/* STEP 1: LANGUAGE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <Languages className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{copy.setup.step1Title}</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
                {copy.setup.step1Desc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  {
                    id: 'en' as const,
                    title: copy.setup.englishOption,
                    sub: copy.setup.englishSub,
                    short: 'EN',
                  },
                  {
                    id: 'hi' as const,
                    title: copy.setup.hindiOption,
                    sub: copy.setup.hindiSub,
                    short: 'हिन्दी',
                  },
                ]
              ).map((opt) => {
                const selected = language === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectLanguage(opt.id)}
                    className={`flex min-h-[96px] items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      selected
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-white/10 bg-[#0E121B] hover:border-white/25'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-white">{opt.title}</div>
                      <div className="text-xs sm:text-sm text-slate-400">{opt.sub}</div>
                    </div>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        selected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#19202D] text-slate-300'
                      }`}
                    >
                      {selected ? <Check className="h-5 w-5" aria-hidden="true" /> : opt.short}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SAME WI-FI & FALLBACK MIRRORING */}
        {step === 2 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <Wifi className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{copy.setup.step2Title}</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
                {copy.setup.step2Desc}
              </p>
            </div>

            {/* Clean numbered checklist */}
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {copy.setup.wifiChecks.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-white/[0.08] bg-[#0E121B] p-4 space-y-2"
                >
                  <div className="font-mono-tabular text-xs font-semibold text-emerald-400">
                    0{idx + 1}.
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>

            {/* Fallback Connection / Screen Mirroring Guide */}
            <div className="border-t border-white/[0.08] pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">
                  {copy.setup.fallbackTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#0B0D12] p-1 border border-white/[0.06]">
                  {(
                    [
                      { id: 'companion', label: copy.setup.fallbackTabs.companion },
                      { id: 'android', label: copy.setup.fallbackTabs.android },
                      { id: 'ios', label: copy.setup.fallbackTabs.ios },
                      { id: 'hdmi', label: copy.setup.fallbackTabs.hdmi },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFallbackTab(tab.id)}
                      className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        fallbackTab === tab.id
                          ? 'bg-[#1F2736] text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <ol className="space-y-2.5">
                {copy.setup.fallbackGuides[fallbackTab].map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="font-mono-tabular text-xs font-semibold text-emerald-400 mt-0.5">
                      {i + 1}.
                    </span>
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* STEP 3: SCAN, PAIR & CONNECT */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Radar className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{copy.setup.step3Title}</span>
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
                  {copy.setup.step3Desc}
                </p>
              </div>
              <button
                type="button"
                onClick={onScanTvs}
                disabled={isScanning}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-[#1B2230] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-[#242D40] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isScanning ? copy.setup.scanning : copy.setup.scanBtn}</span>
              </button>
            </div>

            {connectionStatus === 'connected' && pairedTv && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    {copy.setup.connectedBannerTitle}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-200">
                    {copy.setup.connectedBannerSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLaunchController}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.setup.launchController}</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Discovered TV Receivers */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">
                  {copy.setup.availableTvs}
                </h3>

                <div className="divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] bg-[#0E121B]">
                  {discoveredTvs.map((tv: DiscoveredTV) => {
                    const isThisPaired = pairedTv?.code === tv.code && connectionStatus === 'connected';
                    return (
                      <div
                        key={tv.code}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#181F2D] text-emerald-400">
                            <Tv className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-white truncate">
                              {tv.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              <span>{tv.model}</span>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span className="font-mono-tabular text-slate-300">
                                {copy.status.codeLabel} {tv.code}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClearError();
                            onPairWithCode(tv.code);
                          }}
                          className={`min-h-[44px] rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                            isThisPaired
                              ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98]'
                          }`}
                        >
                          {isThisPaired ? copy.status.connected : copy.setup.instantConnect}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual 4-Digit TV Pairing Code + Launch TV Receiver */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0E121B] p-5">
                <form onSubmit={handleCodeSubmit} className="space-y-3">
                  <label
                    htmlFor="tv-pair-code"
                    className="block text-sm font-semibold text-white"
                  >
                    {copy.setup.pairCodeLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="tv-pair-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value.replace(/[^\d]/g, ''));
                        if (lastError) onClearError();
                      }}
                      placeholder={copy.setup.pairCodePlaceholder}
                      className="min-h-[48px] w-full rounded-xl border border-white/15 bg-[#151B27] px-4 text-base font-mono-tabular tracking-widest text-white placeholder:text-slate-500 placeholder:tracking-normal focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={codeInput.trim().length < 4}
                      className="min-h-[48px] rounded-xl bg-emerald-500 px-5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-45 disabled:hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
                    >
                      {copy.setup.pairCodeBtn}
                    </button>
                  </div>
                  {lastError && (
                    <p role="alert" className="text-xs text-rose-400 leading-relaxed">
                      {copy.setup.codeNotFound}
                    </p>
                  )}
                </form>

                <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {copy.setup.openTvTip}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenTvMode}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#18202E] px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#212B3D] transition-colors"
                  >
                    <Tv className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    <span>{copy.setup.openTvScreenBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/12 bg-[#1A202D] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-[#232B3C] transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{copy.setup.prevStep}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <span>{copy.setup.nextStep}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onLaunchController}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              <span>{copy.setup.launchController}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
