/**
 * Script to generate test data for the IoT platform
 * This creates sample devices and simulates telemetry data
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/iot-platform';

// Device types and statuses
const deviceTypes = ['sensor', 'actuator', 'gateway'];
const deviceStatuses = ['online', 'offline', 'maintenance'];

// Device Schema (simplified version of the actual schema)
const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: deviceTypes, default: 'sensor' },
    status: { type: String, enum: deviceStatuses, default: 'offline' },
    location: { type: String },
    ipAddress: { type: String },
    macAddress: { type: String },
    firmware: { type: String },
    lastSeen: { type: Date },
    telemetry: [{
      timestamp: { type: Date, default: Date.now },
      data: { type: mongoose.Schema.Types.Mixed }
    }],
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Create model
const Device = mongoose.model('Device', deviceSchema);

// Generate a random MAC address
function generateMacAddress() {
  return Array(6).fill(0).map(() => {
    return Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }).join(':');
}

// Generate a random IP address
function generateIpAddress() {
  return `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// Generate random telemetry data
function generateTelemetryData(deviceType) {
  const telemetry = [];
  const now = new Date();
  
  // Generate data for the last 24 hours
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
    let data = {};
    
    // Different telemetry data based on device type
    if (deviceType === 'sensor') {
      data = {
        temperature: parseFloat((20 + Math.random() * 10).toFixed(2)),
        humidity: parseFloat((40 + Math.random() * 40).toFixed(2)),
        batteryLevel: parseFloat((3 + Math.random() * 1.2).toFixed(2))
      };
    } else if (deviceType === 'actuator') {
      data = {
        state: Math.random() > 0.5 ? 'on' : 'off',
        dutyCycle: parseFloat((Math.random() * 100).toFixed(2)),
        powerConsumption: parseFloat((0.5 + Math.random() * 2).toFixed(2))
      };
    } else if (deviceType === 'gateway') {
      data = {
        connectedDevices: Math.floor(Math.random() * 10),
        cpuUsage: parseFloat((10 + Math.random() * 50).toFixed(2)),
        memoryUsage: parseFloat((20 + Math.random() * 60).toFixed(2)),
        signalStrength: parseFloat((-30 - Math.random() * 60).toFixed(2))
      };
    }
    
    telemetry.push({
      timestamp,
      data
    });
  }
  
  return telemetry;
}

// Generate a sample device
function generateDevice(index) {
  const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
  const deviceId = `${deviceType}_${index.toString().padStart(3, '0')}`;
  
  return {
    deviceId,
    name: `Test ${deviceType} ${index}`,
    type: deviceType,
    status: deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)],
    location: `Room ${Math.floor(Math.random() * 10) + 1}`,
    ipAddress: generateIpAddress(),
    macAddress: generateMacAddress(),
    firmware: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
    lastSeen: new Date(),
    telemetry: generateTelemetryData(deviceType),
    metadata: {
      manufacturer: 'Test Manufacturer',
      model: `Model-${Math.floor(Math.random() * 10) + 1}`,
      serialNumber: crypto.randomBytes(8).toString('hex')
    }
  };
}

// Main function to generate test data
async function generateTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Clear existing devices
    console.log('Clearing existing data...');
    await Device.deleteMany({});
    
    // Generate new devices
    console.log('Generating test devices...');
    const devices = [];
    
    for (let i = 1; i <= 10; i++) {
      devices.push(generateDevice(i));
    }
    
    // Insert devices into database
    console.log('Inserting test devices into database...');
    await Device.insertMany(devices);
    
    console.log(`Successfully created ${devices.length} test devices`);
    
    // Create a certificates directory if it doesn't exist
    const certDir = path.resolve(__dirname, '../apps/iofra-api/certs');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
      console.log(`Created certificates directory at ${certDir}`);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('Test data generation complete!');
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

// Run the main function
generateTestData(); 