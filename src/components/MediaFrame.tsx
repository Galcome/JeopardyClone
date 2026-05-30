import type { ClueMedia } from '../shared/types';

interface MediaFrameProps {
  media?: ClueMedia;
  compact?: boolean;
}

export function MediaFrame({ media, compact = false }: MediaFrameProps): JSX.Element | null {
  if (!media) return null;

  return (
    <figure className={compact ? 'media-frame media-frame-compact' : 'media-frame'}>
      {media.type === 'image' && <img src={media.src} alt={media.alt ?? media.caption ?? 'Clue media'} />}
      {media.type === 'audio' && <audio src={media.src} controls preload="metadata" />}
      {media.type === 'video' && <video src={media.src} controls preload="metadata" />}
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  );
}

