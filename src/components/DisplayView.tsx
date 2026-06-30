import { useState, useEffect } from 'react';
import { Trophy, VolumeX } from 'lucide-react';
import QRCode from 'qrcode';
import type { PublicStatePayload } from '../shared/types';
import { Board } from './Board';
import { CluePanel } from './CluePanel';
import { MediaFrame } from './MediaFrame';
import { Scoreboard } from './Scoreboard';

interface DisplayViewProps {
  payload: PublicStatePayload;
}

export function DisplayView({ payload }: DisplayViewProps): JSX.Element {
  const { game, state, joinUrl } = payload;
  const round = game.rounds[state.currentRoundIndex] ?? game.rounds[0];
  const [qrSrc, setQrSrc] = useState<string>('');

  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    return typeof navigator !== 'undefined' && !!(navigator as any).userActivation?.hasBeenActive;
  });

  useEffect(() => {
    if (audioUnlocked) return;
    const unlock = () => {
      setAudioUnlocked(true);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioUnlocked]);

  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, { margin: 1, width: 800 })
        .then(setQrSrc)
        .catch(() => setQrSrc(''));
    }
  }, [joinUrl]);

  return (
    <main className="display-layout">
      {!audioUnlocked && (
        <div 
          className="audio-unlock-overlay"
          onClick={() => setAudioUnlocked(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <VolumeX size={20} />
          <span>Click anywhere to enable game sounds</span>
        </div>
      )}
      {state.screen === 'board' && (
        <>
          <Board game={game} round={{ ...round, categories: round.categories.filter(c => !c.hidden) }} revealedCategoryIndex={state.revealedCategoryIndex} revealedClueIds={state.revealedClueIds} />
          <Scoreboard teams={state.teams} players={state.players} selectedTeamId={state.controllingTeamId ?? undefined} />
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
          <Scoreboard teams={[...state.teams].sort((a, b) => b.score - a.score)} players={state.players} />
        </section>
      )}

      {qrSrc && state.screen === 'board' && (
        <div className="qr-small">
          <img src={qrSrc} alt="Join QR Code" />
          <span>Scan to Join</span>
        </div>
      )}

      {state.showQR && qrSrc && (
        <div className="qr-overlay">
          <h1>Scan to Join Game</h1>
          <img src={qrSrc} alt="Join QR Code" />
        </div>
      )}
    </main>
  );
}

