import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import CmsSuiteClient from './CmsSuiteClient';

export const dynamic = 'force-dynamic';

export default async function AdminCmsSuitePage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/admin/login');
  }

  const [departments, positions, stations, documents] = await Promise.all([
    prisma.department.findMany({
      include: {
        _count: { select: { applications: true, positions: true, users: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.position.findMany({
      include: {
        department: true,
        rubricCriteria: { include: { subcriteria: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.station.findMany({
      include: {
        _count: { select: { applicants: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.requiredDocument.findMany({
      include: {
        _count: { select: { submittedDocuments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen flex bg-[#FDF6E3]">
      <AdminSidebar userRole={user.role} userName={user.name} />

      <main className="flex-1 p-6 md:p-10 md:ml-6 lg:ml-10 w-full max-w-7xl space-y-8 overflow-x-hidden">
        <CmsSuiteClient
          departments={departments}
          positions={positions}
          stations={stations}
          documents={documents}
          userRole={user.role}
        />
      </main>
    </div>
  );
}
