import { DeviceService } from './deviceService';
import { Device, DeviceStatus, DeviceType } from '../models/device';

describe('DeviceService', () => {
  let deviceService: DeviceService;
  
  beforeEach(() => {
    // Create a fresh device service for each test
    deviceService = new DeviceService();
  });
  
  it('should return an empty array of devices initially', async () => {
    const devices = await deviceService.getAllDevices();
    expect(devices).toEqual([]);
  });
  
  it('should create a device with correct data', async () => {
    const deviceData = {
      name: 'Test Device',
      type: DeviceType.SENSOR,
      status: DeviceStatus.ONLINE,
      location: 'Test Location',
    };
    
    const newDevice = await deviceService.createDevice(deviceData);
    
    expect(newDevice).toMatchObject({
      ...deviceData,
      id: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
  
  it('should get a device by id', async () => {
    // Create a device first
    const deviceData = {
      name: 'Test Device',
      type: DeviceType.SENSOR,
      status: DeviceStatus.ONLINE,
    };
    
    const createdDevice = await deviceService.createDevice(deviceData);
    const foundDevice = await deviceService.getDeviceById(createdDevice.id);
    
    expect(foundDevice).toEqual(createdDevice);
  });
  
  it('should return null when getting a non-existent device', async () => {
    const device = await deviceService.getDeviceById('non-existent-id');
    expect(device).toBeNull();
  });
  
  it('should update a device successfully', async () => {
    // Create a device first
    const deviceData = {
      name: 'Test Device',
      type: DeviceType.SENSOR,
      status: DeviceStatus.ONLINE,
    };
    
    const createdDevice = await deviceService.createDevice(deviceData);
    
    // Update the device
    const updateData = {
      name: 'Updated Device',
      status: DeviceStatus.MAINTENANCE,
    };
    
    const updatedDevice = await deviceService.updateDevice(createdDevice.id, updateData);
    
    expect(updatedDevice).toMatchObject({
      ...createdDevice,
      ...updateData,
      updatedAt: expect.any(Date),
    });
  });
  
  it('should return null when updating a non-existent device', async () => {
    const result = await deviceService.updateDevice('non-existent-id', { name: 'Updated' });
    expect(result).toBeNull();
  });
  
  it('should delete a device successfully', async () => {
    // Create a device first
    const deviceData = {
      name: 'Test Device',
      type: DeviceType.SENSOR,
      status: DeviceStatus.ONLINE,
    };
    
    const createdDevice = await deviceService.createDevice(deviceData);
    
    // Delete the device
    const result = await deviceService.deleteDevice(createdDevice.id);
    expect(result).toBe(true);
    
    // Verify it's gone
    const foundDevice = await deviceService.getDeviceById(createdDevice.id);
    expect(foundDevice).toBeNull();
  });
  
  it('should return false when deleting a non-existent device', async () => {
    const result = await deviceService.deleteDevice('non-existent-id');
    expect(result).toBe(false);
  });
}); 