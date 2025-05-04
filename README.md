# Secure IoT Platform

A secure platform for IoT devices to communicate with a cloud backend using mTLS authentication and OTA updates.

## System Architecture

This project consists of two main components:

1. **IoT Device** (ESP32): Securely connects to the cloud backend using mTLS, sends telemetry data, and receives commands and OTA updates.
2. **Cloud Backend**: Provides a secure MQTT broker with mTLS authentication, REST API for device management, and OTA update functionality.

## Security Features

- **mTLS Authentication**: Mutual TLS authentication ensures both the server and device authenticate each other.
- **Certificate-Based Security**: Each device has its own certificate for authentication.
- **Secure MQTT Communication**: All data is encrypted using TLS.
- **Secure OTA Updates**: Over-the-air updates are verified for authenticity before installation.

## Directory Structure

- `/iot-device`: Code for the ESP32 IoT device
- `/iofra`: Cloud backend server (REST API + MQTT broker)

## Getting Started

### Prerequisites

- ESP32 development board
- Arduino IDE or PlatformIO
- Node.js and npm/pnpm
- MongoDB

### IoT Device Setup

1. Open the `iot-device` folder in Arduino IDE or PlatformIO
2. Configure WiFi settings and server address in `config.h`
3. Generate device certificates (see below)
4. Upload the code to your ESP32 device

### Backend Setup

1. Navigate to the `iofra` directory
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file with the following:
   ```
   PORT=3001
   MQTT_PORT=8883
   MONGODB_URI=mongodb://localhost:27017/iot-platform
   CERT_DIR=./certs
   ```
4. Generate certificates (see below)
5. Start the server:
   ```bash
   pnpm dev
   ```

## Certificate Generation

For a production environment, you need to generate proper certificates. Here's a basic guide:

### Generate CA Certificate

```bash
# Generate CA private key
openssl genrsa -out ca.key 2048

# Generate CA certificate
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt
```

### Generate Server Certificate

```bash
# Generate server private key
openssl genrsa -out server.key 2048

# Generate server CSR
openssl req -new -key server.key -out server.csr

# Sign server certificate with CA
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -sha256
```

### Generate Device Certificate

```bash
# Generate device private key
openssl genrsa -out device.key 2048

# Generate device CSR
openssl req -new -key device.key -out device.csr

# Sign device certificate with CA
openssl x509 -req -in device.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out device.crt -days 3650 -sha256
```

## API Endpoints

### Device Management

- `GET /api/devices`: Get all devices
- `GET /api/devices/:id`: Get a specific device
- `POST /api/devices`: Create a new device
- `PUT /api/devices/:id`: Update a device
- `DELETE /api/devices/:id`: Delete a device

### Telemetry and OTA

- `GET /api/devices/:id/telemetry`: Get device telemetry data
- `POST /api/devices/:id/ota`: Initiate OTA update for a device
- `POST /api/devices/:id/certificates`: Generate certificates for a device

## MQTT Topics

- `devices/{deviceId}/telemetry`: Device publishes telemetry data
- `devices/{deviceId}/commands`: Device subscribes for commands
- `devices/{deviceId}/ota`: Device subscribes for OTA updates
- `devices/status`: Device publishes status updates

## License

MIT 