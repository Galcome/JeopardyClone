import { useEffect, useMemo, useState } from 'react';
import { createAppSocket, type AppSocket } from './shared/network';
import type { HostCommand, HostStatePayload, PublicStatePayload } from './shared/types';
import { DisplayView } from './components/DisplayView';
import { HostView } from './components/HostView';
import { JoinView } from './components/JoinView';

function routeName(): 'host' | 'display' | 'join' {
  if (window.location.pathname.startsWith('/display')) return 'display';
  if (window.location.pathname.startsWith('/join')) return 'join';
  return 'host';
}

export function App(): JSX.Element {
  const [route] = useState(routeName);
  const socket = useMemo<AppSocket>(() => createAppSocket(), []);
  const [publicPayload, setPublicPayload] = useState<PublicStatePayload | null>(null);
  const [hostPayload, setHostPayload] = useState<HostStatePayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let activeAudio: HTMLAudioElement | null = null;

    const playSound = (soundName: string) => {
      if (routeName() !== 'display') return;
      console.log(`[SoundEngine] playSound received: ${soundName}`);

      // Stop previous active audio to prevent overlap
      if (activeAudio) {
        console.log('[SoundEngine] Stopping previous active audio:', activeAudio.src);
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }

      const audio = new Audio(`/sounds/${soundName}.mp3`);
      activeAudio = audio;

      console.log('[SoundEngine] Playing new audio:', audio.src);
      audio.play().catch((err) => {
        console.error('[SoundEngine] Play failed:', err);
      });

      audio.addEventListener('ended', () => {
        console.log('[SoundEngine] Audio ended:', audio.src);
        if (activeAudio === audio) {
          activeAudio = null;
        }
      });
    };

    const stopAllSounds = () => {
      if (routeName() !== 'display') return;
      console.log(`[SoundEngine] stopAllSounds received. Active audio exists: ${!!activeAudio}`);
      if (activeAudio) {
        console.log('[SoundEngine] Pausing and resetting active audio:', activeAudio.src);
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
      }
    };

    const controlMedia = (action: 'play' | 'pause' | 'restart') => {
      if (routeName() !== 'display') return;
      const mediaEl = document.querySelector('audio, video') as HTMLMediaElement | null;
      if (mediaEl) {
        if (action === 'play') {
          mediaEl.play().catch(() => {});
        } else if (action === 'pause') {
          mediaEl.pause();
        } else if (action === 'restart') {
          mediaEl.currentTime = 0;
          mediaEl.play().catch(() => {});
        }
      }
    };

    // Register a global helper so local UI playbacks (e.g. countdown timers)
    // route through the exact same exclusive playback engine.
    (window as any).playLocalSound = (soundName: string) => {
      playSound(soundName);
    };

    socket.on('public:state', setPublicPayload);
    socket.on('host:state', setHostPayload);
    socket.on('server:message', setMessage);
    socket.on('play-sound', playSound);
    socket.on('stop-all-sounds', stopAllSounds);
    socket.on('control-media', controlMedia);
    socket.emit('state:request');

    return () => {
      socket.off('public:state', setPublicPayload);
      socket.off('host:state', setHostPayload);
      socket.off('server:message', setMessage);
      socket.off('play-sound', playSound);
      socket.off('stop-all-sounds', stopAllSounds);
      socket.off('control-media', controlMedia);
      socket.disconnect();
      delete (window as any).playLocalSound;
      
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
    };
  }, [socket]);

  const sendHostCommand = (command: HostCommand) => socket.emit('host:command', command);

  if (!publicPayload) {
    return <main className="loading-screen">Starting the board...</main>;
  }

  if (route === 'display') {
    return <DisplayView payload={publicPayload} />;
  }

  if (route === 'join') {
    return <JoinView payload={publicPayload} socket={socket} message={message} />;
  }

  return (
    <HostView
      publicPayload={publicPayload}
      hostPayload={hostPayload}
      socket={socket}
      message={message}
      sendCommand={sendHostCommand}
    />
  );
}

