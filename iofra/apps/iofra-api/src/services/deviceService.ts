import { Device, DeviceCreateData, DeviceUpdateData } from '../models/device';

// In-memory storage for devices (would be replaced with a database in production)
let devices: Device[] = [];

export class DeviceService {
  /**
   * Get all devices
   */
  async getAllDevices(): Promise<Device[]> {
    return devices;
  }

  /**
   * Get a device by ID
   */
  async getDeviceById(id: string): Promise<Device | null> {
    const device = devices.find((d) => d.id === id);
    return device || null;
  }

  /**
   * Create a new device
   */
  async createDevice(deviceData: DeviceCreateData): Promise<Device> {
    const newDevice: Device = {
      id: Math.random().toString(36).substring(2, 11), // Generate a random ID
      ...deviceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    devices.push(newDevice);
    return newDevice;
  }

  /**
   * Update a device
   */
  async updateDevice(id: string, deviceData: DeviceUpdateData): Promise<Device | null> {
    const index = devices.findIndex((d) => d.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedDevice = {
      ...devices[index],
      ...deviceData,
      updatedAt: new Date(),
    };

    devices[index] = updatedDevice;
    return updatedDevice;
  }

  /**
   * Delete a device
   */
  async deleteDevice(id: string): Promise<boolean> {
    const initialLength = devices.length;
    devices = devices.filter((d) => d.id !== id);
    
    return devices.length < initialLength;
  }
} 