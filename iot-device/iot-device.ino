#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <HTTPClient.h>
#include "config.h"
#include "certificates.h"

// Global variables
WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);
HTTPClient httpClient;
unsigned long lastSensorReadTime = 0;
unsigned long lastOtaCheckTime = 0;
unsigned long lastHealthCheckTime = 0;
bool otaInProgress = false;

// Function prototypes
void setupWifi();
void setupMQTT();
void reconnect();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishTelemetry();
void handleOtaUpdate(byte* payload, unsigned int length);
void enterDeepSleep();
void performHealthCheck();

void setup() {
  // Initialize serial for debugging
  if (DEBUG) {
    Serial.begin(115200);
    Serial.println("ESP32 IoT Device starting...");
  }
  
  // Setup WiFi connection
  setupWifi();
  
  // Configure mTLS certificates
  wifiClient.setCACert(rootCA);
  wifiClient.setCertificate(deviceCert);
  wifiClient.setPrivateKey(deviceKey);
  
  // Setup MQTT connection
  setupMQTT();
  
  // Record startup time
  lastSensorReadTime = millis();
  lastOtaCheckTime = millis();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    setupWifi();
  }
  
  // Check MQTT connection
  if (!mqttClient.connected()) {
    reconnect();
  }
  
  // Handle MQTT messages
  mqttClient.loop();
  
  // Check if it's time to read sensors and publish telemetry
  unsigned long currentTime = millis();
  if (currentTime - lastSensorReadTime >= SENSOR_READ_INTERVAL && !otaInProgress) {
    publishTelemetry();
    lastSensorReadTime = currentTime;
  }
  
  // Check for OTA updates
  if (currentTime - lastOtaCheckTime >= OTA_CHECK_INTERVAL && !otaInProgress) {
    if (DEBUG) Serial.println("Checking for OTA updates...");
    mqttClient.publish(MQTT_TOPIC_OTA, "{\"status\":\"check\",\"version\":\"1.0.0\"}");
    lastOtaCheckTime = currentTime;
  }
  
  // Perform health check every minute
  if (currentTime - lastHealthCheckTime >= 60000 && !otaInProgress) {
    performHealthCheck();
    lastHealthCheckTime = currentTime;
  }
  
  // Enter deep sleep if configured
  #ifdef DEEP_SLEEP_DURATION
  if (!otaInProgress) {
    enterDeepSleep();
  }
  #endif
}

void setupWifi() {
  if (DEBUG) Serial.println("Connecting to WiFi...");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    if (DEBUG) Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    if (DEBUG) {
      Serial.println("");
      Serial.println("WiFi connected");
      Serial.println("IP address: ");
      Serial.println(WiFi.localIP());
      
      // Perform an initial health check after connecting
      performHealthCheck();
    }
  } else {
    if (DEBUG) Serial.println("Failed to connect to WiFi");
    ESP.restart();
  }
}

void setupMQTT() {
  mqttClient.setServer(SERVER_HOST, SERVER_PORT);
  mqttClient.setCallback(mqttCallback);
}

void reconnect() {
  int attempts = 0;
  
  while (!mqttClient.connected() && attempts < 5) {
    if (DEBUG) Serial.println("Attempting MQTT connection...");
    if (DEBUG) Serial.print("Connecting to: ");
    if (DEBUG) Serial.print(SERVER_HOST);
    if (DEBUG) Serial.print(":");
    if (DEBUG) Serial.println(SERVER_PORT);
    
    // Attempt to connect with client ID and authentication
    if (mqttClient.connect(DEVICE_ID)) {
      if (DEBUG) Serial.println("Connected to MQTT broker");
      
      // Subscribe to command and OTA topics
      mqttClient.subscribe(MQTT_TOPIC_COMMAND);
      mqttClient.subscribe(MQTT_TOPIC_OTA);
      
      // Publish an announcement that the device is online
      mqttClient.publish("devices/status", "{\"deviceId\":\"" DEVICE_ID "\",\"status\":\"online\"}");
    } else {
      if (DEBUG) {
        Serial.print("Connection failed, rc=");
        Serial.print(mqttClient.state());
        Serial.println(" try again in 5 seconds");
      }
      delay(5000);
    }
    attempts++;
  }
  
  if (!mqttClient.connected() && attempts >= 5) {
    if (DEBUG) Serial.println("Failed to connect to MQTT after multiple attempts. Restarting...");
    ESP.restart();
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (DEBUG) {
    Serial.print("Message received on topic: ");
    Serial.println(topic);
  }
  
  // Handle command messages
  if (strcmp(topic, MQTT_TOPIC_COMMAND) == 0) {
    // Parse the JSON payload
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload, length);
    
    // Process commands based on type
    const char* commandType = doc["type"];
    
    if (strcmp(commandType, "reboot") == 0) {
      if (DEBUG) Serial.println("Reboot command received");
      ESP.restart();
    } else if (strcmp(commandType, "sleep") == 0) {
      if (DEBUG) Serial.println("Sleep command received");
      enterDeepSleep();
    }
    // Add more command handlers here
  }
  
  // Handle OTA update messages
  else if (strcmp(topic, MQTT_TOPIC_OTA) == 0) {
    handleOtaUpdate(payload, length);
  }
}

void publishTelemetry() {
  // Create a JSON document for the telemetry data
  DynamicJsonDocument doc(256);
  
  // Add device information
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = millis();
  
  // Add sensor readings
  doc["temperature"] = random(2000, 3000) / 100.0; // Simulated temperature 20-30°C
  doc["humidity"] = random(4000, 8000) / 100.0;    // Simulated humidity 40-80%
  doc["batteryLevel"] = random(3000, 4200) / 1000.0; // Simulated battery 3.0-4.2V
  
  // Serialize JSON to a string
  String telemetryJson;
  serializeJson(doc, telemetryJson);
  
  // Publish telemetry data
  if (DEBUG) {
    Serial.print("Publishing telemetry: ");
    Serial.println(telemetryJson);
  }
  
  mqttClient.publish(MQTT_TOPIC_TELEMETRY, telemetryJson.c_str());
}

void handleOtaUpdate(byte* payload, unsigned int length) {
  // Parse the JSON payload
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload, length);
  
  // Check for update availability
  const char* status = doc["status"];
  
  if (strcmp(status, "available") == 0) {
    const char* firmwareUrl = doc["url"];
    const int firmwareSize = doc["size"];
    
    if (DEBUG) {
      Serial.println("OTA update available");
      Serial.print("Firmware URL: ");
      Serial.println(firmwareUrl);
      Serial.print("Size: ");
      Serial.println(firmwareSize);
    }
    
    
    
    otaInProgress = true;
    // Simulated update process
    delay(2000);
    
    // Notify server of successful update
    mqttClient.publish(MQTT_TOPIC_OTA, "{\"status\":\"success\",\"version\":\"1.0.1\"}");
    
    // Restart device to apply update
    if (DEBUG) Serial.println("Update complete. Restarting...");
    ESP.restart();
  }
}

void enterDeepSleep() {
  if (DEBUG) Serial.println("Entering deep sleep mode...");
  
  // Disconnect from MQTT and WiFi gracefully
  mqttClient.disconnect();
  WiFi.disconnect();
  
  // Configure wake up source
  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_DURATION * 1000000ULL);
  
  // Enter deep sleep
  if (DEBUG) Serial.println("Going to sleep now");
  delay(100);
  esp_deep_sleep_start();
}

void performHealthCheck() {
  if (WiFi.status() == WL_CONNECTED) {
    if (DEBUG) {
      Serial.println("\n--- NETWORK DIAGNOSTICS ---");
      Serial.print("Device IP: ");
      Serial.println(WiFi.localIP());
      Serial.print("Gateway IP: ");
      Serial.println(WiFi.gatewayIP());
      Serial.print("Subnet Mask: ");
      Serial.println(WiFi.subnetMask());
      Serial.print("DNS Server: ");
      Serial.println(WiFi.dnsIP());
      Serial.print("Signal strength (RSSI): ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      
      // Try different server addresses - both IP and hostname
      Serial.print("Target server: ");
      Serial.print(SERVER_HOST);
      Serial.print(":");
      Serial.println(SERVER_PORT);
      
      // Non-TLS test to port 3001
      Serial.println("\n--- HTTP HEALTH CHECK ---");
    }
    
    // Regular HTTP client (not secure)
    WiFiClient httpWifiClient;
    HTTPClient http;
    
    // Initialize HTTP request to IP address explicitly
    String healthEndpoint = "http://" + String(SERVER_HOST) + ":3001/health";
    if (DEBUG) {
      Serial.print("Performing health check: ");
      Serial.println(healthEndpoint);
    }
    
    http.begin(httpWifiClient, healthEndpoint);
    http.setTimeout(10000); // Increase timeout to 10 seconds
    
    // Send GET request
    if (DEBUG) Serial.println("Sending GET request...");
    int httpCode = http.GET();
    
    // Check result
    if (httpCode > 0) {
      if (DEBUG) {
        Serial.print("HTTP response code: ");
        Serial.println(httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
          String payload = http.getString();
          Serial.println("Response payload:");
          Serial.println(payload);
        }
      }
    } else {
      if (DEBUG) {
        Serial.print("HTTP request failed, error: ");
        Serial.println(http.errorToString(httpCode).c_str());
      }
    }
    
    // Close connection
    http.end();
    
    // Also try a basic HTTP check to a well-known internet service
    if (DEBUG) Serial.println("\n--- INTERNET CONNECTIVITY TEST ---");
    HTTPClient internetTest;
    internetTest.begin(httpWifiClient, "http://worldtimeapi.org/api/ip");
    httpCode = internetTest.GET();
    
    if (httpCode > 0) {
      if (DEBUG) {
        Serial.print("Internet test response: ");
        Serial.println(httpCode);
        Serial.println("Device can access the internet");
      }
    } else {
      if (DEBUG) {
        Serial.println("Internet test failed, device may be isolated from the internet");
      }
    }
    internetTest.end();
    
    // Debug MQTT connection issues
    if (DEBUG) {
      Serial.println("\n--- MQTT DIAGNOSTICS ---");
      Serial.print("MQTT connection state: ");
      switch (mqttClient.state()) {
        case -4: Serial.println("MQTT_CONNECTION_TIMEOUT"); break;
        case -3: Serial.println("MQTT_CONNECTION_LOST"); break;
        case -2: Serial.println("MQTT_CONNECT_FAILED"); break;
        case -1: Serial.println("MQTT_DISCONNECTED"); break;
        case 0: Serial.println("MQTT_CONNECTED"); break;
        case 1: Serial.println("MQTT_CONNECT_BAD_PROTOCOL"); break;
        case 2: Serial.println("MQTT_CONNECT_BAD_CLIENT_ID"); break;
        case 3: Serial.println("MQTT_CONNECT_UNAVAILABLE"); break;
        case 4: Serial.println("MQTT_CONNECT_BAD_CREDENTIALS"); break;
        case 5: Serial.println("MQTT_CONNECT_UNAUTHORIZED"); break;
        default: Serial.println("UNKNOWN"); break;
      }
    }
    
    if (DEBUG) Serial.println("--- END DIAGNOSTICS ---\n");
  } else {
    if (DEBUG) Serial.println("WiFi not connected, cannot perform health check");
  }
} 