import { prisma } from '@/lib/prisma';
import ApplicantForm from '@/components/ApplicantForm';
import Navbar from '@/components/Navbar';


export const dynamic = 'force-dynamic';

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ positionId?: string }>;
}) {
  const { positionId } = await searchParams;

  let departments: any[] = [];
  let stations: any[] = [];
  let positions: any[] = [];

  try {
    [departments, stations, positions] = await Promise.all([
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.station.findMany({ orderBy: { name: 'asc' } }),
      prisma.position.findMany({
        where: { status: 'OPEN' },
        include: { department: true },
        orderBy: { title: 'asc' },
      }),
    ]);
  } catch {
    // Fallback default state if DB loading during static generation
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-8 text-center">
          <div className="inline-block bg-[#0F5132] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Official Application Portal
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Application & Placement Form</h1>
          <p className="text-gray-600 text-sm mt-1 max-w-xl mx-auto">
            Please fill out your details accurately. DVLA staff members must toggle the staff option to select their station.
          </p>
        </div>

        <ApplicantForm
          departments={departments}
          stations={stations}
          positions={positions}
          selectedPositionId={positionId}
        />
      </main>


    </div>
  );
}
