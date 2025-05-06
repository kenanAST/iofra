# ESP32 Secure IoT Device

This folder contains the Arduino code for the ESP32 IoT device that securely communicates with the cloud backend.

## Features

- mTLS (mutual TLS) authentication with the server
- Secure MQTT communication
- OTA (Over-The-Air) updates
- Low power operation

## Requirements

- Arduino IDE or PlatformIO
- ESP32 board
- Libraries:
  - WiFiClientSecure
  - PubSubClient (MQTT)
  - ArduinoJson
  - ESP32 OTA update libraries

## Setup

1. Install the required libraries
2. Configure the WiFi and server settings in `config.h`
3. Generate certificates for mTLS as described in the main README
4. Upload the code to your ESP32 device 