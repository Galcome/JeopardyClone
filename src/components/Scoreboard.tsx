import { Minus, Plus } from 'lucide-react';
import type { Team } from '../shared/types';

interface ScoreboardProps {
  teams: Team[];
  onAdjust?: (teamId: string, delta: number) => void;
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

export function Scoreboard({ teams, onAdjust, selectedTeamId, onSelectTeam }: ScoreboardProps): JSX.Element {
  return (
    <section className="scoreboard" aria-label="Scores">
      {teams.map((team) => (
        <article className={selectedTeamId === team.id ? 'score-card selected' : 'score-card'} key={team.id}>
          <button className="team-pick" type="button" onClick={() => onSelectTeam?.(team.id)}>
            <span>{team.name}</span>
            <strong>{team.score}</strong>
          </button>
          {onAdjust && (
            <div className="score-actions">
              <button type="button" aria-label={`Subtract 100 from ${team.name}`} onClick={() => onAdjust(team.id, -100)}>
                <Minus size={16} />
              </button>
              <button type="button" aria-label={`Add 100 to ${team.name}`} onClick={() => onAdjust(team.id, 100)}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

