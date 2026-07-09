import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HostView } from '../components/HostView';
import { createInitialState, startFinal, toPublicState } from '../shared/gameEngine';
import type { AppSocket } from '../shared/network';
import type { GameData, HostStatePayload } from '../shared/types';

const game: GameData = {
  title: 'Test Game',
  hostPin: '4242',
  defaultTeams: ['Alpha', 'Beta'],
  rounds: [{ id: 'r1', title: 'Round', categories: [{ id: 'c1', title: 'Category', clues: [{ id: 'q1', value: 100, prompt: 'Question', answer: 'Answer' }] }] }],
  finalChallenge: { category: 'Final Category', prompt: 'Final prompt', answer: 'Final answer' }
};

const socket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
} as unknown as AppSocket;

describe('HostView final standings', () => {
  it('hides final scoring controls after the final is complete', () => {
    const state = startFinal(createInitialState(game));
    state.screen = 'standings';
    state.finalPhase = 'complete';
    state.finalResults['team-1'] = { wager: 100, correct: true, locked: true };
    state.finalResults['team-2'] = { wager: 100, correct: false, locked: true };
    const payload: HostStatePayload = { game, state, joinUrl: 'http://localhost/join' };
    const publicPayload = { ...payload, state: toPublicState(state) };

    render(
      <HostView
        publicPayload={publicPayload}
        hostPayload={payload}
        socket={socket}
        message={null}
        sendCommand={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Final Standings' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Correct' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Wrong' })).toHaveLength(1);
    expect(screen.queryByText('Final prompt')).not.toBeInTheDocument();
  });
});
