#ifndef CONFIG_H
#define CONFIG_H

// Device Identification
#define DEVICE_ID "esp32_device_001"  // Unique device identifier

// WiFi Configuration
#define WIFI_SSID "HUAWEI nova Y71"  // WiFi network name
#define WIFI_PASSWORD "1234567891"  // WiFi password

// Server Configuration
#define SERVER_HOST "192.168.1.X"  // Replace with your computer's IP address (run ipconfig to find it)
#define SERVER_PORT 8883  // TLS secured MQTT port

// MQTT Configuration
#define MQTT_TOPIC_TELEMETRY "devices/" DEVICE_ID "/telemetry"
#define MQTT_TOPIC_COMMAND "devices/" DEVICE_ID "/commands"
#define MQTT_TOPIC_OTA "devices/" DEVICE_ID "/ota"

// OTA Update Configuration
#define OTA_CHECK_INTERVAL 3600000  // Check for updates every hour (in milliseconds)

// Sensor Reading Interval
#define SENSOR_READ_INTERVAL 30000  // Read sensor every 30 seconds (in milliseconds)

// Sleep Configuration (for battery saving)
#define DEEP_SLEEP_DURATION 60  // Sleep duration in seconds when in low-power mode

// Debug Configuration
#define DEBUG true  // Set to false to disable serial debug output

#endif // CONFIG_H 