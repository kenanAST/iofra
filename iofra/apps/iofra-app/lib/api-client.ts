// API client for interacting with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: string;
  ipAddress?: string;
  location?: string;
  lastSeen?: string;
  firmware?: string;
  sensors?: Array<{
    id: string;
    name: string;
    sensorType: string;
    interval?: number;
    unit?: string;
  }>;
  actuators?: Array<{
    id: string;
    name: string;
    actuatorType: string;
    state?: string;
    protocol?: string;
  }>;
}

/**
 * Fetch all devices from the API
 */
export async function fetchDevices(): Promise<Device[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
}

/**
 * Fetch a single device by ID
 */
export async function fetchDeviceById(deviceId: string): Promise<Device | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch device: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error);
    return null;
  }
} 