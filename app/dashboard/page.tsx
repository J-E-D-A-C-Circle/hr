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
    setUploading(true);
    try {
      const token = localStorage.getItem('token') || '';
      let passportPath = (application as any).passport_photo || null;
      let idCardPath = (application as any).id_card_copy || null;
      let appointmentPath = (application as any).appointment_letter || null;
      let cvPath = (application as any).certificates || null;

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
        }
      );
      setApplication(response.data.application);
    } catch (error: any) {
      console.error('Error fetching application:', error);
      if (error.response?.status === 401) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (letterType: 'appointment' | 'reposting' = 'appointment') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/applications/generate-pdf?type=${letterType}`,
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

      const applicantName = letterObj.applicantName 
        || `${app.first_name || ''} ${app.middle_name ? app.middle_name + ' ' : ''}${app.last_name || ''}`.trim() 
        || 'APPLICANT';
      const applicantAddress = letterObj.applicantAddress || app.residential_address || 'ACCRA - GHANA';
      const refCode = (app.nss_number || String(app.id || '0127')).slice(-4);
      const displayRef = letterObj.customRefNumber || `DVLA/HR/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear()).slice(-2)}/${letterType === 'reposting' ? 'REPOST' : 'PLACMT'}/${refCode}`;
      const yourRef = letterObj.yourRef || '....................................';

      const displaySubject = letterObj.customSubject || (letterType === 'reposting' 
        ? 'OFFICIAL REPOSTING & RE-ASSIGNMENT RELEASE'
        : 'NSS POSTING APPOINTMENT');

      const salutation = letterObj.salutation || 'Dear Sir/Madam,';
      const stationName = app.posting_station || app.posting_district || app.district || 'Head Office (Accra 37)';
      const deptName = app.posting_department || 'Operations';
      const posTitle = app.course_program || 'NSS Personnel';
      const effectiveDate = letterObj.effectiveDate || (app.service_period_start ? formatDate(app.service_period_start) : 'Monday, September 1, 2026');
      const signatoryName = letterObj.signatoryName || 'EPHRAIM NII TAN SACKEY';
      const signatoryTitle = letterObj.signatoryTitle || 'AG. DIRECTOR HR';
      const signatoryForTitle = letterObj.signatoryForTitle || 'FOR: CHIEF EXECUTIVE';
      
      const ccListItems: string[] = typeof letterObj.ccText === 'string'
        ? letterObj.ccText.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(letterObj.ccList) && letterObj.ccList.length > 0
        ? letterObj.ccList
        : [
            'Chief Executive',
            'Deputy Chief Executives',
            'Ag. Director, IT',
            'Ag. Director Administration',
            'Manager, HR (C&B)',
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
                margin: 0;
                size: A4 portrait;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.5;
              color: #111827;
              background: #FDF3C0;
              padding: 40px;
            }
            .letter-container {
              position: relative;
              max-width: 800px;
              margin: 0 auto;
              background-color: #FDF3C0;
              padding: 40px;
              border: 1px solid #fcd34d;
              border-radius: 8px;
              overflow: hidden;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 380px;
              height: 380px;
              opacity: 0.07;
              pointer-events: none;
              z-index: 1;
            }
            .content-z {
              position: relative;
              z-index: 10;
            }
            .header-title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              color: #008053;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .header-grid {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #1f2937;
              margin-top: 10px;
            }
            .header-left { text-align: left; }
            .header-center { text-align: center; }
            .header-right { text-align: right; }
            .header-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .divider {
              border-top: 2px solid #008053;
              margin: 12px 0 24px 0;
            }
            .ref-row {
              display: flex;
              justify-content: space-between;
              font-family: Arial, sans-serif;
              font-size: 13px;
              margin-bottom: 24px;
            }
            .addressee {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .salutation {
              font-size: 13px;
              margin-bottom: 16px;
            }
            .subject-title {
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              border-bottom: 1px solid #111827;
              padding-bottom: 2px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .body-text {
              font-size: 13px;
              line-height: 1.6;
              text-align: justify;
              margin-bottom: 28px;
              white-space: pre-line;
            }
            .body-text p {
              margin-bottom: 14px;
            }
            .footer-block {
              margin-top: 30px;
              padding-top: 16px;
              border-top: 1px solid rgba(120, 53, 15, 0.2);
            }
            .signatory-block {
              font-size: 12px;
            }
            .signature-svg {
              width: 140px;
              height: 48px;
              margin: 8px 0;
            }
            .signatory-name {
              font-weight: 900;
              text-transform: uppercase;
              font-size: 13px;
            }
            .signatory-title {
              font-weight: bold;
              color: #1f2937;
            }
            .cc-box {
              margin-top: 16px;
              font-size: 11px;
            }
            .cc-box ul {
              list-style: none;
              padding-left: 0;
              margin-top: 4px;
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
                  <strong>My Ref:</strong>......<span style="font-family: monospace; font-weight: bold;">${displayRef}</span><br/>
                  <strong>Your Ref:</strong>......<span style="font-family: monospace; font-weight: bold;">${yourRef}</span>
                </div>
                <div style="text-align: right;">
                  <strong style="text-transform: uppercase;">${issueDate}</strong><br/>
                  <span style="font-family: monospace; font-size: 11px; color: #6b7280;">............/............/20..........</span>
                </div>
              </div>

              <!-- ADDRESSEE -->
              <div class="addressee">
                <div>${applicantName}</div>
                <div style="color: #374151; font-weight: normal;">${applicantAddress}</div>
              </div>

              <!-- SALUTATION -->
              <div class="salutation">${salutation}</div>

              <!-- SUBJECT -->
              <div>
                <h2 class="subject-title">${displaySubject}</h2>
              </div>

              <!-- BODY PARAGRAPHS -->
              <div class="body-text">
                ${letterObj.customBodyText ? letterObj.customBodyText : letterType === 'reposting' ? `
                  This is to formally inform you that, your application for National Service placement at the Driver and Vehicle Licensing Authority (DVLA) has NOT BEEN ACCEPTED.

                  Consequently, this official notification serves as your formal release letter for re-posting back to the National Service Scheme (NSS) Secretariat for re-assignment to an alternative user agency.

                  You are kindly advised to submit a copy of this official release letter to the regional or national NSS Secretariat to facilitate your re-posting.

                  Thank you.
                ` : `
                  This is to inform you that, you have been temporarily posted to the ${stationName} as an ${posTitle}, assigned to the ${deptName} Department, effective ${effectiveDate}.

                  You are to report to the Ag. Director Human Resource and Ag. Director Administration, for necessary instructions and directives concerning your official duties.

                  Thank you.
                `}
              </div>

              <!-- FOOTER & SIGNATURE -->
              <div class="footer-block">
                <div class="signatory-block">
                  <div>Yours faithfully,</div>
                  <div style="margin: 8px 0;">
                    <svg class="signature-svg" viewBox="0 0 200 60" fill="none" stroke="#1a365d" stroke-width="2">
                      <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" stroke-width="2.5" stroke-linecap="round" />
                      <path d="M 25,35 Q 60,5 110,40 T 180,25" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div class="signatory-name">${signatoryName}</div>
                    <div class="signatory-title">${signatoryTitle}</div>
                    <div style="font-size: 11px; font-weight: bold; color: #4b5563; text-transform: uppercase;">${signatoryForTitle}</div>
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

  const getStatusMessage = () => {
    if (!application) return { text: 'Your application is pending', color: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-300' };
    
    switch (application.status) {
      case 'draft':
        return { text: 'Application draft saved - Action Required', color: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-400' };
      case 'approved':
        return { text: 'Your application is successful', color: 'bg-green-50 text-green-900', border: 'border-green-500' };
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
            
            {/* Status Banner - Only show if an application has actually been submitted */}
            {application && application.status !== 'draft' && (
              <div className="my-6 w-full">
                <div className={`${statusInfo.color} rounded-lg px-6 py-3 text-base font-bold text-center border ${statusInfo.border} w-full`}>
                  {statusInfo.text}
                </div>
              </div>
            )}
          </div>

          {/* Grid Cards - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!application || application.status === 'draft' ? (
              /* Draft or No Application - Show full width Resume / Start Application Hero Card */
              <div className="bg-gradient-to-r from-emerald-900 via-[#0d5c2e] to-emerald-900 text-white rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 col-span-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className="p-4 bg-white/15 backdrop-blur-md rounded-2xl ring-1 ring-white/30 shrink-0">
                    <FileText className="w-10 h-10 text-emerald-300" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-400/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {application?.status === 'draft' ? 'Draft Saved' : 'Action Required'}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {application?.status === 'draft' ? 'Resume Your NSS Application' : 'Start Your NSS Application'}
                    </h3>
                    <p className="text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                      {application?.status === 'draft'
                        ? 'You have an incomplete application draft saved in the cloud. Pick up right where you left off to complete your posting process at DVLA.'
                        : 'Enroll into the National Service Scheme Program at The Driver and Vehicle Licensing Authority.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
                  <Button
                    onClick={() => router.push(application?.status === 'draft' ? '/register' : '/dashboard/apply')}
                    className="w-full md:w-auto px-8 py-3.5 rounded-xl text-[#0d5c2e] font-bold bg-white hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
                  >
                    {application?.status === 'draft' ? 'Continue Application →' : 'Start Application'}
                  </Button>
                </div>
              </div>
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

                {/* Card 2: Download Appointment Letter (Top Right - only if approved) */}
                {application.status === 'approved' ? (
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
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] opacity-50">
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-base font-bold mb-1 text-gray-700">Download Appointment Letter</div>
                    <div className="text-[15px] text-gray-500 mb-3">
                      Download your appointment letter to get started at DVLA. (Available only if application is approved)
                    </div>
                    <Button
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-gray-400 shadow-sm cursor-not-allowed"
                      disabled
                    >
                      Download Letter
                    </Button>
                  </div>
                )}

                {/* Card 3: Upload Required Documents */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                  <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                    <Upload className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold mb-1">Upload Required Documents</div>
                  <div className="text-[15px] text-gray-600 mb-3">
                    Upload or update your Passport Photo, Ghana Card / ID Copy, Appointment Letter, or CV at any time.
                  </div>
                  <Button
                    onClick={() => setUploadModalOpen(true)}
                    className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] hover:bg-[#15803d] shadow-sm"
                  >
                    Upload Documents
                  </Button>
                </div>

                {/* Card 4: Download Reposting Letter (Bottom Right - only if rejected) */}
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

      {/* Document Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 md:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload Required Documents</h3>
                <p className="text-xs text-gray-500 mt-1">Attach missing documents directly to your submitted application.</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Passport Photo */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <label className="block text-sm font-bold text-gray-800 mb-2">Passport Picture</label>
                <div className="flex items-center justify-between gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                    <ImageIcon className="w-4 h-4" />
                    Select Passport Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {passportFile ? passportFile.name : ((application as any)?.passport_photo ? '✓ Previously Uploaded' : 'No file selected')}
                  </span>
                </div>
              </div>

              {/* Ghana Card / ID Card */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <label className="block text-sm font-bold text-gray-800 mb-2">Ghana Card / ID Card Copy</label>
                <div className="flex items-center justify-between gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Select ID Card File
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {idCardFile ? idCardFile.name : ((application as any)?.id_card_copy ? '✓ Previously Uploaded' : 'No file selected')}
                  </span>
                </div>
              </div>

              {/* NSS Appointment Letter */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <label className="block text-sm font-bold text-gray-800 mb-2">NSS Appointment Letter</label>
                <div className="flex items-center justify-between gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                    <FileText className="w-4 h-4" />
                    Select Appointment Letter
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => setAppointmentFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {appointmentFile ? appointmentFile.name : ((application as any)?.appointment_letter ? '✓ Previously Uploaded' : 'No file selected')}
                  </span>
                </div>
              </div>

              {/* CV / Certificates */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <label className="block text-sm font-bold text-gray-800 mb-2">Curriculum Vitae (CV) / Certificates</label>
                <div className="flex items-center justify-between gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    Select CV / Certificates
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {cvFile ? cvFile.name : ((application as any)?.certificates ? '✓ Previously Uploaded' : 'No file selected')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="rounded-xl border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveDocuments}
                disabled={uploading}
                className="rounded-xl bg-[#0d5c2e] hover:bg-[#073e1e] text-white font-semibold px-6 shadow-md"
              >
                {uploading ? 'Saving Documents...' : 'Save & Attach Documents'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
