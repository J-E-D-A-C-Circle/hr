'use client';

import { useState } from 'react';
import { createPosition, updatePosition, deletePosition } from '@/app/actions/admin';
import { PositionType, PositionStatus } from '@prisma/client';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, SlidersHorizontal, Briefcase, AlertCircle } from 'lucide-react';

interface PositionManagerClientProps {
  initialPositions: Array<{
    id: string;
    title: string;
    type: PositionType;
    departmentId: string;
    description: string | null;
    requirements: string | null;
    status: PositionStatus;
    maxMarks: number;
    department: { name: string; code: string };
    rubricCriteria: any[];
    _count: { applications: number };
  }>;
  departments: Array<{ id: string; name: string; code: string }>;
  userRole: string;
}

export default function PositionManagerClient({
  initialPositions,
  departments,
  userRole,
}: PositionManagerClientProps) {
  const [positions, setPositions] = useState(initialPositions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PositionType>('ATTACHMENT');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<PositionStatus>('OPEN');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingPos(null);
    setTitle('');
    setType('ATTACHMENT');
    setDepartmentId(departments[0]?.id || '');
    setDescription('');
    setRequirements('');
    setStatus('OPEN');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pos: any) => {
    setEditingPos(pos);
    setTitle(pos.title);
    setType(pos.type);
    setDepartmentId(pos.departmentId);
    setDescription(pos.description || '');
    setRequirements(pos.requirements || '');
    setStatus(pos.status);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (editingPos) {
      const res = await updatePosition(editingPos.id, {
        title,
        type,
        departmentId,
        description,
        requirements,
        status,
      });
      setIsSubmitting(false);

      if (res.success && res.position) {
        setPositions((prev) =>
          prev.map((p) => (p.id === res.position!.id ? { ...p, ...res.position } : p))
        );
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to update position.');
      }
    } else {
      const res = await createPosition({
        title,
        type,
        departmentId,
        description,
        requirements,
      });
      setIsSubmitting(false);

      if (res.success && res.position) {
        setPositions((prev) => [res.position as any, ...prev]);
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to create position.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target position?')) return;
    const res = await deletePosition(id);
    if (res.success) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(res.error || 'Failed to delete position.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions Card */}
      <div className="bg-[#FAF0D7] p-6 rounded-3xl shadow-sm border border-[#E6D7A8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#15803D]" />
            <span>Total Placement Positions & Vacancies</span>
          </div>
          <div className="text-2xl font-black text-[#15803D] mt-0.5">{positions.length} Active Roles</div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#15803D] hover:bg-[#166534] text-white px-5 rounded-2xl font-bold text-sm shadow transition inline-flex items-center space-x-2 shrink-0 cursor-pointer self-start sm:self-center"
          style={{ height: '42px', maxHeight: '42px' }}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Create New Position / Role</span>
        </button>
      </div>

      {/* Positions Table */}
      <div className="bg-[#FAF0D7] rounded-3xl shadow-md border border-[#E6D7A8] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0F4327] text-white text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Position Title & Dept</th>
              <th className="px-6 py-4">Placement Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Rubric Configuration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6D7A8] font-medium bg-[#FAF0D7]">
            {positions.map((pos) => (
              <tr key={pos.id} className="hover:bg-[#F3E5C0] transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 text-base">{pos.title}</div>
                  <div className="text-xs text-gray-600 font-semibold mt-0.5">
                    Dept: {pos.department.name} ({pos.department.code})
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-300">
                    {pos.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl uppercase ${
                      pos.status === 'OPEN'
                        ? 'bg-green-100 text-green-900 border border-green-300'
                        : pos.status === 'CLOSED'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                    }`}
                  >
                    {pos.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-700">
                      {pos.rubricCriteria.length} Criteria Configured
                    </span>
                    <Link
                      href={`/admin/rubrics/${pos.id}`}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 h-7"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Manage Rubric</span>
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(pos)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1 rounded-xl border border-amber-300 transition inline-flex items-center"
                    style={{ height: '32px', maxHeight: '32px' }}
                  >
                    Edit
                  </button>
                  {userRole === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(pos.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-xl border border-red-200 transition inline-flex items-center"
                      style={{ height: '32px', maxHeight: '32px' }}
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

      {/* Modal Drawer for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF0D7] rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-[#E6D7A8] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6D7A8] pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPos ? 'Edit Position Role' : 'Create New Placement Position'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-2xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineering Trainee"
                  className="w-full border border-[#E6D7A8] bg-[#FDF8EB] rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Placement Type *</label>
                  <Select value={type} onValueChange={(val) => setType(val as PositionType)}>
                    <SelectTrigger className="rounded-xl bg-[#FDF8EB] border-[#E6D7A8]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                      <SelectItem value="ATTACHMENT">ATTACHMENT</SelectItem>
                      <SelectItem value="TEMPORARY">TEMPORARY</SelectItem>
                      <SelectItem value="PERMANENT">PERMANENT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Target Department *</label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="rounded-xl bg-[#FDF8EB] border-[#E6D7A8]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingPos && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Position Status *</label>
                  <Select value={status} onValueChange={(val) => setStatus(val as PositionStatus)}>
                    <SelectTrigger className="rounded-xl bg-[#FDF8EB] border-[#E6D7A8]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-[#FDF8EB] border-[#E6D7A8]">
                      <SelectItem value="OPEN">OPEN</SelectItem>
                      <SelectItem value="CLOSED">CLOSED</SelectItem>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline core responsibilities for this role..."
                  className="w-full border border-[#E6D7A8] bg-[#FDF8EB] rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Qualification Requirements</label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Degree, HND, diploma, or specific skills required..."
                  className="w-full border border-[#E6D7A8] bg-[#FDF8EB] rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-[#E6D7A8] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200 border border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#15803D] hover:bg-[#166534] shadow transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingPos ? 'Save Changes' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
