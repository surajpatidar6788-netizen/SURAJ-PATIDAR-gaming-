import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DiscoveredTV, GamepadInputState } from '../types';
import { INITIAL_GAMEPAD_STATE } from '../types';

export interface PairedTVInfo {
  code: string;
  name: string;
  model: string;
  protocol: string;
  isBuiltin: boolean;
}

interface UseTVConnectionResult {
  socketReady: boolean;
  connectionStatus: ConnectionStatus;
  pairedTv: PairedTVInfo | null;
  pingMs: number | null;
  lastError: string | null;
  discoveredTvs: DiscoveredTV[];
  isScanning: boolean;
  tvModeCode: string | null;
  tvConnectedControllers: number;
  liveGamepadState: GamepadInputState;
  scanTvs: () => Promise<void>;
  pairWithCode: (code: string) => void;
  disconnectTv: () => void;
  reconnectTv: () => void;
  registerAsTv: (preferredCode?: string) => void;
  sendGamepadInput: (state: GamepadInputState) => void;
  clearError: () => void;
}

function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function useTVConnection(): UseTVConnectionResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const lastTargetCodeRef = useRef<string | null>(null);
  const roleRef = useRef<'none' | 'controller' | 'tv'>('none');
  const tvPreferredCodeRef = useRef<string | undefined>(undefined);

  const [socketReady, setSocketReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [pairedTv, setPairedTv] = useState<PairedTVInfo | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [discoveredTvs, setDiscoveredTvs] = useState<DiscoveredTV[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [tvModeCode, setTvModeCode] = useState<string | null>(null);
  const [tvConnectedControllers, setTvConnectedControllers] = useState(0);
  const [liveGamepadState, setLiveGamepadState] = useState<GamepadInputState>(INITIAL_GAMEPAD_STATE);

  const sendRaw = useCallback((payload: unknown): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const scanTvs = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/tv-devices');
      if (res.ok) {
        const data = (await res.json()) as { devices?: DiscoveredTV[] };
        setDiscoveredTvs(Array.isArray(data.devices) ? data.devices : []);
      }
    } catch {
      // Keep existing list on transient error
    } finally {
      window.setTimeout(() => setIsScanning(false), 380);
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (roleRef.current === 'controller' && lastTargetCodeRef.current) {
      setConnectionStatus('connecting');
    }

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setSocketReady(true);
      setLastError(null);

      // Measure real RTT via WebSocket ping/pong
      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
      const sendPing = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', ts: performance.now() }));
        }
      };
      sendPing();
      pingIntervalRef.current = window.setInterval(sendPing, 2500);

      // Re-join active pairing session on reconnect
      if (roleRef.current === 'controller' && lastTargetCodeRef.current) {
        ws.send(
          JSON.stringify({
            type: 'controller:join',
            code: lastTargetCodeRef.current,
            deviceName: 'Smartphone GamePad',
          })
        );
      } else if (roleRef.current === 'tv') {
        ws.send(
          JSON.stringify({
            type: 'tv:register',
            code: tvPreferredCodeRef.current || '',
            name: 'Smart TV Screen',
            model: 'Live TV Browser Display',
          })
        );
      }
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === 'pong' && typeof msg.ts === 'number') {
        const rtt = Math.max(1, Math.round(performance.now() - msg.ts));
        setPingMs(rtt);
        return;
      }

      if (msg.type === 'controller:paired') {
        setConnectionStatus('connected');
        setLastError(null);
        setPairedTv({
          code: String(msg.code ?? ''),
          name: String(msg.tvName ?? 'Smart TV'),
          model: String(msg.tvModel ?? 'Smart TV Receiver'),
          protocol: String(msg.protocol ?? 'Wi-Fi Companion'),
          isBuiltin: Boolean(msg.isBuiltin),
        });
        return;
      }

      if (msg.type === 'controller:left') {
        setConnectionStatus('disconnected');
        setPairedTv(null);
        return;
      }

      if (msg.type === 'tv:registered') {
        setTvModeCode(String(msg.code ?? ''));
        setTvConnectedControllers(Number(msg.controllerCount ?? 0));
        return;
      }

      if (msg.type === 'room:presence') {
        if (roleRef.current === 'tv') {
          setTvConnectedControllers(Number(msg.controllerCount ?? 0));
        }
        return;
      }

      if (msg.type === 'gamepad:state' && msg.state) {
        setLiveGamepadState(msg.state as GamepadInputState);
        return;
      }

      if (msg.type === 'error') {
        setConnectionStatus('disconnected');
        setLastError(String(msg.code ?? msg.message ?? 'PAIR_ERROR'));
      }
    };

    ws.onclose = () => {
      setSocketReady(false);
      setPingMs(null);
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (roleRef.current === 'controller') {
        setConnectionStatus('disconnected');
      }

      // Automatic background reconnect
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => {
        connectSocket();
      }, 2200);
    };

    ws.onerror = () => {
      // onclose handles state transition and reconnect
    };
  }, []);

  useEffect(() => {
    connectSocket();
    scanTvs();
    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
      wsRef.current?.close();
    };
  }, [connectSocket, scanTvs]);

  const pairWithCode = useCallback(
    (code: string) => {
      const cleaned = code.trim();
      if (!cleaned) return;
      roleRef.current = 'controller';
      lastTargetCodeRef.current = cleaned;
      setLastError(null);
      setConnectionStatus('connecting');

      const sent = sendRaw({
        type: 'controller:join',
        code: cleaned,
        deviceName: 'Smartphone GamePad',
      });
      if (!sent) {
        connectSocket();
      }
    },
    [sendRaw, connectSocket]
  );

  const disconnectTv = useCallback(() => {
    roleRef.current = 'none';
    sendRaw({ type: 'controller:leave' });
    setConnectionStatus('disconnected');
    setPairedTv(null);
    setLiveGamepadState(INITIAL_GAMEPAD_STATE);
  }, [sendRaw]);

  const reconnectTv = useCallback(() => {
    const target = lastTargetCodeRef.current || '2048';
    pairWithCode(target);
  }, [pairWithCode]);

  const registerAsTv = useCallback(
    (preferredCode?: string) => {
      roleRef.current = 'tv';
      tvPreferredCodeRef.current = preferredCode;
      setPairedTv(null);
      const sent = sendRaw({
        type: 'tv:register',
        code: preferredCode || '',
        name: 'Smart TV Screen',
        model: 'Live TV Browser Display',
      });
      if (!sent) {
        connectSocket();
      }
    },
    [sendRaw, connectSocket]
  );

  const sendGamepadInput = useCallback(
    (state: GamepadInputState) => {
      // Optimistically reflect locally and transmit over real WebSocket to paired TV
      setLiveGamepadState(state);
      sendRaw({
        type: 'gamepad:input',
        state,
      });
    },
    [sendRaw]
  );

  const clearError = useCallback(() => setLastError(null), []);

  return {
    socketReady,
    connectionStatus,
    pairedTv,
    pingMs,
    lastError,
    discoveredTvs,
    isScanning,
    tvModeCode,
    tvConnectedControllers,
    liveGamepadState,
    scanTvs,
    pairWithCode,
    disconnectTv,
    reconnectTv,
    registerAsTv,
    sendGamepadInput,
    clearError,
  };
}
