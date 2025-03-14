interface TelegramWebApp {
  close: () => void;
  // Add other WebApp methods as needed
}

interface Telegram {
  WebApp: TelegramWebApp;
}

interface Window {
  Telegram?: Telegram;
}
