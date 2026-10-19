export const env = {
  /**
   * Base URL for the Spring Boot backend API.
   *
   * Defaults to same-origin `/api`, which `next.config.js` transparently
   * proxies to the backend (`API_PROXY_TARGET`, default http://localhost:8080).
   * Set NEXT_PUBLIC_API_BASE_URL only to point at a different origin directly.
   */
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api",

  appEnv:
    process.env.NEXT_PUBLIC_APP_ENV || "development",

  isProduction:
    (process.env.NEXT_PUBLIC_APP_ENV || "development") === "production",

  isDevelopment:
    (process.env.NEXT_PUBLIC_APP_ENV || "development") === "development",
} as const;
