'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Search,
  Plus,
  X,
  Edit,
  Trash2,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Application, Station } from '@/lib/types/admin';
import ShadcnSelect from '@/components/ui/ShadcnSelect';

interface StationsTabProps {
  stations: Station[];
  applications: Application[];
  onNavigateTab: (tab: any) => void;
  onUpdateStations: (updatedStations: Station[]) => void;
}

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Bono',
  'Bono East',
  'Ahafo',
  'Upper East',
  'Upper West',
  'Oti',
  'Western North',
  'Savannah',
  'North East'
];

export default function StationsTab({
  stations,
  applications,
  onNavigateTab,
  onUpdateStations
}: StationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStationForEdit, setSelectedStationForEdit] = useState<Station | null>(null);

  // Add station form fields
  const [newStationName, setNewStationName] = useState('');
  const [newStationRegion, setNewStationRegion] = useState('Greater Accra');
  const [newStationCapacity, setNewStationCapacity] = useState<number>(20);
  const [newStationDeptInput, setNewStationDeptInput] = useState('');
  const [newStationDepartments, setNewStationDepartments] = useState<string[]>([
    'Driver Licensing & Testing',
    'Vehicle Inspection & Registration',
    'Customer Experience Desk'
  ]);

  // Edit station form fields
  const [editDeptInput, setEditDeptInput] = useState('');

  const approved = applications.filter((a) => a.status === 'approved');

  // Compute counts per station
  const stationCounts: Record<string, number> = {};
  approved.forEach((app) => {
    if (app.posting_station) {
      stationCounts[app.posting_station] = (stationCounts[app.posting_station] || 0) + 1;
    }
  });

  const filteredStations = stations.filter(
    (st) =>
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add department to new station form
  const handleAddDeptToNewStation = () => {
    const trimmed = newStationDeptInput.trim();
    if (!trimmed) return;
    if (newStationDepartments.includes(trimmed)) {
      toast.error('Department already exists for this station');
      return;
    }
    setNewStationDepartments([...newStationDepartments, trimmed]);
    setNewStationDeptInput('');
  };

  const handleRemoveDeptFromNewStation = (deptName: string) => {
    setNewStationDepartments(newStationDepartments.filter((d) => d !== deptName));
  };

  // Submit new station creation
  const handleCreateStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) {
      toast.error('Please enter a station name');
      return;
    }

    if (stations.some((s) => s.name.toLowerCase() === newStationName.trim().toLowerCase())) {
      toast.error('A station with this name already exists');
      return;
    }

    const createdStation: Station = {
      id: `st-${Date.now()}`,
      name: newStationName.trim(),
      region: newStationRegion,
      capacity: Number(newStationCapacity) || 20,
      departments: newStationDepartments.length > 0 ? newStationDepartments : ['General Administration']
    };

    const updated = [...stations, createdStation];
    onUpdateStations(updated);
    toast.success(`Station "${createdStation.name}" created successfully!`);

    // Reset and close
    setNewStationName('');
    setNewStationCapacity(20);
    setNewStationDepartments([
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Customer Experience Desk'
    ]);
    setIsAddModalOpen(false);
  };

  // Department management for existing station edit modal
  const handleAddDeptToSelectedStation = () => {
    if (!selectedStationForEdit) return;
    const trimmed = editDeptInput.trim();
    if (!trimmed) return;

    if (selectedStationForEdit.departments.includes(trimmed)) {
      toast.error('Department already exists in this station');
      return;
    }

    const updatedDepts = [...selectedStationForEdit.departments, trimmed];
    const updatedStation = { ...selectedStationForEdit, departments: updatedDepts };
    const updatedList = stations.map((s) => (s.id === updatedStation.id ? updatedStation : s));

    setSelectedStationForEdit(updatedStation);
    onUpdateStations(updatedList);
    setEditDeptInput('');
    toast.success(`Added department "${trimmed}" to ${updatedStation.name}`);
  };

  const handleRemoveDeptFromSelectedStation = (deptName: string) => {
    if (!selectedStationForEdit) return;
    if (selectedStationForEdit.departments.length <= 1) {
      toast.error('A station must have at least one department');
      return;
    }

    const updatedDepts = selectedStationForEdit.departments.filter((d) => d !== deptName);
    const updatedStation = { ...selectedStationForEdit, departments: updatedDepts };
    const updatedList = stations.map((s) => (s.id === updatedStation.id ? updatedStation : s));

    setSelectedStationForEdit(updatedStation);
    onUpdateStations(updatedList);
    toast.success(`Removed department "${deptName}"`);
  };

  const handleUpdateStationCapacity = (newCap: number) => {
    if (!selectedStationForEdit) return;
    const updatedStation = { ...selectedStationForEdit, capacity: Math.max(1, newCap) };
    const updatedList = stations.map((s) => (s.id === updatedStation.id ? updatedStation : s));

    setSelectedStationForEdit(updatedStation);
    onUpdateStations(updatedList);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d5c2e] via-[#094824] to-teal-950 border border-emerald-700/50 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-extrabold text-white">DVLA Station & Department Management Hub</h2>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium">
            Manage regional stations, allocate personnel capacities, and customize station-specific placement departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e]"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Station</span>
          </button>
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const currentCount = stationCounts[station.name] || 0;
          const percentage = Math.min(100, Math.round((currentCount / station.capacity) * 100));

          return (
            <div
              key={station.id || station.name}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0d5c2e]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0d5c2e] transition-colors">
                      {station.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0d5c2e]" />
                      <span>{station.region} Region</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-xl bg-emerald-50 text-[#0d5c2e] border border-emerald-200">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>

                {/* Active Departments Badge Count */}
                <div className="mt-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-600">
                    {station.departments?.length || 0} Placement Departments
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Deployed Personnel:</span>
                    <span className="font-extrabold text-slate-900">
                      {currentCount} / {station.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage > 85
                          ? 'bg-amber-500'
                          : percentage > 0
                          ? 'bg-[#0d5c2e]'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block text-right">
                    {percentage}% Occupancy Rate
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedStationForEdit(station)}
                  className="flex items-center gap-1 text-xs text-[#0d5c2e] font-extrabold hover:underline"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Manage Departments ({station.departments?.length || 0})</span>
                </button>

                <button
                  onClick={() => onNavigateTab('applications')}
                  className="text-xs text-slate-500 font-bold hover:text-[#0d5c2e]"
                >
                  View Roster →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW STATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#0d5c2e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-base text-white">Create New DVLA Station</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Station Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="e.g. Kasoa District Office"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Region *</label>
                  <ShadcnSelect
                    options={GHANA_REGIONS.map((r) => ({ value: r, label: r }))}
                    value={newStationRegion}
                    onChange={(val) => setNewStationRegion(val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Personnel Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newStationCapacity}
                    onChange={(e) => setNewStationCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Station Departments Builder */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Station Placement Departments
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newStationDeptInput}
                    onChange={(e) => setNewStationDeptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeptToNewStation();
                      }
                    }}
                    placeholder="Type department & click Add..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeptToNewStation}
                    className="px-3 py-1.5 rounded-xl bg-[#0d5c2e] text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[60px]">
                  {newStationDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                    >
                      {dept}
                      <button
                        type="button"
                        onClick={() => handleRemoveDeptFromNewStation(dept)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition-colors"
                >
                  Create Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATION & DEPARTMENTS DETAIL MODAL */}
      {selectedStationForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#0d5c2e] to-teal-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-300" />
                  <h3 className="font-extrabold text-base text-white">
                    {selectedStationForEdit.name}
                  </h3>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                  {selectedStationForEdit.region} Region • Capacity: {selectedStationForEdit.capacity}
                </p>
              </div>
              <button
                onClick={() => setSelectedStationForEdit(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Capacity Setting */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Adjust Station Allocation Capacity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={selectedStationForEdit.capacity}
                    onChange={(e) => handleUpdateStationCapacity(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    Current Deployed: {stationCounts[selectedStationForEdit.name] || 0}
                  </span>
                </div>
              </div>

              {/* Station Specific Departments Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0d5c2e]" /> Station Placement Departments
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedStationForEdit.departments.length} registered
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={editDeptInput}
                    onChange={(e) => setEditDeptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeptToSelectedStation();
                      }
                    }}
                    placeholder="Enter new department name for this station..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeptToSelectedStation}
                    className="px-4 py-2 rounded-xl bg-[#0d5c2e] text-white text-xs font-extrabold hover:bg-emerald-800 transition-colors"
                  >
                    Add Dept
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {selectedStationForEdit.departments.map((dept) => (
                    <div
                      key={dept}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#0d5c2e]" />
                        <span>{dept}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeptFromSelectedStation(dept)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Remove department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStationForEdit(null)}
                  className="px-5 py-2 rounded-xl bg-[#0d5c2e] text-white text-xs font-extrabold hover:bg-emerald-800 transition-colors"
                >
                  Done & Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

