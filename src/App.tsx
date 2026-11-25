import { useEffect, useRef, useState } from 'react';
import { AITeacherView } from './components/AITeacherView';
import { ConnectionBanner } from './components/ConnectionBanner';
import { GamepadController } from './components/GamepadController';
import { SetupWizard } from './components/SetupWizard';
import { TopBar } from './components/TopBar';
import { TVReceiverView } from './components/TVReceiverView';
import { useTVConnection } from './hooks/useTVConnection';
import { TRANSLATIONS } from './i18n/translations';
import type { AppView, DirectionMode, Language } from './types';
import { triggerHapticFeedback } from './utils/haptics';

function getInitialView(): AppView {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'tv') return 'tv';
    if (params.get('mode') === 'controller') return 'controller';
  }
  return 'setup';
}

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('tv_connect_lang');
    if (saved === 'hi' || saved === 'en') return saved;
  }
  return 'en';
}

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const [directionMode, setDirectionMode] = useState<DirectionMode>('joystick');
  const [isFullscreenPad, setIsFullscreenPad] = useState(false);

  const tv = useTVConnection();
  const prevStatusRef = useRef(tv.connectionStatus);

  const copy = TRANSLATIONS[language];

  useEffect(() => {
    window.localStorage.setItem('tv_connect_lang', language);
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  // Tactile confirmation pulse whenever smartphone successfully pairs to a TV
  useEffect(() => {
    if (prevStatusRef.current !== 'connected' && tv.connectionStatus === 'connected') {
      triggerHapticFeedback('connect', true, true);
    }
    prevStatusRef.current = tv.connectionStatus;
  }, [tv.connectionStatus]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleSelectView = (view: AppView) => {
    setIsFullscreenPad(false);
    setActiveView(view);
  };

  const handleQuickPairDemo = () => {
    tv.pairWithCode('2048');
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex flex-col">
      <TopBar
        copy={copy}
        language={language}
        activeView={activeView}
        onSelectView={handleSelectView}
        onToggleLanguage={handleToggleLanguage}
        hidden={isFullscreenPad}
      />

      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 ${
          isFullscreenPad ? 'p-0' : 'pt-5 pb-24 md:pb-10'
        }`}
      >
        <div className="space-y-5">
          {/* Real-time connection status banner (shown in Setup, Gamepad, and AI Guide views) */}
          {!isFullscreenPad && activeView !== 'tv' && (
            <ConnectionBanner
              copy={copy}
              status={tv.connectionStatus}
              pairedTv={tv.pairedTv}
              pingMs={tv.pingMs}
              onReconnect={tv.reconnectTv}
              onDisconnect={tv.disconnectTv}
              onOpenSetup={() => handleSelectView('setup')}
            />
          )}

          {activeView === 'setup' && (
            <SetupWizard
              copy={copy}
              language={language}
              onSelectLanguage={setLanguage}
              connectionStatus={tv.connectionStatus}
              pairedTv={tv.pairedTv}
              discoveredTvs={tv.discoveredTvs}
              isScanning={tv.isScanning}
              lastError={tv.lastError}
              onScanTvs={tv.scanTvs}
              onPairWithCode={tv.pairWithCode}
              onClearError={tv.clearError}
              onLaunchController={() => handleSelectView('controller')}
              onOpenTvMode={() => handleSelectView('tv')}
            />
          )}

          {activeView === 'controller' && (
            <GamepadController
              copy={copy}
              connectionStatus={tv.connectionStatus}
              pairedTv={tv.pairedTv}
              pingMs={tv.pingMs}
              directionMode={directionMode}
              onChangeDirectionMode={setDirectionMode}
              liveGamepadState={tv.liveGamepadState}
              onSendInput={tv.sendGamepadInput}
              onQuickPairDemo={handleQuickPairDemo}
              onOpenSetup={() => handleSelectView('setup')}
              isFullscreenPad={isFullscreenPad}
              onToggleFullscreenPad={setIsFullscreenPad}
            />
          )}

          {activeView === 'tv' && (
            <TVReceiverView
              copy={copy}
              tvModeCode={tv.tvModeCode}
              connectedControllers={tv.tvConnectedControllers}
              liveGamepadState={tv.liveGamepadState}
              onRegisterAsTv={tv.registerAsTv}
              onSwitchToPhone={() => handleSelectView('controller')}
            />
          )}

          {activeView === 'guide' && (
            <AITeacherView
              copy={copy}
              language={language}
              connectionStatus={tv.connectionStatus}
              pairedTv={tv.pairedTv}
              directionMode={directionMode}
              onNavigateView={handleSelectView}
            />
          )}
        </div>
      </main>
    </div>
  );
}
