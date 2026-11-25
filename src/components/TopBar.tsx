import { Gamepad2, Globe, HelpCircle, SlidersHorizontal, Tv } from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { AppView, Language } from '../types';

interface TopBarProps {
  copy: AppCopy;
  language: Language;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onToggleLanguage: () => void;
  hidden?: boolean;
}

export function TopBar({
  copy,
  language,
  activeView,
  onSelectView,
  onToggleLanguage,
  hidden = false,
}: TopBarProps) {
  if (hidden) return null;

  const navItems: { id: AppView; label: string; Icon: typeof SlidersHorizontal }[] = [
    { id: 'setup', label: copy.nav.setup, Icon: SlidersHorizontal },
    { id: 'controller', label: copy.nav.controller, Icon: Gamepad2 },
    { id: 'tv', label: copy.nav.tv, Icon: Tv },
    { id: 'guide', label: copy.nav.guide, Icon: HelpCircle },
  ];

  return (
    <>
      {/* Desktop & Mobile Top Bar (Strict 3-zone contract) */}
      <header className="sticky top-0 z-30 h-14 border-b border-white/[0.08] bg-[#0B0D12]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectView('setup')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
          >
            {copy.brandName}
          </button>

          {/* Zone 2: Clean single-line text navigation links (Desktop) */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary top-bar action (One-tap Bilingual Switcher) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/15 bg-[#151923] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-100 hover:border-emerald-400/50 hover:bg-[#1B2130] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Globe className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{copy.langToggle}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone Anchor) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/[0.08] bg-[#0B0D12]/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-4 items-center h-16 px-1">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectView(id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none whitespace-nowrap truncate max-w-[80px]">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
