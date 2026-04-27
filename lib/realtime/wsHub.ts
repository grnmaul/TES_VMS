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

    try {
      this.server = new WebSocketServer({ port: WS_PORT });
      this.server.on('connection', (socket) => {
        socket.send(
          JSON.stringify({
            type: 'system:connected',
            payload: { connectedAt: new Date().toISOString() },
          } satisfies RealtimeEvent)
        );
      });

      this.server.on('error', (error) => {
        console.error(`[v0] WebSocket server error on port ${WS_PORT}:`, error.message);
      });

      console.log(`[v0] WebSocket server started on port ${WS_PORT}`);
    } catch (error) {
      console.error(`[v0] Failed to start WebSocket server:`, error instanceof Error ? error.message : error);
    }
  }

  broadcast(event: RealtimeEvent) {
    if (!this.server) {
      console.warn('[v0] WebSocket server not initialized, skipping broadcast');
      return;
    }
    const body = JSON.stringify(event);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(body);
        } catch (error) {
          console.error('[v0] Error sending WebSocket message:', error instanceof Error ? error.message : error);
        }
      }
    });
  }

  getWebSocketUrl() {
    const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost';
    return `ws://${host}:${WS_PORT}`;
  }
}

export const wsHub = new WsHub();
