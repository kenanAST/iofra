import { useState, useEffect } from 'react';
import wsClient from '@/lib/websocket-client';
import { fetchDeviceById, Device } from '@/lib/api-client';

interface TelemetryData {
  timestamp: Date;
  data: Record<string, any>;
}

// Extended Device interface that includes telemetry
interface DeviceWithTelemetry extends Device {
  telemetry?: TelemetryData[];
}

export function useTelemetry(deviceId: string) {
  const [deviceData, setDeviceData] = useState<DeviceWithTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    // Fetch device data with telemetry
    const fetchDeviceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const device = await fetchDeviceById(deviceId);
        
        if (!device) {
          throw new Error(`Device not found or could not be fetched`);
        }
        
        setDeviceData(device as DeviceWithTelemetry);
      } catch (err) {
        console.error('Error fetching device data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch device data');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();

    // Set up WebSocket listener for real-time updates
    const handleTelemetryUpdate = (data: any) => {
      if (data.deviceId === deviceId) {
        // Update the device telemetry array with the new data
        setDeviceData(prevData => {
          if (!prevData) return null;
          
          // Create a new telemetry entry
          const newTelemetryEntry = {
            timestamp: new Date(data.timestamp),
            data: data.data
          };
          
          // Add it to the telemetry array
          return {
            ...prevData,
            telemetry: [...(prevData.telemetry || []), newTelemetryEntry]
          };
        });
      }
    };

    // Subscribe to telemetry updates
    wsClient.on('device_telemetry', handleTelemetryUpdate);

    // Clean up when component unmounts
    return () => {
      wsClient.off('device_telemetry', handleTelemetryUpdate);
    };
  }, [deviceId]);

  // Get the most recent telemetry data
  const latestTelemetry = deviceData?.telemetry?.length 
    ? deviceData.telemetry[deviceData.telemetry.length - 1] 
    : null;

  return { deviceData, latestTelemetry, loading, error };
} 