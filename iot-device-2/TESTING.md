# Testing the ESP32 IoT Device

This guide provides instructions for testing the ESP32 IoT device's secure connection to the backend server.

## Prerequisites

- ESP32 development board
- Arduino IDE with ESP32 support installed
- Backend server running with mTLS support
- Generated certificates (CA, server, device)

## Testing Steps

### 1. Prepare the Certificates

1. After generating the certificates using the backend's certificate generation script, you need to format them for the ESP32:

   - Open `certificates.h` and replace the placeholder values with your actual certificates
   - Make sure to format them properly with escaped newlines
   - Include the full certificate chain for proper TLS verification

Example of correctly formatted certificates:

```cpp
const char* rootCA = R"(
-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIUJTzFj1GMRGw9AQZNN+70Nv/ZvIQwDQYJKoZIhvcNAQEL
... (rest of the certificate) ...
Q6RC6cHmRCRyg+4=
-----END CERTIFICATE-----
)";

const char* deviceCert = R"(
-----BEGIN CERTIFICATE-----
MIIDWDCCAkCgAwIBAgIUJRfR1LUSNzf5+UzJ4I60/T7YMRowDQYJKoZIhvcNAQEL
... (rest of the certificate) ...
eaFjRNqzVPtv1w==
-----END CERTIFICATE-----
)";

const char* deviceKey = R"(
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLTt9xSUlWF27W
... (rest of the private key) ...
ZhDzlO8KEMGvdSQtHw==
-----END PRIVATE KEY-----
)";
```

### 2. Configure WiFi and Server Settings

1. Open `config.h` and update the following settings:

```cpp
// WiFi Configuration
#define WIFI_SSID "your-wifi-name"  // Replace with your WiFi network name
#define WIFI_PASSWORD "your-wifi-password"  // Replace with your WiFi password

// Server Configuration
#define SERVER_HOST "your-server-ip-or-hostname"  // Replace with your server's IP or hostname
#define SERVER_PORT 8883  // TLS secured MQTT port
```

### 3. Testing mTLS Connectivity

1. Upload the code to your ESP32 board
2. Open the Serial Monitor (115200 baud rate)
3. Watch the connection process:
   - WiFi connection
   - mTLS handshake with server
   - MQTT connection
   - Publishing telemetry data

### 4. Troubleshooting

If you encounter issues with the mTLS connection:

1. **Certificate Format Issues**:
   - Ensure there are no extra spaces or line breaks
   - Check that the certificates are properly enclosed in the R"( ... )" delimiters

2. **Handshake Failed**:
   - Verify that the server's hostname matches the CN in the server certificate
   - Check that the device certificate is signed by the same CA as the server certificate
   - Ensure the CA certificate is correctly configured on both the device and server

3. **Connection Refused**:
   - Verify the MQTT broker is running and accessible
   - Check that the MQTT port (8883) is open on the server
   - Ensure the device ID matches the CN in the client certificate

### 5. Testing OTA Updates

1. Create a new firmware binary:
   - Make a small change to the code (e.g., version number)
   - Compile the code but don't upload it
   - Find the .bin file in the Arduino build directory

2. Upload the firmware to your backend server

3. Initiate the OTA update:
   - Through the REST API: `POST /api/devices/:id/ota`
   - With payload: `{"version": "1.0.1", "firmwareUrl": "https://your-server/firmware/device-001-v1.0.1.bin", "size": 1234567}`

4. Monitor the update process on the device's serial output

## Example Serial Output for Successful Connection

```
ESP32 IoT Device starting...
Connecting to WiFi...
......
WiFi connected
IP address: 192.168.1.100
Setting TLS certificates...
Attempting MQTT connection...
Connected to MQTT broker
Subscribed to command topic: devices/esp32_device_001/commands
Subscribed to OTA topic: devices/esp32_device_001/ota
Published online status
Publishing telemetry: {"deviceId":"esp32_device_001","timestamp":10023,"temperature":24.75,"humidity":52.31,"batteryLevel":3.82}
``` 