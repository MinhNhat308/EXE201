function resolveApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // In deployed builds, use the same-origin Next.js rewrite/proxy instead of
  // embedding a localhost URL into the client bundle.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "/api";
  }

  return "http://localhost:4000/api";
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "BobaPos"
};
