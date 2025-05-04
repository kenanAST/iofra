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
 * Device interface
 */
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  firmware?: string;
  lastPing?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device creation data interface
 */
export type DeviceCreateData = Omit<Device, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Device update data interface
 */
export type DeviceUpdateData = Partial<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>; 