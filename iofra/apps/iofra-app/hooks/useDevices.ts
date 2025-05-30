import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [noDevicesAvailable, setNoDevicesAvailable] = useState<boolean>(false);
  const [updateCounter, setUpdateCounter] = useState(0); // Add a counter to force re-renders

  // Convert API device to ReactFlow node format
  const mapDeviceToNode = useCallback((device: Device, index: number): DeviceNode => {
    // Extract unique sensor types from telemetry data
    const sensorTypes = new Set<string>();
    
    // Find the latest sensor entry with telemetry data
    const latestSensorsWithTelemetry = device.sensors
      ?.filter(sensor => sensor.telemetry && typeof sensor.telemetry === 'object')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];
    
    // Extract all available sensor types from telemetry
    latestSensorsWithTelemetry.forEach(sensor => {
      if (sensor.telemetry && typeof sensor.telemetry === 'object') {
        Object.keys(sensor.telemetry as Record<string, any>).forEach(key => sensorTypes.add(key));
      }
    });
    
    // Create a sensor object for each type
    const formattedSensors = Array.from(sensorTypes).map(type => {
      // Find the latest reading for this sensor type
      const latestReading = latestSensorsWithTelemetry.find(
        sensor => sensor.telemetry && (sensor.telemetry as Record<string, any>)[type] !== undefined
      );
      
      return {
        id: `${device.deviceId}_${type}`,
        name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
        sensorType: type,
        value: latestReading?.telemetry ? (latestReading.telemetry as Record<string, any>)[type] : null,
        timestamp: latestReading?.timestamp || null
      };
    });
    
    return {
      id: device.deviceId,
      type: 'device',
      position: { x: 100, y: 100 + (index * 150) }, // Position devices in a column
      data: {
        label: device.name || device.deviceId,
        properties: {
          status: device.status,
          ipAddress: device.ipAddress,
          location: device.location,
          sensors: formattedSensors,
          actuators: device.actuators || [],
        },
      },
    };
  }, []);

  // Fetch devices from API
  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoDevicesAvailable(false);
    
    try {
      const devicesData = await fetchDevices();
      setDevices(devicesData);
      setUpdateCounter(prev => prev + 1); // Increment counter to trigger re-renders
      
      // Set noDevicesAvailable flag if the API returns an empty array
      if (devicesData.length === 0) {
        setNoDevicesAvailable(true);
      }
    } catch (err) {
      // For connection errors, we'll show a different message
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Could not connect to the orchestration platform');
      } else {
        setError('Failed to load devices');
      }
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
    setUpdateCounter(prev => prev + 1); // Increment counter to trigger re-renders
  }, []);

  // Handle new device connections
  const handleDeviceConnected = useCallback((device: Device) => {
    setNoDevicesAvailable(false); // Reset the no devices flag when a device connects
    
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
    setUpdateCounter(prev => prev + 1); // Increment counter to trigger re-renders
  }, []);

  // Handle device disconnections
  const handleDeviceDisconnected = useCallback((data: { deviceId: string }) => {
    setDevices(prevDevices => {
      const updatedDevices = prevDevices.map(device => 
        device.deviceId === data.deviceId 
          ? { ...device, status: 'offline' } 
          : device
      );
      
      // Check if all devices are now offline and update noDevicesAvailable accordingly
      const allOffline = updatedDevices.every(d => d.status === 'offline');
      if (allOffline && updatedDevices.length > 0) {
        setNoDevicesAvailable(true);
      }
      
      return updatedDevices;
    });
    setUpdateCounter(prev => prev + 1); // Increment counter to trigger re-renders
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
      wsClient.off('device_status_update', handleDeviceStatusUpdate);
      wsClient.off('device_connected', handleDeviceConnected);
      wsClient.off('device_disconnected', handleDeviceDisconnected);
    };
  }, [handleDeviceStatusUpdate, handleDeviceConnected, handleDeviceDisconnected, loadDevices]);

  // Convert devices to nodes for ReactFlow
  const deviceNodes = useMemo(() => {
    return devices.map(mapDeviceToNode);
  }, [devices, mapDeviceToNode, updateCounter]); // Add updateCounter to dependencies to force re-render

  return {
    devices,
    deviceNodes,
    loading,
    error,
    noDevicesAvailable,
    refreshDevices: loadDevices,
    updateCounter, // Expose the counter so components can use it to detect changes
  };
} 