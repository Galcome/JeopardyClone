import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Gamepad2, Lock, MonitorUp, Trophy } from 'lucide-react';
import type { AppSocket } from '../shared/network';
import type { HostCommand, HostStatePayload, PublicStatePayload } from '../shared/types';
import { Board } from './Board';
import { CluePanel } from './CluePanel';
import { Scoreboard } from './Scoreboard';
import { SetupPanel } from './SetupPanel';
import { MediaFrame } from './MediaFrame';

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
        <Scoreboard teams={state.teams} onAdjust={(teamId, delta) => sendCommand({ type: 'adjust-score', teamId, delta })} />
        <div className="join-card">
          {qr && <img src={qr} alt="Join QR code" />}
          <span>{hostPayload.joinUrl}</span>
        </div>
        {message && <div className="notice">{message}</div>}
      </aside>

      <section className="host-stage">
        {state.screen === 'clue' && <CluePanel game={game} state={state} hostMode sendCommand={sendCommand} />}

        {(state.screen === 'board' || state.screen === 'setup') && (
          <>
            <SetupPanel game={game} teams={state.teams} sendCommand={sendCommand} />
            <Board
              game={game}
              round={round}
              revealedClueIds={state.revealedClueIds}
              onSelect={(roundId, categoryId, clueId) => sendCommand({ type: 'select-clue', roundId, categoryId, clueId })}
            />
            <div className="round-actions">
              <button type="button" onClick={() => sendCommand({ type: 'advance-round' })}>Advance Round</button>
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
            <Scoreboard teams={[...state.teams].sort((a, b) => b.score - a.score)} />
          </section>
        )}
      </section>
    </main>
  );
}

