import prisma from '../utils/prisma.js';

export const getAgents = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['agent', 'admin'] } },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        avatar: true,
        _count: {
          select: {
            assignedTickets: {
              where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      agents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve agents list.',
      error: error.message,
    });
  }
};
