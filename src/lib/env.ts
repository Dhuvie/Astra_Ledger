const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  plaidClientId: process.env.PLAID_CLIENT_ID ?? "",
  plaidSecret: process.env.PLAID_SECRET ?? "",
  plaidEnv: process.env.PLAID_ENV ?? "sandbox",
  plaidWebhookUrl: process.env.PLAID_WEBHOOK_URL ?? "",
  useSampleData: parseBoolean(process.env.USE_SAMPLE_DATA, false),
  /** Seed MongoDB with demo goals/budgets/recurring when DB is empty (off = start empty). */
  seedDemoWorkspace: parseBoolean(process.env.SEED_DEMO_WORKSPACE, false),
};

export const isDatabaseConfigured = Boolean(env.databaseUrl);
export const isPlaidConfigured = Boolean(env.plaidClientId && env.plaidSecret);

