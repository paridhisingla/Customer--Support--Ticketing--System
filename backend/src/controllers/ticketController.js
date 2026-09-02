import prisma from '../utils/prisma.js';
import { analyzeTicketContent, autoAssignAgent } from '../services/triageService.js';

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
        metadata: metadata ? JSON.stringify(metadata) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
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
      ticket,
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
 * Get tickets list with filters and role scoping
 */
export const getTickets = async (req, res) => {
  try {
    const { status, urgency, department, search, assignedToMe } = req.query;

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

    if (search) {
      whereClause.OR = [
        { subject: { contains: search } },
        { description: { contains: search } },
        { ticketNumber: { contains: search } },
      ];
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
      orderBy: { createdAt: 'desc' },
    });

    // Check and annotate SLA status
    const now = new Date();
    const enrichedTickets = tickets.map((t) => {
      const isBreached = t.slaDeadline && now > new Date(t.slaDeadline) && !['RESOLVED', 'CLOSED'].includes(t.status);
      return {
        ...t,
        isSlaBreached: Boolean(isBreached),
        tags: JSON.parse(t.tags || '[]'),
      };
    });

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

    const isBreached = ticket.slaDeadline && new Date() > new Date(ticket.slaDeadline) && !['RESOLVED', 'CLOSED'].includes(ticket.status);

    return res.status(200).json({
      success: true,
      ticket: {
        ...ticket,
        tags: JSON.parse(ticket.tags || '[]'),
        comments: visibleComments,
        isSlaBreached: Boolean(isBreached),
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
        slaDeadline: { lt: now },
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
