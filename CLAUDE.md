# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

See @README for project overview.

**Before marking any work complete:** update this CLAUDE.md and README.md if anything architectural changed.

## Commands

```bash
bun install          # install dependencies
bun run build        # compile to dist/ (tsup)
bun run dev          # watch mode
bun run typecheck    # tsc --noEmit
bun run test         # vitest run (all tests)

# Targeted tests
bun run vitest run tests/auth/storage.test.ts   # storage unit tests
bun run vitest run tests/auth/hooks.test.ts     # hooks unit tests
bun run vitest run tests/cli/sync.test.ts       # sync integration tests
bun run vitest run tests/cli/scaffold.test.ts   # scaffold integration tests
```

## Architecture

`@lastshotlabs/pocketshot` is a published npm package with two entry points:

- **Runtime library** (`src/index.ts`) — `createPocketshot()` factory, auth hooks, API client, token storage, WebSocket hooks. Consuming apps import from here.
- **CLI** (`src/cli/index.ts`) — `pocketshot init` scaffolds a new Expo app; `pocketshot sync` generates typed API clients from an OpenAPI spec.

The `app/` directory is the **reference implementation** — a real Expo app using the package. It demonstrates correct usage and serves as the source of truth for scaffold templates.

### Entry points

- **`src/create-pocketshot.tsx`** — `createPocketshot(config)` factory: wires together `ApiClient`, `TokenStorage`, `QueryClient`, `PocketshotWS`, and auth hooks; returns all hooks + `Providers` component
- **`src/index.ts`** — barrel export for all public APIs
- **`src/cli/index.ts`** — CLI entry point (`init` and `sync` subcommands)

### Runtime library (`src/`)

| File | Purpose |
|------|---------|
| `src/auth/storage.ts` | `TokenStorage` interface + `createSecureStoreStorage()` using expo-secure-store |
| `src/api/client.ts` | `ApiClient` (`x-user-token` header auth, 401→refresh→retry) + `ApiError` |
| `src/auth/hooks.ts` | `createAuthHooks()` factory — 22 hooks + `getOAuthUrl` across auth/account/MFA/OAuth |
| `src/ws/index.ts` | `PocketshotWS` (WS client with `?token=` auth, AppState reconnect) + `createWsHooks()` |
| `src/create-pocketshot.tsx` | Main factory — composes all modules, returns full hook surface + `Providers` |

### CLI (`src/cli/`)

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | Entry — `init` + `sync` subcommands |
| `src/cli/prompts.ts` | 9 interactive prompts via @clack/prompts |
| `src/cli/scaffold.ts` | Writes scaffold files, runs `bun install`, optional git init |
| `src/cli/sync.ts` | OpenAPI → TypeScript codegen |
| `src/cli/types.ts` | `PocketshotScaffoldConfig` interface |
| `src/cli/templates/` | ~21 template generator functions mirroring the reference app |

### Reference app (`app/`)

Real Expo app using the package. Not shipped with the npm package. Screens import exclusively from `@/lib/pocketshot` (which calls `createPocketshot()` and exports all hooks).

### Build output (`dist/`)

| File | Description |
|------|-------------|
| `dist/cli.js` | CLI binary (fully bundled, node18, shebang) |
| `dist/index.js` | ESM runtime library |
| `dist/index.cjs` | CJS runtime library |
| `dist/index.d.ts` | TypeScript declarations |

### Key patterns

**Factory pattern:** `createPocketshot(config)` is the single entry point. It creates all internal instances and returns the full hook surface. The reference app calls this once in `lib/pocketshot.ts` and destructures everything from it.

**TokenStorage:** The canonical key on the pocketshot instance is `tokenStorage` (not `storage`). All internal code and consuming app patterns use this key.

**expo-router peer dep:** Auth hooks call `useRouter()` from `expo-router` internally for post-login/logout navigation. `expo-router` is a required peer dependency.

**Sync config:** `pocketshot.config.json` (not `snapshot.config.json`). The `pocketshotImport` field (not `snapshotImport`) controls the generated import path.

**Templates mirror the reference app:** When the reference app screens are updated, the corresponding template in `src/cli/templates/app/` should be updated to match.

## Testing strategy

Run only tests relevant to changed files. Do not run the full suite mid-task.

```bash
# Changed src/auth/?
bun run vitest run tests/auth/storage.test.ts tests/auth/hooks.test.ts

# Changed src/cli/sync.ts?
bun run vitest run tests/cli/sync.test.ts

# Changed scaffold or templates?
bun run vitest run tests/cli/scaffold.test.ts

# Full suite — only before merging to main:
bun run test
```

`scaffold.test.ts` may show npm 404 errors for `@lastshotlabs/pocketshot` — expected (package not yet published). Tests still pass because they assert file contents, not install success.

## Platform Roadmap

Vision, roadmap, and plugin specs live in the private platform repo:
- Local: `C:/Users/email/projects/lastshotlabs-platform/`
- GitHub: https://github.com/Last-Shot-Labs/platform (private)
