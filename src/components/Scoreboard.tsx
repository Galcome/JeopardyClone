import { Minus, Plus, Crown } from 'lucide-react';
import type { Team, Player } from '../shared/types';

interface ScoreboardProps {
  teams: Team[];
  players?: Player[];
  onAdjust?: (teamId: string, delta: number) => void;
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

export function Scoreboard({ teams, players, onAdjust, selectedTeamId, onSelectTeam }: ScoreboardProps): JSX.Element {
  return (
    <section className="scoreboard" aria-label="Scores">
      {teams.map((team) => {
        const teamPlayers = players?.filter((p) => p.teamId === team.id) || [];
        return (
          <article className={selectedTeamId === team.id ? 'score-card selected' : 'score-card'} key={team.id}>
            <button className="team-pick" type="button" onClick={() => onSelectTeam?.(team.id)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {selectedTeamId === team.id && <Crown size={14} color="var(--gold)" />}
                {team.name}
              </span>
              <strong>{team.score}</strong>
              {teamPlayers.length > 0 && (
                <div className="team-players">
                  {teamPlayers.map((p) => p.name).join(', ')}
                </div>
              )}
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
        );
      })}
    </section>
  );
}

