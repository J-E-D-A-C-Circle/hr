"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DownloadCloud, LogOut, FileText, Home, Menu, X, Upload, ShieldCheck, ImageIcon, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { uploadFile } from '@/lib/file-upload';
import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';
import { SIGNATURE_BASE64 } from '@/lib/signature';

const NAV = [
  { label: 'Dashboard', active: true },
];

interface Application {
  id: number;
  status: string;
  posting_station: string;
  posting_department: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  nss_number: string;
  posting_region: string;
  posting_district: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [appointmentFile, setAppointmentFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSaveDocuments = async () => {
    if (!application) return;

    let passportPath = (application as any).passport_photo || null;
    let idCardPath = (application as any).id_card_copy || null;
    let appointmentPath = (application as any).appointment_letter || null;
    let cvPath = (application as any).certificates || null;

    if (!passportFile && !passportPath) {
      toast.error('Passport Picture is compulsory.');
      return;
    }
    if (!idCardFile && !idCardPath) {
      toast.error('Ghana Card / ID Card Copy is compulsory.');
      return;
    }
    if (!appointmentFile && !appointmentPath) {
      toast.error('NSS Appointment Letter is compulsory.');
      return;
    }
    if (!cvFile && !cvPath) {
      toast.error('Curriculum Vitae (CV) / Certificates is compulsory.');
      return;
    }

    setUploading(true);
    try {
      const token = getValidAuthToken() || localStorage.getItem('token') || '';

      if (passportFile) {
        const res = await uploadFile(passportFile, 'passport', token);
        passportPath = res.file_path;
      }
      if (idCardFile) {
        const res = await uploadFile(idCardFile, 'id_card', token);
        idCardPath = res.file_path;
      }
      if (appointmentFile) {
        const res = await uploadFile(appointmentFile, 'appointment', token);
        appointmentPath = res.file_path;
      }
      if (cvFile) {
        const res = await uploadFile(cvFile, 'cv', token);
        cvPath = res.file_path;
      }

      const payload = {
        ...application,
        passport_photo: passportPath,
        id_card_copy: idCardPath,
        appointment_letter: appointmentPath,
        certificates: cvPath,
      };

      await axios.post('/api/applications/submit', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Documents updated successfully!');
      setUploadModalOpen(false);
      
      // Refresh application details
      const res = await axios.get('/api/applications/my-application', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.application) {
        setApplication(res.data.application);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update documents');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const validToken = getValidAuthToken();
    const parsedUser = getStoredUser();

    if (!validToken || !parsedUser) {
      clearAuthSession();
      router.replace('/login');
      return;
    }

    if (parsedUser.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    setUser(parsedUser);
    fetchApplication();
  }, [router]);

  const fetchApplication = async () => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      const token = getValidAuthToken();
      if (!token) {
        clearAuthSession();
        router.replace('/login');
        return;
      }
      const response = await axios.get(
        '/api/applications/my-application',
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 2000,
        }
      );
      
      const app = response.data.application;
      if (!app || app.status === 'draft') {
        router.replace('/register');
        return;
      }
      
      setApplication(app);
    } catch (error: any) {
      console.error('Error fetching application:', error);
      if (error.response?.status === 401) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const generatePDF = async (letterType: 'appointment' | 'reposting' = 'appointment') => {
    try {
      const token = getValidAuthToken() || localStorage.getItem('token');
      const response = await axios.get(
        `/api/applications/generate-pdf?type=${letterType}${application?.id ? `&id=${application.id}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const app = response.data.application;
      
      // Get logo as base64 for embedding
      const logoPath = '/oop.png';
      
      const letterObj = app.appointmentLetterObject || app.appointmentLetterData || {};
      
      const issueDate = letterObj.letterDate || new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();

      const dynamicFullName = `${app.first_name || ''} ${app.middle_name ? app.middle_name + ' ' : ''}${app.last_name || ''}`.trim();
      const applicantName = letterObj.applicantName || dynamicFullName || user?.full_name || 'NSS Personnel';
      const applicantAddress = letterObj.applicantAddress || app.residential_address || '';
      const refSuffix = app.nss_number || String(app.id || '0127');
      const displayRef = letterObj.customRefNumber || `DVLA/HR/NSS/${refSuffix}`;
      const yourRef = letterObj.yourRef || '....................................';

      const displaySubject = letterObj.customSubject || (letterType === 'reposting' 
        ? 'REPOSTING OF NATIONAL SERVICE PERSONNEL.'
        : 'POSTING OF NATIONAL SERVICE PERSONNEL.');

      const salutation = letterObj.salutation || `Dear ${applicantName},`;
      const stationName = app.posting_station || app.posting_district || app.district || 'Bonwire District Office';
      const serviceYear = app.service_year ? `${app.service_year}/${parseInt(String(app.service_year), 10) + 1}` : '2025/2026';
      const commencementDate = letterObj.commencementDate || (app.service_period_start ? formatDate(app.service_period_start) : 'Monday, 17th November, 2025');
      const endDate = letterObj.endDate || (app.service_period_end ? formatDate(app.service_period_end) : 'Friday, 30th October, 2026');
      const signatoryName = letterObj.signatoryName || 'EPHRAIM NII TAN SACKEY';
      const signatoryTitle = letterObj.signatoryTitle || 'AG. DIRECTOR HR';
      const signatoryForTitle = letterObj.signatoryForTitle || 'FOR: CHIEF EXECUTIVE';
      
      const ccListItems: string[] = typeof letterObj.ccText === 'string'
        ? letterObj.ccText.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(letterObj.ccList) && letterObj.ccList.length > 0
        ? letterObj.ccList
        : [
            'District Licensing Manager',
          ];

      // Create PDF content matching OfficialAppointmentLetter.tsx exactly
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${letterType === 'reposting' ? 'DVLA NSS Reposting Release Letter' : 'DVLA NSS Appointment Letter'}</title>
          <style>
            @media print {
              @page {
                margin: 8mm 12mm;
                size: A4 portrait;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: #FFFFFF !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .letter-container {
                position: relative !important;
                width: 100% !important;
                max-width: 190mm !important;
                max-height: 275mm !important;
                box-sizing: border-box !important;
                padding: 4mm 8mm !important;
                margin: 0 auto !important;
                border: none !important;
                box-shadow: none !important;
                background-color: #FFFFFF !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Times New Roman', Times, serif !important;
            }
            body { 
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 12pt !important;
              line-height: 1.45;
              color: #111827;
              background: #FFFFFF;
              padding: 8mm;
            }
            .letter-container {
              position: relative;
              max-width: 780px;
              margin: 0 auto;
              background-color: #FFFFFF;
              padding: 20px 30px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 340px;
              height: 340px;
              opacity: 0.06;
              pointer-events: none;
              z-index: 1;
            }
            .content-z {
              position: relative;
              z-index: 10;
            }
            .header-title {
              text-align: center;
              font-size: 15pt !important;
              font-weight: 900;
              color: #008053;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 4px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .header-grid {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12pt !important;
              color: #1f2937;
              margin-top: 8px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .header-left { text-align: left; font-size: 12pt !important; line-height: 1.35; }
            .header-center { text-align: center; }
            .header-right { text-align: right; font-size: 12pt !important; line-height: 1.35; }
            .header-logo {
              width: 76px;
              height: 76px;
              object-fit: contain;
            }
            .divider {
              border-top: 2px solid #008053;
              margin: 10px 0 16px 0;
            }
            .ref-row {
              display: flex;
              justify-content: space-between;
              font-size: 12pt !important;
              margin-bottom: 16px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .ref-dotted {
              display: inline-block;
              border-bottom: 1px dotted #111827;
              font-family: monospace;
              font-weight: bold;
              padding: 0 4px;
              min-width: 200px;
            }
            .addressee {
              font-size: 12pt !important;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 12px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .salutation {
              font-size: 12pt !important;
              margin-bottom: 10px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .subject-title {
              font-size: 12pt !important;
              font-weight: 900;
              text-transform: uppercase;
              border-bottom: 1px solid #111827;
              padding-bottom: 1px;
              display: inline-block;
              margin-bottom: 12px;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .body-text {
              font-size: 12pt !important;
              line-height: 1.5;
              text-align: justify;
              margin-bottom: 16px;
              white-space: pre-line;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .body-text p {
              margin-bottom: 10px;
            }
            .footer-block {
              margin-top: 14px;
              padding-top: 8px;
            }
            .signatory-block {
              font-size: 12pt !important;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .signature-img {
              height: 48px;
              max-height: 48px;
              width: auto;
              object-fit: contain;
              margin: 4px 0;
            }
            .signatory-name {
              font-weight: 900;
              text-transform: uppercase;
              font-size: 12pt !important;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .signatory-title {
              font-weight: bold;
              color: #1f2937;
              font-size: 12pt !important;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .signatory-for {
              font-size: 11pt;
              font-weight: bold;
              color: #4b5563;
              text-transform: uppercase;
            }
            .cc-box {
              margin-top: 10px;
              font-size: 11pt !important;
              font-family: 'Times New Roman', Times, serif !important;
            }
            .cc-box ul {
              list-style: none;
              padding-left: 0;
              margin-top: 2px;
              font-size: 11pt !important;
            }
            .cc-box li {
              font-size: 11pt !important;
            }
          </style>
        </head>
        <body>
          <div class="letter-container">
            <!-- Background Watermark -->
            <img src="${logoPath}" alt="Watermark" class="watermark" />

            <div class="content-z">
              <!-- HEADER -->
              <div class="header-title">DRIVER AND VEHICLE LICENSING AUTHORITY</div>
              <div class="header-grid">
                <div class="header-left">
                  <div><strong>Tel:</strong> 0302 764 529</div>
                  <div><strong>Website:</strong> http://www.dvla.gov.gh</div>
                  <div><strong>Email:</strong> info@dvla.gov.gh</div>
                </div>
                <div class="header-center">
                  <img src="${logoPath}" alt="DVLA Logo" class="header-logo" />
                </div>
                <div class="header-right">
                  <div style="font-weight: bold; color: #008053;">Head Office Address:</div>
                  <div>1, Jawaharlal Nehru Road</div>
                  <div>P. O. Box 9379, KIA-Accra</div>
                </div>
              </div>
              <div class="divider"></div>

              <!-- REF & DATE -->
              <div class="ref-row">
                <div>
                  <div style="margin-bottom: 4px;"><strong>My Ref:</strong> <span class="ref-dotted">${displayRef}</span></div>
                  <div><strong>Your Ref:</strong> <span class="ref-dotted">${yourRef || '&nbsp;'}</span></div>
                </div>
                <div style="text-align: right;">
                  <div><strong>Date:</strong> <span class="ref-dotted" style="text-transform: uppercase; min-width: 150px; text-align: center;">${issueDate || '&nbsp;'}</span></div>
                </div>
              </div>

              <!-- ADDRESSEE -->
              <div class="addressee">
                <div>${applicantName}</div>
                ${applicantAddress ? `<div style="color: #374151; font-weight: normal;">${applicantAddress}</div>` : ''}
              </div>

              <!-- SALUTATION -->
              <div class="salutation">${salutation}</div>

              <!-- SUBJECT -->
              <div>
                <h2 class="subject-title">${displaySubject}</h2>
              </div>

              <!-- BODY PARAGRAPHS -->
              <div class="body-text">
                ${letterObj.customBodyText ? `<div style="white-space: pre-line;">${letterObj.customBodyText}</div>` : `
                  <p>This is to inform you that you have been ${letterType === 'reposting' ? 'reposted' : 'assigned'} to the <strong>${stationName}</strong> for the <strong>${serviceYear}</strong> service year.</p>
                  <p>Your National Service commences on <strong>${commencementDate}</strong> and ends on <strong>${endDate}</strong>.</p>
                  <p>You are required to report to the District Licensing Manager for orientation and assignment. You are expected to exhibit good conduct and abide by all rules and regulations of the Authority throughout your service period.</p>
                `}
              </div>

              <!-- FOOTER & SIGNATURE -->
              <div class="footer-block">
                <div class="signatory-block">
                  <div>Thank you.</div>
                  <div style="margin-top: 4px;">Yours faithfully,</div>
                  <div style="margin: 4px 0;">
                    <img src="${SIGNATURE_BASE64}" alt="Signature" class="signature-img" />
                  </div>
                  <div>
                    <div class="signatory-name">${signatoryName}</div>
                    <div class="signatory-title">${signatoryTitle}</div>
                    <div class="signatory-for">${signatoryForTitle}</div>
                  </div>
                  <div class="cc-box">
                    <strong>Cc:</strong>
                    <ul>
                      ${ccListItems.map(item => `<li>&bull; ${item}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate PDF');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

  const hasLetter = (() => {
    if (!application || !(application as any).additional_info) return false;
    try {
      const parsed = typeof (application as any).additional_info === 'string'
        ? JSON.parse((application as any).additional_info)
        : (application as any).additional_info;
      return Boolean(parsed?.appointmentLetterData || parsed?.appointmentType || parsed?.customRefNumber);
    } catch (e) {
      return false;
    }
  })();

  const isAssigned = application?.status === 'approved' && hasLetter;

  const getStatusMessage = () => {
    if (!application) return { text: 'Your application is pending', color: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-300' };
    
    if (application.status === 'approved' && !isAssigned) {
      return { text: 'Application Under Review (Pending Placement & Letter Assignment)', color: 'bg-sky-50 text-sky-800', border: 'border-sky-300' };
    }

    switch (application.status) {
      case 'draft':
        return { text: 'Application draft saved - Action Required', color: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-400' };
      case 'approved':
        return { text: 'Your application is successful & official letter assigned', color: 'bg-green-50 text-green-900', border: 'border-green-500' };
      case 'rejected':
        return { text: 'Your application is rejected', color: 'bg-red-50 text-red-800', border: 'border-red-300' };
      case 'under_review':
        return { text: 'Your application is under review', color: 'bg-blue-50 text-blue-800', border: 'border-blue-300' };
      default:
        return { text: 'Your application is pending', color: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-300' };
    }
  };

  const statusInfo = getStatusMessage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userDisplayName = user?.full_name || 'User';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0d5c2e] to-[#073e1e] shadow-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-white p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Image 
                src="/oop.png" 
                width={32} 
                height={32} 
                alt="DVLA Logo" 
                className="rounded-full bg-white/90 p-0.5 shadow-md ring-1 ring-white/50" 
              />
              <div>
                <h2 className="text-white font-bold text-sm leading-tight">DVLA NSS</h2>
                <p className="text-white/90 text-xs">{userDisplayName.split(' ')[0]}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white bg-red-500/90 hover:bg-red-600 active:bg-red-700 px-3 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md active:scale-95"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="text-xs">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div 
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-gradient-to-b from-[#0d5c2e] to-[#073e1e] text-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-3">
            <Image 
              src="/oop.png" 
              width={40} 
              height={40} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-1 shadow-md ring-2 ring-white/50" 
            />
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">DVLA NSS</h2>
              <p className="text-white/80 text-xs mt-0.5">{userDisplayName.split(' ')[0]}</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)} 
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-6">
          {NAV.map(n => (
            <div
              key={n.label}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center font-medium text-base rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 select-none 
                ${n.active 
                  ? 'bg-white/25 text-white shadow-md backdrop-blur-sm' 
                  : 'text-white/95 hover:bg-white/15 hover:text-white'}`}
            >
              <span className="mr-3">
                {n.label === 'Dashboard' && <Home className="w-5 h-5" />}
              </span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto mb-6 px-4 pt-4 border-t border-white/20">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 text-white bg-red-500/90 hover:bg-red-600 px-4 py-3 rounded-lg w-full font-semibold transition-all duration-200 shadow-md active:scale-95"
          >
            <LogOut className="w-5 h-5" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col min-h-screen w-64 bg-gradient-to-b from-[#0d5c2e] to-[#073e1e] shadow-xl">
        <div className="pt-8 pb-6 px-6 flex flex-col items-center border-b border-white/10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image 
              src="/oop.png" 
              width={56} 
              height={56} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-1.5 shadow-lg ring-2 ring-white/40" 
            />
          </div>
          <h2 className="text-white font-bold text-lg tracking-wide text-center">DVLA NSS Portal</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-6">
          {NAV.map(n => (
            <div
              key={n.label}
              className={`flex items-center font-medium text-base rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 select-none 
                ${n.active 
                  ? 'bg-white/25 text-white shadow-md backdrop-blur-sm' 
                  : 'text-white/95 hover:bg-white/15 hover:text-white'}`}
            >
              <span className="mr-3">
                {n.label === 'Dashboard' && <Home className="w-5 h-5" />}
              </span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto mb-6 px-4 pt-4 border-t border-white/20">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 text-white bg-red-500/90 hover:bg-red-600 px-4 py-3 rounded-lg w-full font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen px-4 md:px-0 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl w-full mx-auto py-10 md:py-10 pt-20 md:pt-10 px-0 md:px-6">
          {/* Header Section */}
          <div className="mt-4 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">
                  Welcome, <span className="hidden md:inline">{userDisplayName}</span><span className="md:hidden">{userDisplayName.split(' ')[0]}</span>
                </div>
                <div className="text-base md:text-xl text-gray-600">Your National Service application portal.</div>
              </div>
              {/* User mini-profile desktop */}
              <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold w-10 h-10 flex items-center justify-center shadow-sm">
                  {userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <span className="text-gray-800 font-semibold text-sm">{userDisplayName}</span>
              </div>
            </div>
            
            {/* Animated Status Timeline Stepper */}
            {application && application.status !== 'draft' && (
              <div className="my-6 w-full p-6 rounded-2xl bg-white shadow-xl border border-emerald-100 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Application Status</span>
                    <h3 className="text-lg font-bold text-gray-900">
                      NSS Posting Progress Tracker ({application.nss_number})
                    </h3>
                  </div>
                  <div className={`${statusInfo.color} rounded-full px-4 py-1.5 text-xs font-extrabold border ${statusInfo.border} self-start sm:self-auto`}>
                    {statusInfo.text}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                      ✓
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">1. Form Submitted</span>
                      <span className="text-[11px] text-gray-500">Details Received</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    application.status === 'pending' || application.status === 'under_review'
                      ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-400/50'
                      : application.status === 'approved' || application.status === 'rejected'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      application.status === 'approved' || application.status === 'rejected'
                        ? 'bg-emerald-600 text-white'
                        : application.status === 'pending' || application.status === 'under_review'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {application.status === 'approved' || application.status === 'rejected' ? '✓' : '2'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">2. Admin Review</span>
                      <span className="text-[11px] text-gray-500">
                        {application.status === 'pending' ? 'In Queue' : application.status === 'under_review' ? 'Reviewing' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isAssigned
                      ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-400/50'
                      : application.status === 'approved'
                      ? 'bg-amber-50 border-amber-200'
                      : application.status === 'rejected'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAssigned
                        ? 'bg-emerald-600 text-white'
                        : application.status === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : application.status === 'approved'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isAssigned ? '✓' : application.status === 'rejected' ? '✕' : '3'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">3. Station Placement</span>
                      <span className="text-[11px] text-gray-500">
                        {isAssigned ? (application.posting_station || 'Assigned Station') : 'Pending Station'}
                      </span>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isAssigned
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAssigned ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isAssigned ? '✓' : '4'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">4. Official Release</span>
                      <span className="text-[11px] text-gray-500">
                        {isAssigned ? 'Letter Ready & Issued' : 'Awaiting Assignment'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid Cards - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!application || application.status === 'draft' ? (
              <div className="col-span-2 py-12 flex justify-center text-gray-500">Redirecting to application form...</div>
            ) : (
              <>
                {/* Card 1: Application Form (Top Left) */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                  <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold mb-1">Application Form</div>
                  <div className="text-[15px] text-gray-600 mb-3">
                    View your submitted National Service Scheme application details.
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/view-application')}
                    className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#0d5c2e] hover:bg-[#073e1e] shadow-sm"
                  >
                    View Application
                  </Button>
                </div>

                {/* Card 2: Download Appointment Letter (Top Right - only if fully assigned) */}
                {isAssigned ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                    <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-base font-bold mb-1">Download Appointment Letter</div>
                    <div className="text-[15px] text-gray-600 mb-3">
                      Download your official appointment letter to get started at DVLA.
                    </div>
                    <Button
                      onClick={() => generatePDF('appointment')}
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm hover:bg-[#15803d]"
                    >
                      Download Letter
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] opacity-60">
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-base font-bold mb-1 text-gray-700">Download Appointment Letter</div>
                    <div className="text-[15px] text-gray-500 mb-3">
                      {application.status === 'approved'
                        ? 'Your application review is complete, but official placement & appointment letter generation by HR is pending.'
                        : 'Download your appointment letter once your application has been approved and assigned by admin.'}
                    </div>
                    <Button
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-gray-400 shadow-sm cursor-not-allowed"
                      disabled
                    >
                      Pending Assignment
                    </Button>
                  </div>
                )}

                {/* Card 3: Download Reposting Letter (Bottom Right - only if rejected) */}
                {application.status === 'rejected' ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] border-red-200 bg-red-50/20">
                    <div className="mb-2 p-2 bg-red-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-base font-bold mb-1 text-gray-900">Download Reposting Letter</div>
                    <div className="text-[15px] text-gray-600 mb-3">
                      Download your official NSS release and reposting letter for the NSS Secretariat.
                    </div>
                    <Button
                      onClick={() => generatePDF('reposting')}
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-red-600 hover:bg-red-700 shadow-sm"
                    >
                      Download Reposting Letter
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] opacity-50">
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-base font-bold mb-1 text-gray-700">Download Reposting Letter</div>
                    <div className="text-[15px] text-gray-500 mb-3">
                      Download your reposting release letter for the NSS secretariat. (Available only if application is rejected)
                    </div>
                    <Button
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-gray-400 shadow-sm cursor-not-allowed"
                      disabled
                    >
                      Download Letter
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
