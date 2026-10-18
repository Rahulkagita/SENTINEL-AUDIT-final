export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api",

  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",

  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  appEnv:
    process.env.NEXT_PUBLIC_APP_ENV || "development",

  isProduction:
    (process.env.NEXT_PUBLIC_APP_ENV || "development") === "production",

  isDevelopment:
    (process.env.NEXT_PUBLIC_APP_ENV || "development") === "development",
} as const;