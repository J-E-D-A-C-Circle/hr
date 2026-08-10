import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminDashboardClient from './AdminDashboardClient';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; stage?: string }>;
}) {
  const user = await getAdminSession();
  if (!user) {
    redirect('/admin/login');
  }

  const { departmentId, stage } = await searchParams;

  // Scoping: Department Admin is strictly locked to their assigned department
  const effectiveDeptId = user.role === 'DEPT_ADMIN' ? user.departmentId || undefined : departmentId;

  const whereClause: any = {};
  if (effectiveDeptId) whereClause.departmentId = effectiveDeptId;
  if (stage) whereClause.currentStage = stage;

  const [applications, departments, stations] = await Promise.all([
    prisma.application.findMany({
      where: whereClause,
      include: {
        applicant: {
          include: { station: true, department: true },
        },
        position: true,
        department: true,
        documents: true,
        stageHistory: { orderBy: { createdAt: 'desc' } },
        panelScores: {
          include: { scoreDetails: true },
          orderBy: { createdAt: 'desc' },
        },
        appointmentLetter: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.station.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="min-h-screen flex bg-[#FDF6E3]">
      {/* Vertical Admin Sidebar */}
      <AdminSidebar userRole={user.role} userName={user.name} />

      <main className="flex-1 p-6 md:p-10 md:ml-6 lg:ml-10 w-full max-w-7xl space-y-8 overflow-x-hidden">
        {/* Admin Welcome Banner */}
        <div className="bg-[#FAF0D7] rounded-3xl shadow-sm border border-[#E6D7A8] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#15803D] text-white text-xs font-black px-3 py-1 rounded-xl uppercase shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Role: {user.role.replace('_', ' ')}</span>
              </span>
              {user.department && (
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-xl border border-amber-300">
                  Dept: {user.department.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-2">Welcome, {user.name}</h1>
            <p className="text-xs text-gray-600 font-medium">
              Review candidate applications, track stage transitions, inspect panel scores, and issue official HR appointment letters.
            </p>
          </div>
        </div>

        <AdminDashboardClient
          currentUser={user}
          initialApplications={applications}
          departments={departments}
          stations={stations}
          currentDeptId={effectiveDeptId}
          currentStage={stage}
        />
      </main>
    </div>
  );
}
