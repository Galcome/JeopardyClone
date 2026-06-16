import type { GameData, Round } from '../shared/types';

interface BoardProps {
  game: GameData;
  round: Round;
  revealedClueIds: string[];
  revealedCategoryIndex: number;
  onSelect?: (roundId: string, categoryId: string, clueId: string) => void;
}

export function Board({ game, round, revealedClueIds, revealedCategoryIndex, onSelect }: BoardProps): JSX.Element {
  const maxRows = Math.max(...round.categories.map((category) => category.clues.length));

  return (
    <section className="board-shell" aria-label={`${round.title} board`}>
      <header className="board-title">
        <span>{game.title}</span>
        <strong>{round.title}</strong>
      </header>
      <div className="board-grid" style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}>
        {round.categories.map((category, index) => (
          <div className="category-cell" key={category.id}>
            {index <= revealedCategoryIndex ? category.title : ''}
          </div>
        ))}

        {Array.from({ length: maxRows }).flatMap((_, rowIndex) =>
          round.categories.map((category, index) => {
            const clue = category.clues[rowIndex];
            if (!clue) return <div className="tile tile-empty" key={`${category.id}-${rowIndex}`} />;

            const revealed = revealedClueIds.includes(clue.id);
            const isCategoryRevealed = index <= revealedCategoryIndex;
            return (
              <button
                className={clue.special === 'wager' && isCategoryRevealed ? 'tile tile-wager' : 'tile'}
                key={clue.id}
                type="button"
                disabled={!isCategoryRevealed || revealed || !onSelect}
                onClick={() => onSelect?.(round.id, category.id, clue.id)}
                aria-label={`${category.title} for ${clue.value}`}
              >
                {!isCategoryRevealed || revealed ? '' : `${round.valuePrefix ?? ''}${clue.value}`}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

