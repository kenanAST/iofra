import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { apiRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { connectToDatabase } from './config/database';
import { startMqttServer } from './services/mqttService';
import { initWebSocketServer } from './services/websocketService';
import http from 'http';

// Load environment variables
dotenv.config();

const app: express.Express = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  // Connect to database
  connectToDatabase().then(() => {
    // Start HTTP server
    server.listen(port, () => {
      logger.info(`HTTP server running on port ${port}`);
      
      // Initialize WebSocket server
      initWebSocketServer(server);
      
      // Start MQTT server after HTTP server is running
      startMqttServer();
    });
  }).catch(err => {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Additional cleanup code here (close database, MQTT server, etc.)
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  // Additional cleanup code here (close database, MQTT server, etc.)
  process.exit(0);
});

export default app; 