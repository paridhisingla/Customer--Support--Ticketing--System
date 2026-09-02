import prisma from '../utils/prisma.js';
import { analyzeTicketContent, autoAssignAgent } from '../services/triageService.js';
import { eventBus } from '../services/eventBus.js';
import { runSlaCheck } from '../services/slaWorker.js';

/**
 * Preview intelligent triage results before client submission
 */
export const previewTriage = async (req, res) => {
  try {
    const { subject = '', description = '' } = req.body;
    const triageResult = analyzeTicketContent(subject, description);
    return res.status(200).json({
      success: true,
      data: triageResult,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a new support ticket with auto-triage, SLA, and auto-routing
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, description, departmentOverride, urgencyOverride, metadata, attachments } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Ticket subject and description are required.',
      });
    }

    // 1. Run Automated Triage & SLA Calculation
    const triage = analyzeTicketContent(subject, description);
    const finalUrgency = urgencyOverride || triage.urgency;
    const finalDepartment = departmentOverride || triage.department;

    // 2. Auto-Assign available support agent
    const assignedAgent = await autoAssignAgent(finalDepartment);

    // 3. Generate unique Ticket Number (e.g. TICK-1042)
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TICK-${1000 + ticketCount + 1}`;

    // 4. Create Ticket Record
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: subject.trim(),
        description: description.trim(),
        status: 'OPEN',
        urgency: finalUrgency,
        department: finalDepartment,
        tags: JSON.stringify(triage.tags),
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
        attachments: attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
        slaDeadline: triage.slaDeadline,
        clientId: req.user.id,
        assignedAgentId: assignedAgent ? assignedAgent.id : null,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true, department: true, avatar: true },
        },
      },
    });

    // 5. Create Initial Activity Logs
    await prisma.activityLog.createMany({
      data: [
        {
          ticketId: ticket.id,
          userId: req.user.id,
          action: 'CREATED',
          details: `Ticket created by ${req.user.name} (${req.user.email}).`,
        },
        {
          ticketId: ticket.id,
          userId: null,
          action: 'TRIAGED',
          details: `Auto-triaged as [${finalUrgency}] priority in [${finalDepartment}] department. SLA target: ${triage.slaHours}h.`,
        },
        ...(assignedAgent
          ? [
              {
                ticketId: ticket.id,
                userId: null,
                action: 'ASSIGNED',
                details: `Auto-assigned to agent ${assignedAgent.name} (${assignedAgent.department || 'General'}).`,
              },
            ]
          : []),
      ],
    });

    // 6. Broadcast Real-Time Event
    eventBus.broadcast('TICKET_CREATED', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      urgency: ticket.urgency,
      department: ticket.department,
      clientName: req.user.name,
      assignedAgent: assignedAgent ? assignedAgent.name : null,
      createdAt: ticket.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully. Your request has been acknowledged.',
      acknowledgement: {
        ticketNumber: ticket.ticketNumber,
        urgency: ticket.urgency,
        department: ticket.department,
        assignedAgent: ticket.assignedAgent ? ticket.assignedAgent.name : 'Queue (Pending Assignment)',
        slaDeadline: ticket.slaDeadline,
        slaHours: triage.slaHours,
      },
      ticket: {
        ...ticket,
        tags: JSON.parse(ticket.tags || '[]'),
        metadata: ticket.metadata ? JSON.parse(ticket.metadata) : null,
        attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
      },
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ticket.',
      error: error.message,
    });
  }
};

/**
 * Get tickets list with filters, sorting, and role scoping
 */
export const getTickets = async (req, res) => {
  try {
    const { status, urgency, department, search, assignedToMe, sortBy = 'created_desc', breachedOnly } = req.query;

    const whereClause = {};

    // Role-based visibility
    if (req.user.role === 'client') {
      whereClause.clientId = req.user.id;
    } else if (req.user.role === 'agent' && assignedToMe === 'true') {
      whereClause.assignedAgentId = req.user.id;
    }

    // Optional query filters
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (urgency && urgency !== 'ALL') {
      whereClause.urgency = urgency;
    }

    if (department && department !== 'ALL') {
      whereClause.department = department;
    }

    if (breachedOnly === 'true') {
      whereClause.isSlaBreached = true;
      whereClause.status = { in: ['OPEN', 'IN_PROGRESS'] };
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: search } },
        { description: { contains: search } },
        { ticketNumber: { contains: search } },
      ];
    }

    // Dynamic sorting
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'sla_asc') {
      orderBy = { slaDeadline: 'asc' };
    } else if (sortBy === 'created_asc') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'created_desc') {
      orderBy = { createdAt: 'desc' };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true, department: true, avatar: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy,
    });

    // Annotate and parse fields
    const now = new Date();
    const enrichedTickets = tickets.map((t) => {
      const isBreached = Boolean(t.isSlaBreached || (t.slaDeadline && now > new Date(t.slaDeadline) && !['RESOLVED', 'CLOSED'].includes(t.status)));
      let parsedMetadata = null;
      let parsedAttachments = [];
      try { parsedMetadata = t.metadata ? JSON.parse(t.metadata) : null; } catch (_) {}
      try { parsedAttachments = t.attachments ? JSON.parse(t.attachments) : []; } catch (_) {}

      return {
        ...t,
        isSlaBreached: isBreached,
        tags: JSON.parse(t.tags || '[]'),
        metadata: parsedMetadata,
        attachments: parsedAttachments,
      };
    });

    // If sorting by urgency priority
    if (sortBy === 'urgency_desc') {
      const urgencyRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      enrichedTickets.sort((a, b) => (urgencyRank[b.urgency] || 0) - (urgencyRank[a.urgency] || 0));
    }

    return res.status(200).json({
      success: true,
      count: enrichedTickets.length,
      tickets: enrichedTickets,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets.',
      error: error.message,
    });
  }
};

/**
 * Get single ticket details with comments and activity timeline
 */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true, department: true, avatar: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    // Role-based access check
    if (req.user.role === 'client' && ticket.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this ticket.',
      });
    }

    // Filter out internal comments if user is a client
    let visibleComments = ticket.comments;
    if (req.user.role === 'client') {
      visibleComments = ticket.comments.filter((c) => !c.isInternal);
    }

    const isBreached = Boolean(ticket.isSlaBreached || (ticket.slaDeadline && new Date() > new Date(ticket.slaDeadline) && !['RESOLVED', 'CLOSED'].includes(ticket.status)));

    let parsedMetadata = null;
    let parsedAttachments = [];
    try { parsedMetadata = ticket.metadata ? JSON.parse(ticket.metadata) : null; } catch (_) {}
    try { parsedAttachments = ticket.attachments ? JSON.parse(ticket.attachments) : []; } catch (_) {}

    return res.status(200).json({
      success: true,
      ticket: {
        ...ticket,
        tags: JSON.parse(ticket.tags || '[]'),
        metadata: parsedMetadata,
        attachments: parsedAttachments,
        comments: visibleComments,
        isSlaBreached: isBreached,
      },
    });
  } catch (error) {
    console.error('Get ticket details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve ticket details.',
      error: error.message,
    });
  }
};

/**
 * Update ticket status (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED)
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Client can only mark RESOLVED or CLOSED on their own ticket
    if (req.user.role === 'client') {
      if (ticket.clientId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
      if (!['RESOLVED', 'CLOSED'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Clients can only mark tickets as Resolved or Closed.',
        });
      }
    }

    const previousStatus = ticket.status;
    const isNowResolved = status === 'RESOLVED' || status === 'CLOSED';

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        resolvedAt: isNowResolved ? (ticket.resolvedAt || new Date()) : null,
      },
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        assignedAgent: { select: { id: true, name: true, email: true, department: true, avatar: true } },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        action: 'STATUS_UPDATED',
        details: `Status updated from ${previousStatus} to ${status} by ${req.user.name} (${req.user.role}).`,
      },
    });

    // Broadcast Event
    eventBus.broadcast('STATUS_UPDATED', {
      ticketId: id,
      ticketNumber: ticket.ticketNumber,
      previousStatus,
      newStatus: status,
      updatedBy: req.user.name,
    });

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status.',
      error: error.message,
    });
  }
};

/**
 * Reassign ticket to another agent
 */
export const assignTicketAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    let agentName = 'Unassigned';
    if (agentId) {
      const agent = await prisma.user.findFirst({
        where: { id: agentId, role: { in: ['agent', 'admin'] } },
      });
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Target agent not found.' });
      }
      agentName = agent.name;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { assignedAgentId: agentId || null },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true, department: true, avatar: true } },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        action: 'ASSIGNED',
        details: `Ticket reassigned to ${agentName} by ${req.user.name}.`,
      },
    });

    // Broadcast Event
    eventBus.broadcast('AGENT_ASSIGNED', {
      ticketId: id,
      ticketNumber: ticket.ticketNumber,
      agentName,
      assignedBy: req.user.name,
    });

    return res.status(200).json({
      success: true,
      message: `Ticket assigned to ${agentName}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Assign agent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign agent.',
      error: error.message,
    });
  }
};

/**
 * Add comment or internal note to ticket
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message body cannot be empty.',
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Permission checks
    if (req.user.role === 'client' && ticket.clientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    // Only agents/admins can post internal notes
    const finalIsInternal = req.user.role === 'client' ? false : Boolean(isInternal);

    const comment = await prisma.comment.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        message: message.trim(),
        isInternal: finalIsInternal,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    // Auto-update status to IN_PROGRESS if an agent replies to an OPEN ticket
    if (req.user.role === 'agent' && ticket.status === 'OPEN' && !finalIsInternal) {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        action: finalIsInternal ? 'INTERNAL_NOTE' : 'COMMENT_ADDED',
        details: finalIsInternal
          ? `Internal note added by ${req.user.name}.`
          : `Reply posted by ${req.user.name} (${req.user.role}).`,
      },
    });

    // Broadcast Event
    eventBus.broadcast('NEW_COMMENT', {
      ticketId: id,
      ticketNumber: ticket.ticketNumber,
      isInternal: finalIsInternal,
      authorName: req.user.name,
      authorRole: req.user.role,
      createdAt: comment.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post comment.',
      error: error.message,
    });
  }
};

/**
 * AI Smart Reply Suggestions Generator (Agent Copilot)
 */
export const getAiSuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, email: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const clientFirstName = ticket.client?.name?.split(' ')[0] || 'there';
    const dept = ticket.department || 'Technical';
    const urgency = ticket.urgency || 'MEDIUM';

    // Tailored smart reply templates
    let suggestions = [];

    if (dept === 'Technical') {
      suggestions = [
        {
          id: 'tech-1',
          title: '🛠 Request Diagnostic Info & Logs',
          text: `Hi ${clientFirstName},\n\nThank you for reporting this issue. Our engineering team is currently investigating. Could you please share the exact timestamp, API response code, or any browser console logs if available? This will help us isolate the problem faster.`,
        },
        {
          id: 'tech-2',
          title: '⚡ Investigating & Patch Underway',
          text: `Hello ${clientFirstName},\n\nWe have reproduced the issue on our staging environment and our dev team is rolling out a patch to mitigate this. We will update you here as soon as the fix is deployed.`,
        },
        {
          id: 'tech-3',
          title: '✅ Resolved & Verification Request',
          text: `Hi ${clientFirstName},\n\nWe have deployed a hotfix addressing this issue. Could you please verify on your end and let us know if everything is working smoothly now?`,
        },
      ];
    } else if (dept === 'Billing') {
      suggestions = [
        {
          id: 'bill-1',
          title: '💳 Reviewing Invoices & Payment Gateway',
          text: `Hello ${clientFirstName},\n\nI am reviewing your transaction history with our finance department. Please allow me a few minutes to pull the latest invoice records and resolve this duplicate charge for you.`,
        },
        {
          id: 'bill-2',
          title: '💰 Refund Initiated',
          text: `Hi ${clientFirstName},\n\nWe have processed a full refund for the duplicate transaction. The funds should reflect back in your original payment method within 3-5 business days. Your updated receipt has also been emailed.`,
        },
        {
          id: 'bill-3',
          title: '📋 Subscription Adjustments Made',
          text: `Hi ${clientFirstName},\n\nI have successfully updated your subscription tier and applied the requested billing adjustments. Your next cycle will reflect the corrected balance.`,
        },
      ];
    } else if (dept === 'Account') {
      suggestions = [
        {
          id: 'acc-1',
          title: '🔐 Identity Verification & Temporary Access',
          text: `Hi ${clientFirstName},\n\nFor security compliance, I have triggered a secure password reset link to your registered email. Please check your inbox and complete 2-factor authentication to regain access.`,
        },
        {
          id: 'acc-2',
          title: '👥 Role & Permission Update Completed',
          text: `Hello ${clientFirstName},\n\nYour account permissions and team member role configurations have been refreshed. Please log out and log back in to see the updated workspace.`,
        },
        {
          id: 'acc-3',
          title: '🛡 SSO & 2FA Reset Instructions',
          text: `Hi ${clientFirstName},\n\nWe have re-synchronized your SSO connection. Please attempt to login via your organization's identity provider. Let us know if you experience any further hurdles.`,
        },
      ];
    } else {
      suggestions = [
        {
          id: 'gen-1',
          title: '👋 General Acknowledgment & Inquiry',
          text: `Hello ${clientFirstName},\n\nThank you for reaching out to support. We have received your request and an agent is currently reviewing your inquiry. We'll be in touch shortly!`,
        },
        {
          id: 'gen-2',
          title: '✨ Feature Request Logged',
          text: `Hi ${clientFirstName},\n\nThank you for the valuable feedback! I have logged this feature request with our product roadmap team for upcoming sprints.`,
        },
        {
          id: 'gen-3',
          title: '🎯 Resolution Confirmation',
          text: `Hi ${clientFirstName},\n\nGlad we could assist you! If you have any additional questions, feel free to reply directly to this ticket. Otherwise, you can mark it as resolved whenever you're ready.`,
        },
      ];
    }

    return res.status(200).json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      department: dept,
      urgency,
      suggestions,
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestions.',
      error: error.message,
    });
  }
};

/**
 * Real-Time Server-Sent Events (SSE) Live Stream
 */
export const streamEvents = async (req, res) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Initial connection message
  res.write(`data: ${JSON.stringify({ event: 'CONNECTED', message: 'SSE Stream active', timestamp: new Date().toISOString() })}\n\n`);

  // Event listener callback
  const onEvent = (eventPayload) => {
    res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
  };

  eventBus.on('ticket_event', onEvent);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.off('ticket_event', onEvent);
  });
};

/**
 * Manual On-Demand SLA Background Scan Trigger
 */
export const triggerSlaScan = async (req, res) => {
  try {
    const result = await runSlaCheck();
    return res.status(200).json({
      success: true,
      message: 'Background SLA check completed successfully.',
      result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Analytics & SLA metrics for Agent Dashboard
 */
export const getAnalytics = async (req, res) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
    const inProgressTickets = await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } });

    const criticalTickets = await prisma.ticket.count({ where: { urgency: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } });
    const highTickets = await prisma.ticket.count({ where: { urgency: 'HIGH', status: { in: ['OPEN', 'IN_PROGRESS'] } } });
    const mediumTickets = await prisma.ticket.count({ where: { urgency: 'MEDIUM', status: { in: ['OPEN', 'IN_PROGRESS'] } } });
    const lowTickets = await prisma.ticket.count({ where: { urgency: 'LOW', status: { in: ['OPEN', 'IN_PROGRESS'] } } });

    // Active SLA Breaches
    const now = new Date();
    const breachedCount = await prisma.ticket.count({
      where: {
        OR: [
          { isSlaBreached: true },
          { slaDeadline: { lt: now } },
        ],
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    // Department Distribution
    const departments = ['Technical', 'Billing', 'Account', 'General'];
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const count = await prisma.ticket.count({ where: { department: dept } });
        return { department: dept, count };
      })
    );

    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;
    const slaComplianceRate = totalTickets > 0 ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100) : 100;

    return res.status(200).json({
      success: true,
      analytics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        breachedCount,
        resolutionRate,
        slaComplianceRate,
        urgencyDistribution: {
          CRITICAL: criticalTickets,
          HIGH: highTickets,
          MEDIUM: mediumTickets,
          LOW: lowTickets,
        },
        departmentDistribution: deptStats,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics.',
      error: error.message,
    });
  }
};
