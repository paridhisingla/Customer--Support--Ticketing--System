import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing records
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Agents
  const agentTech = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Tech Lead)',
      email: 'alex.tech@support.io',
      password: passwordHash,
      role: 'agent',
      department: 'Technical',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
    },
  });

  const agentBilling = await prisma.user.create({
    data: {
      name: 'Sarah Chen (Billing)',
      email: 'sarah.billing@support.io',
      password: passwordHash,
      role: 'agent',
      department: 'Billing',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah',
    },
  });

  const agentAccount = await prisma.user.create({
    data: {
      name: 'David Miller (Security & Access)',
      email: 'david.account@support.io',
      password: passwordHash,
      role: 'agent',
      department: 'Account',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=david',
    },
  });

  // 2. Create Clients
  const client1 = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Acme Corp)',
      email: 'client@acme.com',
      password: passwordHash,
      role: 'client',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Marcus Vance (Apex Innovations)',
      email: 'marcus@apex.io',
      password: passwordHash,
      role: 'client',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus',
    },
  });

  console.log('✅ Users & Agents created.');

  // 3. Create Sample Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TICK-1001',
      subject: 'Critical: Production API Gateway returning 500 errors',
      description: 'Our checkout endpoint is returning 500 Internal Server Error when processing webhooks. Multiple customer orders are failing right now in production.',
      status: 'IN_PROGRESS',
      urgency: 'CRITICAL',
      department: 'Technical',
      tags: JSON.stringify(['technical', 'outage', 'api', 'critical']),
      slaDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // in 1.5 hours
      clientId: client1.id,
      assignedAgentId: agentTech.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TICK-1002',
      subject: 'Charged twice on annual Enterprise subscription renewal',
      description: 'We were billed $2,400 twice on invoice #INV-9821 on Oct 12th. Please review and process the refund for the duplicate transaction.',
      status: 'OPEN',
      urgency: 'HIGH',
      department: 'Billing',
      tags: JSON.stringify(['billing', 'refund', 'charge twice']),
      slaDeadline: new Date(Date.now() + 4.5 * 60 * 60 * 1000), // in 4.5 hours
      clientId: client1.id,
      assignedAgentId: agentBilling.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TICK-1003',
      subject: 'SSO SAML authentication setup assistance needed',
      description: 'We are trying to configure Okta SSO for our 50-member team. The metadata XML verification is failing at the assertion step.',
      status: 'OPEN',
      urgency: 'MEDIUM',
      department: 'Account',
      tags: JSON.stringify(['account', 'sso', 'saml', 'auth']),
      slaDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000), // in 20 hours
      clientId: client2.id,
      assignedAgentId: agentAccount.id,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TICK-1004',
      subject: 'Minor typo in webhook documentation headers',
      description: 'In section 4.2 of the docs, X-Signature is misspelled as X-Siganture in the curl example.',
      status: 'RESOLVED',
      urgency: 'LOW',
      department: 'Technical',
      tags: JSON.stringify(['docs', 'typo', 'feedback']),
      slaDeadline: new Date(Date.now() - 5 * 60 * 60 * 1000),
      resolvedAt: new Date(),
      clientId: client2.id,
      assignedAgentId: agentTech.id,
    },
  });

  // 4. Create Activity Logs and Comments for Ticket 1
  await prisma.activityLog.createMany({
    data: [
      {
        ticketId: ticket1.id,
        userId: client1.id,
        action: 'CREATED',
        details: 'Ticket raised by Elena Rostova (client@acme.com).',
      },
      {
        ticketId: ticket1.id,
        userId: null,
        action: 'TRIAGED',
        details: 'Auto-triaged as [CRITICAL] urgency. Routed to [Technical] department. SLA set to 2 hours.',
      },
      {
        ticketId: ticket1.id,
        userId: null,
        action: 'ASSIGNED',
        details: `Auto-assigned to ${agentTech.name}.`,
      },
      {
        ticketId: ticket1.id,
        userId: agentTech.id,
        action: 'STATUS_UPDATED',
        details: 'Status changed from OPEN to IN_PROGRESS.',
      },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        userId: client1.id,
        message: 'Here is the error log snippet: HTTP 500 - Webhook worker connection timed out after 30000ms.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        userId: agentTech.id,
        message: 'Investigating right now. Checking the Redis queue workers and the database connection pool.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        userId: agentTech.id,
        message: 'Internal Note: Node pool 3 experienced memory pressure. Initiated auto-scaler rolling restart.',
        isInternal: true,
      },
    ],
  });

  console.log('✅ Tickets, activity logs, and comments seeded.');
  console.log('\n--- DEMO ACCOUNTS CREATED ---');
  console.log('1. Client Account:');
  console.log('   Email: client@acme.com');
  console.log('   Password: password123');
  console.log('\n2. Agent Accounts:');
  console.log('   Email: alex.tech@support.io (Technical)');
  console.log('   Email: sarah.billing@support.io (Billing)');
  console.log('   Email: david.account@support.io (Account)');
  console.log('   Password for all: password123');
  console.log('-----------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
