import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { Device, DeviceStatus } from '../models/device';
import websocketService from './websocketService';

// Time threshold in milliseconds (2 minutes)
const DEVICE_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Check for disconnected devices
 * This function finds all devices that are marked as 'online'
 * but haven't been seen in the last 2 minutes and marks them as 'offline'
 */
async function checkOfflineDevices(): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - DEVICE_TIMEOUT_MS);
    
    // Find all devices that are marked as online but haven't been seen recently
    const devicesToUpdate = await Device.find({
      status: DeviceStatus.ONLINE,
      lastSeen: { $lt: cutoffTime }
    });
    
    if (devicesToUpdate.length > 0) {
      logger.info(`Found ${devicesToUpdate.length} devices that appear to be offline`);
      
      // Update each device to offline status
      for (const device of devicesToUpdate) {
        await Device.findOneAndUpdate(
          { deviceId: device.deviceId },
          { status: DeviceStatus.OFFLINE }
        );
        
        // Notify clients via WebSocket
        websocketService.notifyDeviceDisconnected(device.deviceId);
        
        logger.info(`Marked device ${device.deviceId} as offline due to inactivity`);
      }
    }
  } catch (error) {
    logger.error(`Error checking for offline devices: ${error}`);
  }
}

/**
 * Initialize the device monitoring service
 * This sets up a cron job to periodically check for offline devices
 */
export function initDeviceMonitoring(): void {
  // Run the check every minute
  cron.schedule('* * * * *', () => {
    logger.debug('Running scheduled check for offline devices');
    checkOfflineDevices();
  });
  
  logger.info('Device monitoring service initialized');
}

export default {
  initDeviceMonitoring,
  checkOfflineDevices
}; 