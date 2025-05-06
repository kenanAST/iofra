import mongoose, { Document, Schema } from 'mongoose';

/**
 * Device status enumeration
 */
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

/**
 * Device type enumeration
 */
export enum DeviceType {
  SENSOR = 'sensor',
  ACTUATOR = 'actuator',
  GATEWAY = 'gateway',
}

/**
 * Telemetry data interface
 */
export interface TelemetryData {
  timestamp: Date;
  data: Record<string, any>;
}

/**
 * Sensor data interface
 */
export interface SensorData {
  _id: string;
  timestamp: Date;
  deviceId: string;
  telemetry: {
    temperature: number;
    humidity: number;
  };
}

/**
 * Device interface
 */
export interface IDevice {
  deviceId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  firmware?: string;
  lastSeen?: Date;
  sensors?: SensorData[];
  telemetry?: TelemetryData[];
  certificates?: {
    clientCert: string;
    clientKey: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device document interface for MongoDB
 */
export interface DeviceDocument extends IDevice, Document {}

/**
 * Device creation data interface
 */
export type DeviceCreateData = Omit<IDevice, 'createdAt' | 'updatedAt'>;

/**
 * Device update data interface
 */
export type DeviceUpdateData = Partial<Omit<IDevice, 'deviceId' | 'createdAt' | 'updatedAt'>>;

/**
 * Mongoose schema for device
 */
const deviceSchema = new Schema<DeviceDocument>(
  {
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: Object.values(DeviceType),
      default: DeviceType.SENSOR 
    },
    status: { 
      type: String, 
      enum: Object.values(DeviceStatus),
      default: DeviceStatus.OFFLINE
    },
    location: { type: String },
    ipAddress: { type: String },
    macAddress: { type: String },
    firmware: { type: String },
    lastSeen: { type: Date },
    sensors: [{
      _id: { type: String },
      timestamp: { type: Date, default: Date.now },
      deviceId: { type: String },
      telemetry: { type: Schema.Types.Mixed }
    }],
    telemetry: [{
      timestamp: { type: Date, default: Date.now },
      data: { type: Schema.Types.Mixed }
    }],
    certificates: {
      clientCert: { type: String },
      clientKey: { type: String }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

// Create indexes for efficient queries
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ type: 1 });
deviceSchema.index({ 'telemetry.timestamp': -1 });

// Create and export the Device model
export const Device = mongoose.model<DeviceDocument>('Device', deviceSchema);

// Export the Device type (previous interface kept for backward compatibility)
export type Device = IDevice; 