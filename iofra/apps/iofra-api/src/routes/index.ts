import { Router } from 'express';
import deviceRoutes from './deviceRoutes';

const router = Router();

// Define API routes
router.use('/devices', deviceRoutes);

// Add more routes as needed
// router.use('/users', userRoutes);

export const apiRoutes = router;
export default router; 