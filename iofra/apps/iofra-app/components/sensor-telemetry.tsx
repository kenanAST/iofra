import { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";

interface SensorTelemetryProps {
  deviceId: string;
  sensorId: string;
  sensorType: string;
}

export function SensorTelemetry({ deviceId, sensorId, sensorType }: SensorTelemetryProps) {
  const { deviceData, latestTelemetry, loading, error } = useTelemetry(deviceId);

  // Display appropriate value based on sensor type
  const getTelemetryValue = () => {
    if (!latestTelemetry?.data) return "No data";

    switch (sensorType) {
      case "temperature":
        return `${latestTelemetry.data.temperature?.toFixed(1) || "--"}°C`;
      case "humidity":
        return `${latestTelemetry.data.humidity?.toFixed(1) || "--"}%`;
      case "motion":
        return latestTelemetry.data.motion ? "Active" : "Inactive";
      case "light":
        return `${latestTelemetry.data.light?.toFixed(0) || "--"} lux`;
      case "pressure":
        return `${latestTelemetry.data.pressure?.toFixed(1) || "--"} hPa`;
      default:
        // Display the first available value
        const keys = Object.keys(latestTelemetry.data);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const value = latestTelemetry.data[firstKey];
          return typeof value === "number" ? value.toFixed(1) : value;
        }
        return "No data";
    }
  };

  // Get timestamp in readable format
  const getTimeAgo = () => {
    if (!latestTelemetry?.timestamp) return "";
    
    const now = new Date();
    const timestamp = new Date(latestTelemetry.timestamp);
    const diffMs = now.getTime() - timestamp.getTime();
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
      {loading ? (
        <span className="text-gray-400">Loading...</span>
      ) : latestTelemetry ? (
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