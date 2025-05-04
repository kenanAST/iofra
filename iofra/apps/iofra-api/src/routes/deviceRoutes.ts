import { Router } from 'express';
import { 
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
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

export default router; 