import { useEffect, useState, useRef, useCallback } from 'react';



type InternalEvent = {type: 'open' | 'close' | 'error' | 'message', error?: Event, data?: any};
type Callback = (arg1: InternalEvent) => void;

class WebSocketManager {
  ws: WebSocket | null = null;
  url: string;
  listeners = new Set<Callback>();
  messageQueue:string[] = [];
  connected = false;

  constructor(url: string) {
    this.url = url;
  }

  connect = () => {
    if (this.ws) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.listeners.forEach((cb) => cb({ type: 'open' }));
      this.messageQueue.forEach((msg) => this.ws!.send(msg));
      this.messageQueue = [];
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.listeners.forEach((cb) => cb({ type: 'close' }));
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      this.listeners.forEach((cb) => cb({ type: 'error', error}));
    };

    this.ws.onmessage = (event) => {
      this.listeners.forEach((cb) => cb({ type: 'message', data: event.data }));
    };
  }

  reconnect = () => {
    if (!this.ws) {
      this.connect();
      return;
    }

    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 100); 
  };

  disconnect = () => {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  send(message:string) {
    if (this.connected && this.ws) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  subscribe = (listener:any) => {
    this.listeners.add(listener);
    listener({ type: this.connected ? 'open' : 'close' });
  }

  register = (listener:any) => {
    this.listeners.add(listener);
  }

  unsubscribe(listener:any) {
    this.listeners.delete(listener);
  }
}

const wsManager = new WebSocketManager('ws://192.168.0.172:3000');

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState(null);

  const listenerRef = useRef<(event:InternalEvent)=>void>(undefined);

  useEffect(() => {
    listenerRef.current = (event) => {
      switch (event.type) {
        case 'error':
          console.error('WebSocket error:', event.error);
          break;
        case 'message':
          setLastMessage(event.data); 
          break;
        default:
          break;
      }
    };

    wsManager.subscribe(listenerRef.current);

    wsManager.connect();

    return () => {
      wsManager.unsubscribe(listenerRef.current);
    };
  }, []);

  const sendMessage = useCallback((msg:string) => {
    wsManager.send(msg);
  }, []);

  return { status: wsManager.connected, lastMessage, sendMessage, reconnect: wsManager.reconnect, register: wsManager.register};
}