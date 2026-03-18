# pocketshot

Expo / React Native starter for [bunshot](https://github.com/Last-Shot-Labs/bunshot) APIs.

## What's included (Phase 2)

- Auth screens: Login, Register, MFA Verify
- Token storage via `expo-secure-store`
- Auth service (`lib/auth.ts`) — register, login, MFA verify, OAuth exchange, logout
- API client (`lib/api.ts`) — `x-user-token` header auth, automatic token refresh interceptor
- WebSocket client (`lib/ws.ts`) — `?token=` query param auth, AppState reconnect, room re-subscription
- OpenAPI codegen (`bun run sync`) — fetches spec and generates typed client

## Setup

```bash
bun install
cp .env.example .env.local   # set EXPO_PUBLIC_API_URL
bun start
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | Your bunshot API base URL |
| `EXPO_PUBLIC_WS_URL` | `ws://localhost:3000` | WebSocket base URL |

## Auth flow

Mobile auth uses JSON tokens, not cookies:

- **Register / Login** — response body `{ token, refreshToken }` stored in `expo-secure-store`
- **Requests** — `x-user-token: <jwt>` header
- **Refresh** — `POST /auth/refresh` with `{ refreshToken }` in body; on success, retries the original request once; on second 401, clears tokens and caller redirects to login
- **OAuth** — `expo-web-browser` opens `GET /auth/:provider`, deep link returns `pocketshot://auth/callback?code=xxx`, exchanged via `POST /auth/oauth/exchange`
- **WebSocket** — `wss://host/ws?token=<jwt>` (bunshot accepts `?token=` for React Native clients)

## File structure

```
app/
  _layout.tsx              # Root layout (SafeAreaProvider)
  (auth)/
    _layout.tsx            # Auth stack
    login.tsx
    register.tsx
    mfa.tsx                # TOTP / email OTP verify
    oauth-callback.tsx     # Deep link handler: pocketshot://auth/callback
  (app)/
    _layout.tsx            # Auth gate — redirects to login if no token
    index.tsx              # Home screen (placeholder)
lib/
  config.ts                # API_BASE_URL, WS_BASE_URL
  tokenStorage.ts          # expo-secure-store get/set/clear
  api.ts                   # apiFetch / apiGet / apiPost + refresh interceptor
  auth.ts                  # register, login, verifyMfa, logout, exchangeOAuthCode
  ws.ts                    # PocketshotWS class + singleton export
  generated/               # Output of `bun run sync` (gitignored)
scripts/
  sync.ts                  # OpenAPI codegen script
```
