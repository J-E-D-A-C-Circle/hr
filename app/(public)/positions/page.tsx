import { prisma } from '@/lib/prisma';
import PositionsClient from './PositionsClient';

export const dynamic = 'force-dynamic';

export default async function PositionsPage() {
  let positions: any[] = [];
  let departments: any[] = [];

  try {
    [positions, departments] = await Promise.all([
      prisma.position.findMany({
        where: { status: 'OPEN' },
        include: {
          department: true,
          rubricCriteria: { select: { maxMark: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
    ]);
  } catch {
    // fallback if db not seeded yet
  }

  return <PositionsClient positions={positions} departments={departments} />;
}
