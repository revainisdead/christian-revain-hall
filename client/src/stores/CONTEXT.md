# Stores: context plan

**Rule: always create distinct, encapsulated groups for parts of the app.**

Pinia is global: any component can reach any store. That makes it easy to pile everything into one place, which gets messy fast. So stores are split into **groups**, one folder per part of the app. Each group owns its state and is the only thing that changes it.

## Layout

```
stores/
  index.ts          Pinia setup (Quasar boot). No state here.
  CONTEXT.md        This file.
  auth/index.ts     useAuthStore
  board/index.ts    useBoardStore
  <group>/index.ts  one folder per group; add types.ts, helpers, or more stores inside it as it grows
```

- Import a group by its folder: `import { useBoardStore } from 'stores/board'`.
- Store ids match the folder: `'auth'`, `'board'`. A group that needs more than one store uses `'<group>.<name>'` (for example `'campaign.run'`) and keeps them all in its folder.

## Rules

1. **One group per part of the app.** A group maps to a feature area a player would recognize (signing in, the board, the campaign, progress), not to a data type.
2. **Only the group changes its state.** Other groups and components read its state and getters, and change it only by calling its actions. No reaching in to assign another group's fields.
3. **No cycles.** If two groups need each other, the shared part becomes its own group, or one group passes data into the other's action as an argument.
4. **Store only what has to be shared or outlive a component.** Anything a single component needs stays in that component. Values derived from state are getters (or `computed`), never a second copy of the state.
5. **Rules stay out of stores.** Chess rules and analysis live in plain modules (`components/useBoardHistory.ts`, `components/attackMap.ts`, ...) that stores and components both call. A store holds *what is*, not *how chess works*.
6. **Server calls go through the owning group's actions,** using the `api` instance from `boot/axios`. Components don't call the API for data a store owns.
7. **Persistence is opt-in per group** (server, or `localStorage` for view preferences). Document it in the group's file when added.
8. **Fair play:** no store accepts a position from outside BlunderProof for analysis. Positions come from games played on BlunderProof's own board or against its bots (see `FAIR_PLAY.md`).

## Groups

| Group | Status | Owns |
|---|---|---|
| `auth` | in use | The signed-in user, login and logout, auth config. |
| `board` | created, empty | The local board: the current game, layer settings (Counts, You are), the battle shown in the battle tab. Move these in from `IndexPage.vue` when a second page needs them. |
| `campaign` | planned | A solo run against bots: the opponent ladder, the current run, the game in progress, run results. |
| `progress` | planned | Achievements, stats, the visualization score (prediction accuracy over time), unlocks. |
| `settings` | planned | Player preferences: which training aids are on, sounds, theme, board style. |

Add a row when a group is created, and keep this table in step with the folders.
