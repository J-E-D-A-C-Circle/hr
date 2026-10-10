'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Mail,
  Trash2,
  Check,
  RotateCcw,
  Eye,
  X,
  Filter
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getValidAuthToken } from '@/lib/auth-client';

export interface SupportTicket {
  id: number;
  name: string;
  contact: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export default function SupportTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = getValidAuthToken();
      const response = await axios.get('/api/admin/support', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets || []);
    } catch (error: any) {
      console.error('Failed to fetch support tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshKey]);

  const handleUpdateStatus = async (id: number, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      const token = getValidAuthToken();
      const response = await axios.put(
        '/api/admin/support',
        { id, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTickets(response.data.tickets || []);
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Failed to update ticket status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Are you sure you want to delete this support ticket?')) return;

    try {
      const token = getValidAuthToken();
      const response = await axios.delete(`/api/admin/support?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets || []);
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(null);
      }
      toast.success('Ticket deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  // Compute stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.contact || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.message || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d5c2e] via-[#094824] to-teal-950 border border-emerald-700/50 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <LifeBuoy className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-extrabold text-white">Support & Inquiries Desk</h2>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium">
            Review, track, and respond to user-submitted technical issues and inquiries.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0 cursor-pointer border border-white/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold opacity-80">Total Tickets</div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('open')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'open'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400">Open Tickets</div>
          <div className="text-2xl font-black mt-1 text-rose-600">{openCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'in_progress'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400">In Progress</div>
          <div className="text-2xl font-black mt-1 text-amber-600">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Resolved</div>
          <div className="text-2xl font-black mt-1 text-emerald-600">{resolvedCount}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, contact or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0d5c2e]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-[#0d5c2e] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-[#0d5c2e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading support tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-800">No Support Tickets Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            {searchQuery || statusFilter !== 'all'
              ? 'No tickets match your filter criteria.'
              : 'No user support tickets have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">#{t.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0d5c2e] flex items-center justify-center font-bold text-xs shrink-0">
                          {t.name ? t.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-extrabold text-slate-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{t.contact}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-600 font-normal">{t.message}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {t.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                        {t.status === 'in_progress' && <Clock className="w-3 h-3" />}
                        {t.status === 'open' && <AlertCircle className="w-3 h-3" />}
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {t.created_at}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                          title="View Full Issue"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {t.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'resolved')}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors"
                            title="Mark Resolved"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {t.status === 'open' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-colors"
                            title="Mark In Progress"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTicket(t.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#0d5c2e] to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-base text-white">Support Ticket #{selectedTicket.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase block">User Name</span>
                  <span className="text-xs font-black text-slate-900">{selectedTicket.name}</span>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase block">Phone Number</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTicket.contact}</span>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase block">Status</span>
                  <span className="text-xs font-bold capitalize text-emerald-700">{selectedTicket.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase block">Submitted At</span>
                  <span className="text-xs font-medium text-slate-700">{selectedTicket.created_at}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Issue Description
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm transition-colors"
                  >
                    Mark In Progress
                  </button>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
