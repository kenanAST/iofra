import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { DeviceService } from '../services/deviceService';

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
    const devices = await deviceService.getAllDevices();
    res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const device = await deviceService.getDeviceById(id);
    
    if (!device) {
      throw new ApiError(404, `Device with ID ${id} not found`);
    }
    
    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
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
    const deviceData = req.body;
    const newDevice = await deviceService.createDevice(deviceData);
    
    res.status(201).json({
      success: true,
      data: newDevice,
    });
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const deviceData = req.body;
    
    const updatedDevice = await deviceService.updateDevice(id, deviceData);
    
    if (!updatedDevice) {
      throw new ApiError(404, `Device with ID ${id} not found`);
    }
    
    res.status(200).json({
      success: true,
      data: updatedDevice,
    });
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const result = await deviceService.deleteDevice(id);
    
    if (!result) {
      throw new ApiError(404, `Device with ID ${id} not found`);
    }
    
    res.status(200).json({
      success: true,
      message: `Device with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}; 