import express from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicketAgent,
  addComment,
  getAnalytics,
  previewTriage,
} from '../controllers/ticketController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Preview triage (open to authenticated users)
router.post('/preview-triage', requireAuth, previewTriage);

// Analytics (Agents / Admins)
router.get('/analytics', requireAuth, requireRole('agent', 'admin'), getAnalytics);

// Main ticket CRUD & interactions
router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, getTickets);
router.get('/:id', requireAuth, getTicketById);
router.patch('/:id/status', requireAuth, updateTicketStatus);
router.patch('/:id/assign', requireAuth, requireRole('agent', 'admin'), assignTicketAgent);
router.post('/:id/comments', requireAuth, addComment);

export default router;
