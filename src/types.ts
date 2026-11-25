export type Language = 'en' | 'hi';

export type AppView = 'setup' | 'controller' | 'tv' | 'guide';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type DirectionMode = 'joystick' | 'dpad';

export type GamepadButtonId =
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'L1'
  | 'L2'
  | 'R1'
  | 'R2'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'SELECT'
  | 'HOME'
  | 'START';

export interface GamepadInputState {
  ax: number; // -1 to 1 horizontal stick/dpad vector
  ay: number; // -1 to 1 vertical stick/dpad vector
  buttons: Record<GamepadButtonId, boolean>;
  timestamp: number;
}

export interface DiscoveredTV {
  code: string;
  name: string;
  model: string;
  protocol: 'Wi-Fi Companion' | 'Smart TV Receiver' | 'Built-in Preview';
  connectedControllers: number;
  isBuiltin?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isError?: boolean;
  suggestedAction?: 'setup' | 'controller' | 'tv';
}

export const INITIAL_BUTTONS: Record<GamepadButtonId, boolean> = {
  A: false,
  B: false,
  X: false,
  Y: false,
  L1: false,
  L2: false,
  R1: false,
  R2: false,
  UP: false,
  DOWN: false,
  LEFT: false,
  RIGHT: false,
  SELECT: false,
  HOME: false,
  START: false,
};

export const INITIAL_GAMEPAD_STATE: GamepadInputState = {
  ax: 0,
  ay: 0,
  buttons: { ...INITIAL_BUTTONS },
  timestamp: 0,
};
