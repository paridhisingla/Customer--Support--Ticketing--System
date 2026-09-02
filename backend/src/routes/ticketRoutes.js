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
  getAiSuggestions,
  streamEvents,
  triggerSlaScan,
} from '../controllers/ticketController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Real-Time SSE Events Stream (Agents and Clients)
router.get('/events/stream', streamEvents);

// Preview triage (open to authenticated users)
router.post('/preview-triage', requireAuth, previewTriage);

// Analytics (Agents / Admins)
router.get('/analytics', requireAuth, requireRole('agent', 'admin'), getAnalytics);

// Background SLA Scan Manual Trigger
router.post('/sla-scan', requireAuth, requireRole('agent', 'admin'), triggerSlaScan);

// Main ticket CRUD & interactions
router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, getTickets);
router.get('/:id', requireAuth, getTicketById);
router.get('/:id/ai-suggestions', requireAuth, requireRole('agent', 'admin'), getAiSuggestions);
router.patch('/:id/status', requireAuth, updateTicketStatus);
router.patch('/:id/assign', requireAuth, requireRole('agent', 'admin'), assignTicketAgent);
router.post('/:id/comments', requireAuth, addComment);

export default router;
