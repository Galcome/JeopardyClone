# Local Party Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only bachelor-party quiz app with host, display, and player buzzer routes.

**Architecture:** A Vite + React client is served by an Express server. Socket.IO keeps `/host`, `/display`, and `/join` synchronized against an in-memory game engine loaded from `game-data.json`.

**Tech Stack:** TypeScript, React, Vite, Express, Socket.IO, Vitest, Testing Library, Playwright CLI for browser verification.

---

## File Structure

- `package.json`: scripts and dependencies.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`: TypeScript, Vite, and test configuration.
- `index.html`: Vite app entry.
- `game-data.json`: default local game content.
- `server/index.ts`: Express + Socket.IO local server.
- `src/shared/types.ts`: shared game content, state, and socket event types.
- `src/shared/gameData.ts`: JSON validation and normalized board helpers.
- `src/shared/gameEngine.ts`: pure state transitions for rounds, clues, scoring, buzzers, wager tiles, and final challenge.
- `src/shared/network.ts`: browser socket client helpers.
- `src/main.tsx`, `src/App.tsx`: React entry and route switch.
- `src/components/*.tsx`: focused UI pieces for host, display, join, board, clue, setup, scoring, and media.
- `src/styles.css`: classic-adjacent visual system.
- `src/test/*.test.ts`: Vitest coverage for validation and engine behavior.
- `README.md`: local install/run and party-day instructions.

## Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`

- [ ] Add scripts: `dev`, `server`, `party`, `build`, `test`, and `typecheck`.
- [ ] Add dependencies: `@vitejs/plugin-react`, `typescript`, `vite`, `vitest`, `react`, `react-dom`, `express`, `socket.io`, `socket.io-client`, `qrcode`, `lucide-react`, and matching type packages.
- [ ] Run `npm install`.
- [ ] Run `npm test -- --run`; expected no tests or pass once test files exist.

### Task 2: Game Data And Types

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/gameData.ts`
- Create: `src/test/gameData.test.ts`
- Create: `game-data.json`

- [ ] Write failing tests that validate a complete game file, reject duplicate clue IDs, reject missing media fields, and normalize values for configured rounds.
- [ ] Run `npm test -- --run src/test/gameData.test.ts`; expected failure because validation does not exist.
- [ ] Implement shared types and `validateGameData(data: unknown): GameData`.
- [ ] Add default `game-data.json` with two rounds, hidden wager tiles, final challenge, and sample media references.
- [ ] Run the same test file; expected pass.

### Task 3: Game Engine

**Files:**
- Create: `src/shared/gameEngine.ts`
- Create: `src/test/gameEngine.test.ts`

- [ ] Write failing tests for team setup, clue selection, host-only answer reveal, score changes, manual score adjustment, buzzer lock/clear/reopen, special wager scoring, round transition, final wagers, and final scoring.
- [ ] Run `npm test -- --run src/test/gameEngine.test.ts`; expected failure because engine does not exist.
- [ ] Implement pure functions: `createInitialState`, `setTeams`, `selectClue`, `revealHostAnswer`, `openBuzzers`, `registerBuzz`, `clearBuzzers`, `markCorrect`, `markWrong`, `adjustScore`, `setSpecialWager`, `advanceRound`, `startFinal`, `setFinalWager`, and `resolveFinalTeam`.
- [ ] Run engine tests; expected pass.

### Task 4: Local Server And Socket Protocol

**Files:**
- Create: `server/index.ts`
- Create: `src/shared/network.ts`
- Modify: `src/shared/types.ts`

- [ ] Define typed socket events for host commands, player joins, display sync, and state broadcasts.
- [ ] Load and validate `game-data.json` at startup.
- [ ] Serve Vite in development and built static files in production.
- [ ] Broadcast the full public state after every command.
- [ ] Keep host-only details available only to authenticated host sockets.
- [ ] Print `/host`, `/display`, and `/join` URLs at startup.
- [ ] Run `npm run typecheck`; expected pass.

### Task 5: React Routes And Host UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/HostView.tsx`
- Create: `src/components/SetupPanel.tsx`
- Create: `src/components/Board.tsx`
- Create: `src/components/CluePanel.tsx`
- Create: `src/components/Scoreboard.tsx`
- Create: `src/components/MediaFrame.tsx`

- [ ] Implement route detection for `/host`, `/display`, and `/join`.
- [ ] Implement host PIN entry.
- [ ] Implement setup controls for team names.
- [ ] Implement board tile selection.
- [ ] Implement clue controls: show answer, open buzzers, mark correct, mark wrong, reopen, clear, return.
- [ ] Implement score adjustment.
- [ ] Implement special wager and final challenge controls.
- [ ] Run `npm run typecheck`; expected pass.

### Task 6: Display And Player UI

**Files:**
- Create: `src/components/DisplayView.tsx`
- Create: `src/components/JoinView.tsx`
- Modify: `src/components/Board.tsx`
- Modify: `src/components/CluePanel.tsx`
- Modify: `src/components/MediaFrame.tsx`

- [ ] Build clean display-only board, clue, transition, special wager, and final screens.
- [ ] Build mobile join screen with team selector, name field, and large buzzer button.
- [ ] Ensure display never renders correct answers or host controls.
- [ ] Run `npm run typecheck`; expected pass.

### Task 7: Styling And Party-Day Docs

**Files:**
- Create: `src/styles.css`
- Create: `README.md`
- Create: `public/media/.gitkeep`

- [ ] Add classic-adjacent blue/gold visual styling with distinct app title, labels, and transitions.
- [ ] Ensure host UI is dense and controller-like while display UI is clean and TV-readable.
- [ ] Add responsive mobile styling for `/join`.
- [ ] Document install, `npm run party`, display window setup, QR join, hotspot fallback, JSON editing, and media placement.
- [ ] Run `npm run build`; expected pass.

### Task 8: Verification And Commit

**Files:**
- Modify as needed based on verification findings.

- [ ] Run `npm test -- --run`; expected all tests pass.
- [ ] Run `npm run typecheck`; expected pass.
- [ ] Run `npm run build`; expected pass.
- [ ] Start `npm run party`.
- [ ] Use browser verification to open `/host`, `/display`, and `/join`.
- [ ] Verify host PIN, board reveal, private answer, buzzer registration, score update, display sync, and mobile join layout.
- [ ] Commit the complete build.

