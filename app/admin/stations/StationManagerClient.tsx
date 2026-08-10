'use client';

import { useState } from 'react';
import { createStation, updateStation, deleteStation } from '@/app/actions/admin';

interface StationManagerClientProps {
  initialStations: Array<{
    id: string;
    name: string;
    code: string | null;
    location: string | null;
    _count: { applicants: number };
  }>;
  userRole: string;
}

export default function StationManagerClient({ initialStations, userRole }: StationManagerClientProps) {
  const [stations, setStations] = useState(initialStations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingStation(null);
    setName('');
    setCode('');
    setLocation('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: any) => {
    setEditingStation(st);
    setName(st.name);
    setCode(st.code);
    setLocation(st.location || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (editingStation) {
      const res = await updateStation(editingStation.id, name, code, location);
      setIsSubmitting(false);

      if (res.success && res.station) {
        setStations((prev) =>
          prev.map((s) => (s.id === res.station!.id ? { ...s, ...res.station } : s))
        );
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to update station.');
      }
    } else {
      const res = await createStation(name, code, location);
      setIsSubmitting(false);

      if (res.success && res.station) {
        setStations((prev) => [res.station as any, ...prev]);
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to create station.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return;
    const res = await deleteStation(id);
    if (res.success) {
      setStations((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert(res.error || 'Failed to delete station.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF0D7] p-5 rounded-3xl shadow-sm border border-[#E6D7A8]">
        <div>
          <div className="text-sm font-bold text-gray-900">Registered DVLA Stations Across Ghana</div>
          <div className="text-2xl font-black text-[#15803D]">{stations.length} Active Stations</div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#15803D] hover:bg-[#166534] text-white px-5 py-2.5 rounded-2xl font-extrabold text-sm shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          ➕ Add New DVLA Station
        </button>
      </div>

      <div className="bg-[#FAF0D7] rounded-3xl shadow-md border border-[#E6D7A8] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-900 text-white text-xs uppercase font-extrabold tracking-wider">
            <tr>
              <th className="px-6 py-4">Station Name</th>
              <th className="px-6 py-4">Station Code</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Staff Applications</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stations.map((st) => (
              <tr key={st.id} className="hover:bg-amber-50/40 transition">
                <td className="px-6 py-4 font-bold text-gray-900">{st.name}</td>
                <td className="px-6 py-4 font-mono font-bold text-amber-800">{st.code}</td>
                <td className="px-6 py-4 text-gray-600">{st.location || 'Ghana'}</td>
                <td className="px-6 py-4 font-bold text-emerald-800">{st._count?.applicants || 0} Staff</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(st)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 transition"
                  >
                    Edit
                  </button>
                  {userRole === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 transition"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                {editingStation ? 'Edit Station' : 'Create New DVLA Station'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-2xl text-red-800 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Station Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kumasi Main Station"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Station Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KSI-01"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Location Region / Address</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ashanti Region, Kumasi"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#15803D] hover:bg-[#166534] shadow transition"
                >
                  {isSubmitting ? 'Saving...' : editingStation ? 'Save Changes' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
