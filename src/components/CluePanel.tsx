import { useEffect, useState } from 'react';
import { Eye, MonitorUp, Play, RotateCcw, Square, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-react';
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
  const [selectedTeamId, setSelectedTeamId] = useState(() => state.buzzes[0]?.teamId ?? state.teams[0]?.id ?? '');

  useEffect(() => {
    if (state.buzzes[0]) {
      setSelectedTeamId(state.buzzes[0].teamId);
      return;
    }
    if (!state.teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(state.teams[0]?.id ?? '');
    }
  }, [selectedTeamId, state.buzzes, state.teams]);

  const [remaining, setRemaining] = useState<number | null>(null);
  const [playedSoundFor, setPlayedSoundFor] = useState<number | null>(null);

  useEffect(() => {
    if (!state.timerStartedAt || !state.timerSeconds) {
      setRemaining(null);
      return;
    }

    const total = state.timerSeconds;
    const startedAt = state.timerStartedAt;

    const updateTimer = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);

      if (left > 0) {
        requestAnimationFrame(updateTimer);
      } else {
        if (!hostMode && playedSoundFor !== startedAt) {
          setPlayedSoundFor(startedAt);
          const audio = new Audio('/sounds/buzz.mp3');
          audio.play().catch(() => {});
        }
      }
    };

    const animFrame = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animFrame);
  }, [state.timerStartedAt, state.timerSeconds, hostMode, playedSoundFor]);

  if (!active || !clue) {
    return <section className="clue-screen">No clue selected.</section>;
  }

  const isWager = clue.special === 'wager';
  const wagerSet = active.wager !== undefined;
  const showPrompt = !isWager || wagerSet || hostMode;

  return (
    <section className={hostMode ? 'clue-screen host-clue' : 'clue-screen'}>
      <div className="clue-main">
        {remaining !== null && (
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '20px',
            position: 'relative'
          }}>
            <div style={{
              width: `${(remaining / (state.timerSeconds ?? 5)) * 100}%`,
              height: '100%',
              background: remaining > 2 ? 'var(--gold, #ffd166)' : 'var(--red, #ef476f)',
              transition: 'width 0.1s linear',
              borderRadius: '4px'
            }} />
            {remaining === 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239, 71, 111, 0.2)',
                color: '#ef476f',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Time's Up!
              </div>
            )}
          </div>
        )}
        {isWager && !showPrompt ? (
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--gold)', textTransform: 'uppercase', textShadow: '0 4px 20px rgba(255, 209, 102, 0.4)' }}>Daily Double</h1>
        ) : (
          <>
            {isWager && <div className="special-banner">Daily Double</div>}
            <p className="clue-value">{wagerSet ? `Wager ${active.wager}` : `${clue.value}`}</p>
            <h1>{clue.prompt}</h1>
            <MediaFrame media={clue.media} />
          </>
        )}
        {!hostMode && state.buzzes[0] && (
          <div className="buzz-banner">
            {state.buzzes[0].playerName} for {state.buzzes[0].teamName}
          </div>
        )}
        {!hostMode && active.displayAnswerVisible && (
          <div className="display-answer">
            <span>Answer</span>
            <strong>{clue.answer}</strong>
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
            <button
              type="button"
              disabled={!active.hostAnswerVisible || active.displayAnswerVisible}
              onClick={() => sendCommand({ type: 'reveal-answer-to-display' })}
            >
              <MonitorUp size={18} /> Reveal to Display
            </button>
          </div>

          <div className="control-group">
            <button type="button" onClick={() => sendCommand({ type: 'open-buzzers' })}>
              <Volume2 size={18} /> Open Buzzers
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'clear-buzzers' })}>
              <RotateCcw size={18} /> Clear Buzzers
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => sendCommand({ type: 'start-timer' })} 
                disabled={remaining !== null && remaining > 0}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem', padding: '6px' }}
              >
                <Play size={14} /> Start Timer
              </button>
              <button 
                type="button" 
                onClick={() => sendCommand({ type: 'stop-timer' })}
                disabled={remaining === null}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem', padding: '6px' }}
              >
                <Square size={14} /> Reset Timer
              </button>
            </div>
            <div className="buzz-status">{state.buzzersOpen ? 'Buzzers open' : state.buzzes[0]?.playerName ?? 'Buzzers closed'}</div>
          </div>

          <Scoreboard teams={state.teams} selectedTeamId={selectedTeamId} onSelectTeam={setSelectedTeamId} />

          <div className="control-grid">
            <button type="button" disabled={!selectedTeamId} onClick={() => sendCommand({ type: 'mark-correct', teamId: selectedTeamId })}>
              <ThumbsUp size={18} /> Correct
            </button>
            <button type="button" disabled={!selectedTeamId} onClick={() => sendCommand({ type: 'mark-wrong', teamId: selectedTeamId, reopen: true })}>
              <ThumbsDown size={18} /> Wrong & Reopen
            </button>
            <button type="button" disabled={!selectedTeamId} onClick={() => sendCommand({ type: 'mark-wrong', teamId: selectedTeamId, reopen: false })}>
              <ThumbsDown size={18} /> Wrong
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'unreveal-clue' })}>
              Cancel (Unreveal)
            </button>
            <button type="button" onClick={() => sendCommand({ type: 'return-board' })}>
              Return (Played)
            </button>
          </div>
        </aside>
      )}
    </section>
  );
}
