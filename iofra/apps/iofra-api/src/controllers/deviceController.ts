import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { DeviceService } from '../services/deviceService';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Device, DeviceType, DeviceStatus, DeviceCreateData, DeviceUpdateData } from '../models/device';
import { logger } from '../utils/logger';
import mqttService from '../services/mqttService';

const deviceService = new DeviceService();

/**
 * Get all devices
 */
export const getAllDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const devices = await Device.find({status: DeviceStatus.ONLINE}).select('-certificates');
    res.status(200).json(devices);
  } catch (error) {
    logger.error(`Error getting devices: ${error}`);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

/**
 * Get a device by ID
 */
export const getDeviceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deviceId = req.params.id;
    const device = await Device.findOne({ deviceId }).select('-certificates.clientKey');
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    res.status(200).json(device);
  } catch (error) {
    logger.error(`Error getting device: ${error}`);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
};

/**
 * Create a new device
 */
export const createDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deviceData: DeviceCreateData = req.body;
    
    // Generate device ID if not provided
    if (!deviceData.deviceId) {
      deviceData.deviceId = `device_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Create the new device
    const newDevice = await Device.create(deviceData);
    
    res.status(201).json(newDevice);
  } catch (error) {
    logger.error(`Error creating device: ${error}`);
    res.status(500).json({ error: 'Failed to create device' });
  }
};

/**
 * Update a device
 */
export const updateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deviceId = req.params.id;
    const updateData: DeviceUpdateData = req.body;
    
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      updateData,
      { new: true }
    ).select('-certificates.clientKey');
    
    if (!updatedDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    res.status(200).json(updatedDevice);
  } catch (error) {
    logger.error(`Error updating device: ${error}`);
    res.status(500).json({ error: 'Failed to update device' });
  }
};

/**
 * Delete a device
 */
export const deleteDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deviceId = req.params.id;
    const deletedDevice = await Device.findOneAndDelete({ deviceId });
    
    if (!deletedDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    res.status(200).json({ message: 'Device deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting device: ${error}`);
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

/**
 * Get device telemetry
 */
export const getDeviceTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const device = await Device.findOne({ deviceId }).select('telemetry');
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    // Get the latest telemetry data
    const telemetry = device.telemetry ? device.telemetry.slice(-limit) : [];
    
    res.status(200).json(telemetry);
  } catch (error) {
    logger.error(`Error getting device telemetry: ${error}`);
    res.status(500).json({ error: 'Failed to fetch telemetry data' });
  }
};

/**
 * Initiate OTA update for a device
 */
export const initiateOtaUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.id;
    const { version, firmwareUrl, size } = req.body;
    
    if (!version || !firmwareUrl) {
      res.status(400).json({ error: 'Version and firmware URL are required' });
      return;
    }
    
    // Check if device exists
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    // Send OTA update message via MQTT
    const otaTopic = `devices/${deviceId}/ota`;
    const otaMessage = JSON.stringify({
      status: 'available',
      version,
      url: firmwareUrl,
      size: size || 0
    });
    
    mqttService.broker.publish(
      { topic: otaTopic, payload: Buffer.from(otaMessage) },
      (err) => {
        if (err) {
          logger.error(`Error sending OTA update message: ${err}`);
          res.status(500).json({ error: 'Failed to send OTA update message' });
          return;
        }
        
        // Update device firmware version in database
        Device.findOneAndUpdate(
          { deviceId },
          { firmware: version },
          { new: true }
        ).then(() => {
          logger.info(`OTA update initiated for device ${deviceId}`);
        }).catch(err => {
          logger.error(`Error updating device firmware version: ${err}`);
        });
        
        res.status(200).json({ 
          message: 'OTA update initiated',
          deviceId,
          version
        });
      }
    );
  } catch (error) {
    logger.error(`Error initiating OTA update: ${error}`);
    res.status(500).json({ error: 'Failed to initiate OTA update' });
  }
};

/**
 * Generate certificates for a device
 */
export const generateCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.id;
    
    // Check if device exists
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    // In a real implementation, you would:
    // 1. Generate a private key and CSR for the device
    // 2. Sign the CSR with your CA to create a device certificate
    // 3. Store the certificate and key in the database or filesystem
    // 4. Return the certificate and key to the client
    
    // This is a placeholder implementation
    const certificates = {
      clientCert: `-----BEGIN CERTIFICATE-----\nSIMULATED_DEVICE_CERTIFICATE_FOR_${deviceId}\n-----END CERTIFICATE-----`,
      clientKey: `-----BEGIN PRIVATE KEY-----\nSIMULATED_DEVICE_KEY_FOR_${deviceId}\n-----END PRIVATE KEY-----`
    };
    
    // Update device with certificates
    await Device.findOneAndUpdate(
      { deviceId },
      { certificates }
    );
    
    res.status(200).json({
      message: 'Device certificates generated',
      deviceId,
      clientCert: certificates.clientCert
    });
  } catch (error) {
    logger.error(`Error generating certificates: ${error}`);
    res.status(500).json({ error: 'Failed to generate certificates' });
  }
}; 