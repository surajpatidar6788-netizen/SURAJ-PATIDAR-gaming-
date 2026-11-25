import { RefreshCw, Tv, Unplug, Wifi, WifiOff } from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { PairedTVInfo } from '../hooks/useTVConnection';
import type { ConnectionStatus } from '../types';

interface ConnectionBannerProps {
  copy: AppCopy;
  status: ConnectionStatus;
  pairedTv: PairedTVInfo | null;
  pingMs: number | null;
  onReconnect: () => void;
  onDisconnect: () => void;
  onOpenSetup: () => void;
}

export function ConnectionBanner({
  copy,
  status,
  pairedTv,
  pingMs,
  onReconnect,
  onDisconnect,
  onOpenSetup,
}: ConnectionBannerProps) {
  const statusConfig = {
    connected: {
      label: copy.status.connected,
      dotClass: 'bg-emerald-400',
      textClass: 'text-emerald-400',
      Icon: Wifi,
    },
    connecting: {
      label: copy.status.connecting,
      dotClass: 'bg-amber-400 animate-pulse',
      textClass: 'text-amber-400',
      Icon: RefreshCw,
    },
    disconnected: {
      label: copy.status.disconnected,
      dotClass: 'bg-rose-400',
      textClass: 'text-rose-400',
      Icon: WifiOff,
    },
  }[status];

  const StatusIcon = statusConfig.Icon;

  return (
    <section
      aria-label="TV Connection Status"
      className="rounded-2xl border border-white/[0.08] bg-[#131720] px-4 py-3 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Real-time status + metadata (clean unboxed text with separators) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass}`} aria-hidden="true" />
            <StatusIcon
              className={`h-4 w-4 ${statusConfig.textClass} ${status === 'connecting' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className={`text-sm font-semibold ${statusConfig.textClass}`}>
              {statusConfig.label}
            </span>
          </div>

          <span className="text-slate-600" aria-hidden="true">·</span>

          {pairedTv ? (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm text-slate-300 min-w-0">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-100 truncate">
                <Tv className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                {pairedTv.name}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="font-mono-tabular text-slate-400">
                {copy.status.codeLabel} {pairedTv.code}
              </span>
              {pingMs !== null && status === 'connected' && (
                <>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-slate-400">
                    {copy.status.latency} {pingMs} ms
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-slate-400">{copy.status.noTvPaired}</span>
          )}
        </div>

        {/* Quick Reconnect / Switch Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status !== 'connected' ? (
            <button
              type="button"
              onClick={onReconnect}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.status.reconnect}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenSetup}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#1A202D] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#232B3B] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{copy.status.switchTv}</span>
              </button>
              <button
                type="button"
                onClick={onDisconnect}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-slate-400 hover:border-rose-500/40 hover:text-rose-300 transition-colors whitespace-nowrap shrink-0"
              >
                <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.status.disconnect}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
