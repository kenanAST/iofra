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
  telemetry?: Array<{
    id?: string;
    data?: any;
  }>;
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
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add a reasonable timeout to avoid hanging
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - couldn't reach the server
      throw new Error('Failed to connect to the orchestration platform');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout error
      throw new Error('Connection to orchestration platform timed out');
    } else {
      // Other errors
      console.error('Error fetching devices:', error);
      throw error;
    }
  }
}

/**
 * Fetch a single device by ID
 */
export async function fetchDeviceById(deviceId: string): Promise<Device | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add a reasonable timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch device: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      return null;
    } else {
      console.error(`Error fetching device ${deviceId}:`, error);
      return null;
    }
  }
} 