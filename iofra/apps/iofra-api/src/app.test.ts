import request from 'supertest';
import app from './server';
import { DeviceType, DeviceStatus } from './models/device';

describe('API Integration Tests', () => {
  let createdDeviceId: string;

  // Test device creation
  it('should create a new device', async () => {
    const response = await request(app)
      .post('/api/devices')
      .send({
        name: 'Test Device',
        type: DeviceType.SENSOR,
        status: DeviceStatus.ONLINE,
        location: 'Test Location'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name', 'Test Device');
    
    // Save the device ID for future tests
    createdDeviceId = response.body.data.id;
  });

  // Test getting all devices
  it('should get all devices', async () => {
    const response = await request(app).get('/api/devices');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // Test getting a device by ID
  it('should get a device by ID', async () => {
    const response = await request(app).get(`/api/devices/${createdDeviceId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', createdDeviceId);
  });

  // Test updating a device
  it('should update a device', async () => {
    const response = await request(app)
      .put(`/api/devices/${createdDeviceId}`)
      .send({
        name: 'Updated Device',
        status: DeviceStatus.MAINTENANCE
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('name', 'Updated Device');
    expect(response.body.data).toHaveProperty('status', DeviceStatus.MAINTENANCE);
  });

  // Test 404 error for non-existent device
  it('should return 404 for non-existent device', async () => {
    const response = await request(app).get('/api/devices/non-existent-id');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  // Test deleting a device
  it('should delete a device', async () => {
    const response = await request(app).delete(`/api/devices/${createdDeviceId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify device is gone
    const getResponse = await request(app).get(`/api/devices/${createdDeviceId}`);
    expect(getResponse.status).toBe(404);
  });

  // Test the health check endpoint
  it('should have a working health check endpoint', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
}); 