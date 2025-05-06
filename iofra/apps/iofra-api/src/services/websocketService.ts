import { Server as WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { Device, DeviceStatus } from '../models/device';

// WebSocket server instance
let wss: WebSocketServer;

// Initialize WebSocket server with HTTP server
export const initWebSocketServer = (server: Server): void => {
  // Create WebSocket server attached to HTTP server
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  logger.info('WebSocket server initialized');

  // Connection event
  wss.on('connection', (ws: WebSocket) => {
    logger.info('Client connected to WebSocket');

    // Handle messages from clients
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        logger.info(`Received message: ${JSON.stringify(data)}`);
        
        // Handle different message types here
        if (data.type === 'get_devices') {
          sendDeviceList(ws);
        }
      } catch (error) {
        logger.error(`Error processing WebSocket message: ${error}`);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      logger.info('Client disconnected from WebSocket');
    });

    // Send initial message to confirm connection
    ws.send(JSON.stringify({ 
      type: 'connection_established',
      data: { message: 'Connected to IOFRA WebSocket server' }
    }));
  });
};

// Send broadcast to all connected clients
export const broadcast = (type: string, data: any): void => {
  if (!wss) {
    logger.warn('Attempted to broadcast but WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({ type, data });
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Notify clients about device status changes
export const notifyDeviceStatusChange = (deviceId: string, status: string): void => {
  broadcast('device_status_update', { deviceId, status });
};

// Notify clients about new device connections
export const notifyDeviceConnected = (device: any): void => {
  broadcast('device_connected', device);
};

// Notify clients about device disconnections
export const notifyDeviceDisconnected = (deviceId: string): void => {
  broadcast('device_disconnected', { deviceId });
};

// Send device list to a specific client
const sendDeviceList = async (ws: WebSocket): Promise<void> => {
  try {
    const devices = await Device.find({status: DeviceStatus.ONLINE});
    ws.send(JSON.stringify({
      type: 'device_list',
      data: devices
    }));
  } catch (error) {
    logger.error(`Error fetching devices: ${error}`);
  }
};

export default {
  initWebSocketServer,
  broadcast,
  notifyDeviceStatusChange,
  notifyDeviceConnected,
  notifyDeviceDisconnected
}; 