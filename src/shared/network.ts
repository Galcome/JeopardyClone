import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createAppSocket(): AppSocket {
  return io({
    transports: ['websocket', 'polling']
  });
}
