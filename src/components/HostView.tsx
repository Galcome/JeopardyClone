import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Gamepad2, Lock, MonitorUp, Trophy, Volume2 } from 'lucide-react';
import type { AppSocket } from '../shared/network';
import type { HostCommand, HostStatePayload, PublicStatePayload } from '../shared/types';
import { Board } from './Board';
import { CluePanel } from './CluePanel';
import { Scoreboard } from './Scoreboard';
import { SetupPanel } from './SetupPanel';
import { MediaFrame } from './MediaFrame';
import { EditorPanel } from './EditorPanel';

interface HostViewProps {
  publicPayload: PublicStatePayload;
  hostPayload: HostStatePayload | null;
  socket: AppSocket;
  message: string | null;
  sendCommand: (command: HostCommand) => void;
}

export function HostView({ publicPayload, hostPayload, socket, message, sendCommand }: HostViewProps): JSX.Element {
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorError, setEditorError] = useState<string>();
  const [qr, setQr] = useState<string>('');
  const payload = hostPayload ?? publicPayload;
  const { game, state } = payload;
  const round = game.rounds[state.currentRoundIndex] ?? game.rounds[0];

  useEffect(() => {
    const joinUrl = hostPayload?.joinUrl ?? `${window.location.origin}/join`;
    QRCode.toDataURL(joinUrl, { margin: 1, width: 160 }).then(setQr).catch(() => setQr(''));
  }, [hostPayload?.joinUrl]);

  function authenticate() {
    socket.emit('host:auth', { pin }, (result) => {
      setAuthError(result.ok ? null : result.message ?? 'Incorrect PIN');
    });
  }

  if (!hostPayload) {
    return (
      <main className="host-login">
        <section className="login-card">
          <Lock size={34} />
          <h1>{game.title}</h1>
          <p>Enter the host PIN to control the board.</p>
          <input value={pin} onChange={(event) => setPin(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && authenticate()} autoFocus />
          <button type="button" onClick={authenticate}>Unlock Host</button>
          {authError && <p className="error-text">{authError}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="host-layout">
      <header className="host-header">
        <div>
          <p className="eyebrow">Host Controller</p>
          <h1>{game.title}</h1>
        </div>
        <div className="host-links">
          <a href="/display" target="_blank" rel="noreferrer"><MonitorUp size={16} /> Display</a>
          <a href="/join" target="_blank" rel="noreferrer"><Gamepad2 size={16} /> Join</a>
        </div>
      </header>

      <aside className="host-sidebar">
        <Scoreboard teams={state.teams} players={state.players} selectedTeamId={state.controllingTeamId ?? undefined} onAdjust={(teamId, delta) => sendCommand({ type: 'adjust-score', teamId, delta })} />
        <div className="round-navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <button type="button" disabled={state.currentRoundIndex === 0 && state.screen !== 'final' && state.screen !== 'standings'} onClick={() => sendCommand({ type: 'previous-round' })}>Previous Round</button>
          <button type="button" disabled={state.screen === 'final' || state.screen === 'standings'} onClick={() => sendCommand({ type: 'advance-round' })}>Advance Round</button>
          <button type="button" onClick={() => setIsEditing(!isEditing)} style={{ marginTop: '1rem' }}>{isEditing ? 'Close Editor' : 'Edit Game Data'}</button>
        </div>
        <div className="game-management" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <button type="button" onClick={() => sendCommand({ type: 'save-state' })}>Save Progress</button>
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('Are you sure you want to completely restart the game? This will reset all progress and zero out all team scores.')) {
                sendCommand({ type: 'reset-game' });
              }
            }}
          >
            Restart Game
          </button>
        </div>
        <div className="sound-board" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
            <Volume2 size={16} />
            <span>SFX Soundboard</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => sendCommand({ type: 'test-sound', soundName: 'correct' })}>Correct</button>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => sendCommand({ type: 'test-sound', soundName: 'wrong' })}>Wrong</button>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => sendCommand({ type: 'test-sound', soundName: 'daily_double' })}>Daily Double</button>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => sendCommand({ type: 'test-sound', soundName: 'final_jeopardy' })}>Final Theme</button>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px', gridColumn: 'span 2' }} onClick={() => sendCommand({ type: 'test-sound', soundName: 'buzz' })}>Buzzer SFX</button>
            <button type="button" style={{ fontSize: '0.75rem', padding: '6px', gridColumn: 'span 2', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => sendCommand({ type: 'stop-all-sounds' })}>🛑 Stop All Sounds</button>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '2px' }}>
            Sounds play on the <strong>Display</strong> screen
          </span>
        </div>
        <div className="join-card">
          {qr && <img src={qr} alt="Join QR code" />}
          <span>{hostPayload.joinUrl}</span>
        </div>
        {message && <div className="notice">{message}</div>}
      </aside>

      <section className="host-stage" style={{ display: isEditing ? 'none' : 'block' }}>
        {state.screen === 'clue' && <CluePanel game={game} state={state} hostMode sendCommand={sendCommand} />}

        {(state.screen === 'board' || state.screen === 'setup') && (
          <>
            <SetupPanel game={game} teams={state.teams} sendCommand={sendCommand} />
            <Board
              game={game}
              round={{ ...round, categories: round.categories.filter(c => !c.hidden) }}
              revealedCategoryIndex={state.revealedCategoryIndex}
              revealedClueIds={state.revealedClueIds}
              onSelect={(roundId, categoryId, clueId) => sendCommand({ type: 'select-clue', roundId, categoryId, clueId })}
            />
            <div className="round-actions">
              {state.revealedCategoryIndex < round.categories.filter(c => !c.hidden).length - 1 && (
                <button type="button" onClick={() => sendCommand({ type: 'reveal-next-category' })}>Reveal Next Category</button>
              )}
              <button type="button" onClick={() => sendCommand({ type: 'start-final' })}>Start Final</button>
            </div>
          </>
        )}

        {state.screen === 'round-transition' && (
          <section className="transition-panel">
            <p className="eyebrow">Next up</p>
            <h2>{round.transitionTitle ?? round.title}</h2>
            <button type="button" onClick={() => sendCommand({ type: 'show-board' })}>Show Board</button>
          </section>
        )}

        {(state.screen === 'final' || state.screen === 'standings') && (
          <section className="final-host">
            <p className="eyebrow">Final Challenge</p>
            <h2>{game.finalChallenge.category}</h2>
            {state.finalPhase === 'wagering' && (
              <div className="final-grid">
                {state.teams.map((team) => (
                  <label key={team.id}>
                    {team.name} wager
                    <input
                      type="number"
                      min="0"
                      defaultValue={state.finalResults[team.id]?.wager ?? 0}
                      onBlur={(event) => sendCommand({ type: 'set-final-wager', teamId: team.id, wager: Number(event.currentTarget.value) })}
                    />
                  </label>
                ))}
                <button type="button" onClick={() => sendCommand({ type: 'reveal-final' })}>Reveal Final Clue</button>
              </div>
            )}
            {state.finalPhase !== 'wagering' && (
              <>
                <h3>{game.finalChallenge.prompt}</h3>
                <MediaFrame media={game.finalChallenge.media} />
                <div className="answer-box always-visible">
                  <span>Accepted answer</span>
                  <strong>{game.finalChallenge.answer}</strong>
                  {game.finalChallenge.notes && <p>{game.finalChallenge.notes}</p>}
                </div>
                <div className="final-results">
                  {state.teams.map((team) => (
                    <div key={team.id} className="final-team-row">
                      <span>{team.name}</span>
                      <span>Wager {state.finalResults[team.id]?.wager ?? 0}</span>
                      <button type="button" onClick={() => sendCommand({ type: 'resolve-final-team', teamId: team.id, correct: true })}>Correct</button>
                      <button type="button" onClick={() => sendCommand({ type: 'resolve-final-team', teamId: team.id, correct: false })}>Wrong</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {state.screen === 'standings' && (
          <section className="standings">
            <Trophy size={42} />
            <h2>Final Standings</h2>
            <Scoreboard teams={[...state.teams].sort((a, b) => b.score - a.score)} players={state.players} />
          </section>
        )}
      </section>
      {isEditing && (
        <EditorPanel
          initialGame={game}
          error={editorError}
          onCancel={() => setIsEditing(false)}
          onSave={(newGame) => {
            setEditorError(undefined);
            socket.emit('host:update-game', newGame, (res) => {
              if (res.ok) setIsEditing(false);
              else setEditorError(res.message || 'Failed to save');
            });
          }}
        />
      )}
    </main>
  );
}

