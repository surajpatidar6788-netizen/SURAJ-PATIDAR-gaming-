import type { Language } from '../types';

export interface AppCopy {
  brandName: string;
  nav: {
    setup: string;
    controller: string;
    tv: string;
    guide: string;
  };
  langToggle: string;
  status: {
    connected: string;
    connecting: string;
    disconnected: string;
    reconnect: string;
    disconnect: string;
    latency: string;
    noTvPaired: string;
    pairedWith: string;
    codeLabel: string;
    switchTv: string;
  };
  setup: {
    heroTitle: string;
    heroSubtitle: string;
    stepPrefix: string;
    steps: [string, string, string];
    step1Title: string;
    step1Desc: string;
    englishOption: string;
    englishSub: string;
    hindiOption: string;
    hindiSub: string;
    step2Title: string;
    step2Desc: string;
    wifiChecks: string[];
    fallbackTitle: string;
    fallbackTabs: {
      companion: string;
      android: string;
      ios: string;
      hdmi: string;
    };
    fallbackGuides: {
      companion: string[];
      android: string[];
      ios: string[];
      hdmi: string[];
    };
    step3Title: string;
    step3Desc: string;
    scanBtn: string;
    scanning: string;
    availableTvs: string;
    instantConnect: string;
    pairCodeLabel: string;
    pairCodePlaceholder: string;
    pairCodeBtn: string;
    openTvTip: string;
    openTvScreenBtn: string;
    nextStep: string;
    prevStep: string;
    launchController: string;
    codeNotFound: string;
    connectedBannerTitle: string;
    connectedBannerSub: string;
  };
  controller: {
    title: string;
    landscapeHint: string;
    enterFullscreen: string;
    exitFullscreen: string;
    joystickMode: string;
    dpadMode: string;
    hapticsOn: string;
    hapticsOff: string;
    soundOn: string;
    soundOff: string;
    showTvMonitor: string;
    hideTvMonitor: string;
    notConnectedNotice: string;
    quickPairDemo: string;
    goToSetup: string;
    actionLabels: {
      A: string;
      B: string;
      X: string;
      Y: string;
      SELECT: string;
      HOME: string;
      START: string;
    };
    keyboardTip: string;
    tvMonitorTitle: string;
  };
  tv: {
    title: string;
    subtitle: string;
    pairingCodeHeading: string;
    pairingInstructions: string;
    waitingForPhone: string;
    controllerLinked: string;
    controllersCount: string;
    copyLink: string;
    linkCopied: string;
    openPhoneMode: string;
    testLocally: string;
    gameTitle: string;
    score: string;
    level: string;
    lives: string;
    shieldReady: string;
    paused: string;
    gameOver: string;
    pressStart: string;
    pressSelectRestart: string;
  };
  guide: {
    title: string;
    subtitle: string;
    welcomeMessage: string;
    inputPlaceholder: string;
    send: string;
    thinking: string;
    clearChat: string;
    quickPromptsLabel: string;
    quickPrompts: string[];
    retry: string;
    actionShortcuts: {
      setup: string;
      controller: string;
      tv: string;
    };
  };
}

export const TRANSLATIONS: Record<Language, AppCopy> = {
  en: {
    brandName: 'TV Connect GamePad',
    nav: {
      setup: 'Setup',
      controller: 'Gamepad',
      tv: 'TV Screen',
      guide: 'AI Guide',
    },
    langToggle: 'हिन्दी',
    status: {
      connected: 'Connected',
      connecting: 'Connecting',
      disconnected: 'Disconnected',
      reconnect: 'Reconnect',
      disconnect: 'Disconnect',
      latency: 'Ping',
      noTvPaired: 'No TV paired yet',
      pairedWith: 'Paired to',
      codeLabel: 'Code',
      switchTv: 'Change TV',
    },
    setup: {
      heroTitle: 'Turn your phone into a low-latency TV gamepad',
      heroSubtitle:
        'Follow three quick steps to connect your smartphone and television, then play in full landscape controller mode.',
      stepPrefix: 'Step',
      steps: ['Language', 'Same Wi-Fi', 'Pair TV'],
      step1Title: 'Choose your preferred language',
      step1Desc:
        'Every menu, setup instruction, controller button label, and AI Teacher reply updates instantly. You can switch anytime from the top bar.',
      englishOption: 'English',
      englishSub: 'All setup steps, controller labels, and AI Teacher in English',
      hindiOption: 'हिन्दी (Hindi)',
      hindiSub: 'सभी सेटअप कदम, कंट्रोलर लेबल और AI टीचर हिन्दी में',
      step2Title: 'Connect phone and TV to the same Wi-Fi',
      step2Desc:
        'For ultra-low latency control, ensure both your smartphone and television are joined to the same home Wi-Fi router.',
      wifiChecks: [
        'Turn on your Smart TV and open Settings → Network to confirm your Wi-Fi name.',
        'Connect your smartphone to the exact same Wi-Fi network (avoid Guest Wi-Fi or mobile data).',
        'Keep your phone within clear Wi-Fi range of the router for smooth gameplay.',
      ],
      fallbackTitle: 'Connection methods & fallback support',
      fallbackTabs: {
        companion: 'TV Browser Link',
        android: 'Android Cast',
        ios: 'iOS AirPlay',
        hdmi: 'HDMI / USB-C',
      },
      fallbackGuides: {
        companion: [
          'Open the browser on your Smart TV (or a laptop connected to the TV via HDMI).',
          'Visit this app URL and tap the "TV Screen" tab to display a live 4-digit pairing code.',
          'Enter that 4-digit code on your phone in Step 3 for instant low-latency gamepad control.',
        ],
        android: [
          'Swipe down from the top of your Android phone to open Quick Settings.',
          'Tap "Cast", "Smart View", or "Wireless Display" and pick your TV from the list.',
          'Once your TV mirrors the screen, launch your game or switch to Gamepad mode here.',
        ],
        ios: [
          'Swipe down from the top-right corner of your iPhone to open Control Center.',
          'Tap "Screen Mirroring" and select your AirPlay-compatible Smart TV or Apple TV.',
          'Return to TV Connect GamePad and rotate your phone to landscape for gaming.',
        ],
        hdmi: [
          'Plug a USB-C to HDMI adapter (or Lightning to HDMI) between your phone/laptop and TV.',
          'Switch your TV input source (HDMI 1 / HDMI 2) using your TV remote.',
          'Open TV Screen mode on the connected device and pair your phone over Wi-Fi.',
        ],
      },
      step3Title: 'Scan, pair, and connect to your TV',
      step3Desc:
        'Select a discovered Smart TV below, enter the 4-digit pairing code shown on your TV screen, or connect to the built-in TV receiver to test immediately.',
      scanBtn: 'Scan TVs',
      scanning: 'Scanning...',
      availableTvs: 'Discovered TVs on network',
      instantConnect: 'Connect',
      pairCodeLabel: 'Enter 4-digit TV pairing code',
      pairCodePlaceholder: 'e.g. 2048',
      pairCodeBtn: 'Pair TV',
      openTvTip: 'Want to turn another screen or Smart TV into a live game display?',
      openTvScreenBtn: 'Open TV Screen Mode',
      nextStep: 'Continue',
      prevStep: 'Back',
      launchController: 'Open Gaming Controller',
      codeNotFound: 'TV pairing code not found. Verify the 4-digit code shown on your TV Screen tab.',
      connectedBannerTitle: 'Ready to play on your TV',
      connectedBannerSub: 'Your smartphone is paired and ready. Switch to Gaming Controller mode to start playing.',
    },
    controller: {
      title: 'Gaming Controller',
      landscapeHint: 'Rotate sideways or tap Fullscreen Pad for comfortable landscape play',
      enterFullscreen: 'Landscape Pad',
      exitFullscreen: 'Exit Fullscreen',
      joystickMode: 'Joystick',
      dpadMode: 'D-Pad',
      hapticsOn: 'Vibration On',
      hapticsOff: 'Vibration Off',
      soundOn: 'Tactile Click On',
      soundOff: 'Tactile Click Off',
      showTvMonitor: 'Show TV Monitor',
      hideTvMonitor: 'Hide TV Monitor',
      notConnectedNotice: 'Not connected to a TV yet. Pair in one tap to control the live TV game.',
      quickPairDemo: 'Quick Connect TV (2048)',
      goToSetup: 'Open Setup',
      actionLabels: {
        A: 'Fire',
        B: 'Shield',
        X: 'Dash',
        Y: 'Pulse',
        SELECT: 'Reset',
        HOME: 'Home',
        START: 'Pause',
      },
      keyboardTip: 'Desktop controls: WASD / Arrows to move · J (A) · K (B) · U (X) · I (Y) · Enter (Start)',
      tvMonitorTitle: 'Live TV Output — Galactic Shift',
    },
    tv: {
      title: 'TV Screen Receiver',
      subtitle: 'Keep this screen open on your Smart TV or HDMI-connected display and pair with your smartphone.',
      pairingCodeHeading: 'TV Pairing Code',
      pairingInstructions: 'Open TV Connect GamePad on your phone → Setup → Step 3 and enter this code.',
      waitingForPhone: 'Waiting for smartphone gamepad to pair...',
      controllerLinked: 'Smartphone GamePad Connected',
      controllersCount: 'Connected pads',
      copyLink: 'Copy TV Link',
      linkCopied: 'Copied',
      openPhoneMode: 'Switch to Phone GamePad',
      testLocally: 'Play with Keyboard',
      gameTitle: 'Galactic Shift',
      score: 'Score',
      level: 'Wave',
      lives: 'Hull',
      shieldReady: 'Shield',
      paused: 'Paused',
      gameOver: 'Mission Ended',
      pressStart: 'Press Start / A to Play',
      pressSelectRestart: 'Press Select or A to Restart',
    },
    guide: {
      title: 'AI Teacher & Guide',
      subtitle: 'Ask anything about setup, TV pairing, controller buttons, or fixing connection issues.',
      welcomeMessage:
        'Hello! I am your TV Connect GamePad Teacher. Tap any quick question below or ask me anything about pairing your TV, using the gaming controller, or fixing lag.',
      inputPlaceholder: 'Ask how to connect your TV, use buttons, or fix issues...',
      send: 'Ask',
      thinking: 'AI Teacher is preparing clear steps...',
      clearChat: 'Clear Chat',
      quickPromptsLabel: 'Common Questions',
      quickPrompts: [
        'How do I connect my phone to the TV?',
        'How to use the gaming controller?',
        'Fix TV connection or lag problems',
        'How to use screen mirroring or cast?',
        'Explain all gamepad buttons (A, B, X, Y)',
      ],
      retry: 'Try Again',
      actionShortcuts: {
        setup: 'Go to Setup Wizard',
        controller: 'Open Gaming Controller',
        tv: 'Open TV Screen Mode',
      },
    },
  },
  hi: {
    brandName: 'TV Connect GamePad',
    nav: {
      setup: 'सेटअप',
      controller: 'कंट्रोलर',
      tv: 'टीवी स्क्रीन',
      guide: 'AI गाइड',
    },
    langToggle: 'English',
    status: {
      connected: 'कनेक्टेड',
      connecting: 'कनेक्ट हो रहा है',
      disconnected: 'डिस्कनेक्टेड',
      reconnect: 'फिर से जोड़ें',
      disconnect: 'डिस्कनेक्ट करें',
      latency: 'पिंग',
      noTvPaired: 'अभी कोई टीवी जुड़ा नहीं है',
      pairedWith: 'जुड़ा हुआ टीवी',
      codeLabel: 'कोड',
      switchTv: 'टीवी बदलें',
    },
    setup: {
      heroTitle: 'अपने फ़ोन को तेज़ टीवी गेमिंग कंट्रोलर बनाएं',
      heroSubtitle:
        'तीन आसान चरणों में अपने स्मार्टफोन को टीवी से जोड़ें और आरामदायक लैंडस्केप गेमपैड मोड में गेम खेलें।',
      stepPrefix: 'चरण',
      steps: ['भाषा', 'समान Wi-Fi', 'टीवी पेयर'],
      step1Title: 'अपनी पसंदीदा भाषा चुनें',
      step1Desc:
        'पूरा ऐप, सेटअप निर्देश, कंट्रोलर बटन लेबल और AI टीचर के जवाब तुरंत चुनी गई भाषा में बदल जाते हैं। आप ऊपर से कभी भी भाषा बदल सकते हैं।',
      englishOption: 'English (अंग्रेज़ी)',
      englishSub: 'सभी सेटअप कदम, कंट्रोलर और AI टीचर अंग्रेज़ी में',
      hindiOption: 'हिन्दी',
      hindiSub: 'सभी सेटअप चरण, कंट्रोलर लेबल और AI टीचर हिन्दी में',
      step2Title: 'फ़ोन और टीवी को एक ही Wi-Fi से जोड़ें',
      step2Desc:
        'बिना देरी (लो-लैटेंसी) गेम खेलने के लिए सुनिश्चित करें कि आपका स्मार्टफोन और टीवी एक ही होम Wi-Fi नेटवर्क से जुड़े हों।',
      wifiChecks: [
        'अपना स्मार्ट टीवी चालू करें और Settings → Network में जाकर Wi-Fi का नाम जांचें।',
        'अपने फ़ोन को ठीक उसी Wi-Fi से जोड़ें (मोबाइल डेटा या Guest Wi-Fi बंद रखें)।',
        'स्मूद गेमप्ले के लिए फ़ोन को राउटर के अच्छे सिग्नल क्षेत्र में रखें।',
      ],
      fallbackTitle: 'कनेक्शन के तरीके और वैकल्पिक सपोर्ट',
      fallbackTabs: {
        companion: 'टीवी ब्राउज़र लिंक',
        android: 'Android कास्ट',
        ios: 'iOS AirPlay',
        hdmi: 'HDMI / USB-C',
      },
      fallbackGuides: {
        companion: [
          'अपने स्मार्ट टीवी के ब्राउज़र (या टीवी से HDMI द्वारा जुड़े लैपटॉप) में यह ऐप खोलें।',
          '"टीवी स्क्रीन" टैब चुनें — स्क्रीन पर एक लाइव 4-अंकीय पेयरिंग कोड दिखाई देगा।',
          'चरण 3 में अपने फ़ोन पर वह 4-अंकीय कोड दर्ज करें और तुरंत गेम खेलें।',
        ],
        android: [
          'अपने Android फ़ोन में ऊपर से नीचे स्वाइप करके Quick Settings खोलें।',
          '"Cast", "Smart View" या "Wireless Display" पर टैप करें और अपना टीवी चुनें।',
          'स्क्रीन मिरर होने के बाद गेम शुरू करें या यहाँ गेमपैड मोड पर जाएं।',
        ],
        ios: [
          'अपने iPhone के ऊपर-दाएं कोने से नीचे स्वाइप करके Control Center खोलें।',
          '"Screen Mirroring" पर टैप करें और अपना AirPlay स्मार्ट टीवी या Apple TV चुनें।',
          'वापस TV Connect GamePad में आएं और खेलने के लिए फ़ोन को आड़ा (लैंडस्केप) घुमाएं।',
        ],
        hdmi: [
          'USB-C से HDMI (या Lightning से HDMI) केबल से डिवाइस को टीवी से जोड़ें।',
          'टीवी रिमोट से सही HDMI इनपुट (HDMI 1 / HDMI 2) चुनें।',
          'कनेक्टेड स्क्रीन पर "टीवी स्क्रीन" मोड खोलें और Wi-Fi से फ़ोन पेयर करें।',
        ],
      },
      step3Title: 'टीवी स्कैन करें, पेयर करें और कनेक्ट करें',
      step3Desc:
        'नीचे मिले स्मार्ट टीवी को चुनें, टीवी पर दिख रहा 4-अंकीय कोड डालें, या तुरंत टेस्ट करने के लिए बिल्ट-इन टीवी रिसीवर से कनेक्ट करें।',
      scanBtn: 'टीवी स्कैन करें',
      scanning: 'स्कैन हो रहा है...',
      availableTvs: 'नेटवर्क पर उपलब्ध टीवी',
      instantConnect: 'कनेक्ट करें',
      pairCodeLabel: '4-अंकीय टीवी पेयरिंग कोड दर्ज करें',
      pairCodePlaceholder: 'जैसे 2048',
      pairCodeBtn: 'टीवी पेयर करें',
      openTvTip: 'क्या आप किसी दूसरे स्मार्ट टीवी या स्क्रीन को लाइव गेम डिस्प्ले बनाना चाहते हैं?',
      openTvScreenBtn: 'टीवी स्क्रीन मोड खोलें',
      nextStep: 'आगे बढ़ें',
      prevStep: 'पीछे',
      launchController: 'गेमिंग कंट्रोलर खोलें',
      codeNotFound: 'यह पेयरिंग कोड नहीं मिला। कृपया टीवी स्क्रीन टैब पर दिखाया 4-अंकीय कोड जांचें।',
      connectedBannerTitle: 'टीवी पर खेलने के लिए तैयार',
      connectedBannerSub: 'आपका स्मार्टफोन सफलतापूर्वक जुड़ गया है। खेलने के लिए गेमिंग कंट्रोलर मोड खोलें।',
    },
    controller: {
      title: 'गेमिंग कंट्रोलर',
      landscapeHint: 'आराम से खेलने के लिए फ़ोन को आड़ा घुमाएं या फुलस्क्रीन पैड टैप करें',
      enterFullscreen: 'लैंडस्केप पैड',
      exitFullscreen: 'फुलस्क्रीन बंद करें',
      joystickMode: 'जॉयस्टिक',
      dpadMode: 'D-Pad',
      hapticsOn: 'वाइब्रेशन चालू',
      hapticsOff: 'वाइब्रेशन बंद',
      soundOn: 'क्लिक साउंड चालू',
      soundOff: 'क्लिक साउंड बंद',
      showTvMonitor: 'टीवी मॉनिटर दिखाएं',
      hideTvMonitor: 'टीवी मॉनिटर छिपाएं',
      notConnectedNotice: 'अभी कोई टीवी कनेक्ट नहीं है। लाइव टीवी गेम चलाने के लिए एक टैप में पेयर करें।',
      quickPairDemo: 'तुरंत टीवी जोड़ें (2048)',
      goToSetup: 'सेटअप खोलें',
      actionLabels: {
        A: 'फायर',
        B: 'शील्ड',
        X: 'डैश',
        Y: 'पल्स',
        SELECT: 'रीसेट',
        HOME: 'होम',
        START: 'पॉज़',
      },
      keyboardTip: 'कीबोर्ड नियंत्रण: WASD / Arrow चलने के लिए · J (A) · K (B) · U (X) · I (Y) · Enter (Start)',
      tvMonitorTitle: 'लाइव टीवी आउटपुट — Galactic Shift',
    },
    tv: {
      title: 'टीवी स्क्रीन रिसीवर',
      subtitle: 'इस स्क्रीन को अपने स्मार्ट टीवी या HDMI डिस्प्ले पर खुला रखें और अपने स्मार्टफोन से पेयर करें।',
      pairingCodeHeading: 'टीवी पेयरिंग कोड',
      pairingInstructions: 'अपने फ़ोन पर TV Connect GamePad खोलें → सेटअप → चरण 3 में यह कोड दर्ज करें।',
      waitingForPhone: 'स्मार्टफोन गेमपैड के जुड़ने का इंतज़ार है...',
      controllerLinked: 'स्मार्टफोन गेमपैड कनेक्टेड',
      controllersCount: 'जुड़े कंट्रोलर',
      copyLink: 'टीवी लिंक कॉपी करें',
      linkCopied: 'कॉपी हो गया',
      openPhoneMode: 'फ़ोन गेमपैड पर जाएं',
      testLocally: 'कीबोर्ड से खेलें',
      gameTitle: 'Galactic Shift',
      score: 'स्कोर',
      level: 'लेवल',
      lives: 'लाइफ',
      shieldReady: 'शील्ड',
      paused: 'रुका हुआ',
      gameOver: 'गेम समाप्त',
      pressStart: 'खेलने के लिए Start या A दबाएं',
      pressSelectRestart: 'फिर से शुरू करने के लिए Select या A दबाएं',
    },
    guide: {
      title: 'AI टीचर और गाइड',
      subtitle: 'सेटअप, टीवी पेयरिंग, कंट्रोलर बटन या कनेक्शन समस्या के बारे में कुछ भी पूछें।',
      welcomeMessage:
        'नमस्ते! मैं आपका TV Connect GamePad AI टीचर हूँ। नीचे दिए गए किसी भी त्वरित प्रश्न पर टैप करें या टीवी जोड़ने, कंट्रोलर चलाने या कनेक्शन ठीक करने के बारे में कुछ भी पूछें।',
      inputPlaceholder: 'टीवी कनेक्ट करने, बटन या किसी समस्या के बारे में पूछें...',
      send: 'पूछें',
      thinking: 'AI टीचर आसान कदम तैयार कर रहा है...',
      clearChat: 'चैट साफ़ करें',
      quickPromptsLabel: 'सामान्य प्रश्न',
      quickPrompts: [
        'फ़ोन को टीवी से कैसे कनेक्ट करें?',
        'गेमिंग कंट्रोलर का उपयोग कैसे करें?',
        'टीवी कनेक्शन या लैग की समस्या ठीक करें',
        'स्क्रीन मिररिंग या कास्ट कैसे करें?',
        'सभी गेमपैड बटन (A, B, X, Y) समझाएं',
      ],
      retry: 'फिर से प्रयास करें',
      actionShortcuts: {
        setup: 'सेटअप विज़ार्ड खोलें',
        controller: 'गेमिंग कंट्रोलर खोलें',
        tv: 'टीवी स्क्रीन मोड खोलें',
      },
    },
  },
};
