import { useState } from 'react';
import { Radio } from 'lucide-react';
import type { AppSocket } from '../shared/network';
import type { PublicStatePayload } from '../shared/types';

interface JoinViewProps {
  payload: PublicStatePayload;
  socket: AppSocket;
  message: string | null;
}

export function JoinView({ payload, socket, message }: JoinViewProps): JSX.Element {
  const { game, state } = payload;
  const [playerName, setPlayerName] = useState('');
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? '');
  const [joined, setJoined] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isLockedOut = state.lockedOutTeamIds?.includes(teamId);

  function join() {
    socket.emit('player:join', { playerName, teamId }, (result) => {
      setJoined(result.ok);
      setLocalMessage(result.ok ? 'Joined. Wait for buzzers.' : result.message ?? 'Could not join');
    });
  }

  function buzz() {
    socket.emit('player:buzz');
  }

  return (
    <main className="join-layout">
      <section className="join-card-full">
        <p className="eyebrow">Buzzer</p>
        <h1>{game.title}</h1>

        {!joined && (
          <div className="join-form">
            <label>
              Your name
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Name" />
            </label>
            <label>
              Team
              <select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={join}>Join Game</button>
          </div>
        )}

        {joined && (
          <>
            <button className={state.buzzersOpen && !isLockedOut ? 'buzzer-button armed' : 'buzzer-button'} type="button" disabled={!state.buzzersOpen || isLockedOut} onClick={buzz}>
              <Radio size={44} />
              {isLockedOut ? 'Locked Out' : state.buzzersOpen ? 'Buzz' : 'Locked'}
            </button>
            <p className="join-status">
              {isLockedOut ? 'You answered incorrectly on this clue.' : state.buzzes[0] ? `${state.buzzes[0].playerName} buzzed first` : state.buzzersOpen ? 'Buzzers open' : 'Waiting for host'}
            </p>
          </>
        )}

        {(localMessage || message) && <p className="notice">{localMessage ?? message}</p>}
      </section>
    </main>
  );
}

