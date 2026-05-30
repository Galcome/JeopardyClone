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
    socket.on('public:state', setPublicPayload);
    socket.on('host:state', setHostPayload);
    socket.on('server:message', setMessage);
    socket.emit('state:request');

    return () => {
      socket.off('public:state', setPublicPayload);
      socket.off('host:state', setHostPayload);
      socket.off('server:message', setMessage);
      socket.disconnect();
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

