import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import {
  addOrUpdatePlayer,
  adjustScore,
  advanceRound,
  clearBuzzers,
  createInitialState,
  markCorrect,
  markWrong,
  openBuzzers,
  registerBuzz,
  resolveFinalTeam,
  revealDisplayAnswer,
  returnToBoard,
  unrevealClue,
  revealNextCategory,
  revealFinalClue,
  revealHostAnswer,
  selectClue,
  previousRound,
  setFinalWager,
  setSpecialWager,
  setTeams,
  showCurrentBoard,
  startFinal,
  toPublicState
} from '../src/shared/gameEngine';
import { validateGameData } from '../src/shared/gameData';
import type {
  ClientToServerEvents,
  GameState,
  HostCommand,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../src/shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getLocalAddress(): string {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return 'localhost';
}

function loadGame() {
  const raw = readFileSync(path.join(rootDir, 'game-data.json'), 'utf8');
  return validateGameData(JSON.parse(raw));
}

function loadSavedState(): GameState | null {
  const stateFile = path.join(rootDir, 'game-state.json');
  if (existsSync(stateFile)) {
    try {
      const raw = readFileSync(stateFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load saved state', e);
    }
  }
  return null;
}

let game = loadGame();
let state: GameState = loadSavedState() ?? showCurrentBoard(createInitialState(game));
const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer);
const localAddress = getLocalAddress();
const baseUrl = `http://${localAddress}:${port}`;
const joinUrl = `${baseUrl}/join`;

function hostPayload() {
  return { game, state, joinUrl };
}

function publicPayload() {
  return { game, state: toPublicState(state), joinUrl };
}

function emitState() {
  io.emit('public:state', publicPayload());
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.isHost) socket.emit('host:state', hostPayload());
  }
}

function applyCommand(command: HostCommand) {
  switch (command.type) {
    case 'set-teams':
      state = setTeams(state, command.names);
      break;
    case 'show-board':
      state = showCurrentBoard(state);
      break;
    case 'select-clue':
      state = selectClue(state, game, command.roundId, command.categoryId, command.clueId);
      break;
    case 'show-answer':
      state = revealHostAnswer(state);
      break;
    case 'reveal-answer-to-display':
      state = revealDisplayAnswer(state);
      break;
    case 'open-buzzers':
      state = openBuzzers(state);
      state.timerStartedAt = Date.now();
      state.timerSeconds = 5;
      break;
    case 'clear-buzzers':
      state = clearBuzzers(state);
      state.timerStartedAt = null;
      break;
    case 'mark-correct':
      state = markCorrect(state, game, command.teamId);
      state.timerStartedAt = null;
      break;
    case 'mark-wrong':
      state = markWrong(state, game, command.teamId, command.reopen);
      state.timerStartedAt = null;
      break;
    case 'return-board':
      state = returnToBoard(state);
      state.timerStartedAt = null;
      break;
    case 'unreveal-clue':
      state = unrevealClue(state);
      break;
    case 'reveal-next-category':
      state = revealNextCategory(state, game);
      break;
    case 'save-state':
      writeFileSync(path.join(rootDir, 'game-state.json'), JSON.stringify(state, null, 2), 'utf-8');
      state = { ...state, message: 'Game progress saved' };
      break;
    case 'reset-game':
      const resetTeams = state.teams.map((t) => ({ ...t, score: 0 }));
      state = showCurrentBoard(createInitialState(game, resetTeams));
      state.message = 'Game completely restarted';
      break;
    case 'adjust-score':
      state = adjustScore(state, command.teamId, command.delta);
      break;
    case 'set-special-wager':
      state = setSpecialWager(state, command.wager);
      break;
    case 'advance-round':
      state = advanceRound(state, game);
      break;
    case 'previous-round':
      state = previousRound(state, game);
      break;
    case 'start-final':
      state = startFinal(state);
      break;
    case 'reveal-final':
      state = revealFinalClue(state);
      break;
    case 'set-final-wager':
      state = setFinalWager(state, command.teamId, command.wager);
      break;
    case 'resolve-final-team':
      state = resolveFinalTeam(state, command.teamId, command.correct);
      break;
    case 'test-sound':
      break;
    case 'start-timer':
      state.timerStartedAt = Date.now();
      state.timerSeconds = command.seconds ?? 5;
      break;
    case 'stop-timer':
      state.timerStartedAt = null;
      break;
    case 'stop-all-sounds':
      break;
    case 'reveal-media':
      if (state.activeClue) {
        state.activeClue = { ...state.activeClue, mediaVisible: true };
      }
      break;
    case 'control-media':
      break;
    case 'toggle-qr':
      state.showQR = !state.showQR;
      break;
  }
}

io.on('connection', (socket) => {
  socket.emit('public:state', publicPayload());

  socket.on('state:request', () => {
    socket.emit('public:state', publicPayload());
    if (socket.data.isHost) socket.emit('host:state', hostPayload());
  });

  socket.on('host:auth', (payload, callback) => {
    if (payload.pin === game.hostPin) {
      socket.data.isHost = true;
      callback({ ok: true });
      socket.emit('host:state', hostPayload());
      return;
    }
    callback({ ok: false, message: 'Incorrect PIN' });
  });

  socket.on('host:command', (command) => {
    if (!socket.data.isHost) {
      socket.emit('server:message', 'Host PIN required');
      return;
    }

    try {
      applyCommand(command);

      if (command.type === 'mark-correct') io.emit('play-sound', 'correct');
      if (command.type === 'mark-wrong') io.emit('play-sound', 'wrong');
      if (command.type === 'select-clue' && state.message === 'Wager Tile') io.emit('play-sound', 'daily_double');
      if (command.type === 'start-final') io.emit('play-sound', 'final_jeopardy');
      if (command.type === 'test-sound') io.emit('play-sound', command.soundName);
      if (command.type === 'stop-all-sounds') io.emit('stop-all-sounds');
      if (command.type === 'control-media') io.emit('control-media', command.action);

      emitState();
      try {
        writeFileSync(path.join(rootDir, 'game-state.json'), JSON.stringify(state, null, 2), 'utf-8');
      } catch (e) {
        console.error('Auto-save failed', e);
      }
    } catch (error) {
      socket.emit('server:message', error instanceof Error ? error.message : 'Command failed');
    }
  });

  socket.on('host:update-game', (newGame, callback) => {
    if (!socket.data.isHost) {
      callback({ ok: false, message: 'Host PIN required' });
      return;
    }

    try {
      const validatedGame = validateGameData(newGame);
      writeFileSync(path.join(rootDir, 'game-data.json'), JSON.stringify(validatedGame, null, 2), 'utf-8');
      game = validatedGame;
      emitState();
      callback({ ok: true });
    } catch (error) {
      console.error(error);
      callback({ ok: false, message: error instanceof Error ? error.message : 'Failed to update game data' });
    }
  });

  socket.on('player:join', (payload, callback) => {
    const team = state.teams.find((candidate) => candidate.id === payload.teamId);
    if (!team) {
      callback({ ok: false, message: 'Choose a valid team' });
      return;
    }

    const player = {
      id: socket.id,
      name: payload.playerName.trim() || 'Player',
      teamId: team.id
    };
    socket.data.player = player;
    state = addOrUpdatePlayer(state, player);
    callback({ ok: true, playerId: player.id });
    emitState();
  });

  socket.on('player:buzz', () => {
    if (!socket.data.player) {
      socket.emit('server:message', 'Join a team before buzzing');
      return;
    }
    const prevBuzzCount = state.buzzes.length;
    state = registerBuzz(state, socket.data.player);
    if (state.buzzes.length > prevBuzzCount) {
      io.emit('play-sound', 'buzz');
      state.timerStartedAt = null;
    }
    emitState();
  });

  socket.on('disconnect', () => {
    if (socket.data.player) {
      const playerId = socket.data.player.id;
      state = {
        ...state,
        players: state.players.filter(p => p.id !== playerId)
      };
      emitState();
      try {
        writeFileSync(path.join(rootDir, 'game-state.json'), JSON.stringify(state, null, 2), 'utf-8');
      } catch (e) {}
    }
  });
});

if (isProduction) {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, '0.0.0.0', () => {
  const localhost = `http://localhost:${port}`;
  console.log('');
  console.log(`${game.title} is running locally`);
  console.log(`Host:    ${localhost}/host`);
  console.log(`Display: ${localhost}/display`);
  console.log(`Join:    ${joinUrl}`);
  console.log('');
});
