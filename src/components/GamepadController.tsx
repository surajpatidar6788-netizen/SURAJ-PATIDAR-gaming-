import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Gamepad2,
  Home,
  Maximize2,
  Minimize2,
  Monitor,
  MonitorOff,
  Smartphone,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { PairedTVInfo } from '../hooks/useTVConnection';
import type {
  ConnectionStatus,
  DirectionMode,
  GamepadButtonId,
  GamepadInputState,
} from '../types';
import { INITIAL_BUTTONS } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';
import { GalacticShiftGame } from './GalacticShiftGame';

interface GamepadControllerProps {
  copy: AppCopy;
  connectionStatus: ConnectionStatus;
  pairedTv: PairedTVInfo | null;
  pingMs: number | null;
  directionMode: DirectionMode;
  onChangeDirectionMode: (mode: DirectionMode) => void;
  liveGamepadState: GamepadInputState;
  onSendInput: (state: GamepadInputState) => void;
  onQuickPairDemo: () => void;
  onOpenSetup: () => void;
  isFullscreenPad: boolean;
  onToggleFullscreenPad: (next: boolean) => void;
}

export function GamepadController({
  copy,
  connectionStatus,
  pairedTv,
  pingMs,
  directionMode,
  onChangeDirectionMode,
  liveGamepadState,
  onSendInput,
  onQuickPairDemo,
  onOpenSetup,
  isFullscreenPad,
  onToggleFullscreenPad,
}: GamepadControllerProps) {
  const [vibrationOn, setVibrationOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showTvMonitor, setShowTvMonitor] = useState(true);

  // Local instant state for zero-latency visual button press & joystick deflection
  const [pressedButtons, setPressedButtons] = useState<Record<GamepadButtonId, boolean>>({
    ...INITIAL_BUTTONS,
  });
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stickActive, setStickActive] = useState(false);

  const buttonsRef = useRef<Record<GamepadButtonId, boolean>>({ ...INITIAL_BUTTONS });
  const stickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickZoneRef = useRef<HTMLDivElement | null>(null);
  const activeStickPointerIdRef = useRef<number | null>(null);
  const controllerContainerRef = useRef<HTMLDivElement | null>(null);

  const emitCurrentState = useCallback(() => {
    onSendInput({
      ax: Number(stickRef.current.x.toFixed(3)),
      ay: Number(stickRef.current.y.toFixed(3)),
      buttons: { ...buttonsRef.current },
      timestamp: Date.now(),
    });
  }, [onSendInput]);

  const setButtonState = useCallback(
    (btn: GamepadButtonId, isDown: boolean, hapticKind: 'action' | 'trigger' | 'dpad' | 'tap' = 'action') => {
      if (buttonsRef.current[btn] === isDown) return;
      buttonsRef.current = { ...buttonsRef.current, [btn]: isDown };
      setPressedButtons({ ...buttonsRef.current });

      if (isDown) {
        triggerHapticFeedback(hapticKind, vibrationOn, soundOn);
      }
      emitCurrentState();
    },
    [emitCurrentState, vibrationOn, soundOn]
  );

  // Release all inputs cleanly if window loses focus
  useEffect(() => {
    const releaseAll = () => {
      buttonsRef.current = { ...INITIAL_BUTTONS };
      stickRef.current = { x: 0, y: 0 };
      setPressedButtons({ ...INITIAL_BUTTONS });
      setStickPos({ x: 0, y: 0 });
      setStickActive(false);
      activeStickPointerIdRef.current = null;
      emitCurrentState();
    };
    window.addEventListener('blur', releaseAll);
    return () => window.removeEventListener('blur', releaseAll);
  }, [emitCurrentState]);

  // Desktop keyboard bindings so users on laptops/desktops can also test smoothly
  useEffect(() => {
    const keyMap: Record<string, GamepadButtonId> = {
      ArrowUp: 'UP',
      KeyW: 'UP',
      ArrowDown: 'DOWN',
      KeyS: 'DOWN',
      ArrowLeft: 'LEFT',
      KeyA: 'LEFT',
      ArrowRight: 'RIGHT',
      KeyD: 'RIGHT',
      KeyJ: 'A',
      Space: 'A',
      KeyK: 'B',
      KeyU: 'X',
      KeyI: 'Y',
      KeyQ: 'L1',
      KeyE: 'R1',
      Digit1: 'L2',
      Digit2: 'R2',
      Enter: 'START',
      ShiftLeft: 'SELECT',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const mapped = keyMap[e.code];
      if (!mapped) return;
      if (e.code === 'Space' || e.code.startsWith('Arrow')) {
        e.preventDefault();
      }
      if (!e.repeat) {
        const isDpad = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(mapped);
        setButtonState(mapped, true, isDpad ? 'dpad' : 'action');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mapped = keyMap[e.code];
      if (!mapped) return;
      setButtonState(mapped, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setButtonState]);

  // Virtual Analog Joystick pointer handlers
  const updateJoystickFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = joystickZoneRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxRadius = rect.width * 0.36;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      const normX = maxRadius > 0 ? dx / maxRadius : 0;
      const normY = maxRadius > 0 ? dy / maxRadius : 0;
      const deadzone = 0.08;
      const cleanX = Math.abs(normX) < deadzone ? 0 : normX;
      const cleanY = Math.abs(normY) < deadzone ? 0 : normY;

      stickRef.current = { x: cleanX, y: cleanY };
      setStickPos({ x: cleanX, y: cleanY });
      emitCurrentState();
    },
    [emitCurrentState]
  );

  const handleStickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activeStickPointerIdRef.current = e.pointerId;
    setStickActive(true);
    triggerHapticFeedback('tap', vibrationOn, soundOn);
    updateJoystickFromClientPoint(e.clientX, e.clientY);
  };

  const handleStickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeStickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateJoystickFromClientPoint(e.clientX, e.clientY);
  };

  const handleStickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeStickPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    activeStickPointerIdRef.current = null;
    setStickActive(false);
    stickRef.current = { x: 0, y: 0 };
    setStickPos({ x: 0, y: 0 });
    emitCurrentState();
  };

  const handleFullscreenClick = async () => {
    const next = !isFullscreenPad;
    onToggleFullscreenPad(next);

    if (next) {
      try {
        if (controllerContainerRef.current && controllerContainerRef.current.requestFullscreen) {
          await controllerContainerRef.current.requestFullscreen();
        }
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (mode: string) => Promise<void>;
        };
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape').catch(() => {});
        }
      } catch {
        // Fallback: CSS full-viewport fixed landscape overlay still activates cleanly
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore fullscreen exit errors
      }
    }
  };

  // Sync exit if user presses Escape in browser fullscreen
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreenPad) {
        onToggleFullscreenPad(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreenPad, onToggleFullscreenPad]);

  const bindButtonEvents = (
    id: GamepadButtonId,
    kind: 'action' | 'trigger' | 'dpad' | 'tap' = 'action'
  ) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setButtonState(id, true, kind);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      setButtonState(id, false, kind);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      setButtonState(id, false, kind);
    },
  });

  const faceButtons: {
    id: 'A' | 'B' | 'X' | 'Y';
    gridPos: string;
    ringColor: string;
    activeBg: string;
    letterColor: string;
    label: string;
  }[] = [
    {
      id: 'Y',
      gridPos: 'col-start-2 row-start-1',
      ringColor: 'border-amber-400/55',
      activeBg: 'bg-amber-400 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)] border-amber-300',
      letterColor: 'text-amber-300',
      label: copy.controller.actionLabels.Y,
    },
    {
      id: 'X',
      gridPos: 'col-start-1 row-start-2',
      ringColor: 'border-sky-400/55',
      activeBg: 'bg-sky-400 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.45)] border-sky-300',
      letterColor: 'text-sky-300',
      label: copy.controller.actionLabels.X,
    },
    {
      id: 'B',
      gridPos: 'col-start-3 row-start-2',
      ringColor: 'border-rose-400/55',
      activeBg: 'bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] border-rose-300',
      letterColor: 'text-rose-300',
      label: copy.controller.actionLabels.B,
    },
    {
      id: 'A',
      gridPos: 'col-start-2 row-start-3',
      ringColor: 'border-emerald-400/60',
      activeBg: 'bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.5)] border-emerald-300',
      letterColor: 'text-emerald-300',
      label: copy.controller.actionLabels.A,
    },
  ];

  return (
    <div
      ref={controllerContainerRef}
      className={
        isFullscreenPad
          ? 'fixed inset-0 z-50 flex flex-col justify-between bg-[#080A0F] p-3 sm:p-5 overflow-hidden'
          : 'space-y-5'
      }
    >
      {/* Not-connected prompt (only in normal view when no TV paired yet) */}
      {!isFullscreenPad && connectionStatus !== 'connected' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
          <p className="text-xs sm:text-sm text-amber-100">{copy.controller.notConnectedNotice}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onQuickPairDemo}
              className="min-h-[40px] rounded-xl bg-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              {copy.controller.quickPairDemo}
            </button>
            <button
              type="button"
              onClick={onOpenSetup}
              className="min-h-[40px] rounded-xl border border-white/15 bg-[#151A25] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-[#1E2534] transition-colors whitespace-nowrap"
            >
              {copy.controller.goToSetup}
            </button>
          </div>
        </div>
      )}

      {/* Controller Utility Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#131720] p-1">
            <button
              type="button"
              onClick={() => onChangeDirectionMode('joystick')}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                directionMode === 'joystick'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {copy.controller.joystickMode}
            </button>
            <button
              type="button"
              onClick={() => onChangeDirectionMode('dpad')}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                directionMode === 'dpad'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {copy.controller.dpadMode}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setVibrationOn((v) => !v)}
            aria-pressed={vibrationOn}
            title={vibrationOn ? copy.controller.hapticsOn : copy.controller.hapticsOff}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              vibrationOn
                ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-[#131720] text-slate-400'
            }`}
          >
            <Vibrate className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">
              {vibrationOn ? copy.controller.hapticsOn : copy.controller.hapticsOff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            aria-pressed={soundOn}
            title={soundOn ? copy.controller.soundOn : copy.controller.soundOff}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              soundOn
                ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-[#131720] text-slate-400'
            }`}
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden md:inline">
              {soundOn ? copy.controller.soundOn : copy.controller.soundOff}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isFullscreenPad && (
            <button
              type="button"
              onClick={() => setShowTvMonitor((m) => !m)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#131720] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1B2230] transition-colors whitespace-nowrap"
            >
              {showTvMonitor ? (
                <MonitorOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
              ) : (
                <Monitor className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              )}
              <span>
                {showTvMonitor ? copy.controller.hideTvMonitor : copy.controller.showTvMonitor}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFullscreenClick}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#1D2534] border border-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273145] transition-colors whitespace-nowrap"
          >
            {isFullscreenPad ? (
              <>
                <Minimize2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>{copy.controller.exitFullscreen}</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>{copy.controller.enterFullscreen}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Live TV Output Monitor (shows Galactic Shift responding live to gamepad input) */}
      {!isFullscreenPad && showTvMonitor && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>{copy.controller.tvMonitorTitle}</span>
            {pairedTv && (
              <span className="font-mono-tabular">
                {pairedTv.name} · {copy.status.codeLabel} {pairedTv.code}
                {pingMs !== null ? ` · ${pingMs} ms` : ''}
              </span>
            )}
          </div>
          <GalacticShiftGame copy={copy} gamepadState={liveGamepadState} compact />
        </div>
      )}

      {/* Ergonomic Landscape-Ready Hardware GamePad Shell */}
      <div
        className={`gamepad-surface relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-[#171C27] to-[#0F131B] p-4 sm:p-6 shadow-2xl ${
          isFullscreenPad ? 'flex-1 min-h-0' : ''
        }`}
      >
        {/* Top Shoulder Triggers: L2 / L1 (left) and R1 / R2 (right) */}
        <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 mb-4">
          <div className="col-span-5 flex items-center gap-2">
            <button
              type="button"
              {...bindButtonEvents('L2', 'trigger')}
              className={`pad-btn flex-1 min-h-[46px] rounded-tl-2xl rounded-tr-lg rounded-b-lg border text-xs sm:text-sm font-bold tracking-wide ${
                pressedButtons.L2
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1D2331] text-slate-300 hover:bg-[#242B3C]'
              }`}
            >
              L2
            </button>
            <button
              type="button"
              {...bindButtonEvents('L1', 'trigger')}
              className={`pad-btn flex-1 min-h-[46px] rounded-t-lg rounded-b-lg border text-xs sm:text-sm font-bold tracking-wide ${
                pressedButtons.L1
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1D2331] text-slate-300 hover:bg-[#242B3C]'
              }`}
            >
              L1
            </button>
          </div>

          <div className="col-span-2 flex items-center justify-center">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-400'
                    : connectionStatus === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400'
                }`}
              />
              <span className="hidden sm:inline">
                {pingMs !== null && connectionStatus === 'connected' ? `${pingMs}ms` : pairedTv?.code || 'PAD'}
              </span>
            </div>
          </div>

          <div className="col-span-5 flex items-center gap-2">
            <button
              type="button"
              {...bindButtonEvents('R1', 'trigger')}
              className={`pad-btn flex-1 min-h-[46px] rounded-t-lg rounded-b-lg border text-xs sm:text-sm font-bold tracking-wide ${
                pressedButtons.R1
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1D2331] text-slate-300 hover:bg-[#242B3C]'
              }`}
            >
              R1
            </button>
            <button
              type="button"
              {...bindButtonEvents('R2', 'trigger')}
              className={`pad-btn flex-1 min-h-[46px] rounded-tr-2xl rounded-tl-lg rounded-b-lg border text-xs sm:text-sm font-bold tracking-wide ${
                pressedButtons.R2
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1D2331] text-slate-300 hover:bg-[#242B3C]'
              }`}
            >
              R2
            </button>
          </div>
        </div>

        {/* Main 3-Zone Thumb Ergonomics Deck: Left Stick/D-Pad | Center System Keys | Right A/B/X/Y */}
        <div
          className={`grid items-center my-auto py-2 ${
            isFullscreenPad
              ? 'grid-cols-12 gap-3 sm:gap-6'
              : 'grid-cols-1 sm:grid-cols-12 gap-6'
          }`}
        >
          {/* LEFT SIDE: Virtual Analog Joystick OR Tactile D-Pad */}
          <div
            className={`flex flex-col items-center justify-center ${
              isFullscreenPad ? 'col-span-5' : 'sm:col-span-5'
            }`}
          >
            {directionMode === 'joystick' ? (
              <div
                ref={joystickZoneRef}
                role="slider"
                aria-label="Virtual Analog Joystick"
                aria-valuenow={Math.round(Math.hypot(stickPos.x, stickPos.y) * 100)}
                onPointerDown={handleStickPointerDown}
                onPointerMove={handleStickPointerMove}
                onPointerUp={handleStickPointerUp}
                onPointerCancel={handleStickPointerUp}
                className={`relative flex h-44 w-44 sm:h-48 sm:w-48 items-center justify-center rounded-full border-2 bg-[#0B0E15] shadow-inner transition-colors ${
                  stickActive ? 'border-emerald-400/70' : 'border-white/12'
                }`}
              >
                {/* Directional alignment notches */}
                <ChevronUp className="pointer-events-none absolute top-2.5 h-4 w-4 text-slate-600" />
                <ChevronDown className="pointer-events-none absolute bottom-2.5 h-4 w-4 text-slate-600" />
                <ChevronLeft className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-600" />
                <ChevronRight className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-600" />

                {/* Inner concentric guide ring */}
                <div className="pointer-events-none h-24 w-24 rounded-full border border-white/[0.06]" />

                {/* Thumbstick Cap */}
                <div
                  style={{
                    transform: `translate3d(${stickPos.x * 52}px, ${stickPos.y * 52}px, 0) scale(${
                      stickActive ? 0.96 : 1
                    })`,
                  }}
                  className={`pointer-events-none absolute flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-xl transition-colors ${
                    stickActive
                      ? 'border-emerald-300 bg-gradient-to-b from-[#2A3548] to-[#1A2130]'
                      : 'border-white/20 bg-gradient-to-b from-[#252E3F] to-[#161C28]'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full border ${
                      stickActive ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-white/10 bg-[#10141E]'
                    }`}
                  />
                </div>
              </div>
            ) : (
              /* Tactile 8-way D-Pad */
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-44 w-44 sm:h-48 sm:w-48">
                <button
                  type="button"
                  aria-label="D-Pad Up"
                  {...bindButtonEvents('UP', 'dpad')}
                  className={`pad-btn col-start-2 row-start-1 flex items-center justify-center rounded-t-2xl rounded-b-md border ${
                    pressedButtons.UP
                      ? 'pad-btn-pressed border-emerald-400 bg-emerald-500 text-slate-950'
                      : 'border-white/15 bg-[#1E2534] text-slate-200'
                  }`}
                >
                  <ChevronUp className="h-7 w-7" strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  aria-label="D-Pad Left"
                  {...bindButtonEvents('LEFT', 'dpad')}
                  className={`pad-btn col-start-1 row-start-2 flex items-center justify-center rounded-l-2xl rounded-r-md border ${
                    pressedButtons.LEFT
                      ? 'pad-btn-pressed border-emerald-400 bg-emerald-500 text-slate-950'
                      : 'border-white/15 bg-[#1E2534] text-slate-200'
                  }`}
                >
                  <ChevronLeft className="h-7 w-7" strokeWidth={2.6} />
                </button>
                <div className="col-start-2 row-start-2 flex items-center justify-center rounded-lg bg-[#141925] border border-white/[0.06]">
                  <div className="h-4 w-4 rounded-full bg-[#0B0E15]" />
                </div>
                <button
                  type="button"
                  aria-label="D-Pad Right"
                  {...bindButtonEvents('RIGHT', 'dpad')}
                  className={`pad-btn col-start-3 row-start-2 flex items-center justify-center rounded-r-2xl rounded-l-md border ${
                    pressedButtons.RIGHT
                      ? 'pad-btn-pressed border-emerald-400 bg-emerald-500 text-slate-950'
                      : 'border-white/15 bg-[#1E2534] text-slate-200'
                  }`}
                >
                  <ChevronRight className="h-7 w-7" strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  aria-label="D-Pad Down"
                  {...bindButtonEvents('DOWN', 'dpad')}
                  className={`pad-btn col-start-2 row-start-3 flex items-center justify-center rounded-b-2xl rounded-t-md border ${
                    pressedButtons.DOWN
                      ? 'pad-btn-pressed border-emerald-400 bg-emerald-500 text-slate-950'
                      : 'border-white/15 bg-[#1E2534] text-slate-200'
                  }`}
                >
                  <ChevronDown className="h-7 w-7" strokeWidth={2.6} />
                </button>
              </div>
            )}
          </div>

          {/* CENTER HUB: Select / Home / Start */}
          <div
            className={`flex items-center justify-center gap-3 ${
              isFullscreenPad ? 'col-span-2 flex-col' : 'sm:col-span-2 flex-row sm:flex-col'
            }`}
          >
            <button
              type="button"
              {...bindButtonEvents('SELECT', 'tap')}
              className={`pad-btn min-h-[44px] min-w-[76px] rounded-xl border px-3 py-2 text-xs font-semibold ${
                pressedButtons.SELECT
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1A202D] text-slate-300'
              }`}
            >
              {copy.controller.actionLabels.SELECT}
            </button>

            <button
              type="button"
              aria-label={copy.controller.actionLabels.HOME}
              {...bindButtonEvents('HOME', 'tap')}
              className={`pad-btn flex h-12 w-12 items-center justify-center rounded-full border ${
                pressedButtons.HOME
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500 text-slate-950'
                  : 'border-white/15 bg-[#1D2534] text-emerald-400'
              }`}
            >
              <Home className="h-5 w-5" />
            </button>

            <button
              type="button"
              {...bindButtonEvents('START', 'tap')}
              className={`pad-btn min-h-[44px] min-w-[76px] rounded-xl border px-3 py-2 text-xs font-semibold ${
                pressedButtons.START
                  ? 'pad-btn-pressed border-emerald-400 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/12 bg-[#1A202D] text-slate-300'
              }`}
            >
              {copy.controller.actionLabels.START}
            </button>
          </div>

          {/* RIGHT SIDE: Ergonomic A, B, X, Y Diamond Cluster */}
          <div
            className={`flex flex-col items-center justify-center ${
              isFullscreenPad ? 'col-span-5' : 'sm:col-span-5'
            }`}
          >
            <div className="grid grid-cols-3 grid-rows-3 gap-2.5 h-48 w-48 sm:h-52 sm:w-52 items-center justify-items-center">
              {faceButtons.map((btn) => {
                const isPressed = pressedButtons[btn.id];
                return (
                  <button
                    key={btn.id}
                    type="button"
                    aria-label={`${btn.id} - ${btn.label}`}
                    {...bindButtonEvents(btn.id, 'action')}
                    className={`pad-btn ${btn.gridPos} flex h-16 w-16 sm:h-[68px] sm:w-[68px] flex-col items-center justify-center rounded-full border-2 shadow-lg ${
                      isPressed
                        ? `pad-btn-pressed ${btn.activeBg}`
                        : `${btn.ringColor} bg-gradient-to-b from-[#232B3B] to-[#141925] text-white`
                    }`}
                  >
                    <span
                      className={`text-lg sm:text-xl font-extrabold leading-none ${
                        isPressed ? 'text-current' : btn.letterColor
                      }`}
                    >
                      {btn.id}
                    </span>
                    <span
                      className={`mt-0.5 text-[10px] font-semibold leading-none ${
                        isPressed ? 'opacity-90' : 'text-slate-400'
                      }`}
                    >
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Ergonomic Tip Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[11px] sm:text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{copy.controller.landscapeHint}</span>
          </span>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-500">
            <Gamepad2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.controller.keyboardTip}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
