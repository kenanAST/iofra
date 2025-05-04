# IOFRA App

Frontend application for the IoT Framework Application.

## Features

- Visual orchestration tool for IoT devices
- Real-time device status monitoring
- Workflow design with drag-and-drop components
- Integration with backend API and WebSocket for live updates

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## Device Integration

The app now connects to the backend API to fetch actual device data instead of using hardcoded mock devices.
When a device connects to the orchestration platform, it will:

1. Register with the backend API
2. Appear in the device list in real-time
3. Show its current connection status (online/offline)

Devices are no longer manually added through the UI - they are discovered automatically when connected
to the orchestration platform.

## Architecture

- Uses Next.js with React framework
- ReactFlow for workflow visualization
- Real-time updates via WebSocket connections
- Tailwind CSS for styling 