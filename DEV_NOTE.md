# Next.js 16 Dev Origins

- Next.js 16 blocks cross-origin requests to dev-only assets and endpoints by default. In Codespaces, forwarded URLs or `127.0.0.1` can load SSR HTML while client JS/HMR requests are blocked, which looks like all click handlers are dead because hydration cannot complete.
- For local preview apps, configure `allowedDevOrigins` in the app `next.config.ts` with the concrete local/proxy origins needed for development.
