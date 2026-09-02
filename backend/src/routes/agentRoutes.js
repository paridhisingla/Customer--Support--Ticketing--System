import express from 'express';
import { getAgents } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getAgents);

export default router;
