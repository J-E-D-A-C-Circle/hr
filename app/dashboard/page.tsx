"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UploadCloud, DownloadCloud, LogOut, FileText, Home, Shield } from 'lucide-react';
import axios from 'axios';

const NAV = [
  { label: 'Dashboard', active: true },
  { label: 'Onboarding', active: false },
  { label: 'Privacy', active: false },
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.replace('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    if (parsedUser.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchApplication();
  }, [router]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost/api/applications.php?action=my-application',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApplication(response.data.application);
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost/api/applications.php?action=generate-pdf',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const app = response.data.application;
      
      // Get logo as base64 for embedding
      const logoPath = '/oop.png';
      
      // Format date nicely
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Create PDF content with beautiful design
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NSS Posting Letter - DVLA</title>
          <style>
            @media print {
              @page { 
                margin: 1.5cm 2cm;
                size: A4;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.8;
              color: #1a1a1a;
              background: #ffffff;
              padding: 0;
            }
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 25px;
              border-bottom: 4px solid #16a34a;
              position: relative;
            }
            .logo-container {
              margin-bottom: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .logo-container img {
              max-width: 120px;
              height: auto;
              margin-bottom: 15px;
            }
            .organization-name {
              font-size: 22px;
              font-weight: bold;
              color: #16a34a;
              letter-spacing: 1px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .document-title {
              font-size: 18px;
              color: #2d5016;
              font-weight: 600;
              margin-top: 10px;
              letter-spacing: 0.5px;
            }
            .document-subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
              font-style: italic;
            }
            .content {
              margin-top: 35px;
            }
            .date-section {
              text-align: right;
              margin-bottom: 30px;
              font-size: 14px;
              color: #555;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
              line-height: 2;
            }
            .main-text {
              font-size: 15px;
              text-align: justify;
              margin-bottom: 25px;
              line-height: 1.9;
            }
            .highlight {
              color: #16a34a;
              font-weight: bold;
              font-size: 16px;
            }
            .details-box {
              background: linear-gradient(to right, #f0fdf4, #ffffff);
              border-left: 5px solid #16a34a;
              padding: 20px 25px;
              margin: 30px 0;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .details-title {
              font-size: 16px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .detail-item {
              margin-bottom: 12px;
              font-size: 14px;
            }
            .detail-label {
              font-weight: bold;
              color: #2d5016;
              display: inline-block;
              min-width: 140px;
            }
            .detail-value {
              color: #1a1a1a;
            }
            .posting-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border: 2px solid #16a34a;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
              box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
            }
            .posting-title {
              font-size: 17px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 18px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              padding-bottom: 10px;
              border-bottom: 2px solid #86efac;
            }
            .posting-item {
              display: flex;
              margin-bottom: 14px;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .posting-label {
              font-weight: bold;
              color: #2d5016;
              min-width: 120px;
              font-size: 14px;
            }
            .posting-value {
              color: #1a1a1a;
              font-size: 14px;
              font-weight: 500;
            }
            .closing {
              margin-top: 35px;
              font-size: 15px;
              line-height: 2;
            }
            .signature-section {
              margin-top: 60px;
              margin-bottom: 40px;
            }
            .signature-line {
              border-top: 2px solid #16a34a;
              width: 300px;
              margin: 50px 0 10px 0;
            }
            .signature-label {
              font-size: 13px;
              color: #555;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #888;
              font-style: italic;
            }
            .footer-id {
              margin-top: 8px;
              font-size: 10px;
              color: #aaa;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="header">
              <div class="logo-container">
                <img src="${logoPath}" alt="DVLA Logo" onerror="this.style.display='none';" />
              </div>
              <div class="organization-name">Driver and Vehicle Licensing Authority</div>
              <div class="document-title">NATIONAL SERVICE SCHEME</div>
              <div class="document-subtitle">Posting Appointment Letter</div>
            </div>
            
            <div class="content">
              <div class="date-section">
                <strong>Date:</strong> ${currentDate}
              </div>
              
              <div class="greeting">
                <strong>Dear ${app.first_name} ${app.middle_name ? app.middle_name + ' ' : ''}${app.last_name},</strong>
              </div>
              
              <div class="main-text">
                We are pleased to inform you that your application for National Service posting at the 
                <span class="highlight">Driver and Vehicle Licensing Authority (DVLA)</span> has been 
                <strong style="color: #16a34a; font-size: 16px;">APPROVED</strong>.
              </div>
              
              <div class="details-box">
                <div class="details-title">Applicant Information</div>
                <div class="detail-item">
                  <span class="detail-label">NSS Number:</span>
                  <span class="detail-value">${app.nss_number || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Full Name:</span>
                  <span class="detail-value">${app.first_name} ${app.middle_name || ''} ${app.last_name}</span>
                </div>
              </div>
              
              <div class="posting-box">
                <div class="posting-title">📋 Posting Assignment Details</div>
                ${app.posting_region ? `
                <div class="posting-item">
                  <span class="posting-label">Region:</span>
                  <span class="posting-value">${app.posting_region}</span>
                </div>
                ` : ''}
                ${app.posting_district && app.posting_district !== '0' && app.posting_district !== 'N/A' ? `
                <div class="posting-item">
                  <span class="posting-label">District:</span>
                  <span class="posting-value">${app.posting_district}</span>
                </div>
                ` : app.district ? `
                <div class="posting-item">
                  <span class="posting-label">District:</span>
                  <span class="posting-value">${app.district}</span>
                </div>
                ` : ''}
                ${app.posting_station ? `
                <div class="posting-item">
                  <span class="posting-label">Station:</span>
                  <span class="posting-value">${app.posting_station}</span>
                </div>
                ` : ''}
                ${app.posting_department ? `
                <div class="posting-item">
                  <span class="posting-label">Department:</span>
                  <span class="posting-value">${app.posting_department}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="closing">
                <p>Please report to the above-mentioned station and department on your assigned date to begin your National Service. 
                This appointment is subject to the terms and conditions of the National Service Scheme.</p>
                <p style="margin-top: 15px;">If you have any questions or require further clarification, please do not hesitate to contact the DVLA NSS Portal administration.</p>
                <p style="margin-top: 20px;">We congratulate you on your appointment and look forward to your valuable contribution to the Driver and Vehicle Licensing Authority.</p>
              </div>
              
              <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Signatory</div>
                <div style="margin-top: 5px; font-size: 12px; color: #666;">DVLA Administration</div>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an official computer-generated document from the DVLA NSS Portal</p>
              <div class="footer-id">Document ID: ${app.id} | Generated: ${new Date().toLocaleString()}</div>
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
      alert(error.response?.data?.error || 'Failed to generate PDF');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const getStatusMessage = () => {
    if (!application) return { text: 'Your application is pending', color: 'bg-yellow-50 text-yellow-900' };
    
    switch (application.status) {
      case 'approved':
        return { text: 'Your application is successful', color: 'bg-green-50 text-green-900' };
      case 'rejected':
        return { text: 'Your application is rejected', color: 'bg-red-50 text-red-900' };
      case 'under_review':
        return { text: 'Your application is under review', color: 'bg-blue-50 text-blue-900' };
      default:
        return { text: 'Your application is pending', color: 'bg-yellow-50 text-yellow-900' };
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#22c55e] to-[#16a34a] shadow-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image 
              src="/oop.png" 
              width={40} 
              height={40} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-1 shadow-md ring-2 ring-white/50" 
            />
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">DVLA NSS Portal</h2>
              <p className="text-white/90 text-xs mt-0.5">{userDisplayName.split(' ')[0]}</p>
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
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col min-h-screen w-64 bg-gradient-to-b from-[#22c55e] to-[#16a34a] shadow-xl">
        <div className="pt-8 pb-6 px-7 flex flex-col items-center border-b border-white/20">
          <div className="relative mb-5">
            <Image 
              src="/oop.png" 
              width={64} 
              height={64} 
              alt="DVLA Logo" 
              className="rounded-full bg-white/90 p-2 shadow-lg ring-2 ring-white/50" 
            />
          </div>
          <h2 className="text-white font-bold text-lg tracking-wide">DVLA NSS Portal</h2>
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
                {n.label === 'Onboarding' && <UploadCloud className="w-5 h-5" />}
                {n.label === 'Privacy' && <Shield className="w-5 h-5" />}
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
            
            {/* Status Banner */}
            <div className="my-6 flex justify-center">
              <div className={`${statusInfo.color} rounded-lg px-6 py-3 text-base font-semibold text-center border border-yellow-200`}>
                {statusInfo.text}
              </div>
            </div>
          </div>

          {/* Grid Cards - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!application ? (
              /* No Application - Show full width Application Form */
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] col-span-2">
                <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                  <UploadCloud className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-base font-bold mb-1">Application Form</div>
                <div className="text-[15px] text-gray-600 mb-3">
                  Start your application to get enrolled into the NSS Program at The Driver and Vehicle Licensing Authority.
                </div>
                <Button
                  onClick={() => router.push('/dashboard/apply')}
                  className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm"
                >
                  Start Application
                </Button>
              </div>
            ) : (
              <>
                {/* Card 1: Application Form (Top Left) */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                  <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                    <UploadCloud className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold mb-1">Application Form</div>
                  <div className="text-[15px] text-gray-600 mb-3">
                    Start your application to get enrolled into the NSS Program at The Driver and Vehicle Licensing Authority.
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/view-application')}
                    className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm"
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
                      Download your appointment letter to get started at DVLA
                    </div>
                    <Button
                      onClick={generatePDF}
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm"
                    >
                      Download Letter
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] opacity-50">
                    <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-base font-bold mb-1">Download Appointment Letter</div>
                    <div className="text-[15px] text-gray-600 mb-3">
                      Download your appointment letter to get started at DVLA
                    </div>
                    <Button
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-gray-400 shadow-sm cursor-not-allowed"
                      disabled
                    >
                      Download Letter
                    </Button>
                  </div>
                )}

                {/* Card 3: NSS district approved appointment form (Bottom Left) */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                  <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                    <UploadCloud className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold mb-1">NSS district approved appointment form</div>
                  <div className="text-[15px] text-gray-600 mb-3">
                    Upload your appointment form to get complete your enrollment into the NSS Program at The Driver and Vehicle Licensing Authority.
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/apply')}
                    className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm"
                    disabled={application.status !== 'approved'}
                  >
                    Upload Form
                  </Button>
                </div>

                {/* Card 4: Download Reposting Letter (Bottom Right - only if approved) */}
                {application.status === 'approved' ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                    <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-base font-bold mb-1">Download Reposting Letter</div>
                    <div className="text-[15px] text-gray-600 mb-3">
                      Download your reposting letter to send to the NSS secretariat
                    </div>
                    <Button
                      onClick={generatePDF}
                      className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] shadow-sm"
                    >
                      Download Letter
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px] opacity-50">
                    <div className="mb-2 p-2 bg-emerald-100 rounded-lg">
                      <DownloadCloud className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-base font-bold mb-1">Download Reposting Letter</div>
                    <div className="text-[15px] text-gray-600 mb-3">
                      Download your reposting letter to send to the NSS secretariat
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
