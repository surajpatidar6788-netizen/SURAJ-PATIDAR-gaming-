// Subtle tactile haptic vibration & optional low-latency Web Audio mechanical micro-click

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export type HapticKind = 'tap' | 'action' | 'trigger' | 'dpad' | 'connect';

export function triggerHapticFeedback(
  kind: HapticKind,
  vibrationEnabled: boolean,
  soundEnabled: boolean
): void {
  if (vibrationEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (kind) {
        case 'action':
          navigator.vibrate(16);
          break;
        case 'trigger':
          navigator.vibrate([12, 18, 12]);
          break;
        case 'dpad':
          navigator.vibrate(10);
          break;
        case 'connect':
          navigator.vibrate([20, 40, 30]);
          break;
        default:
          navigator.vibrate(8);
      }
    } catch {
      // Vibration API not supported or blocked in current context
    }
  }

  if (soundEnabled) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = kind === 'connect' ? 'sine' : 'triangle';

      if (kind === 'action') {
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (kind === 'trigger') {
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (kind === 'connect') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(760, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      } else {
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (kind === 'connect' ? 0.15 : 0.055));
    } catch {
      // Ignore audio errors
    }
  }
}
