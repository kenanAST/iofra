# Secure IoT API Server

This API server provides a secure interface for IoT devices using mutual TLS (mTLS) authentication and MQTT communication.

## Features

- REST API for device management
- MQTT broker with mTLS authentication
- Device telemetry data storage
- OTA (Over-The-Air) update management
- Certificate generation and management

## Prerequisites

- Node.js 16+
- MongoDB
- OpenSSL (for certificate generation)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following content:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # MQTT Configuration
   MQTT_PORT=8883

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/iot-platform

   # Certificate Configuration
   CERT_DIR=./certs

   # Logging Configuration
   LOG_LEVEL=info
   ```

3. Generate certificates for mTLS:
   ```bash
   ../../../scripts/generate-certs.sh
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Building and Running

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Testing

Run the tests:
```bash
npm run test
```

## API Documentation

API documentation is available in Swagger format at `./swagger.json`. You can use tools like Swagger UI to visualize and interact with the API documentation.

## MQTT Topics

The MQTT broker uses the following topics:

- `devices/{deviceId}/telemetry`: Device publishes telemetry data
- `devices/{deviceId}/commands`: Device subscribes for commands
- `devices/{deviceId}/ota`: Device subscribes for OTA updates
- `devices/status`: Device publishes status updates

## Security

This server uses mutual TLS (mTLS) for secure authentication between devices and the server. Each device needs its own certificate signed by the server's CA. 