import { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";

interface SensorTelemetryProps {
  deviceId: string;
  sensorId: string;
  sensorType: string;
  value?: number | null;
  timestamp?: Date | string | null;
}

export function SensorTelemetry({ 
  deviceId, 
  sensorId, 
  sensorType,
  value: initialValue,
  timestamp: initialTimestamp
}: SensorTelemetryProps) {
  const { deviceData, latestTelemetry, loading, error } = useTelemetry(deviceId);
  
  // Use initial value/timestamp if available, otherwise use telemetry data
  const value = initialValue !== undefined ? initialValue : 
    (latestTelemetry?.data && latestTelemetry.data[sensorType]);
  
  const timestamp = initialTimestamp || latestTelemetry?.timestamp;

  // Display appropriate value based on sensor type
  const getTelemetryValue = () => {
    if (value === undefined || value === null) return "No data";

    switch (sensorType) {
      case "temperature":
        return `${Number(value).toFixed(2)}°C`;
      case "humidity":
        return `${Number(value).toFixed(2)}%`;
      case "motion":
        return value ? "Active" : "Inactive";
      case "light":
        return `${Number(value).toFixed(0)} lux`;
      case "pressure":
        return `${Number(value).toFixed(2)} hPa`;
      default:
        return typeof value === "number" ? value.toFixed(1) : value;
    }
  };

  // Get timestamp in readable format
  const getTimeAgo = () => {
    if (!timestamp) return "";
    
    const now = new Date();
    const timestampDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffMs = now.getTime() - timestampDate.getTime();
    const diffSec = Math.round(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
    return `${Math.round(diffSec / 86400)}d ago`;
  };

  if (error) {
    return <div className="mt-1 pl-5 text-xs text-red-500">Error loading data</div>;
  }

  return (
    <div className="mt-1 pl-5 text-xs">
      {loading && !value ? (
        <span className="text-gray-400">Loading...</span>
      ) : value !== undefined && value !== null ? (
        <div className="flex items-center justify-between">
          <span className="font-medium">{getTelemetryValue()}</span>
          <span className="text-gray-400 text-[10px]">{getTimeAgo()}</span>
        </div>
      ) : (
        <span className="text-gray-400">No data available</span>
      )}
    </div>
  );
} 