import { useState } from 'react';
import type { GameData, Clue } from '../shared/types';

interface EditorPanelProps {
  initialGame: GameData;
  onSave: (game: GameData) => void;
  onCancel: () => void;
  error?: string;
}

export function EditorPanel({ initialGame, onSave, onCancel, error }: EditorPanelProps): JSX.Element {
  const [game, setGame] = useState<GameData>(initialGame);

  const updateCategoryTitle = (roundIndex: number, catIndex: number, title: string) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories];
    next.rounds[roundIndex].categories[catIndex] = { ...next.rounds[roundIndex].categories[catIndex], title };
    setGame(next);
  };

  const addCategory = (roundIndex: number) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    const numClues = next.rounds[roundIndex].categories[0]?.clues.length || 5;
    const newCat = {
      id: `cat-${Date.now()}`,
      title: 'New Category',
      clues: Array.from({ length: numClues }).map((_, i) => ({
        id: `clue-${Date.now()}-${i}`,
        value: (i + 1) * 100,
        prompt: 'New Prompt',
        answer: 'New Answer'
      }))
    };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories, newCat];
    setGame(next);
  };

  const removeCategory = (roundIndex: number, catIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this entire category?')) return;
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = next.rounds[roundIndex].categories.filter((_, i) => i !== catIndex);
    setGame(next);
  };

  const toggleCategoryHidden = (roundIndex: number, catIndex: number) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories];
    const cat = next.rounds[roundIndex].categories[catIndex];
    next.rounds[roundIndex].categories[catIndex] = { ...cat, hidden: !cat.hidden };
    setGame(next);
  };

  const addClue = (roundIndex: number, catIndex: number) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories];
    const cat = next.rounds[roundIndex].categories[catIndex];
    const newValue = cat.clues.length > 0 ? cat.clues[cat.clues.length - 1].value + 100 : 100;
    next.rounds[roundIndex].categories[catIndex] = {
      ...cat,
      clues: [...cat.clues, {
        id: `clue-${Date.now()}`,
        value: newValue,
        prompt: 'New Prompt',
        answer: 'New Answer'
      }]
    };
    setGame(next);
  };

  const removeClue = (roundIndex: number, catIndex: number, clueIndex: number) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories];
    const cat = next.rounds[roundIndex].categories[catIndex];
    next.rounds[roundIndex].categories[catIndex] = {
      ...cat,
      clues: cat.clues.filter((_, i) => i !== clueIndex)
    };
    setGame(next);
  };

  const moveCategory = (roundIndex: number, catIndex: number, direction: 'left' | 'right') => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    const categories = [...next.rounds[roundIndex].categories];
    const targetIndex = direction === 'left' ? catIndex - 1 : catIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    
    const temp = categories[targetIndex];
    categories[targetIndex] = categories[catIndex];
    categories[catIndex] = temp;
    next.rounds[roundIndex].categories = categories;
    setGame(next);
  };

  const moveCategoryRound = (roundIndex: number, catIndex: number, direction: 'prev' | 'next') => {
    const nextRoundIndex = direction === 'prev' ? roundIndex - 1 : roundIndex + 1;
    if (nextRoundIndex < 0 || nextRoundIndex >= game.rounds.length) return;

    const next = { ...game };
    next.rounds = [...next.rounds];
    
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    const sourceCategories = [...next.rounds[roundIndex].categories];
    const [movedCategory] = sourceCategories.splice(catIndex, 1);
    next.rounds[roundIndex].categories = sourceCategories;

    next.rounds[nextRoundIndex] = { ...next.rounds[nextRoundIndex] };
    next.rounds[nextRoundIndex].categories = [...next.rounds[nextRoundIndex].categories, movedCategory];
    
    setGame(next);
  };

  const updateClue = (roundIndex: number, catIndex: number, clueIndex: number, changes: Partial<Clue>) => {
    const next = { ...game };
    next.rounds = [...next.rounds];
    next.rounds[roundIndex] = { ...next.rounds[roundIndex] };
    next.rounds[roundIndex].categories = [...next.rounds[roundIndex].categories];
    next.rounds[roundIndex].categories[catIndex] = { ...next.rounds[roundIndex].categories[catIndex] };
    next.rounds[roundIndex].categories[catIndex].clues = [...next.rounds[roundIndex].categories[catIndex].clues];
    next.rounds[roundIndex].categories[catIndex].clues[clueIndex] = {
      ...next.rounds[roundIndex].categories[catIndex].clues[clueIndex],
      ...changes
    };
    setGame(next);
  };

  return (
    <section className="editor-panel" style={{ padding: '2rem', overflowY: 'auto', maxHeight: '100vh', width: '100%', background: '#0a0a0a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Edit Game Data</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={onCancel} style={{ background: '#555', padding: '0.5rem 1rem', borderRadius: '4px' }}>Cancel</button>
          <button type="button" onClick={() => onSave(game)} style={{ padding: '0.5rem 1rem', borderRadius: '4px' }}>Save Changes</button>
        </div>
      </div>
      
      {error && <div className="notice" style={{ background: '#c0392b', marginBottom: '1rem', padding: '1rem', borderRadius: '4px' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <label>
          Game Title:
          <input type="text" value={game.title} onChange={e => setGame({ ...game, title: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>
        <label>
          Host PIN:
          <input type="text" value={game.hostPin} onChange={e => setGame({ ...game, hostPin: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>
      </div>

      <div className="rounds-editor" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {game.rounds.map((round, rIndex) => (
          <div key={round.id} style={{ border: '1px solid #444', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Round: {round.title}</h3>
            {round.categories.map((cat, cIndex) => (
              <div key={cat.id} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
                    <span style={{ fontWeight: 'bold' }}>Category Title:</span>
                    <input type="text" value={cat.title} onChange={e => updateCategoryTitle(rIndex, cIndex, e.target.value)} style={{ padding: '0.5rem', flex: 1 }} />
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => moveCategory(rIndex, cIndex, 'left')} disabled={cIndex === 0} style={{ padding: '0.25rem 0.5rem' }}>Move Left</button>
                    <button type="button" onClick={() => moveCategory(rIndex, cIndex, 'right')} disabled={cIndex === round.categories.length - 1} style={{ padding: '0.25rem 0.5rem' }}>Move Right</button>
                    <button type="button" onClick={() => moveCategoryRound(rIndex, cIndex, 'prev')} disabled={rIndex === 0} style={{ padding: '0.25rem 0.5rem' }}>Move to Prev Round</button>
                    <button type="button" onClick={() => moveCategoryRound(rIndex, cIndex, 'next')} disabled={rIndex === game.rounds.length - 1} style={{ padding: '0.25rem 0.5rem' }}>Move to Next Round</button>
                    <button type="button" onClick={() => removeCategory(rIndex, cIndex)} style={{ background: '#c0392b', padding: '0.25rem 0.5rem' }}>Delete Category</button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#333', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      <input type="checkbox" checked={cat.hidden || false} onChange={() => toggleCategoryHidden(rIndex, cIndex)} style={{ width: 'auto' }} />
                      Hide from Board
                    </label>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {cat.clues.map((clue, clueIndex) => (
                    <div key={clue.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#f39c12', width: '50px' }}>${clue.value}</span>
                        <label style={{ flex: 1 }}>
                          Prompt:
                          <input type="text" value={clue.prompt} onChange={e => updateClue(rIndex, cIndex, clueIndex, { prompt: e.target.value })} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }} />
                        </label>
                      </div>
                      <label>
                        Answer:
                        <input type="text" value={clue.answer} onChange={e => updateClue(rIndex, cIndex, clueIndex, { answer: e.target.value })} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }} />
                      </label>
                      <label>
                        Notes (Host only):
                        <input type="text" value={clue.notes || ''} onChange={e => updateClue(rIndex, cIndex, clueIndex, { notes: e.target.value })} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }} />
                      </label>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ flex: 1 }}>
                          Media Type:
                          <select value={clue.media?.type || ''} onChange={e => updateClue(rIndex, cIndex, clueIndex, { media: e.target.value ? { ...clue.media, type: e.target.value as any, src: clue.media?.src || '' } : undefined })} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }}>
                            <option value="">None</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                          </select>
                        </label>
                        <label style={{ flex: 2 }}>
                          Media URL:
                          <input type="text" value={clue.media?.src || ''} onChange={e => updateClue(rIndex, cIndex, clueIndex, { media: { ...clue.media, type: clue.media?.type || 'image', src: e.target.value } })} disabled={!clue.media?.type} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }} placeholder="https://example.com/image.jpg" />
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={clue.special === 'wager'} onChange={e => updateClue(rIndex, cIndex, clueIndex, { special: e.target.checked ? 'wager' : undefined })} style={{ width: 'auto' }} />
                          Daily Double (Wager)
                        </label>
                        <button type="button" onClick={() => removeClue(rIndex, cIndex, clueIndex)} style={{ background: '#c0392b', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Delete Clue</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addClue(rIndex, cIndex)} style={{ padding: '0.5rem', background: '#34495e' }}>+ Add Clue to {cat.title}</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addCategory(rIndex)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#2c3e50' }}>+ Add Category to {round.title}</button>
          </div>
        ))}
      </div>
    </section>
  );
}
