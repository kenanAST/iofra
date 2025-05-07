import { Router } from 'express';
import deviceRoutes from './deviceRoutes';
import emailRoutes from './emailRoutes';

const router = Router();

// Define API routes
router.use('/devices', deviceRoutes);
router.use('/email', emailRoutes);

// Add more routes as needed
// router.use('/users', userRoutes);

export const apiRoutes = router;
export default router; 