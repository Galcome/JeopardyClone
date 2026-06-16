export type MediaType = 'image' | 'audio' | 'video';

export interface ClueMedia {
  type: MediaType;
  src: string;
  alt?: string;
  caption?: string;
}

export interface Clue {
  id: string;
  value: number;
  prompt: string;
  answer: string;
  notes?: string;
  media?: ClueMedia;
  special?: 'wager';
}

export interface Category {
  id: string;
  title: string;
  hidden?: boolean;
  clues: Clue[];
}

export interface Round {
  id: string;
  title: string;
  transitionTitle?: string;
  valuePrefix?: string;
  categories: Category[];
}

export interface FinalChallenge {
  category: string;
  prompt: string;
  answer: string;
  notes?: string;
  media?: ClueMedia;
}

export interface GameData {
  title: string;
  hostPin: string;
  defaultTeams: string[];
  rounds: Round[];
  finalChallenge: FinalChallenge;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

export type ScreenMode = 'setup' | 'board' | 'clue' | 'round-transition' | 'final' | 'standings';
export type FinalPhase = 'idle' | 'wagering' | 'clue' | 'scoring' | 'complete';

export interface Buzz {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  at: number;
}

export interface ActiveClue {
  roundId: string;
  categoryId: string;
  clueId: string;
  wager?: number;
  hostAnswerVisible: boolean;
  displayAnswerVisible: boolean;
  mediaVisible?: boolean;
}

export interface FinalTeamResult {
  wager: number | null;
  correct: boolean | null;
  locked: boolean;
}

export interface GameState {
  screen: ScreenMode;
  currentRoundIndex: number;
  teams: Team[];
  players: Player[];
  revealedCategoryIndex: number;
  revealedClueIds: string[];
  lockedOutTeamIds: string[];
  controllingTeamId: string | null;
  activeClue: ActiveClue | null;
  buzzersOpen: boolean;
  buzzes: Buzz[];
  finalPhase: FinalPhase;
  finalResults: Record<string, FinalTeamResult>;
  message?: string;
  timerStartedAt?: number | null;
  timerSeconds?: number;
}

export interface PublicGameState extends Omit<GameState, 'activeClue'> {
  activeClue: (ActiveClue & { hostAnswerVisible: false }) | null;
}

export interface HostStatePayload {
  game: GameData;
  state: GameState;
  joinUrl: string;
}

export interface PublicStatePayload {
  game: GameData;
  state: PublicGameState;
}

export interface HostAuthPayload {
  pin: string;
}

export interface JoinPayload {
  playerName: string;
  teamId: string;
}

export type HostCommand =
  | { type: 'set-teams'; names: string[] }
  | { type: 'show-board' }
  | { type: 'select-clue'; roundId: string; categoryId: string; clueId: string }
  | { type: 'show-answer' }
  | { type: 'reveal-answer-to-display' }
  | { type: 'open-buzzers' }
  | { type: 'clear-buzzers' }
  | { type: 'mark-correct'; teamId: string }
  | { type: 'mark-wrong'; teamId: string; reopen: boolean }
  | { type: 'return-board' }
  | { type: 'adjust-score'; teamId: string; delta: number }
  | { type: 'set-special-wager'; wager: number }
  | { type: 'advance-round' }
  | { type: 'previous-round' }
  | { type: 'unreveal-clue' }
  | { type: 'reveal-next-category' }
  | { type: 'save-state' }
  | { type: 'reset-game' }
  | { type: 'start-final' }
  | { type: 'reveal-final' }
  | { type: 'set-final-wager'; teamId: string; wager: number }
  | { type: 'resolve-final-team'; teamId: string; correct: boolean }
  | { type: 'test-sound'; soundName: string }
  | { type: 'start-timer'; seconds?: number }
  | { type: 'stop-timer' }
  | { type: 'stop-all-sounds' }
  | { type: 'reveal-media' }
  | { type: 'control-media'; action: 'play' | 'pause' | 'restart' };

export type ClientToServerEvents = {
  'host:auth': (payload: HostAuthPayload, callback: (result: { ok: boolean; message?: string }) => void) => void;
  'host:command': (command: HostCommand) => void;
  'host:update-game': (game: GameData, callback: (result: { ok: boolean; message?: string }) => void) => void;
  'player:join': (payload: JoinPayload, callback: (result: { ok: boolean; playerId?: string; message?: string }) => void) => void;
  'player:buzz': () => void;
  'state:request': () => void;
};

export type ServerToClientEvents = {
  'host:state': (payload: HostStatePayload) => void;
  'public:state': (payload: PublicStatePayload) => void;
  'server:message': (message: string) => void;
};

export type InterServerEvents = Record<string, never>;

export type SocketData = {
  isHost?: boolean;
  player?: Player;
};
