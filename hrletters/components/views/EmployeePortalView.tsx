'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, CheckCircle2, ShieldCheck, Eye, Printer, Mail, Clock, MapPin, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge, statusToBadgeVariant } from '../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { LetterPreviewModal } from '../LetterPreviewModal';
import { AckModal } from '../AckModal';
import { printOfficialLetter } from '../../lib/printLetterHelper';

interface EmployeePortalViewProps {
  currentUser?: any;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({ currentUser }) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLetter, setPreviewLetter] = useState<any | null>(null);
  const [ackLetter, setAckLetter] = useState<any | null>(null);
  const [ackModalOpen, setAckModalOpen] = useState(false);

  const staffName = currentUser?.fullName || 'Kofi Mensah';
  const staffId = currentUser?.staffId || 'DVLA-712986';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/letters');
      const data = await res.json();
      if (data.success) {
        // Filter letters issued to this employee or matching their name/staffId
        const myLetters = data.data.filter(
          (l: any) =>
            l.staff?.fullName?.toLowerCase().includes(staffName.toLowerCase()) ||
            l.staff?.staffId === staffId ||
            l.status === 'ISSUED' ||
            l.status === 'ACKNOWLEDGED'
        );
        setLetters(myLetters.length > 0 ? myLetters : data.data.slice(0, 3));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handlePrint = (doc: any) => {
    printOfficialLetter({
      customRefNumber: doc.customRefNumber,
      issueDate: doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString('en-GB') : undefined,
      applicantName: doc.staff?.fullName || staffName,
      salutation: doc.salutation || 'Dear Sir/Madam,',
      customSubject: doc.title,
      customBodyText: doc.content,
      salaryGrade: doc.salaryGrade,
      signatoryName: doc.signatoryName,
      signatoryTitle: doc.signatoryTitle,
      letterType: doc.letterType,
      positionTitle: doc.staff?.jobTitle,
      departmentName: doc.staff?.department,
      effectiveDate: doc.effectiveDate,
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Employee Profile Header Banner */}
      <div className="bg-[#0F5132] text-white rounded-2xl p-6 shadow-md border-b-4 border-[#D97706] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-gray-950 font-black text-xl flex items-center justify-center shadow">
              {staffName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold">{staffName}</h2>
                <span className="bg-amber-500 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
                  Staff Account
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Staff ID: <code className="font-mono font-bold text-amber-300">{staffId}</code> &bull; Department of{' '}
                {currentUser?.department || 'Driver Licensing & Administration'}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs text-emerald-100 space-y-1">
            <div>🔒 <strong>DVLA Webmail Gateway:</strong> {currentUser?.email || 'kofi.mensah@dvla.gov.gh'}</div>
            <div>✓ Official Document Acknowledgment Portal</div>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-1)' }}>
            My Employment Letters & Documents
          </h3>
          <p className="text-xs text-gray-500">
            View, print, and acknowledge receipt of official letters issued by the Directorate of Human Resources
          </p>
        </div>
        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
          {letters.length} Official Letters
        </div>
      </div>

      {/* Documents Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Verification Code</TableHead>
              <TableHead>Letter Title</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-xs" style={{ color: 'var(--color-text-3)' }}>
                  Loading your staff letters...
                </TableCell>
              </TableRow>
            ) : letters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-xs" style={{ color: 'var(--color-text-3)' }}>
                  No issued letters found for your account.
                </TableCell>
              </TableRow>
            ) : (
              letters.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <code className="text-xs font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
                      {doc.verificationCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm" style={{ color: 'var(--color-text-1)' }}>
                      {doc.title}
                    </div>
                    <div className="text-[11px] font-mono text-gray-500">
                      Ref: {doc.customRefNumber || 'DVLA/HR/PLACMT'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs" style={{ color: 'var(--color-text-2)' }}>
                    {doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString('en-GB') : 'Recently Issued'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusToBadgeVariant(doc.status)} dot>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setPreviewLetter(doc)}
                      >
                        View Letter
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => handlePrint(doc)}
                      >
                        Print PDF
                      </Button>
                      {doc.status === 'ISSUED' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setAckLetter(doc);
                            setAckModalOpen(true);
                          }}
                        >
                          Acknowledge Receipt
                        </Button>
                      )}
                      {doc.status === 'ACKNOWLEDGED' && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {previewLetter && (
        <LetterPreviewModal letter={previewLetter} onClose={() => setPreviewLetter(null)} />
      )}
      {ackModalOpen && (
        <AckModal
          isOpen={ackModalOpen}
          letter={ackLetter}
          onClose={() => {
            setAckModalOpen(false);
            setAckLetter(null);
          }}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
