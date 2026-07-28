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
- `domain/disponible.ts` — `computeMonthSlice()`: the "disponible" formula for one month. Also
  `estaVigenteEnMes()`, which gates a `GastoFijo` by its optional `inicio`/`fin` window (used for
  subscriptions with a fixed duration, e.g. "Amazon for 3 months").
- `domain/msi.ts` — installment-purchase math (monthly payment, which months a purchase affects).
- `domain/escenario.ts` — the simulator's `EscenarioItem` math (`unico` / `meses` / `recurrente`),
  independent of and never persisted into real financial state.
- `domain/projection.ts` — `projectMonths()`: rolls the formula forward N months, chaining the
  carried-over cushion (`colchon`) month to month; accepts an optional `extrasPorMes` to fold in a
  simulated scenario without touching the real projection.

**Disponible formula** (calendar month, forward-looking):
```
saldo_del_mes = ingresos_del_mes − gastos_fijos_del_mes − Σ mensualidades_MSI_activas
              − aporte_reserva_del_mes − gastos_variables_ya_registrados − extras_de_escenario
disponible = saldo_del_mes + colchon_acumulado
```
`saldo_del_mes` (does the month alone hold up?) and `disponible` (does it hold up once the
cushion from previous months is counted?) are shown as two separate numbers in the UI — a month can
be in the red on its own while `disponible` stays positive because of savings, and that distinction
is the point.
The reserva (imprevistos fund) is a real accumulating balance (`reserva_saldo`), not a phantom
buffer: `aporte_reserva` is subtracted from disponible *and* added to the fund each month;
transactions tagged `imprevisto` draw down the fund instead of lowering disponible directly.

**Data layer** (`src/db/`): `schema.ts` holds the DDL and a `PRAGMA user_version`-based migration
guard (`migrateDbIfNeeded`); `queries.ts` maps snake_case SQLite rows to the camelCase domain types
in `src/domain/types.ts`. The DB is provided via `SQLiteProvider` in `src/app/_layout.tsx`
(`useSQLiteContext()` in screens/store) — this is the SDK 57 `expo-sqlite` async API
(`runAsync`/`getAllAsync`/`getFirstAsync`/`execAsync`), not the legacy WebSQL-style API.

**Routing** (`src/app/`, expo-router, file-based, `typedRoutes` on): `_layout.tsx` wraps the app in
`SQLiteProvider` and a tab navigator (Inicio / Simulador / Ingresos / Gastos / Apartados). Path
aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`.

**Store** (`src/store/useFinanceStore.ts`): loads a ±12-month window around the current month, not
just "the current month" — `mesVisible` lets the UI navigate through it (`irAMes`/`mesAnterior`/
`mesSiguiente`). Months before today are read back from the already-closed `estado_mensual` history;
today is computed live; months ahead come from `proyeccionBase`. The simulator's `escenario` (a
persisted list of `EscenarioItem`s) is projected separately into `proyeccionEscenario` and never
merges into `proyeccionBase` — real financial state must never be derived from a hypothetical.

**No seed data.** The app must always start with an empty database — no income, no expenses, no
balances baked in (this repo is public; a seed with real numbers was removed for that reason and
must never come back). `src/db/genesis.ts` only writes the zeroed "génesis" anchor month that
`cerrarMesesPendientes` needs as a starting point. Every screen must have a working empty state
(see `src/components/EmptyState.tsx`) since a first launch has nothing in it.

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
