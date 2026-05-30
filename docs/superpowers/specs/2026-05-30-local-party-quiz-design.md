# Local Party Quiz Design

## Purpose

Build a local-only, web-based bachelor-party quiz game with a familiar category-and-value board structure, host-controlled gameplay, optional phone buzzers, local media support, and a distinct visual identity that does not copy Jeopardy branding, language, typography, or exact presentation.

The app is intended to be used once at a private event, saved in GitHub mainly so it can be transferred to a laptop. It must not require cloud services during gameplay.

## Recommended Stack

Use a Vite + React frontend served by a local Express server with Socket.IO for realtime state sync.

This stack gives us:

- A polished local web UI for host, display, and players.
- Reliable realtime buzzer and game-state synchronization.
- A simple one-command party-day start script.
- Local-only operation with no database or external service requirement.

## Routes

### `/host`

The host screen runs on the laptop. It is protected by a simple host PIN.

The host screen provides:

- Game setup.
- Team creation and renaming, with four teams as the default.
- Game-data validation status.
- Board control.
- Clue reveal control.
- Host-only answer reveal behind a **Show Answer** action.
- Score controls.
- Buzzer controls.
- Round transition controls.
- Special wager tile controls.
- Final round wager and scoring controls.
- Manual fallback controls if phone buzzers are not usable.

The host can see correct answers privately. The TV display does not show answers by default.

### `/display`

The display screen is intended for the TV/projector. It is controlled entirely from `/host`.

The display screen shows:

- The current board.
- Selected clue prompt and local media.
- Round transitions.
- Buzzer status when appropriate.
- Final round screens.
- Final scores.

The display screen must not show host-only controls, correct answers, JSON details, or PIN-related UI.

### `/join`

The player screen is intended for phones or other devices on the same local network.

The join screen provides:

- Team selection or player name entry.
- A large buzzer button.
- Buzzer locked/open/accepted status.
- Lightweight styling for fast loading over local Wi-Fi or hotspot.

Players do not need accounts. The server treats connections as temporary party-session clients.

## Local Networking

The primary setup assumes the laptop and phones are on the same Wi-Fi network. The app should also work if the host creates a hotspot and devices join it.

The server should print:

- Host URL.
- Display URL.
- Join URL using the laptop's local network address when possible.

The host UI should also show a QR code for `/join`.

If network buzzers fail because the venue Wi-Fi blocks device-to-device traffic, the host can continue with manual scoring and buzz decisions from `/host`.

## Game State

The Express server is the source of truth for live game state.

State includes:

- Current screen mode.
- Current round.
- Current selected clue.
- Revealed tiles.
- Teams and scores.
- Player connections.
- Buzzer open/closed state.
- Buzz order.
- Active special wager tile state.
- Final round phase.
- Final wagers.
- Final correctness and final scores.

Live state can remain in memory for the session. Persistent save/load is not required for the first version.

## Content Model

Game content lives in a local `game-data.json` file.

The JSON defines:

- Game title and visual theme metadata.
- Host PIN default.
- Default team names.
- Rounds.
- Categories.
- Clues.
- Values.
- Prompt text.
- Correct answer.
- Optional host notes.
- Hidden special wager tiles.
- Round transition labels.
- Final round category, prompt, answer, and media.

The JSON can define any number of rounds. The default content shape should support an opening round, a doubled-stakes round, and a final challenge.

## Media

Clues can include local media:

- Images.
- Audio clips.
- Video clips.

Media files live under `public/media/` and are referenced from `game-data.json` with local relative paths.

The display screen shows clue media. The host screen also shows the clue media, plus answer and control UI. For video and audio clips, host controls should trigger playback behavior on the display as much as practical through Socket.IO events.

The app does not fetch copyrighted media or external assets. It only supports playback of local files the user places on the laptop.

## Board And Clue Flow

The board uses category headers and value tiles. Selected clues become unavailable after use.

When the host selects a clue:

1. The display shows the clue prompt and media.
2. The host sees the same prompt/media plus controls.
3. The answer remains hidden on the host screen until the host clicks **Show Answer**.
4. The host can open buzzers.
5. The first buzzer locks in by default.
6. The host decides whether to mark correct, mark wrong, reopen buzzers, clear buzzers, award no points, or return to the board.

Scoring is host-controlled. The host can also manually adjust team scores at any time.

## Hidden Special Wager Tiles

Special wager tiles are hidden on the board until selected.

When selected:

1. The display enters a custom reveal state that does not use copied show terminology.
2. The host chooses or confirms the wager.
3. The clue proceeds like a normal clue.
4. The host applies correct or incorrect scoring based on the wager.

Suggested UI language: **Wager Tile**, **Set Wager**, **Reveal Clue**.

## Round Transitions

Rounds are configured in `game-data.json`. The host triggers movement between rounds.

The default game should include:

- Opening round.
- Doubled-stakes round.
- Final challenge.

The transition UI should feel theatrical but use custom text and motion. It should not use the exact Jeopardy round names unless the user deliberately puts those words in their private JSON content.

## Final Challenge

The final round supports in-app wagers.

Flow:

1. Host starts final challenge.
2. Teams submit or host enters wagers.
3. Wagers lock.
4. Display reveals final category and clue.
5. Host can reveal the answer privately on `/host`.
6. Host marks each team correct or incorrect.
7. Scores update.
8. Display shows final standings.

Team-written responses are optional for the first version. The host can decide correctness verbally and enter results.

## Visual Direction

Use a classic-adjacent visual style:

- Deep blue board.
- Gold/yellow values.
- Strong category blocks.
- Large readable clue screens.
- High contrast for TV readability.
- Distinct custom typography.
- Distinct app title and UI labels.
- Custom transitions and wording.

The design should be familiar enough that guests understand the format instantly, while avoiding copied branding, exact fonts, exact colors, exact sound effects, exact language, or show-specific names.

## Party-Day Setup

The intended setup:

1. Clone or download the repo onto the laptop.
2. Run a single command, likely `npm run party`.
3. Open `/host` on the laptop.
4. Open `/display` in another browser window and drag it to the TV.
5. Players scan a QR code or type the join URL for `/join`.
6. If local-network buzzers do not work, use hotspot or host-controlled manual mode.

## Testing Strategy

Automated tests should cover:

- Game-data validation.
- Board clue selection.
- Revealed tile tracking.
- Score changes.
- Manual score adjustment.
- Buzzer locking and clearing.
- Mark-wrong and reopen flow.
- Hidden special wager behavior.
- Final wager validation.
- Final scoring.

Browser verification should cover:

- `/host` loads and gates by PIN.
- `/display` loads without host-only data.
- `/join` loads on a narrow/mobile viewport.
- Host actions update display state.
- A player buzz appears on host and display.

## Out Of Scope For First Version

- Cloud deployment.
- User accounts.
- Database persistence.
- Online multiplayer across the internet.
- Automated content authoring UI.
- Fetching external videos or images.
- Exact Jeopardy branding or copied show assets.

