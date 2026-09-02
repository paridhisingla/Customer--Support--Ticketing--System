import prisma from '../utils/prisma.js';
import { eventBus } from './eventBus.js';

const URGENCY_ESCALATION = {
  LOW: 'MEDIUM',
  MEDIUM: 'HIGH',
  HIGH: 'CRITICAL',
  CRITICAL: 'CRITICAL',
};

let workerInterval = null;

/**
 * Execute a single SLA compliance and auto-escalation check pass
 */
export const runSlaCheck = async () => {
  try {
    const now = new Date();

    // 1. Find all active tickets (OPEN or IN_PROGRESS)
    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      include: {
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let breachedCount = 0;
    let escalatedCount = 0;

    for (const ticket of activeTickets) {
      if (!ticket.slaDeadline) continue;

      const deadline = new Date(ticket.slaDeadline);
      const isPastDeadline = now > deadline;

      if (isPastDeadline && !ticket.isSlaBreached) {
        // SLA has just been breached!
        breachedCount++;
        const previousUrgency = ticket.urgency;
        const escalatedUrgency = URGENCY_ESCALATION[ticket.urgency] || 'CRITICAL';
        const didEscalate = escalatedUrgency !== previousUrgency;

        if (didEscalate) {
          escalatedCount++;
        }

        // Update Ticket
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            isSlaBreached: true,
            urgency: escalatedUrgency,
          },
        });

        // Log Activity for Audit Trail
        await prisma.activityLog.create({
          data: {
            ticketId: ticket.id,
            action: 'SLA_ALERT',
            details: didEscalate
              ? `🚨 SLA BREACH DETECTED. Urgency auto-escalated from [${previousUrgency}] to [${escalatedUrgency}] by Background SLA Engine.`
              : `🚨 SLA BREACH DETECTED. Ticket is past target resolution deadline (${deadline.toLocaleTimeString()}).`,
          },
        });

        // Emit real-time broadcast event
        eventBus.broadcast('SLA_ESCALATED', {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          previousUrgency,
          newUrgency: escalatedUrgency,
          assignedAgent: ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned',
          breachedAt: now.toISOString(),
        });
      }
    }

    return {
      success: true,
      scanned: activeTickets.length,
      newBreaches: breachedCount,
      escalations: escalatedCount,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error during background SLA check:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Start the background SLA worker loop
 * @param {number} intervalMs - Poll interval in ms (default: 20 seconds)
 */
export const startSlaWorker = (intervalMs = 20000) => {
  if (workerInterval) {
    clearInterval(workerInterval);
  }

  console.log(`⏱️ [SLA Worker] Started background monitor (Interval: ${intervalMs / 1000}s).`);
  
  // Initial run on boot
  runSlaCheck();

  workerInterval = setInterval(async () => {
    await runSlaCheck();
  }, intervalMs);
};

/**
 * Stop background SLA worker (for graceful shutdown or tests)
 */
export const stopSlaWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('⏱️ [SLA Worker] Stopped background monitor.');
  }
};
