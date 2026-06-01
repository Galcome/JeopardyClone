import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { GameData, HostCommand, Team } from '../shared/types';

interface SetupPanelProps {
  game: GameData;
  teams: Team[];
  sendCommand: (command: HostCommand) => void;
}

export function SetupPanel({ game, teams, sendCommand }: SetupPanelProps): JSX.Element {
  const [names, setNames] = useState(() => teams.map((team) => team.name));

  useEffect(() => {
    setNames(teams.map((team) => team.name));
  }, [teams]);

  const filledNames = names.map((name) => name.trim()).filter(Boolean);

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
      <div className="setup-actions">
        <button type="button" onClick={() => setNames([...names, `Team ${names.length + 1}`])}>
          <Plus size={18} /> Add Team
        </button>
        <button type="button" disabled={names.length <= 2} onClick={() => setNames(names.slice(0, -1))}>
          <Trash2 size={18} /> Remove
        </button>
        <button type="button" disabled={filledNames.length < 2} onClick={() => sendCommand({ type: 'set-teams', names: filledNames })}>
          <Check size={18} /> Save Teams
        </button>
      </div>
    </section>
  );
}
