"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Activity } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table";
import { Pagination } from "../ui/Pagination";

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  useEffect(() => {
    setLoading(true);
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-1)" }}>
            System Audit Trail & Security Log
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-3)" }}>
            Immutable record of approvals, digital signatures, role activities & document acknowledgments
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: "var(--color-accent-subtle)",
            color: "var(--color-accent)",
            border: "1px solid var(--color-border)",
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> {logs.length} Logged Events
        </div>
      </div>

      {/* ── Logs Table (Shadcn UI Table) ── */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Timestamp", "Action Executed", "Actor & Role", "Details", "IP Hash"].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(5).fill(0).map((_, j) => (
                    <TableCell key={j}>
                      <div className="skeleton h-4 rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs" style={{ color: "var(--color-text-3)" }}>
                    {new Date(log.createdAt).toLocaleString("en-GB")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm" style={{ color: "var(--color-text-1)" }}>
                    {log.actorName} <span className="text-xs font-normal" style={{ color: "var(--color-text-3)" }}>({log.actorRole})</span>
                  </TableCell>
                  <TableCell className="text-xs max-w-md" style={{ color: "var(--color-text-2)" }}>
                    {log.details}
                  </TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: "var(--color-text-4)" }}>
                    {log.ipAddress || "127.0.0.1"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm" style={{ color: "var(--color-text-4)" }}>
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No security audit events recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={logs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
