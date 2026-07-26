# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"lana" — a personal, local-only finance app (Expo/React Native, Android-first). Single goal: show
how much money is safe to spend or commit right now, and simulate MSI (interest-free installment)
purchases before committing to them. No backend, no auth, no cloud sync — everything lives in a
local SQLite database on-device.

## Commands

- `npm start` / `npm run android` / `npm run ios` / `npm run web` — start the Expo dev server
- `npm run lint` — `expo lint` (flat ESLint config in `eslint.config.js`)
- `npm run reset-project` — moves the starter code aside (see `scripts/reset-project.js`)
- No test runner is configured. To sanity-check `src/domain/*` logic against real numbers, write a
  throwaway script and run it with `npx tsx path/to/script.ts` (do not commit scratch scripts).

## Architecture

**`src/domain/` is the core — pure functions, no React Native or SQLite imports.** All the financial
math (month math, the "disponible" formula, MSI, 6-month projection) lives here and is fully
testable in isolation. UI and the store only orchestrate; they never compute.

- `domain/month.ts` — month-range math: last day of month, clamping day 31, and counting real
  occurrences of a weekday in a month (a month can have 4 *or* 5 Fridays/Sundays — never assume 4).
- `domain/disponible.ts` — `computeMonthSlice()`: the "disponible" formula for one month.
- `domain/msi.ts` — installment-purchase math (monthly payment, which months a purchase affects).
- `domain/projection.ts` — `projectMonths()`: rolls the formula forward N months, chaining the
  carried-over cushion (`colchon`) month to month; also used by the simulator to inject a
  hypothetical purchase and compare projections.

**Disponible formula** (calendar month, forward-looking):
```
disponible = ingresos_del_mes − gastos_fijos_del_mes − Σ mensualidades_MSI_activas
           − aporte_reserva_del_mes − gastos_variables_ya_registrados + colchon_acumulado
```
The reserva (imprevistos fund) is a real accumulating balance (`reserva_saldo`), not a phantom
buffer: `aporte_reserva` is subtracted from disponible *and* added to the fund each month;
transactions tagged `imprevisto` draw down the fund instead of lowering disponible directly.

**Data layer** (`src/db/`): `schema.ts` holds the DDL and a `PRAGMA user_version`-based migration
guard (`migrateDbIfNeeded`); `queries.ts` maps snake_case SQLite rows to the camelCase domain types
in `src/domain/types.ts`. The DB is provided via `SQLiteProvider` in `src/app/_layout.tsx`
(`useSQLiteContext()` in screens/store) — this is the SDK 57 `expo-sqlite` async API
(`runAsync`/`getAllAsync`/`getFirstAsync`/`execAsync`), not the legacy WebSQL-style API.

**Routing** (`src/app/`, expo-router, file-based, `typedRoutes` on): `_layout.tsx` wraps the app in
`SQLiteProvider` and a tab navigator (Inicio / Simulador / Configuración). Path aliases: `@/*` →
`src/*`, `@/assets/*` → `assets/*`.

**Seed data** (`src/seed/`): `data.ts` holds the user's real recurring income/expenses as typed seed
records; `loadSeed.ts` inserts them once on first launch if the DB is empty — useful as a reference
for the shape of real data when adding features.

## Notable conventions

- Expo SDK **57** (React 19.2, React Native 0.86) — see `AGENTS.md`: read the versioned docs at
  https://docs.expo.dev/versions/v57.0.0/ before writing code; do not assume APIs from older SDKs.
- Styling is NativeWind (Tailwind classes via `className`); dark mode follows the OS
  (`userInterfaceStyle: "automatic"` in `app.json`) using Tailwind's `dark:` variant.
- `experiments.reactCompiler` is on in `app.json` — avoid manual `useMemo`/`useCallback` patterns
  the compiler already handles.
- `.vscode/settings.json` runs fixAll / organizeImports / sortMembers on save.
- Money values are computed in domain code as plain numbers (no currency library); format for
  display with `formatMXN()` in `src/lib/format.ts`.
