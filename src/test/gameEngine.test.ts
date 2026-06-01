import { describe, expect, it } from 'vitest';
import type { GameData } from '../shared/types';
import {
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
  revealHostAnswer,
  selectClue,
  setFinalWager,
  setSpecialWager,
  setTeams,
  startFinal
} from '../shared/gameEngine';

const game: GameData = {
  title: 'After Hours Answers',
  hostPin: '4242',
  defaultTeams: ['Alpha', 'Beta'],
  rounds: [
    {
      id: 'r1',
      title: 'Opening',
      valuePrefix: '$',
      categories: [
        {
          id: 'cat',
          title: 'Category',
          clues: [
            { id: 'c1', value: 200, prompt: 'Prompt', answer: 'Answer' },
            { id: 'w1', value: 400, prompt: 'Wager prompt', answer: 'Wager answer', special: 'wager' }
          ]
        }
      ]
    },
    {
      id: 'r2',
      title: 'Doubled',
      categories: [
        {
          id: 'cat2',
          title: 'Category 2',
          clues: [{ id: 'c2', value: 800, prompt: 'Prompt 2', answer: 'Answer 2' }]
        }
      ]
    }
  ],
  finalChallenge: {
    category: 'Final',
    prompt: 'Final prompt',
    answer: 'Final answer'
  }
};

describe('game engine', () => {
  it('creates teams from defaults and lets the host rename them', () => {
    const state = setTeams(createInitialState(game), ['Groomsmen', 'Cousins']);

    expect(state.teams).toEqual([
      { id: 'team-1', name: 'Groomsmen', score: 0 },
      { id: 'team-2', name: 'Cousins', score: 0 }
    ]);
  });

  it('selects a clue without revealing the host answer', () => {
    const state = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');

    expect(state.screen).toBe('clue');
    expect(state.activeClue).toMatchObject({ clueId: 'c1', hostAnswerVisible: false });
    expect(state.revealedClueIds).toContain('c1');
  });

  it('reveals the answer only in host state', () => {
    const selected = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');
    const state = revealHostAnswer(selected);

    expect(state.activeClue?.hostAnswerVisible).toBe(true);
    expect(state.activeClue?.displayAnswerVisible).toBe(false);
  });

  it('reveals the answer to the display only after the host chooses to share it', () => {
    const selected = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');
    const hostVisible = revealHostAnswer(selected);
    const displayVisible = revealDisplayAnswer(hostVisible);

    expect(displayVisible.activeClue?.hostAnswerVisible).toBe(true);
    expect(displayVisible.activeClue?.displayAnswerVisible).toBe(true);
  });

  it('locks the first buzzer and ignores later buzzes until reopened', () => {
    let state = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');
    state = openBuzzers(state);
    state = registerBuzz(state, { id: 'p1', name: 'Joey', teamId: 'team-1' });
    state = registerBuzz(state, { id: 'p2', name: 'Mark', teamId: 'team-2' });

    expect(state.buzzersOpen).toBe(false);
    expect(state.buzzes).toHaveLength(1);
    expect(state.buzzes[0].playerName).toBe('Joey');
  });

  it('can clear and reopen buzzers after a wrong answer', () => {
    let state = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');
    state = openBuzzers(state);
    state = registerBuzz(state, { id: 'p1', name: 'Joey', teamId: 'team-1' });
    state = markWrong(state, game, 'team-1', true);

    expect(state.teams[0].score).toBe(-200);
    expect(state.buzzersOpen).toBe(true);
    expect(state.buzzes).toEqual([]);

    state = clearBuzzers(state);
    expect(state.buzzersOpen).toBe(false);
  });

  it('awards selected clue value and returns to the board', () => {
    let state = selectClue(createInitialState(game), game, 'r1', 'cat', 'c1');
    state = markCorrect(state, game, 'team-2');

    expect(state.screen).toBe('board');
    expect(state.activeClue).toBeNull();
    expect(state.teams[1].score).toBe(200);
  });

  it('supports manual score adjustment', () => {
    const state = adjustScore(createInitialState(game), 'team-1', 125);

    expect(state.teams[0].score).toBe(125);
  });

  it('scores hidden wager tiles by the host-entered wager', () => {
    let state = selectClue(createInitialState(game), game, 'r1', 'cat', 'w1');
    state = setSpecialWager(state, 900);
    state = markCorrect(state, game, 'team-1');

    expect(state.teams[0].score).toBe(900);
  });

  it('advances rounds and then starts final challenge', () => {
    let state = advanceRound(createInitialState(game), game);
    expect(state.currentRoundIndex).toBe(1);
    expect(state.screen).toBe('round-transition');

    state = advanceRound(state, game);
    expect(state.screen).toBe('final');
    expect(state.finalPhase).toBe('wagering');
  });

  it('locks final wagers and resolves final scores', () => {
    let state = startFinal(createInitialState(game));
    state = adjustScore(state, 'team-1', 1000);
    state = setFinalWager(state, 'team-1', 700);
    state = resolveFinalTeam(state, 'team-1', true);
    state = setFinalWager(state, 'team-2', 500);
    state = resolveFinalTeam(state, 'team-2', false);

    expect(state.teams[0].score).toBe(1700);
    expect(state.teams[1].score).toBe(-500);
    expect(state.finalResults['team-1']).toMatchObject({ wager: 700, correct: true, locked: true });
  });
});
