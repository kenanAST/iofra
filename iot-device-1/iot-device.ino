#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <HTTPClient.h>
#include "config.h"
#include "certificates.h"

// Water Level Sensor setup
#define WATER_LEVEL_PIN 15  // Water level sensor connected to pin 15

// Global variables
WiFiClient wifiClient;
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

  // Initialize water level sensor pin
  pinMode(WATER_LEVEL_PIN, INPUT);
  if (DEBUG) Serial.println("Water level sensor initialized");

  struct tm t;
  t.tm_year = 2025 - 1900;
  t.tm_mon = 4;  // May (0-based)
  t.tm_mday = 6;
  t.tm_hour = 12;
  t.tm_min = 0;
  t.tm_sec = 0;
  time_t now = mktime(&t);
  struct timeval tv = { now, 0 };
  settimeofday(&tv, nullptr);

  Serial.println("🕒 Time set manually");

  
  // Setup WiFi connection
  setupWifi();
  
  // Configure mTLS certificates
  if (DEBUG) Serial.println("Setting up TLS certificates...");
  // wifiClient.setCACert(rootCA);
  // wifiClient.setCertificate(deviceCert);
  // wifiClient.setPrivateKey(deviceKey);
  
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

  Serial.print("Testing raw TLS connection to ");
  Serial.print(SERVER_HOST);
  Serial.print(":");
  Serial.println(SERVER_PORT);

  if (wifiClient.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("✅ TLS connection successful!");
    wifiClient.stop();  // Clean up
  } else {
    Serial.println("❌ TLS connection failed.");
  }

  mqttClient.setServer(SERVER_HOST, SERVER_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(1);
  // Set larger timeout for secure connection
  wifiClient.setTimeout(15000);
  // Set MQTT timeout
  mqttClient.setSocketTimeout(10);  // 10 seconds
  
  if (DEBUG) Serial.println("MQTT client configured with timeout of 10 seconds");
}

void reconnect() {
  int attempts = 0;
  
  // First check if WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    if (DEBUG) Serial.println("WiFi disconnected. Reconnecting first...");
    setupWifi();
  }
  
  while (!mqttClient.connected() && attempts < 5) {
    if (DEBUG) Serial.println("Attempting MQTT connection...");
    if (DEBUG) Serial.print("Connecting to: ");
    if (DEBUG) Serial.print(SERVER_HOST);
    if (DEBUG) Serial.print(":");
    if (DEBUG) Serial.println(SERVER_PORT);
    
    // Add a small delay before connection attempt
    delay(1000);
    
    // Attempt to connect with client ID and authentication
    if (DEBUG) Serial.println("Calling mqttClient.connect with client ID: " DEVICE_ID);
    if (mqttClient.connect(DEVICE_ID)) {
      if (DEBUG) Serial.println("Connected to MQTT broker");
      
      // Subscribe to command and OTA topics
      mqttClient.subscribe(MQTT_TOPIC_COMMAND);
      mqttClient.subscribe(MQTT_TOPIC_OTA);
      
      // Publish an announcement that the device is online
      mqttClient.publish("devices/status", "{\"deviceId\":\"" DEVICE_ID "\",\"status\":\"online\"}");
    } else {
      if (DEBUG) {
        int rc = mqttClient.state();
        Serial.print("Connection failed, rc=");
        Serial.print(rc);
        Serial.print(" (");
        switch(rc) {
          case -5: Serial.print("Connection timeout"); break;
          case -4: Serial.print("Failed to receive connack"); break;
          case -3: Serial.print("Failed to send connect packet"); break;
          case -2: Serial.print("TCP connection failed"); break;
          case -1: Serial.print("Connection failed"); break;
          case 1: Serial.print("Incorrect protocol version"); break;
          case 2: Serial.print("Invalid client identifier"); break;
          case 3: Serial.print("Server unavailable"); break;
          case 4: Serial.print("Bad username or password"); break;
          case 5: Serial.print("Not authorized"); break;
          default: Serial.print("Unknown error"); break;
        }
        if (rc != -2) Serial.println(")");
        Serial.print("Will retry in 5 seconds, attempt ");
        Serial.print(attempts + 1);
        Serial.println(" of 5");
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
  
  // Read water level sensor (analog reading)
  int waterLevelRaw = analogRead(WATER_LEVEL_PIN);
  if (DEBUG) {
    Serial.print("Raw water level reading: ");
    Serial.println(waterLevelRaw);
  }
  // Map the raw value to percentage (0 = dry, 4095 = fully wet)
  float waterLevelPercentage = map(waterLevelRaw, 0, 4095, 0, 100);
  if (DEBUG) {
    Serial.print("Mapped water level percentage: ");
    Serial.println(waterLevelPercentage);
  }
  
  // Add sensor readings
  doc["waterLevel"] = waterLevelPercentage;
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
    if (DEBUG) Serial.print("Performing health check: ");
    if (DEBUG) Serial.println(HEALTH_CHECK_ENDPOINT);
    
    // Regular HTTP client (not secure)
    WiFiClient httpWifiClient;
    HTTPClient http;
    
    // Initialize HTTP request
    http.begin(httpWifiClient, HEALTH_CHECK_ENDPOINT);
    
    // Send GET request
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
  } else {
    if (DEBUG) Serial.println("WiFi not connected, cannot perform health check");
  }
} 