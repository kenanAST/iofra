import { useState, useEffect, useCallback } from 'react';
import { fetchDevices, type Device } from '@/lib/api-client';
import wsClient from '@/lib/websocket-client';

export interface DeviceNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    properties: {
      status: string;
      ipAddress?: string;
      location?: string;
      sensors?: Array<any>;
      actuators?: Array<any>;
    };
  };
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Convert API device to ReactFlow node format
  const mapDeviceToNode = useCallback((device: Device, index: number): DeviceNode => {
    return {
      id: device.deviceId,
      type: 'device',
      position: { x: 100, y: 100 + (index * 150) }, // Position devices in a column
      data: {
        label: device.name,
        properties: {
          status: device.status,
          ipAddress: device.ipAddress,
          location: device.location,
          sensors: device.sensors || [],
          actuators: device.actuators || [],
        },
      },
    };
  }, []);

  // Fetch devices from API
  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const devicesData = await fetchDevices();
      setDevices(devicesData);
    } catch (err) {
      setError('Failed to load devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time device status updates
  const handleDeviceStatusUpdate = useCallback((data: { deviceId: string; status: string }) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.deviceId === data.deviceId 
          ? { ...device, status: data.status } 
          : device
      )
    );
  }, []);

  // Handle new device connections
  const handleDeviceConnected = useCallback((device: Device) => {
    setDevices(prevDevices => {
      // Check if device already exists
      const exists = prevDevices.some(d => d.deviceId === device.deviceId);
      
      if (exists) {
        // Update existing device
        return prevDevices.map(d => 
          d.deviceId === device.deviceId ? { ...d, ...device } : d
        );
      } else {
        // Add new device
        return [...prevDevices, device];
      }
    });
  }, []);

  // Handle device disconnections
  const handleDeviceDisconnected = useCallback((data: { deviceId: string }) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.deviceId === data.deviceId 
          ? { ...device, status: 'offline' } 
          : device
      )
    );
  }, []);

  // Initialize WebSocket connection and event listeners
  useEffect(() => {
    // Connect to WebSocket
    wsClient.connect();
    
    // Set up event listeners
    wsClient.on('device_status_update', handleDeviceStatusUpdate);
    wsClient.on('device_connected', handleDeviceConnected);
    wsClient.on('device_disconnected', handleDeviceDisconnected);
    
    // Load initial device data
    loadDevices();
    
    // Clean up
    return () => {
      wsClient.off('device_status_update');
      wsClient.off('device_connected');
      wsClient.off('device_disconnected');
    };
  }, [handleDeviceStatusUpdate, handleDeviceConnected, handleDeviceDisconnected, loadDevices]);

  // Convert devices to nodes for ReactFlow
  const deviceNodes = devices.map(mapDeviceToNode);

  return {
    devices,
    deviceNodes,
    loading,
    error,
    refreshDevices: loadDevices,
  };
} 