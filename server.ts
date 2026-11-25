import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Gemini AI client (server-side only)
function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- Real-time TV Pairing Room Registry ---
interface TVRoom {
  code: string;
  name: string;
  model: string;
  protocol: 'Wi-Fi Companion' | 'Smart TV Receiver' | 'Built-in Preview';
  isBuiltin: boolean;
  tvSockets: Set<WebSocket>;
  controllerSockets: Set<WebSocket>;
  createdAt: number;
}

interface ClientMeta {
  role: 'tv' | 'controller' | 'unknown';
  roomCode: string | null;
  deviceName: string;
}

const rooms = new Map<string, TVRoom>();
const clientMeta = new WeakMap<WebSocket, ClientMeta>();

// Seed the built-in instant preview TV receiver room (still uses real WebSocket relay)
const BUILTIN_ROOM_CODE = '2048';
rooms.set(BUILTIN_ROOM_CODE, {
  code: BUILTIN_ROOM_CODE,
  name: 'Living Room Smart TV',
  model: '4K Gaming Display (Built-in Receiver)',
  protocol: 'Built-in Preview',
  isBuiltin: true,
  tvSockets: new Set(),
  controllerSockets: new Set(),
  createdAt: Date.now(),
});

function generatePairingCode(): string {
  for (let i = 0; i < 30; i += 1) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(code)) return code;
  }
  return String(Math.floor(10000 + Math.random() * 89999));
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoomPresence(room: TVRoom): void {
  const presencePayload = {
    type: 'room:presence',
    code: room.code,
    tvName: room.name,
    tvCount: room.tvSockets.size + (room.isBuiltin ? 1 : 0),
    controllerCount: room.controllerSockets.size,
  };
  room.tvSockets.forEach((sock) => safeSend(sock, presencePayload));
  room.controllerSockets.forEach((sock) => safeSend(sock, presencePayload));
}

function detachClientFromRoom(ws: WebSocket): void {
  const meta = clientMeta.get(ws);
  if (!meta || !meta.roomCode) return;

  const room = rooms.get(meta.roomCode);
  if (room) {
    room.tvSockets.delete(ws);
    room.controllerSockets.delete(ws);
    if (!room.isBuiltin && room.tvSockets.size === 0 && room.controllerSockets.size === 0) {
      rooms.delete(room.code);
    } else {
      broadcastRoomPresence(room);
    }
  }
  meta.roomCode = null;
}

function sanitizeString(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLen);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Discover active Smart TV receivers registered on the server
  app.get('/api/tv-devices', (_req, res) => {
    const devices = Array.from(rooms.values())
      .filter((room) => room.isBuiltin || room.tvSockets.size > 0)
      .map((room) => ({
        code: room.code,
        name: room.name,
        model: room.model,
        protocol: room.protocol,
        connectedControllers: room.controllerSockets.size,
        isBuiltin: room.isBuiltin,
      }));
    res.json({ devices });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Built-in AI Teacher / Guide powered by Gemini
  app.post('/api/ai-teacher', async (req, res) => {
    const rawMessage = sanitizeString(req.body?.message, 1000);
    const language = req.body?.language === 'hi' ? 'hi' : 'en';
    const context = typeof req.body?.context === 'object' && req.body?.context !== null ? req.body.context : {};
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];

    if (!rawMessage) {
      res.status(400).json({ error: 'Please enter a question for the AI Teacher.' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          language === 'hi'
            ? 'Gemini API कुंजी सेट नहीं है। कृपया Settings > Secrets में अपनी API कुंजी जांचें।'
            : 'Gemini API key is not configured. Please verify your API key in Settings > Secrets.',
      });
      return;
    }

    const connectionStatus = sanitizeString(context.connectionStatus, 24) || 'disconnected';
    const pairedTvName = sanitizeString(context.pairedTvName, 80) || 'None';
    const directionMode = sanitizeString(context.directionMode, 24) || 'joystick';
    const currentView = sanitizeString(context.currentView, 24) || 'guide';

    const systemInstruction =
      language === 'hi'
        ? `आप "TV Connect GamePad" ऐप के मित्रवत, स्पष्ट और धैर्यवान AI टीचर और गाइड हैं।
आपकी भूमिका उपयोगकर्ताओं को हर फीचर समझाना, फ़ोन को टीवी से कनेक्ट करना सिखाना, गेमिंग कंट्रोलर का उपयोग समझाना और कनेक्शन या लैग की समस्याएं हल करना है।

ऐप की मुख्य बातें:
1. गाइडेड सेटअप (3 कदम): भाषा चुनें (हिन्दी/English) -> फ़ोन और टीवी को एक ही Wi-Fi नेटवर्क से जोड़ें -> टीवी स्कैन करें या 4-अंकीय पेयरिंग कोड (जैसे 2048 बिल्ट-इन टीवी रिसीवर के लिए, या TV Screen टैब पर दिखा कोड) डालकर कनेक्ट करें।
2. वैकल्पिक कनेक्शन (Fallback): अगर स्मार्ट टीवी ब्राउज़र नहीं है, तो Android Cast / Miracast, iOS AirPlay, या HDMI/USB-C केबल का उपयोग करके फ़ोन स्क्रीन मिरर कर सकते हैं।
3. गेमिंग कंट्रोलर मोड: बाईं तरफ़ वर्चुअल जॉयस्टिक या D-Pad (स्विच किया जा सकता है), दाईं तरफ़ A (Fire/फ़ायर), B (Shield/शील्ड), X (Dash/डैश), Y (Pulse/पल्स), ऊपर L1/L2 और R1/R2 ट्रिगर, बीच में Select/Home/Start। लैंडस्केप फुलस्क्रीन मोड और हैप्टिक वाइब्रेशन सपोर्ट।
4. टीवी स्क्रीन मोड: किसी भी स्मार्ट टीवी या लैपटॉप ब्राउज़र में "TV Screen" टैब खोलने पर नया 4-अंकीय कोड बनता है और "Galactic Shift" गेम लाइव चलता है।

वर्तमान उपयोगकर्ता स्थिति: कनेक्शन = ${connectionStatus}, पेयर्ड टीवी = ${pairedTvName}, कंट्रोल मोड = ${directionMode}, वर्तमान टैब = ${currentView}।

निर्देश:
- हमेशा आसान, स्वाभाविक और शुद्ध हिन्दी (देवनागरी लिपि) में जवाब दें (तकनीकी शब्द जैसे Wi-Fi, GamePad, A/B/X/Y सरल रखें)।
- छोटे, स्पष्ट क्रमांकित चरणों (1, 2, 3...) का उपयोग करें ताकि कोई भी आसानी से समझ सके।
- बिना जरूरत के लंबा निबंध न लिखें; 90-180 शब्दों के बीच स्पष्ट, व्यावहारिक और मददगार रहें।
- Markdown कोड ब्लॉक या अजीब चिह्न न डालें; सादा टेक्स्ट और नंबर वाली सूची का उपयोग करें।`
        : `You are the friendly, patient, and clear AI Teacher & Guide built inside the "TV Connect GamePad" mobile app.
Your job is to explain every feature, walk users step-by-step through connecting their smartphone to a television, teach them how to use the gaming controller, and troubleshoot Wi-Fi, pairing, or lag issues in plain everyday language.

Key App Facts:
1. Guided 3-Step Setup: Select Language (English/Hindi) -> Connect phone and TV to the same Wi-Fi network -> Scan for active TVs or enter a 4-digit pairing code (such as 2048 for the built-in Living Room Smart TV preview, or the code displayed on the TV Screen tab).
2. Fallback Connection Options: If the TV does not have a built-in browser, users can use Android Smart View / Cast, iOS AirPlay, or a USB-C to HDMI cable to mirror or cast games to the TV.
3. Gaming Controller Mode: Left side has a switchable Analog Virtual Joystick or 8-way D-Pad; right side has tactile A (Fire), B (Shield), X (Dash), Y (Pulse) action buttons; top shoulders have L1/L2 and R1/R2 triggers; center has Select, Home, and Start. Includes Landscape Fullscreen mode and haptic vibration feedback.
4. TV Screen Mode: Opening the "TV Screen" tab on a Smart TV browser or laptop connected to a TV generates a live 4-digit pairing code and runs the built-in "Galactic Shift" arcade game in real time.

Current User State: Connection = ${connectionStatus}, Paired TV = ${pairedTvName}, Direction Control = ${directionMode}, Active Tab = ${currentView}.

Response Style:
- Reply in clear, warm, plain English.
- Use short numbered steps (1, 2, 3...) when guiding or troubleshooting.
- Keep responses concise, practical, and easy to skim on a phone screen (around 80–170 words).
- Avoid markdown code blocks or raw syntax clutter; use clean plain text and numbered steps.`;

    const contents = [
      ...rawHistory
        .filter(
          (item: unknown): item is { role: string; text: string } =>
            typeof item === 'object' &&
            item !== null &&
            'role' in item &&
            'text' in item &&
            typeof (item as { text: unknown }).text === 'string'
        )
        .map((item: { role: string; text: string }) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: sanitizeString(item.text, 800) }],
        })),
      {
        role: 'user',
        parts: [{ text: rawMessage }],
      },
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({
          error:
            language === 'hi'
              ? 'AI टीचर से खाली उत्तर मिला। कृपया फिर से प्रयास करें।'
              : 'Received an empty response from the AI Teacher. Please try again.',
        });
        return;
      }

      // Suggest a helpful in-app shortcut based on topic
      const lower = rawMessage.toLowerCase();
      let suggestedAction: 'setup' | 'controller' | 'tv' | undefined;
      if (lower.includes('connect') || lower.includes('pair') || lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('कनेक्ट') || lower.includes('सेटअप') || lower.includes('पेयर')) {
        suggestedAction = 'setup';
      } else if (lower.includes('button') || lower.includes('joystick') || lower.includes('controller') || lower.includes('gamepad') || lower.includes('कंट्रोलर') || lower.includes('जॉयस्टिक') || lower.includes('बटन')) {
        suggestedAction = 'controller';
      } else if (lower.includes('tv screen') || lower.includes('receiver') || lower.includes('टीवी स्क्रीन')) {
        suggestedAction = 'tv';
      }

      res.json({ reply: replyText, suggestedAction });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'AI service error';
      const status = errMsg.includes('429') ? 429 : errMsg.includes('403') ? 403 : 502;
      res.status(status).json({
        error:
          language === 'hi'
            ? `AI टीचर अभी जवाब नहीं दे सका (${errMsg})। कृपया थोड़ी देर बाद फिर प्रयास करें।`
            : `AI Teacher could not respond right now (${errMsg}). Please try again.`,
      });
    }
  });

  const server = http.createServer(app);

  // Attach real WebSocket server for low-latency phone-to-TV gamepad relay
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    clientMeta.set(ws, { role: 'unknown', roomCode: null, deviceName: 'Device' });

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = msg.type;
      const meta = clientMeta.get(ws);
      if (!meta) return;

      if (type === 'ping') {
        safeSend(ws, { type: 'pong', ts: typeof msg.ts === 'number' ? msg.ts : Date.now() });
        return;
      }

      if (type === 'tv:register') {
        detachClientFromRoom(ws);
        const requestedCode = sanitizeString(msg.code, 8);
        const tvName = sanitizeString(msg.name, 50) || 'Smart TV Display';
        const tvModel = sanitizeString(msg.model, 60) || 'TV Browser Receiver';

        let room = requestedCode ? rooms.get(requestedCode) : undefined;
        if (!room) {
          const code = requestedCode && /^\d{4,5}$/.test(requestedCode) ? requestedCode : generatePairingCode();
          room = {
            code,
            name: tvName,
            model: tvModel,
            protocol: 'Smart TV Receiver',
            isBuiltin: false,
            tvSockets: new Set(),
            controllerSockets: new Set(),
            createdAt: Date.now(),
          };
          rooms.set(code, room);
        }

        room.tvSockets.add(ws);
        meta.role = 'tv';
        meta.roomCode = room.code;
        meta.deviceName = room.name;

        safeSend(ws, {
          type: 'tv:registered',
          code: room.code,
          name: room.name,
          controllerCount: room.controllerSockets.size,
        });
        broadcastRoomPresence(room);
        return;
      }

      if (type === 'controller:join') {
        detachClientFromRoom(ws);
        const code = sanitizeString(msg.code, 8);
        const controllerName = sanitizeString(msg.deviceName, 40) || 'Smartphone GamePad';

        const room = rooms.get(code);
        if (!room) {
          safeSend(ws, {
            type: 'error',
            code: 'ROOM_NOT_FOUND',
            message: 'TV pairing code not found. Check the 4-digit code on your TV screen.',
          });
          return;
        }

        room.controllerSockets.add(ws);
        meta.role = 'controller';
        meta.roomCode = room.code;
        meta.deviceName = controllerName;

        safeSend(ws, {
          type: 'controller:paired',
          code: room.code,
          tvName: room.name,
          tvModel: room.model,
          protocol: room.protocol,
          isBuiltin: room.isBuiltin,
        });
        broadcastRoomPresence(room);
        return;
      }

      if (type === 'controller:leave') {
        detachClientFromRoom(ws);
        safeSend(ws, { type: 'controller:left' });
        return;
      }

      if (type === 'gamepad:input') {
        if (meta.role !== 'controller' || !meta.roomCode) return;
        const room = rooms.get(meta.roomCode);
        if (!room) return;

        const rawState = msg.state;
        if (typeof rawState !== 'object' || rawState === null) return;
        const s = rawState as Record<string, unknown>;
        const clampAxis = (v: unknown): number =>
          typeof v === 'number' && Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;

        const allowedButtons = [
          'A', 'B', 'X', 'Y', 'L1', 'L2', 'R1', 'R2',
          'UP', 'DOWN', 'LEFT', 'RIGHT', 'SELECT', 'HOME', 'START',
        ];
        const rawBtns = typeof s.buttons === 'object' && s.buttons !== null
          ? (s.buttons as Record<string, unknown>)
          : {};
        const safeButtons: Record<string, boolean> = {};
        for (const key of allowedButtons) {
          safeButtons[key] = Boolean(rawBtns[key]);
        }

        const sanitizedState = {
          ax: clampAxis(s.ax),
          ay: clampAxis(s.ay),
          buttons: safeButtons,
          timestamp: typeof s.timestamp === 'number' && Number.isFinite(s.timestamp) ? s.timestamp : Date.now(),
        };

        const inputPayload = {
          type: 'gamepad:state',
          code: room.code,
          state: sanitizedState,
          serverTs: Date.now(),
        };

        // Relay to all connected Smart TV displays in this room
        room.tvSockets.forEach((tvSock) => safeSend(tvSock, inputPayload));

        // If paired to the built-in TV room, also echo confirmed frame to controller's live TV monitor
        if (room.isBuiltin) {
          safeSend(ws, inputPayload);
        }
      }
    });

    ws.on('close', () => {
      detachClientFromRoom(ws);
    });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TV Connect GamePad server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
