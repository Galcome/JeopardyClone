import { Trophy } from 'lucide-react';
import type { PublicStatePayload } from '../shared/types';
import { Board } from './Board';
import { CluePanel } from './CluePanel';
import { MediaFrame } from './MediaFrame';
import { Scoreboard } from './Scoreboard';

interface DisplayViewProps {
  payload: PublicStatePayload;
}

export function DisplayView({ payload }: DisplayViewProps): JSX.Element {
  const { game, state } = payload;
  const round = game.rounds[state.currentRoundIndex] ?? game.rounds[0];

  return (
    <main className="display-layout">
      {(state.screen === 'board' || state.screen === 'setup') && (
        <>
          <Board game={game} round={round} revealedClueIds={state.revealedClueIds} />
          <Scoreboard teams={state.teams} />
        </>
      )}

      {state.screen === 'clue' && <CluePanel game={game} state={state} hostMode={false} />}

      {state.screen === 'round-transition' && (
        <section className="display-transition">
          <p>Coming up</p>
          <h1>{round.transitionTitle ?? round.title}</h1>
        </section>
      )}

      {state.screen === 'final' && (
        <section className="display-final">
          <p>Final Challenge</p>
          <h1>{game.finalChallenge.category}</h1>
          {state.finalPhase === 'clue' || state.finalPhase === 'scoring' ? (
            <>
              <h2>{game.finalChallenge.prompt}</h2>
              <MediaFrame media={game.finalChallenge.media} />
            </>
          ) : (
            <h2>Wagers are being locked in</h2>
          )}
        </section>
      )}

      {state.screen === 'standings' && (
        <section className="display-standings">
          <Trophy size={72} />
          <h1>Final Standings</h1>
          <Scoreboard teams={[...state.teams].sort((a, b) => b.score - a.score)} />
        </section>
      )}
    </main>
  );
}

