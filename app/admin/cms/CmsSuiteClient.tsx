'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DepartmentManagerClient from '../departments/DepartmentManagerClient';
import PositionManagerClient from '../positions/PositionManagerClient';
import StationManagerClient from '../stations/StationManagerClient';
import DocumentChecklistManagerClient from '../documents/DocumentChecklistManagerClient';
import AdminPanelMonitor from '@/components/AdminPanelMonitor';
import AdminFraudCenter from '@/components/AdminFraudCenter';
import { Building2, Briefcase, MapPin, ClipboardList, Settings2, Users, ShieldAlert } from 'lucide-react';

export default function CmsSuiteClient({
  departments,
  positions,
  stations,
  documents,
  userRole,
}: {
  departments: any[];
  positions: any[];
  stations: any[];
  documents: any[];
  userRole: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'stations' | 'documents' | 'panel-monitor' | 'fraud'>(
    (tabParam as any) || 'departments'
  );

  useEffect(() => {
    if (tabParam && ['departments', 'positions', 'stations', 'documents', 'panel-monitor', 'fraud'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabSwitch = (tab: 'departments' | 'positions' | 'stations' | 'documents' | 'panel-monitor' | 'fraud') => {
    setActiveTab(tab);
    router.push(`/admin/cms?tab=${tab}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-[#FAF0D7] rounded-3xl p-6 shadow-sm border border-[#E6D7A8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-amber-900 bg-amber-200/70 px-3 py-1 rounded-xl border border-amber-400/60 inline-flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            <span>Unified Administrative CMS & Security Hub</span>
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">DVLA System Configurations & Monitor</h1>
          <p className="text-xs text-gray-600 font-medium mt-0.5">
            Manage authority departments, vacancy positions, scoring rubrics, stations directory, real-time panel scoring, and document authenticity alerts.
          </p>
        </div>
      </div>

      {/* Interactive Segmented Switcher / Slider Bar */}
      <div className="bg-[#FAF0D7] p-2 rounded-3xl shadow-sm border border-[#E6D7A8]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          
          {/* Departments Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('departments')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-[#15803D] text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Departments ({departments.length})</span>
          </button>

          {/* Positions & Rubrics Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('positions')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'positions'
                ? 'bg-[#15803D] text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>Positions & Rubrics ({positions.length})</span>
          </button>

          {/* Stations Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('stations')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'stations'
                ? 'bg-[#15803D] text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>Stations ({stations.length})</span>
          </button>

          {/* Document Checklist Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('documents')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-[#15803D] text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Checklist ({documents.length})</span>
          </button>

          {/* Panel Monitor Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('panel-monitor')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'panel-monitor'
                ? 'bg-[#15803D] text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <Users className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Panel Monitor</span>
          </button>

          {/* Fraud & Authenticity Hub Tab */}
          <button
            type="button"
            onClick={() => handleTabSwitch('fraud')}
            className={`py-3 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'fraud'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-gray-800 hover:bg-[#F3E5C0]'
            }`}
            style={{ height: '44px', maxHeight: '44px' }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>Fraud Hub</span>
          </button>

        </div>
      </div>

      {/* Tab Panel Content Area */}
      <div className="transition-all duration-300">
        {activeTab === 'departments' && (
          <DepartmentManagerClient initialDepartments={departments} userRole={userRole} />
        )}

        {activeTab === 'positions' && (
          <PositionManagerClient
            initialPositions={positions}
            departments={departments}
            userRole={userRole}
          />
        )}

        {activeTab === 'stations' && (
          <StationManagerClient initialStations={stations} userRole={userRole} />
        )}

        {activeTab === 'documents' && (
          <DocumentChecklistManagerClient initialDocuments={documents} userRole={userRole} />
        )}

        {activeTab === 'panel-monitor' && (
          <AdminPanelMonitor />
        )}

        {activeTab === 'fraud' && (
          <AdminFraudCenter />
        )}
      </div>
    </div>
  );
}
