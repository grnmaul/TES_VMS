import { WebSocketServer, WebSocket } from 'ws';

const WS_PORT = Number(process.env.WS_PORT || 3010);

type RealtimeEvent = {
  type: string;
  payload: unknown;
};

class WsHub {
  private server: WebSocketServer | null = null;

  ensureStarted() {
    if (this.server) {
      return;
    }

    this.server = new WebSocketServer({ port: WS_PORT });
    this.server.on('connection', (socket) => {
      socket.send(
        JSON.stringify({
          type: 'system:connected',
          payload: { connectedAt: new Date().toISOString() },
        } satisfies RealtimeEvent)
      );
    });
  }

  broadcast(event: RealtimeEvent) {
    if (!this.server) {
      return;
    }
    const body = JSON.stringify(event);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(body);
      }
    });
  }

  getWebSocketUrl() {
    const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost';
    return `ws://${host}:${WS_PORT}`;
  }
}

export const wsHub = new WsHub();
