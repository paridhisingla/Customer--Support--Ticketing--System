import prisma from '../utils/prisma.js';

// SLA Target Durations (in milliseconds)
const SLA_HOURS = {
  CRITICAL: 2,  // 2 hours
  HIGH: 6,      // 6 hours
  MEDIUM: 24,   // 24 hours
  LOW: 48,      // 48 hours
};

const KEYWORDS = {
  CRITICAL: ['outage', 'down', 'crash', 'breach', 'security', 'critical', 'production', 'blocker', 'emergency', 'data loss', 'stolen'],
  HIGH: ['error', 'failed', 'refund', 'charge twice', 'broken', 'cannot access', 'urgent', 'exception', 'timeout', 'loss of service'],
  MEDIUM: ['update', 'change', 'billing', 'invoice', 'subscription', 'how to', 'feature request', 'slow', 'delay'],
  LOW: ['typo', 'feedback', 'suggestion', 'minor', 'docs', 'documentation', 'cosmetic', 'inquiry'],
};

const DEPARTMENT_RULES = [
  {
    department: 'Billing',
    keywords: ['bill', 'invoice', 'payment', 'refund', 'charge', 'card', 'subscription', 'pricing', 'checkout', 'stripe', 'money', 'transaction'],
    tags: ['billing', 'payment', 'finance'],
  },
  {
    department: 'Technical',
    keywords: ['api', 'server', 'database', 'bug', 'code', '500', '404', 'integration', 'stack trace', 'sdk', 'backend', 'frontend', 'latency', 'gateway'],
    tags: ['technical', 'dev', 'infrastructure'],
  },
  {
    department: 'Account',
    keywords: ['login', 'password', 'auth', '2fa', 'mfa', 'profile', 'sso', 'signup', 'reset', 'permission', 'role', 'team', 'member'],
    tags: ['account', 'security', 'access'],
  },
];

export const analyzeTicketContent = (subject = '', description = '') => {
  const combined = `${subject} ${description}`.toLowerCase();
  
  // 1. Detect Urgency
  let detectedUrgency = 'MEDIUM';
  if (KEYWORDS.CRITICAL.some((kw) => combined.includes(kw))) {
    detectedUrgency = 'CRITICAL';
  } else if (KEYWORDS.HIGH.some((kw) => combined.includes(kw))) {
    detectedUrgency = 'HIGH';
  } else if (KEYWORDS.LOW.some((kw) => combined.includes(kw))) {
    detectedUrgency = 'LOW';
  }

  // 2. Detect Department & Tags
  let detectedDepartment = 'General';
  const extractedTags = new Set(['ticket']);

  for (const rule of DEPARTMENT_RULES) {
    const matchedCount = rule.keywords.filter((kw) => combined.includes(kw)).length;
    if (matchedCount > 0) {
      detectedDepartment = rule.department;
      rule.tags.forEach((t) => extractedTags.add(t));
      break;
    }
  }

  // Add urgency tag
  extractedTags.add(detectedUrgency.toLowerCase());

  // 3. Compute SLA Deadline
  const slaDurationMs = (SLA_HOURS[detectedUrgency] || 24) * 60 * 60 * 1000;
  const slaDeadline = new Date(Date.now() + slaDurationMs);

  return {
    urgency: detectedUrgency,
    department: detectedDepartment,
    tags: Array.from(extractedTags),
    slaDeadline,
    slaHours: SLA_HOURS[detectedUrgency],
  };
};

/**
 * Intelligent Agent Auto-Assigner (Load-Balanced)
 * Finds available agent in the specified department with the lowest active ticket count.
 */
export const autoAssignAgent = async (department) => {
  try {
    // 1. Find agents matching department first, or all agents if no specific match
    let agents = await prisma.user.findMany({
      where: {
        role: 'agent',
        department: department !== 'General' ? department : undefined,
      },
      include: {
        assignedTickets: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        },
      },
    });

    // Fallback to any active agent if department specific not available
    if (agents.length === 0) {
      agents = await prisma.user.findMany({
        where: { role: 'agent' },
        include: {
          assignedTickets: {
            where: {
              status: { in: ['OPEN', 'IN_PROGRESS'] },
            },
          },
        },
      });
    }

    if (agents.length === 0) {
      return null;
    }

    // Sort by lowest workload (least active assigned tickets)
    agents.sort((a, b) => a.assignedTickets.length - b.assignedTickets.length);

    return agents[0];
  } catch (error) {
    console.error('Error during agent auto-assignment:', error);
    return null;
  }
};
