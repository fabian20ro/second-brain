export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getTelegramConfig() {
  return {
    botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  };
}
