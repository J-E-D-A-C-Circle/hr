import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import RubricBuilderClient from './RubricBuilderClient';

export const dynamic = 'force-dynamic';

export default async function RubricBuilderPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const user = await getAdminSession();
  if (!user) redirect('/admin/login');

  const { positionId } = await params;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      department: true,
      rubricCriteria: {
        include: { subcriteria: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!position) {
    redirect('/admin/positions');
  }

  return (
    <div className="min-h-screen flex bg-[#FDF6E3]">
      <AdminSidebar userRole={user.role} userName={user.name} />

      <main className="flex-1 p-6 md:p-10 md:ml-6 lg:ml-10 w-full max-w-5xl space-y-8 overflow-x-hidden">
        <div className="bg-[#FAF0D7] rounded-3xl p-6 shadow-sm border border-[#E6D7A8] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
              Rubric Builder CMS
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">
              Scoring Rubric — {position.title}
            </h1>
            <p className="text-xs text-gray-600">
              Department: <strong>{position.department.name}</strong> | Position Type: <strong>{position.type}</strong>
            </p>
          </div>

          <a href="/admin/positions" className="text-xs font-bold text-[#15803D] hover:underline">
            ← Back to Positions
          </a>
        </div>

        <RubricBuilderClient position={position} />
      </main>
    </div>
  );
}
