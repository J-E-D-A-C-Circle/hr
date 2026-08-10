'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDepartment, updateDepartment, deleteDepartment } from '@/app/actions/admin';
import { Building2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function DepartmentManagerClient({
  initialDepartments,
  userRole,
}: {
  initialDepartments: any[];
  userRole: string;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = editingDept
      ? await updateDepartment(editingDept.id, name, code, description)
      : await createDepartment(name, code, description);

    setIsSubmitting(false);

    if (res.success) {
      setName('');
      setCode('');
      setDescription('');
      setEditingDept(null);
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Operation failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    const res = await deleteDepartment(id);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Delete failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Form */}
      <div className="bg-[#FAF0D7] rounded-3xl shadow-md p-6 border border-[#E6D7A8] h-fit space-y-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-[#E6D7A8] pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#15803D]" />
          <span>{editingDept ? 'Edit Department' : 'Create New Department'}</span>
        </h2>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-2xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Information Technology"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Department Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. IT"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm uppercase font-bold text-gray-900 focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of department scope..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || userRole === 'DEPT_ADMIN'}
              className="flex-1 bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2.5 rounded-xl text-xs shadow transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : editingDept ? 'Update Dept' : 'Create Dept'}</span>
            </button>
            {editingDept && (
              <button
                type="button"
                onClick={() => {
                  setEditingDept(null);
                  setName('');
                  setCode('');
                  setDescription('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Directory List */}
      <div className="md:col-span-2 bg-[#FAF0D7] rounded-3xl shadow-md border border-[#E6D7A8] p-6 space-y-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-[#E6D7A8] pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Existing Departments ({initialDepartments.length})</span>
        </h2>

        <div className="divide-y divide-gray-200">
          {initialDepartments.map((dept) => (
            <div key={dept.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">{dept.name}</span>
                  <span className="text-xs font-mono font-bold bg-[#15803D] text-white px-2.5 py-0.5 rounded-xl">
                    {dept.code}
                  </span>
                </div>
                {dept.description && <p className="text-xs text-gray-600 mt-1">{dept.description}</p>}

                <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2 font-semibold">
                  <span>Applications: <strong>{dept._count.applications}</strong></span>
                  <span>Open Positions: <strong>{dept._count.positions}</strong></span>
                  <span>Assigned Staff: <strong>{dept._count.users}</strong></span>
                </div>
              </div>

              {userRole === 'SUPER_ADMIN' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDept(dept);
                      setName(dept.name);
                      setCode(dept.code);
                      setDescription(dept.description || '');
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(dept.id)}
                    className="text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
