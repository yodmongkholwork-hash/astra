import "server-only";

/** Server-side configuration. Secrets never leave this module's callers (route handlers / server components). */
export const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/** Demo Mode is on when no Claude key is configured, or when forced via ASTRA_DEMO_MODE=true. */
export const isDemoMode = () => process.env.ASTRA_DEMO_MODE === "true" || !config.anthropicKey;
