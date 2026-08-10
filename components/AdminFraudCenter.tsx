'use client';

import React, { useState, useEffect } from 'react';
import { getFraudAlerts, resolveFraudAlert } from '@/app/actions/fraud';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Lock,
  UserX,
  FileCheck,
} from 'lucide-react';

export default function AdminFraudCenter() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const res = await getFraudAlerts();
    setIsLoading(false);

    if (res.success && res.alerts) {
      setAlerts(res.alerts);
    } else {
      setError(res.error || 'Failed to load fraud alerts.');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (alertId: string, status: 'DISMISSED' | 'CONFIRMED_FRAUD' | 'INVESTIGATING') => {
    setIsUpdating(true);
    const res = await resolveFraudAlert(alertId, status);
    setIsUpdating(false);

    if (res.success) {
      setSelectedAlert(null);
      fetchAlerts();
    }
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING' || a.status === 'INVESTIGATING');
  const criticalCount = pendingAlerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-[#0F4327] text-white rounded-3xl p-6 shadow-xl border-2 border-red-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Identity & Document Authenticity Center</span>
          </div>
          <h2 className="text-2xl font-black text-white">Fraud & Duplicate Application Engine</h2>
          <p className="text-xs text-red-200 mt-1 max-w-2xl">
            Detects duplicate National ID / Ghana Card numbers, reused CV document hashes, and multi-email submissions across applicant records to prevent identity fraud in public recruitment.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase">Active Fraud Alerts</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{pendingAlerts.length}</div>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-red-600 uppercase">Critical & High Risk</div>
            <div className="text-3xl font-black text-red-600 mt-1">{criticalCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Duplicate ID / CV Hash matches</div>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-black">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase">Total Logged Alerts</div>
            <div className="text-3xl font-black text-emerald-950 mt-1">{alerts.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Audit history</div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-2xl flex items-center justify-center font-black">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Fraud Alerts List */}
      {alerts.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-base">Flagged Authenticity Alerts</h3>
            <span className="text-xs font-bold text-gray-500">{alerts.length} Total Alerts</span>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => {
              const app = alert.application;
              const isResolved = alert.status === 'DISMISSED' || alert.status === 'CONFIRMED_FRAUD';

              return (
                <div key={alert.id} className="p-5 hover:bg-gray-50/50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Alert Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-base">{app.applicant.fullName}</span>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">
                          {app.referenceNumber}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : alert.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}
                        >
                          {alert.severity} RISK — {alert.alertType.replace(/_/g, ' ')}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            alert.status === 'CONFIRMED_FRAUD'
                              ? 'bg-red-900 text-white'
                              : alert.status === 'DISMISSED'
                              ? 'bg-emerald-100 text-[#0F5132]'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 font-medium pt-1">
                        Reason: <span className="text-gray-900">{alert.reason}</span>
                      </div>

                      {alert.matchedDetails && (
                        <div className="text-xs text-red-700 bg-red-50/80 p-2 rounded-xl border border-red-200 mt-2 font-mono flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{alert.matchedDetails}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isResolved ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolve(alert.id, 'CONFIRMED_FRAUD')}
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Confirm Fraud & Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolve(alert.id, 'DISMISSED')}
                            disabled={isUpdating}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5132]" />
                            <span>Dismiss Alert</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 italic">Resolved</span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center shadow border border-gray-200 space-y-2">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">No Fraud Alerts Flagged</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            The automated document authenticity engine will continuously audit incoming candidate submissions and highlight duplicates here.
          </p>
        </div>
      )}

    </div>
  );
}
