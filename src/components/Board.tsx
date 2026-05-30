import type { GameData, Round } from '../shared/types';

interface BoardProps {
  game: GameData;
  round: Round;
  revealedClueIds: string[];
  onSelect?: (roundId: string, categoryId: string, clueId: string) => void;
}

export function Board({ game, round, revealedClueIds, onSelect }: BoardProps): JSX.Element {
  const maxRows = Math.max(...round.categories.map((category) => category.clues.length));

  return (
    <section className="board-shell" aria-label={`${round.title} board`}>
      <header className="board-title">
        <span>{game.title}</span>
        <strong>{round.title}</strong>
      </header>
      <div className="board-grid" style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}>
        {round.categories.map((category) => (
          <div className="category-cell" key={category.id}>
            {category.title}
          </div>
        ))}

        {Array.from({ length: maxRows }).flatMap((_, rowIndex) =>
          round.categories.map((category) => {
            const clue = category.clues[rowIndex];
            if (!clue) return <div className="tile tile-empty" key={`${category.id}-${rowIndex}`} />;

            const revealed = revealedClueIds.includes(clue.id);
            return (
              <button
                className={clue.special === 'wager' ? 'tile tile-wager' : 'tile'}
                key={clue.id}
                type="button"
                disabled={revealed || !onSelect}
                onClick={() => onSelect?.(round.id, category.id, clue.id)}
                aria-label={`${category.title} for ${clue.value}`}
              >
                {revealed ? '' : `${round.valuePrefix ?? ''}${clue.value}`}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

