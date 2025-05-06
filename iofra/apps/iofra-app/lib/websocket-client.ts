// WebSocket client for real-time updates

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor(
    url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    reconnectInterval: number = 5000,
    maxReconnectAttempts: number = 10
  ) {
    this.url = url;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;
          
          if (this.listeners.has(type)) {
            const callbacks = this.listeners.get(type);
            if (callbacks) {
              callbacks.forEach(callback => callback(data));
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect (${++this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, this.reconnectInterval);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public on(type: string, callback: (data: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.push(callback);
    }

    // Auto-connect when a listener is added
    if (this.socket === null) {
      this.connect();
    }
  }

  public off(type: string, callback?: (data: any) => void): void {
    if (!callback) {
      this.listeners.delete(type);
      return;
    }

    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.listeners.delete(type);
      }
    }
  }
}

// Create a singleton instance
const wsClient = new WebSocketClient();

// Automatically connect when on client side
if (typeof window !== 'undefined') {
  wsClient.connect();
}

export default wsClient; 