/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The same Content-Security-Policy CloudFront sends in production, applied to the dev server so a
// violation shows up locally rather than after a deploy. Kept in step by hand with the response
// headers policy in iac/terraform/cloudfront.tf. The dev server additionally needs 'unsafe-inline'
// scripts and a websocket for React Refresh and HMR; production does not.
const devContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws://localhost:5173",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    headers: { "content-security-policy": devContentSecurityPolicy },
  },
  build: {
    // Never inline. Inlined flags would become data: URIs inside the main bundle -- most flags are
    // under the default 4 KB limit, so that is nearly 200 of them loaded before the first screen.
    // As separate files, each is fetched only when it is shown and cached forever after.
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
  },
});
