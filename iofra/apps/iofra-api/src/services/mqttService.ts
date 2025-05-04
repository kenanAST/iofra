import * as fs from 'fs';
import * as path from 'path';
import aedes from 'aedes';
import { createServer } from 'aedes-server-factory';
import { logger } from '../utils/logger';
import { Device } from '../models/device';

// MQTT server configuration
const MQTT_PORT = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT) : 8883;

// Certificate paths
const CERT_DIR = process.env.CERT_DIR || path.join(__dirname, '../../certs');
const CA_CERT = path.join(CERT_DIR, 'ca.crt');
const SERVER_CERT = path.join(CERT_DIR, 'server.crt');
const SERVER_KEY = path.join(CERT_DIR, 'server.key');

// Initialize Aedes MQTT broker
const broker = aedes();

// TLS configuration
const serverOptions = {
  key: fs.readFileSync(SERVER_KEY),
  cert: fs.readFileSync(SERVER_CERT),
  requestCert: true, // Require client certificate
  rejectUnauthorized: true, // Reject unauthorized connections
  ca: [fs.readFileSync(CA_CERT)], // Trusted CA for client certs
};

// Create MQTT server with TLS
const mqttServer = createServer(broker, serverOptions);

// Event handlers
broker.on('client', (client) => {
  logger.info(`MQTT Client Connected: ${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  logger.info(`MQTT Client Disconnected: ${client.id}`);
  
  // Update device status in the database
  Device.findOneAndUpdate(
    { deviceId: client.id },
    { status: 'offline', lastSeen: new Date() }
  ).catch(err => logger.error(`Error updating device status: ${err.message}`));
});

broker.on('publish', async (packet, client) => {
  if (!client) return; // Skip messages published by the broker itself
  
  try {
    const topic = packet.topic;
    
    // Handle telemetry data
    if (topic.includes('/telemetry')) {
      const deviceId = topic.split('/')[1];
      const payload = JSON.parse(packet.payload.toString());
      
      logger.info(`Received telemetry from ${deviceId}`);
      
      // Store telemetry data in database
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          status: 'online',
          lastSeen: new Date(),
          $push: { 
            telemetry: {
              timestamp: new Date(),
              data: payload
            }
          }
        },
        { upsert: true }
      );
    }
    
    // Handle device status updates
    else if (topic === 'devices/status') {
      const payload = JSON.parse(packet.payload.toString());
      const deviceId = payload.deviceId;
      const status = payload.status;
      
      logger.info(`Device ${deviceId} status: ${status}`);
      
      // Update device status in database
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          status,
          lastSeen: new Date()
        },
        { upsert: true }
      );
    }
  } catch (err) {
    logger.error(`Error processing MQTT message: ${err.message}`);
  }
});

// Authentication handler with client certificate verification
broker.authenticate = (client, username, password, callback) => {
  const clientId = client.id;
  
  // Check if the client provided a valid certificate
  if (client.conn.authorized) {
    logger.info(`Device ${clientId} authenticated via mTLS`);
    return callback(null, true);
  }
  
  // Reject clients without valid certificates
  logger.warn(`Device ${clientId} failed mTLS authentication`);
  return callback(new Error('Unauthorized: Invalid certificate'), false);
};

// Start MQTT server
export const startMqttServer = () => {
  mqttServer.listen(MQTT_PORT, () => {
    logger.info(`MQTT server running on port ${MQTT_PORT} with TLS`);
  });
};

export default {
  startMqttServer,
  broker,
}; 