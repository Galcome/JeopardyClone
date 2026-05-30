import { Eye, RotateCcw, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-react';
import { findClue } from '../shared/gameData';
import type { GameData, GameState, HostCommand } from '../shared/types';
import { MediaFrame } from './MediaFrame';
import { Scoreboard } from './Scoreboard';

interface CluePanelProps {
  game: GameData;
  state: GameState;
  hostMode: boolean;
  sendCommand?: (command: HostCommand) => void;
}

export function CluePanel({ game, state, hostMode, sendCommand }: CluePanelProps): JSX.Element {
  const active = state.activeClue;
  const clue = active ? findClue(game, active.roundId, active.categoryId, active.clueId) : null;
  const selectedTeamId = state.buzzes[0]?.teamId ?? state.teams[0]?.id;

  if (!active || !clue) {
    return <section className="clue-screen">No clue selected.</section>;
  }

  return (
    <section className={hostMode ? 'clue-screen host-clue' : 'clue-screen'}>
      <div className="clue-main">
        {clue.special === 'wager' && <div className="special-banner">Wager Tile</div>}
        <p className="clue-value">{active.wager ? `Wager ${active.wager}` : `${clue.value}`}</p>
        <h1>{clue.prompt}</h1>
        <MediaFrame media={clue.media} />
        {!hostMode && state.buzzes[0] && (
          <div className="buzz-banner">
            {state.buzzes[0].playerName} for {state.buzzes[0].teamName}
          </div>
        )}
      </div>

      {hostMode && sendCommand && (
        <aside className="host-controls">
          {clue.special === 'wager' && (
            <div className="control-group">
              <label htmlFor="wager">Set wager</label>
              <input
                id="wager"
                type="number"
                min="0"
                defaultValue={active.wager ?? clue.value}
                onBlur={(event) => sendCommand({ type: 'set-special-wager', wager: Number(event.currentTarget.value) })}
              />
            </div>
          )}

          <div className="control-group">
            <button type="button" onClick={() => sendCommand({ type: 'show-answer' })}>
              <Eye size={18} /> Show Answer
            </button>
            {active.hostAnswerVisible && (
              <div className="answer-box">
                <span>Accepted answer</span>
                <strong>{clue.answer}</strong>
                {clue.notes && <p>{clue.notes}</p>}
              </div>
            )}
          </div>

          <div className="control-group">
            <button type="button" onClick={() => sendCommand({ type: 'open-buzzers' })}>
              <Volume2 size={18} /> Open Buzzers
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'clear-buzzers' })}>
              <RotateCcw size={18} /> Clear Buzzers
            </button>
            <div className="buzz-status">{state.buzzersOpen ? 'Buzzers open' : state.buzzes[0]?.playerName ?? 'Buzzers closed'}</div>
          </div>

          <Scoreboard teams={state.teams} selectedTeamId={selectedTeamId} />

          <div className="control-grid">
            <button type="button" onClick={() => sendCommand({ type: 'mark-correct', teamId: selectedTeamId })}>
              <ThumbsUp size={18} /> Correct
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'mark-wrong', teamId: selectedTeamId, reopen: true })}>
              <ThumbsDown size={18} /> Wrong & Reopen
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'mark-wrong', teamId: selectedTeamId, reopen: false })}>
              <ThumbsDown size={18} /> Wrong
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'return-board' })}>
              Return
            </button>
          </div>
        </aside>
      )}
    </section>
  );
}

