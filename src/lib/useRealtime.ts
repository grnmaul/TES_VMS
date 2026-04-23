import { useEffect, useRef } from 'react';

type RealtimeEvent = {
  type: string;
  payload: unknown;
};

export function useRealtime(onMessage: (event: RealtimeEvent) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const res = await fetch('/api/realtime');
        const data = await res.json();
        if (!res.ok || !data?.url || cancelled) {
          return;
        }

        socket = new WebSocket(data.url as string);
        socket.onmessage = (message) => {
          try {
            const parsed = JSON.parse(message.data) as RealtimeEvent;
            handlerRef.current(parsed);
          } catch {
            // Ignore invalid payload from socket.
          }
        };
        socket.onclose = () => {
          if (cancelled) return;
          reconnectTimer = setTimeout(connect, 1500);
        };
      } catch {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);
}
