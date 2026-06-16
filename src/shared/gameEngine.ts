import { findClue } from './gameData';
import type { GameData, GameState, Player, PublicGameState, Team } from './types';

type BuzzInput = Pick<Player, 'id' | 'name' | 'teamId'>;

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

function makeTeams(names: string[]): Team[] {
  return names.map((name, index) => ({
    id: `team-${index + 1}`,
    name,
    score: 0
  }));
}

function currentClueValue(state: GameState, game: GameData): number {
  if (!state.activeClue) return 0;
  if (state.activeClue.wager !== undefined) return state.activeClue.wager;
  const clue = findClue(game, state.activeClue.roundId, state.activeClue.categoryId, state.activeClue.clueId);
  return clue?.value ?? 0;
}

function updateTeamScore(state: GameState, teamId: string, delta: number): GameState {
  const next = cloneState(state);
  next.teams = next.teams.map((team) => (team.id === teamId ? { ...team, score: team.score + delta } : team));
  return next;
}

function ensureFinalResults(state: GameState): GameState {
  const next = cloneState(state);
  for (const team of next.teams) {
    next.finalResults[team.id] ??= { wager: null, correct: null, locked: false };
  }
  return next;
}

export function createInitialState(game: GameData): GameState {
  const teams = makeTeams(game.defaultTeams);
  return {
    screen: 'setup',
    currentRoundIndex: 0,
    teams,
    players: [],
    revealedCategoryIndex: -1,
    revealedClueIds: [],
    lockedOutTeamIds: [],
    controllingTeamId: null,
    activeClue: null,
    buzzersOpen: false,
    buzzes: [],
    finalPhase: 'idle',
    finalResults: Object.fromEntries(teams.map((team) => [team.id, { wager: null, correct: null, locked: false }]))
  };
}

export function setTeams(state: GameState, names: string[]): GameState {
  const next = cloneState(state);
  next.teams = makeTeams(names.filter((name) => name.trim().length > 0));
  next.finalResults = Object.fromEntries(
    next.teams.map((team) => [team.id, state.finalResults[team.id] ?? { wager: null, correct: null, locked: false }])
  );
  return next;
}

export function selectClue(
  state: GameState,
  game: GameData,
  roundId: string,
  categoryId: string,
  clueId: string
): GameState {
  const clue = findClue(game, roundId, categoryId, clueId);
  if (!clue) throw new Error(`Unknown clue: ${clueId}`);
  if (state.revealedClueIds.includes(clueId)) throw new Error(`Clue already revealed: ${clueId}`);

  const next = cloneState(state);
  next.screen = 'clue';
  next.activeClue = { roundId, categoryId, clueId, hostAnswerVisible: false, displayAnswerVisible: false };
  next.revealedClueIds = [...next.revealedClueIds, clueId];
  next.lockedOutTeamIds = [];
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = clue.special === 'wager' ? 'Wager Tile' : undefined;
  return next;
}

export function revealHostAnswer(state: GameState): GameState {
  if (!state.activeClue) return state;
  const next = cloneState(state);
  next.activeClue = { ...next.activeClue!, hostAnswerVisible: true };
  return next;
}

export function revealDisplayAnswer(state: GameState): GameState {
  if (!state.activeClue) return state;
  const next = cloneState(state);
  next.activeClue = { ...next.activeClue!, hostAnswerVisible: true, displayAnswerVisible: true };
  next.message = 'Answer revealed';
  return next;
}

export function openBuzzers(state: GameState): GameState {
  const next = cloneState(state);
  next.buzzersOpen = true;
  next.buzzes = [];
  next.message = 'Buzzers open';
  return next;
}

export function registerBuzz(state: GameState, player: BuzzInput): GameState {
  if (!state.buzzersOpen || state.buzzes.length > 0) return state;
  if (state.lockedOutTeamIds.includes(player.teamId)) return state;
  const team = state.teams.find((candidate) => candidate.id === player.teamId);
  if (!team) return state;

  const next = cloneState(state);
  next.buzzersOpen = false;
  next.buzzes = [
    {
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: team.name,
      at: Date.now()
    }
  ];
  next.message = `${player.name} buzzed for ${team.name}`;
  return next;
}

export function clearBuzzers(state: GameState): GameState {
  const next = cloneState(state);
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = undefined;
  return next;
}

export function markCorrect(state: GameState, game: GameData, teamId: string): GameState {
  let next = updateTeamScore(state, teamId, currentClueValue(state, game));
  next.screen = 'board';
  next.activeClue = null;
  next.buzzes = [];
  next.buzzersOpen = false;
  next.controllingTeamId = teamId;
  next.message = 'Correct';
  return next;
}

export function markWrong(state: GameState, game: GameData, teamId: string, reopenBuzzers: boolean): GameState {
  let next = updateTeamScore(state, teamId, -currentClueValue(state, game));
  next.buzzes = [];
  next.lockedOutTeamIds = [...next.lockedOutTeamIds, teamId];
  next.buzzersOpen = reopenBuzzers;
  next.message = reopenBuzzers ? 'Try another team' : 'Incorrect';
  return next;
}

export function returnToBoard(state: GameState): GameState {
  const next = cloneState(state);
  next.screen = 'board';
  next.activeClue = null;
  next.lockedOutTeamIds = [];
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = undefined;
  return next;
}

export function unrevealClue(state: GameState): GameState {
  if (!state.activeClue) return state;
  const next = cloneState(state);
  next.revealedClueIds = next.revealedClueIds.filter(id => id !== state.activeClue!.clueId);
  next.screen = 'board';
  next.activeClue = null;
  next.lockedOutTeamIds = [];
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = 'Clue cancelled';
  return next;
}

export function revealNextCategory(state: GameState, game: GameData): GameState {
  const next = cloneState(state);
  const round = game.rounds[next.currentRoundIndex];
  if (round) {
    const visibleCategoriesCount = round.categories.filter((cat) => !cat.hidden).length;
    if (next.revealedCategoryIndex < visibleCategoriesCount - 1) {
      next.revealedCategoryIndex += 1;
    }
  }
  return next;
}

export function adjustScore(state: GameState, teamId: string, delta: number): GameState {
  return updateTeamScore(state, teamId, delta);
}

export function setSpecialWager(state: GameState, wager: number): GameState {
  if (!state.activeClue) return state;
  const next = cloneState(state);
  next.activeClue = { ...next.activeClue!, wager: Math.max(0, Math.floor(wager)) };
  next.message = `Wager set: ${next.activeClue.wager}`;
  return next;
}

export function previousRound(state: GameState, game: GameData): GameState {
  const next = cloneState(state);
  if (next.screen === 'final' || next.screen === 'standings') {
    next.currentRoundIndex = game.rounds.length - 1;
    next.screen = 'board';
    next.activeClue = null;
    next.buzzersOpen = false;
    next.buzzes = [];
    next.message = undefined;
    return next;
  }
  
  if (next.currentRoundIndex > 0) {
    next.currentRoundIndex -= 1;
    next.screen = 'board';
    next.revealedCategoryIndex = -1;
    next.activeClue = null;
    next.controllingTeamId = null;
    next.lockedOutTeamIds = [];
    next.buzzersOpen = false;
    next.buzzes = [];
    next.message = undefined;
  }
  return next;
}

export function advanceRound(state: GameState, game: GameData): GameState {
  if (state.currentRoundIndex + 1 >= game.rounds.length) {
    return startFinal(state);
  }

  const next = cloneState(state);
  next.currentRoundIndex += 1;
  next.screen = 'round-transition';
  next.revealedCategoryIndex = -1;
  next.activeClue = null;
  next.controllingTeamId = null;
  next.lockedOutTeamIds = [];
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = game.rounds[next.currentRoundIndex].transitionTitle ?? game.rounds[next.currentRoundIndex].title;
  return next;
}

export function showCurrentBoard(state: GameState): GameState {
  const next = cloneState(state);
  next.screen = 'board';
  next.message = undefined;
  return next;
}

export function startFinal(state: GameState): GameState {
  const next = ensureFinalResults(state);
  next.screen = 'final';
  next.finalPhase = 'wagering';
  next.activeClue = null;
  next.controllingTeamId = null;
  next.lockedOutTeamIds = [];
  next.buzzersOpen = false;
  next.buzzes = [];
  next.message = 'Final Challenge';
  return next;
}

export function revealFinalClue(state: GameState): GameState {
  const next = cloneState(state);
  next.screen = 'final';
  next.finalPhase = 'clue';
  next.message = undefined;
  return next;
}

export function setFinalWager(state: GameState, teamId: string, wager: number): GameState {
  const next = ensureFinalResults(state);
  const normalizedWager = Math.max(0, Math.floor(wager));
  next.finalResults[teamId] = {
    wager: normalizedWager,
    correct: null,
    locked: false
  };
  return next;
}

export function resolveFinalTeam(state: GameState, teamId: string, correct: boolean): GameState {
  const result = state.finalResults[teamId];
  const wager = result?.wager ?? 0;
  let next = updateTeamScore(state, teamId, correct ? wager : -wager);
  next.finalResults[teamId] = { wager, correct, locked: true };
  next.finalPhase = Object.values(next.finalResults).every((teamResult) => teamResult.locked) ? 'complete' : 'scoring';
  next.screen = next.finalPhase === 'complete' ? 'standings' : 'final';
  return next;
}

export function addOrUpdatePlayer(state: GameState, player: Player): GameState {
  const next = cloneState(state);
  const existing = next.players.findIndex((candidate) => candidate.id === player.id);
  if (existing >= 0) next.players[existing] = player;
  else next.players.push(player);
  return next;
}

export function toPublicState(state: GameState): PublicGameState {
  const next = cloneState(state);
  if (next.activeClue) {
    next.activeClue.hostAnswerVisible = false;
  }
  return next as PublicGameState;
}
