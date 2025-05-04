import { Router } from 'express';
import { 
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceTelemetry,
  initiateOtaUpdate,
  generateCertificates
} from '../controllers/deviceController';

const router = Router();

// GET /api/devices - Get all devices
router.get('/', getAllDevices);

// GET /api/devices/:id - Get a device by ID
router.get('/:id', getDeviceById);

// POST /api/devices - Create a new device
router.post('/', createDevice);

// PUT /api/devices/:id - Update a device
router.put('/:id', updateDevice);

// DELETE /api/devices/:id - Delete a device
router.delete('/:id', deleteDevice);

// GET /api/devices/:id/telemetry - Get device telemetry data
router.get('/:id/telemetry', getDeviceTelemetry);

// POST /api/devices/:id/ota - Initiate OTA update for a device
router.post('/:id/ota', initiateOtaUpdate);

// POST /api/devices/:id/certificates - Generate certificates for a device
router.post('/:id/certificates', generateCertificates);

export default router; 