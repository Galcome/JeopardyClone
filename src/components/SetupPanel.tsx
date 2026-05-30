import { useState } from 'react';
import { Check } from 'lucide-react';
import type { GameData, HostCommand, Team } from '../shared/types';

interface SetupPanelProps {
  game: GameData;
  teams: Team[];
  sendCommand: (command: HostCommand) => void;
}

export function SetupPanel({ game, teams, sendCommand }: SetupPanelProps): JSX.Element {
  const [names, setNames] = useState(() => teams.map((team) => team.name));

  return (
    <section className="setup-panel">
      <div>
        <p className="eyebrow">Game file loaded</p>
        <h2>{game.title}</h2>
        <p>
          {game.rounds.length} rounds, {game.defaultTeams.length} default teams, final challenge ready.
        </p>
      </div>
      <div className="team-name-grid">
        {names.map((name, index) => (
          <label key={`team-name-${index}`}>
            Team {index + 1}
            <input
              value={name}
              onChange={(event) => setNames(names.map((candidate, candidateIndex) => (candidateIndex === index ? event.target.value : candidate)))}
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={() => sendCommand({ type: 'set-teams', names })}>
        <Check size={18} /> Save Teams
      </button>
    </section>
  );
}

