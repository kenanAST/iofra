"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTelemetry } from "@/hooks/useTelemetry"

interface TelemetryGraphProps {
  deviceId: string
  sensorType: string
  sensorName: string
  unit?: string
}

export function TelemetryGraph({ deviceId, sensorType, sensorName, unit = "" }: TelemetryGraphProps) {
  const { deviceData, loading, error } = useTelemetry(deviceId)
  const [graphData, setGraphData] = useState<any[]>([])

  useEffect(() => {
    if (deviceData?.telemetry) {
      // Extract telemetry data for this sensor type
      const rawData = deviceData.telemetry
        .filter(entry => entry.data[sensorType] !== undefined)
        .slice(-60) // Get last 60 data points to ensure we have enough for per-second display
        .map(entry => {
          const timestamp = new Date(entry.timestamp);
          return {
            // Store full timestamp for processing
            timestamp,
            // Format time as HH:MM:SS for display
            time: timestamp.toTimeString().split(' ')[0],
            // Also keep track of seconds for precise grouping
            second: `${timestamp.getMinutes()}:${timestamp.getSeconds()}`,
            value: entry.data[sensorType]
          };
        });
      
      // Group by second to ensure we show at most one data point per second
      // This prevents the graph from being overwhelmed with data points
      const groupedBySecond = rawData.reduce((acc, point) => {
        // If we already have a data point for this second, only keep the newest one
        if (!acc[point.second] || new Date(acc[point.second].timestamp) < new Date(point.timestamp)) {
          acc[point.second] = point;
        }
        return acc;
      }, {} as Record<string, any>);

      // Convert back to array and sort by timestamp
      const processedData = Object.values(groupedBySecond)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-20); // Show only the last 20 seconds of data
      
      setGraphData(processedData);
    }
  }, [deviceData, sensorType])

  // Format value based on sensor type
  const formatValue = (value: number) => {
    switch (sensorType) {
      case "temperature":
        return `${Number(value).toFixed(1)}°C`
      case "humidity":
        return `${Number(value).toFixed(1)}%`
      case "pressure":
        return `${Number(value).toFixed(1)} hPa`
      case "light":
        return `${Number(value).toFixed(0)} lux`
      default:
        return `${value}${unit ? ` ${unit}` : ''}`
    }
  }

  if (loading && graphData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading telemetry data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="text-sm text-red-500">Error loading telemetry data</div>
      </div>
    )
  }

  if (graphData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="text-sm text-gray-400">No telemetry data available</div>
      </div>
    )
  }

  return (
    <div className="w-full h-32">
      <div className="text-xs font-medium mb-1">{sensorName}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={graphData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 9 }}
            tickFormatter={(time) => {
              // Extract and show just the seconds part of the time (HH:MM:SS)
              const parts = time.split(':');
              return `${parts[1]}:${parts[2]}`;
            }}
            interval="preserveStartEnd"
            minTickGap={15}
          />
          <YAxis 
            tick={{ fontSize: 9 }} 
            width={30}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          <Tooltip 
            formatter={(value: number) => [formatValue(value), 'Value']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#86A8E7" 
            strokeWidth={2}
            dot={{ r: 1 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false} // Disable animation for faster updates
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 