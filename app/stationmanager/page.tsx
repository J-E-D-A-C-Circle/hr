'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import {
  Building2,
  Users,
  Search,
  Filter,
  FileText,
  Printer,
  Download,
  Phone,
  Mail,
  X,
  Shield,
  Eye,
  RefreshCw,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import OfficialAppointmentLetter from '@/components/OfficialAppointmentLetter';
import ModalPortal from '@/components/ui/ModalPortal';
import IntakeStatusToggle from '@/components/IntakeStatusToggle';
import { getAutoServiceYear, getDefaultCcForStation, getCcListForStation } from '@/lib/utils';
import { Station } from '@/lib/types/admin';

interface StationWithCount extends Station {
  personnelCount?: number;
  station_code?: string;
}

interface StationPersonnel {
  id: number;
  nss_number?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  phone_number?: string;
  email?: string;
  residential_address?: string;
  region?: string;
  district?: string;
  institution_name?: string;
  course_program?: string;
  year_of_completion?: string | number;
  posting_station?: string;
  posting_department?: string;
  posting_region?: string;
  posting_district?: string;
  service_year?: string;
  service_period_start?: string;
  service_period_end?: string;
  status?: string;
  created_at?: string;
  reviewed_at?: string;
  appointmentLetterData?: any;
}

const FIXED_EFFECTIVE_DATE_TEXT = 'Monday, November 2, 2026';
const GILL_SANS_FONT_FAMILY = "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif";

function StationManagerContent() {
  const searchParams = useSearchParams();
  const urlStationParam = searchParams.get('station');

  const [stations, setStations] = useState<StationWithCount[]>([]);
  const [applications, setApplications] = useState<StationPersonnel[]>([]);
  const [totalApprovedOverall, setTotalApprovedOverall] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStationName, setSelectedStationName] = useState<string>(urlStationParam || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Suggestive Typing Combobox State
  const [stationSearchInput, setStationSearchInput] = useState<string>('');
  const [isStationMenuOpen, setIsStationMenuOpen] = useState<boolean>(false);
  const [highlightedStationIndex, setHighlightedStationIndex] = useState<number>(-1);
  const stationComboboxRef = useRef<HTMLDivElement>(null);

  // Pagination state (critical for large volumes)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal state for viewing personnel details & appointment letter
  const [selectedPersonnel, setSelectedPersonnel] = useState<StationPersonnel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Update browser URL
  const updateBrowserUrl = (stationName: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!stationName || stationName === 'all') {
      url.searchParams.delete('station');
    } else {
      url.searchParams.set('station', stationName);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Fetch stations and personnel from API
  const fetchData = async (stationParam?: string) => {
    setLoading(true);
    try {
      const activeStation = stationParam !== undefined ? stationParam : selectedStationName;
      const url = activeStation && activeStation !== 'all'
        ? `/api/stationmanager?station=${encodeURIComponent(activeStation)}`
        : '/api/stationmanager';

      const response = await axios.get(url);
      const serverStations: StationWithCount[] = response.data.stations || [];
      const serverApplications: StationPersonnel[] = response.data.applications || [];
      const overallCount: number = response.data.totalApprovedOverall || serverApplications.length;

      setStations(serverStations);
      setApplications(serverApplications);
      setTotalApprovedOverall(overallCount);

      // Default to first station or URL param if not set
      if (!activeStation && !urlStationParam && serverStations.length > 0) {
        const stationWithPersonnel = serverStations.find((s) => (s.personnelCount || 0) > 0);
        const initialStation = stationWithPersonnel ? stationWithPersonnel.name : serverStations[0].name;
        setSelectedStationName(initialStation);
        setStationSearchInput(initialStation);
        updateBrowserUrl(initialStation);
      } else if (urlStationParam && !activeStation) {
        setSelectedStationName(urlStationParam);
        setStationSearchInput(urlStationParam);
      } else if (activeStation) {
        setStationSearchInput(activeStation === 'all' ? '' : activeStation);
      }
    } catch (err: any) {
      console.error('Error fetching station manager data:', err);
      toast.error('Failed to load station personnel data from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(urlStationParam || undefined);
  }, []);

  // Sync stationSearchInput with selectedStationName
  useEffect(() => {
    if (selectedStationName && selectedStationName !== 'all') {
      setStationSearchInput(selectedStationName);
    } else if (selectedStationName === 'all') {
      setStationSearchInput('');
    }
  }, [selectedStationName]);

  // Click outside listener for suggestive typing dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stationComboboxRef.current && !stationComboboxRef.current.contains(event.target as Node)) {
        setIsStationMenuOpen(false);
        // Reset input text to selected station if closed without picking
        if (selectedStationName && selectedStationName !== 'all') {
          setStationSearchInput(selectedStationName);
        } else {
          setStationSearchInput('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStationName]);

  // Suggestive typing options with zero duplicates guaranteed
  const suggestedStations = useMemo(() => {
    // Unique stations deduplicated by lowercase trimmed name
    const uniqueStationsMap = new Map<string, StationWithCount>();
    for (const st of stations) {
      const key = st.name.trim().toLowerCase();
      if (!uniqueStationsMap.has(key)) {
        uniqueStationsMap.set(key, st);
      }
    }
    const deduplicated = Array.from(uniqueStationsMap.values());

    const query = stationSearchInput.trim().toLowerCase();
    if (!query) {
      return deduplicated;
    }
    return deduplicated.filter((st) => {
      const nameMatch = st.name.toLowerCase().includes(query);
      const regionMatch = (st.region || '').toLowerCase().includes(query);
      const codeMatch = (st.station_code || '').toLowerCase().includes(query);
      return nameMatch || regionMatch || codeMatch;
    });
  }, [stations, stationSearchInput]);

  // Handle station selection
  const handleSelectStation = (stationName: string) => {
    setSelectedStationName(stationName);
    setSelectedDeptFilter('all');
    setSearchQuery('');
    setIsStationMenuOpen(false);
    setHighlightedStationIndex(-1);

    if (stationName === 'all') {
      setStationSearchInput('');
    } else {
      setStationSearchInput(stationName);
    }

    updateBrowserUrl(stationName);
    fetchData(stationName);
  };

  // Keyboard navigation for suggestive typing
  const handleComboboxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isStationMenuOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsStationMenuOpen(true);
      }
      return;
    }

    // List includes "All Stations" option at index 0, followed by suggestedStations
    const totalOptions = suggestedStations.length + 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedStationIndex((prev) => (prev + 1 >= totalOptions ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedStationIndex((prev) => (prev - 1 < 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedStationIndex === 0) {
        handleSelectStation('all');
      } else if (highlightedStationIndex > 0 && highlightedStationIndex <= suggestedStations.length) {
        handleSelectStation(suggestedStations[highlightedStationIndex - 1].name);
      } else if (suggestedStations.length > 0) {
        handleSelectStation(suggestedStations[0].name);
      }
    } else if (e.key === 'Escape') {
      setIsStationMenuOpen(false);
    }
  };

  // Filtered applications
  const filteredPersonnel = useMemo(() => {
    return applications.filter((person) => {
      // Station filter
      if (selectedStationName && selectedStationName !== 'all') {
        const matchesStation = (person.posting_station || '').trim().toLowerCase() === selectedStationName.trim().toLowerCase();
        if (!matchesStation) return false;
      }

      // Department filter
      if (selectedDeptFilter !== 'all') {
        if (person.posting_department !== selectedDeptFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = person.full_name?.toLowerCase().includes(q);
        const nssMatch = person.nss_number?.toLowerCase().includes(q);
        const deptMatch = person.posting_department?.toLowerCase().includes(q);
        const programMatch = person.course_program?.toLowerCase().includes(q);
        const institutionMatch = person.institution_name?.toLowerCase().includes(q);
        const phoneMatch = person.phone_number?.includes(q);
        return Boolean(nameMatch || nssMatch || deptMatch || programMatch || institutionMatch || phoneMatch);
      }

      return true;
    });
  }, [applications, selectedStationName, selectedDeptFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStationName, selectedDeptFilter, searchQuery, pageSize]);

  // Paginated slice
  const paginatedPersonnel = useMemo(() => {
    if (pageSize >= 9999) return filteredPersonnel;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPersonnel.slice(startIndex, startIndex + pageSize);
  }, [filteredPersonnel, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize >= 9999 || filteredPersonnel.length === 0) return 1;
    return Math.ceil(filteredPersonnel.length / pageSize);
  }, [filteredPersonnel.length, pageSize]);

  // Current selected station details
  const currentStationObj = useMemo(() => {
    if (!selectedStationName || selectedStationName === 'all') return null;
    return stations.find((s) => s.name.toLowerCase() === selectedStationName.toLowerCase()) || null;
  }, [stations, selectedStationName]);

  // Station available departments
  const availableDepartments = useMemo(() => {
    if (currentStationObj && currentStationObj.departments?.length > 0) {
      return currentStationObj.departments;
    }
    const depts = new Set<string>();
    applications
      .filter((a) => !selectedStationName || selectedStationName === 'all' || a.posting_station === selectedStationName)
      .forEach((a) => {
        if (a.posting_department) depts.add(a.posting_department);
      });
    return Array.from(depts);
  }, [currentStationObj, applications, selectedStationName]);

  // Copy shareable link for this station
  const handleCopyStationLink = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.origin + window.location.pathname);
    if (selectedStationName && selectedStationName !== 'all') {
      url.searchParams.set('station', selectedStationName);
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    toast.success(`Shareable link copied for ${selectedStationName || 'All Stations'}!`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Export station roster CSV with all personnel details for Excel
  const handleExportCSV = () => {
    if (filteredPersonnel.length === 0) {
      toast.error('No personnel records to export for this view.');
      return;
    }

    const headers = [
      '#',
      'NSS Number',
      'Full Name',
      'Surname / Last Name',
      'First Name',
      'Middle Name',
      'Gender',
      'Date of Birth',
      'Nationality',
      'Phone Number',
      'Email Address',
      'Residential Address',
      'Home Region',
      'Home District',
      'Tertiary Institution',
      'Program of Study',
      'Year of Completion',
      'Assigned Station',
      'Assigned Department',
      'Posting Region',
      'Posting District',
      'Service Year',
      'Service Start Date',
      'Service End Date',
      'Commencement Date',
      'Appointment Ref Number',
      'Appointment Letter Date',
      'Authorized Signatory',
      'Signatory Title',
      'Approval Status',
      'Approval Date',
      'Submission Date',
    ];

    const escapeCell = (val: any) => {
      if (val === undefined || val === null || val === '') return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatPhone = (val: any) => {
      if (!val) return '""';
      // Format as ="..." so Excel preserves leading zeros without formatting loss
      const cleaned = String(val).replace(/["'=]/g, '').trim();
      return `="${cleaned}"`;
    };

    const rows = filteredPersonnel.map((p, index) => {
      const letterData = p.appointmentLetterData || {};
      const refNum = letterData.customRefNumber || `DVLA/HQ/NSS/2026/${String(p.id).padStart(3, '0')}`;
      const letterDate =
        letterData.letterDate ||
        (p.reviewed_at
          ? new Date(p.reviewed_at)
              .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              .toUpperCase()
          : 'OCTOBER 12, 2026');
      const signatory = letterData.signatoryName || 'EPHRAIM NII TAN SACKEY';
      const sigTitle = letterData.signatoryTitle || 'AG. DIRECTOR HR';

      return [
        index + 1,
        escapeCell(p.nss_number || 'N/A'),
        escapeCell(p.full_name),
        escapeCell(p.last_name),
        escapeCell(p.first_name),
        escapeCell(p.middle_name || ''),
        escapeCell(p.gender || 'N/A'),
        escapeCell(p.date_of_birth ? new Date(p.date_of_birth).toISOString().split('T')[0] : 'N/A'),
        escapeCell(p.nationality || 'Ghanaian'),
        formatPhone(p.phone_number),
        escapeCell(p.email || 'N/A'),
        escapeCell(p.residential_address || 'N/A'),
        escapeCell(p.region || 'N/A'),
        escapeCell(p.district || 'N/A'),
        escapeCell(p.institution_name || 'N/A'),
        escapeCell(p.course_program || 'N/A'),
        escapeCell(p.year_of_completion || 'N/A'),
        escapeCell(p.posting_station || selectedStationName || 'N/A'),
        escapeCell(p.posting_department || 'General Deployment'),
        escapeCell(p.posting_region || currentStationObj?.region || 'N/A'),
        escapeCell(p.posting_district || 'N/A'),
        escapeCell(getAutoServiceYear(p.service_year)),
        escapeCell(p.service_period_start || '2026-11-02'),
        escapeCell(p.service_period_end || '2027-10-29'),
        escapeCell(FIXED_EFFECTIVE_DATE_TEXT),
        escapeCell(refNum),
        escapeCell(letterDate),
        escapeCell(signatory),
        escapeCell(sigTitle),
        escapeCell((p.status || 'APPROVED').toUpperCase()),
        escapeCell(p.reviewed_at ? new Date(p.reviewed_at).toISOString().split('T')[0] : 'N/A'),
        escapeCell(p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 'N/A'),
      ].join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedStationName = (selectedStationName || 'All_Stations').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `DVLA_NSS_Personnel_Roster_${sanitizedStationName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Station roster with full personnel records exported to CSV!');
  };

  // Open Details Modal
  const handleOpenDetails = (person: StationPersonnel) => {
    setSelectedPersonnel(person);
    setIsDetailModalOpen(true);
  };

  // Print official appointment letter
  const handlePrintLetter = (person: StationPersonnel) => {
    const printWin = window.open('', '_blank', 'width=850,height=1050');
    if (!printWin) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the appointment letter.');
      return;
    }

    const savedLetter = person.appointmentLetterData || {};
    const refNum = savedLetter.customRefNumber || `DVLA/HQ/NSS/2026/${String(person.id).padStart(3, '0')}`;
    const issueDate = savedLetter.letterDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    const applicantName = (savedLetter.applicantName || person.full_name).toUpperCase();
    const applicantAddress = (savedLetter.applicantAddress || person.residential_address || 'ACCRA - GHANA').toUpperCase();
    const salutation = savedLetter.salutation || 'Dear Sir/Madam,';
    const dept = person.posting_department || savedLetter.departmentName || '';
    const station = person.posting_station || selectedStationName || 'DVLA Head Office - Cantonments';
    const serviceYear = getAutoServiceYear(person.service_year);
    const endDate = 'OCTOBER 29, 2027';

    const subject = (savedLetter.customSubject || `APPOINTMENT AS NATIONAL SERVICE PERSONNEL: ${serviceYear} SERVICE YEAR`).toUpperCase();

    const defaultCc = getDefaultCcForStation(station);
    const ccList = getCcListForStation(station, savedLetter.ccList || [defaultCc]);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Letter - ${applicantName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.42;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .letter-container {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            position: relative;
          }
          .header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .header-left {
            font-size: 9pt;
            line-height: 1.35;
          }
          .header-logo {
            text-align: center;
          }
          .header-logo img {
            width: 80px;
            height: auto;
          }
          .header-right {
            text-align: right;
            font-size: 9pt;
            line-height: 1.35;
          }
          .divider {
            border-bottom: 2.5px solid #008053;
            margin: 6px 0 14px 0;
          }
          .ref-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5pt;
            margin-bottom: 12px;
          }
          .ref-dotted {
            border-bottom: 1px dotted #333;
            padding: 0 4px;
            font-weight: bold;
          }
          .addressee {
            margin-bottom: 16px;
            font-size: 11pt;
            font-weight: bold;
            line-height: 1.35;
          }
          .salutation {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .subject-title {
            text-align: center;
            font-weight: bold;
            font-size: 11.5pt;
            text-decoration: underline;
            margin-bottom: 14px;
            text-transform: uppercase;
            line-height: 1.35;
          }
          .body-text p {
            margin-top: 0;
            margin-bottom: 8px;
            text-align: justify;
            font-size: 11pt;
            line-height: 1.42;
          }
          .footer-block {
            margin-top: 18px;
          }
          .signatory-block {
            font-size: 11pt;
            line-height: 1.35;
          }
          .signatory-name {
            font-weight: bold;
            text-decoration: underline;
          }
          .signatory-title {
            font-weight: bold;
            font-size: 10pt;
          }
          .signatory-for {
            font-weight: bold;
            font-size: 9.5pt;
            color: #374151;
          }
          .cc-section {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
            font-size: 9.5pt;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="letter-container">
          <div class="header-row">
            <div class="header-left">
              <div style="font-weight: bold; color: #008053;">Driver & Vehicle Licensing Authority</div>
              <div>Tel: 0302-764993/4</div>
              <div>E-mail: info@dvla.gov.gh</div>
            </div>
            <div class="header-logo">
              <img src="/oop.png" alt="DVLA Logo" />
            </div>
            <div class="header-right">
              <div style="font-weight: bold; color: #008053;">Head Office Address:</div>
              <div>1, Jawaharlal Nehru Road</div>
              <div>P. O. Box 9379, KIA-Accra</div>
            </div>
          </div>
          <div class="divider"></div>

          <div class="ref-row">
            <div>
              <div><strong>My Ref:</strong> <span class="ref-dotted">${refNum}</span></div>
            </div>
            <div style="text-align: right;">
              <div><strong>Date:</strong> <span class="ref-dotted" style="text-transform: uppercase; min-width: 140px; text-align: center;">${issueDate}</span></div>
            </div>
          </div>

          <div class="addressee">
            <div>${applicantName}</div>
            <div style="color: #374151; font-weight: normal;">${applicantAddress}</div>
          </div>

          <div class="salutation">${salutation}</div>

          <div>
            <h2 class="subject-title">${subject}</h2>
          </div>

          <div class="body-text">
            <p>This is to inform you that you have been assigned to the <strong>${station}</strong>${dept ? ` (<strong>${dept}</strong>)` : ''} for the <strong>${serviceYear}</strong> service year.</p>
            <p>Your National Service commences on <strong>${FIXED_EFFECTIVE_DATE_TEXT}</strong> and ends on <strong>${endDate}</strong>.</p>
            <p>You are required to report to the ${defaultCc} for orientation and assignment. You are expected to exhibit good conduct and abide by all rules and regulations of the Authority throughout your service period.</p>
          </div>

          <div class="footer-block">
            <div class="signatory-block">
              <div>Thank you.</div>
              <div style="margin-top: 4px;">Yours faithfully,</div>
              <div style="margin: 4px 0;">
                <div style="font-weight: bold; font-style: italic; color: #008053; margin: 8px 0;">[Authorized Signatory]</div>
              </div>
              <div>
                <div class="signatory-name">${savedLetter.signatoryName || 'EPHRAIM NII TAN SACKEY'}</div>
                <div class="signatory-title">${savedLetter.signatoryTitle || 'AG. DIRECTOR HR'}</div>
                <div class="signatory-for">FOR: CHIEF EXECUTIVE</div>
              </div>
            </div>

            <div class="cc-section">
              <div style="font-weight: bold; margin-bottom: 2px;">CC:</div>
              ${ccList.map((item) => `<div>&bull; ${item}</div>`).join('')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => {
      printWin.print();
    }, 500);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{ fontFamily: GILL_SANS_FONT_FAMILY }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 relative shrink-0">
              <Image
                src="/oop.png"
                alt="DVLA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-[#008053] tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>DVLA NSS PORTAL</span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-[#008053] px-2 py-0.5 rounded-full border border-emerald-200">
                  Station Manager
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                Assigned Personnel Roster & Official Letters (Live MySQL Database)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <IntakeStatusToggle />
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Cycle: <strong className="text-[#008053]">2026/2027</strong>
            </span>
            <button
              onClick={() => fetchData(selectedStationName)}
              className="p-2 text-slate-600 hover:text-[#008053] hover:bg-emerald-50 rounded-xl transition border border-slate-200 cursor-pointer"
              title="Refresh from MySQL Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#008053]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Station Selector Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
            {/* Suggestive Typing Combobox */}
            <div className="space-y-1.5 w-full lg:max-w-xl" ref={stationComboboxRef}>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#008053]" /> Choose Assigned Station (Type to Search)
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={stationSearchInput}
                      onChange={(e) => {
                        setStationSearchInput(e.target.value);
                        setIsStationMenuOpen(true);
                      }}
                      onFocus={() => setIsStationMenuOpen(true)}
                      onKeyDown={handleComboboxKeyDown}
                      placeholder="Type station name (e.g. Kumasi, Tema, Accra)..."
                      className="w-full h-11 pl-4 pr-16 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#008053] focus:border-[#008053] shadow-xs placeholder:text-slate-400 placeholder:font-normal transition"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {stationSearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setStationSearchInput('');
                            handleSelectStation('all');
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 transition cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsStationMenuOpen(!isStationMenuOpen)}
                        className="p-1 rounded-md text-slate-500 hover:text-[#008053] transition cursor-pointer"
                        title="Toggle station options"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isStationMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Suggestive Dropdown Menu */}
                  {isStationMenuOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 sm:max-h-80 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-xs z-[9999] animate-in fade-in-50 zoom-in-95">
                      {/* Option 0: All Stations */}
                      <button
                        type="button"
                        onClick={() => handleSelectStation('all')}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition cursor-pointer ${
                          selectedStationName === 'all' || !selectedStationName
                            ? 'bg-emerald-50 text-emerald-900 font-black'
                            : highlightedStationIndex === 0
                            ? 'bg-slate-100 text-slate-900'
                            : 'hover:bg-slate-50 text-slate-800 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${selectedStationName === 'all' || !selectedStationName ? 'text-[#008053]' : 'opacity-0'}`} />
                          <span>-- All Stations Overview --</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          {totalApprovedOverall} Total
                        </span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      {suggestedStations.length === 0 ? (
                        <div className="px-4 py-4 text-center text-slate-400">
                          <p className="font-semibold text-xs">No matching stations found.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try typing &quot;Accra&quot;, &quot;Kumasi&quot;, or &quot;Tema&quot;</p>
                        </div>
                      ) : (
                        suggestedStations.map((st, idx) => {
                          const isSelected = selectedStationName.toLowerCase() === st.name.toLowerCase();
                          const isHighlighted = highlightedStationIndex === idx + 1;
                          return (
                            <button
                              key={st.id || st.name}
                              type="button"
                              onClick={() => handleSelectStation(st.name)}
                              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-950 font-black'
                                  : isHighlighted
                                  ? 'bg-slate-100 text-slate-900 font-semibold'
                                  : 'hover:bg-emerald-50/50 text-slate-800 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#008053]' : 'opacity-0'}`} />
                                <div className="truncate">
                                  <span className="block truncate text-xs">{st.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{st.region}</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                                {st.personnelCount !== undefined ? `${st.personnelCount} posted` : st.region}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyStationLink}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#008053] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  title="Copy shareable link for this station"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" /> Copy Station Link
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                You can copy and send this station link directly to the station manager to view this roster anytime.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Posted Personnel</span>
                <span className="text-lg sm:text-xl font-black text-[#008053]">{filteredPersonnel.length}</span>
              </div>
              {currentStationObj && (
                <>
                  <div className="bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">Station Capacity</span>
                    <span className="text-lg sm:text-xl font-black text-slate-800">{currentStationObj.capacity || 20}</span>
                  </div>
                  <div className="bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">Region</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 block truncate">{currentStationObj.region}</span>
                  </div>
                </>
              )}
              <button
                onClick={handleExportCSV}
                className="col-span-2 sm:col-span-1 h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Export CSV Roster
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Personnel List Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Control Bar */}
          <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, NSS #, program, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#008053] bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-between md:justify-end">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 shrink-0">Dept:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008053] transition cursor-pointer"
                >
                  <option value="all">All Departments ({filteredPersonnel.length})</option>
                  {availableDepartments.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-600">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008053] transition cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={9999}>All</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Card View (visible on < md screens) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#008053]" />
                Loading personnel records...
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="py-12 text-center text-slate-400 px-4">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No approved personnel found for <strong>{selectedStationName || 'this station'}</strong>.
              </div>
            ) : (
              paginatedPersonnel.map((person, idx) => {
                const rowNumber = (currentPage - 1) * (pageSize >= 9999 ? 0 : pageSize) + idx + 1;
                return (
                  <div
                    key={person.id}
                    className="p-4 hover:bg-emerald-50/30 transition cursor-pointer space-y-3"
                    onClick={() => handleOpenDetails(person)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono font-bold">#{rowNumber}</span>
                          <span className="font-extrabold text-slate-900 text-sm truncate">
                            {person.full_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono font-semibold mt-0.5">
                          {person.nss_number || `NSS-2026-${String(person.id).padStart(3, '0')}`} &bull; {person.gender || 'N/A'}
                        </div>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                        {person.posting_department || 'General'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{person.course_program || 'NSS Personnel'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {person.phone_number || 'N/A'}
                        </span>
                        <span className="font-bold text-emerald-700">Reporting: Nov 2</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(person)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#008053] font-bold text-xs border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details & Letter
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintLetter(person)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Print Official Letter"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on >= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">NSS Number</th>
                  <th className="py-3.5 px-4">Personnel Full Name</th>
                  <th className="py-3.5 px-4">Assigned Department</th>
                  <th className="py-3.5 px-4">Institution / Qualification</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Reporting Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#008053]" />
                      Loading assigned personnel from MySQL database...
                    </td>
                  </tr>
                ) : filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No approved personnel found for <strong>{selectedStationName || 'this station'}</strong>.
                      <p className="text-[11px] text-slate-400 mt-1">
                        Personnel will appear here automatically once approved and posted by Head Office HR.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedPersonnel.map((person, idx) => {
                    const rowNumber = (currentPage - 1) * (pageSize >= 9999 ? 0 : pageSize) + idx + 1;
                    return (
                      <tr
                        key={person.id}
                        className="hover:bg-emerald-50/40 transition group cursor-pointer"
                        onClick={() => handleOpenDetails(person)}
                      >
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">
                          {person.nss_number || `NSS-2026-${String(person.id).padStart(3, '0')}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 group-hover:text-[#008053] transition">
                            {person.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium capitalize">
                            Gender: {person.gender || 'Not specified'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {person.posting_department || 'General Deployment'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{person.course_program || 'NSS Personnel'}</div>
                          <div className="text-[11px] text-slate-500">{person.institution_name || 'Tertiary Institution'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" /> {person.phone_number || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" /> {person.email || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-700 text-xs">
                            {FIXED_EFFECTIVE_DATE_TEXT}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            Orientation Ready
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(person)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#008053] font-bold text-xs border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details & Letter
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintLetter(person)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Print Official Letter"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Mobile-Friendly Pagination */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="text-center sm:text-left">
              Showing{' '}
              <strong>
                {filteredPersonnel.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong>
                {Math.min(currentPage * pageSize, filteredPersonnel.length)}
              </strong>{' '}
              of <strong>{filteredPersonnel.length}</strong> personnel in{' '}
              <strong>{selectedStationName || 'All Stations'}</strong>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2.5 py-1 font-bold text-slate-800 text-xs">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Read-Only Details & Generated Letter Modal */}
      {isDetailModalOpen && selectedPersonnel && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-scaleUp">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 to-[#008053] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-base sm:text-lg text-emerald-200 border border-white/20 shrink-0">
                    {selectedPersonnel.first_name[0]}{selectedPersonnel.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-black text-white flex flex-wrap items-center gap-1.5">
                      <span className="truncate">{selectedPersonnel.full_name}</span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        {selectedPersonnel.nss_number || `NSS-2026-${String(selectedPersonnel.id).padStart(3, '0')}`}
                      </span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                      Station: <strong>{selectedPersonnel.posting_station || selectedStationName}</strong> &bull; Dept: <strong>{selectedPersonnel.posting_department}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePrintLetter(selectedPersonnel)}
                    className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-300" /> <span className="hidden sm:inline">Print Official</span> Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-1.5 sm:p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
                {/* Personnel Read-Only Bio Grid */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#008053]" /> Personnel Deployment Summary (Read-Only)
                    </h3>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1 self-start sm:self-auto">
                      <Shield className="w-3 h-3 text-amber-700" /> Identity files restricted to Head Office HR
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Institution</span>
                      <strong className="text-slate-900 block truncate">{selectedPersonnel.institution_name || 'N/A'}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Course Program</span>
                      <strong className="text-slate-900 block truncate">{selectedPersonnel.course_program || 'N/A'}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone Contact</span>
                      <strong className="text-slate-900 block font-mono text-[11px] truncate">{selectedPersonnel.phone_number || 'N/A'}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                      <strong className="text-slate-900 block truncate text-[11px]">{selectedPersonnel.email || 'N/A'}</strong>
                    </div>

                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Station</span>
                      <strong className="text-[#008053] block truncate">{selectedPersonnel.posting_station || selectedStationName}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Department</span>
                      <strong className="text-[#008053] block truncate">{selectedPersonnel.posting_department || 'General'}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Commencement</span>
                      <strong className="text-slate-900 block text-[11px] truncate">{FIXED_EFFECTIVE_DATE_TEXT}</strong>
                    </div>
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Service Year</span>
                      <strong className="text-slate-900 block font-mono">{getAutoServiceYear(selectedPersonnel.service_year)}</strong>
                    </div>
                  </div>
                </div>

                {/* Official Generated Appointment Letter Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#008053]" /> Official Generated Appointment Letter
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#008053] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Official Times New Roman 12pt Standard
                    </span>
                  </div>

                  <div className="bg-amber-100/40 p-2 sm:p-4 rounded-2xl border border-amber-300/70 shadow-inner overflow-x-auto">
                    <OfficialAppointmentLetter
                      referenceNumber={selectedPersonnel.nss_number || String(selectedPersonnel.id || '0001')}
                      applicantName={selectedPersonnel.full_name}
                      applicantAddress={selectedPersonnel.residential_address || 'ACCRA - GHANA'}
                      positionTitle={selectedPersonnel.course_program || 'NSS Personnel'}
                      departmentName={selectedPersonnel.posting_department}
                      postingStationName={selectedPersonnel.posting_station || selectedStationName || 'Head Office'}
                      appointmentType="TEMPORARY"
                      effectiveDate={FIXED_EFFECTIVE_DATE_TEXT}
                      issueDate={selectedPersonnel.appointmentLetterData?.letterDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      customRefNumber={selectedPersonnel.appointmentLetterData?.customRefNumber}
                      salutation={selectedPersonnel.appointmentLetterData?.salutation}
                      customSubject={selectedPersonnel.appointmentLetterData?.customSubject}
                      customBodyText={selectedPersonnel.appointmentLetterData?.customBodyText}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <span className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
                  Read-only view for Station Managers. To request personnel transfers, contact Head Office HR.
                </span>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default function StationManagerPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500"
          style={{ fontFamily: GILL_SANS_FONT_FAMILY }}
        >
          <RefreshCw className="w-8 h-8 animate-spin text-[#008053] mr-3" />
          <span className="font-bold text-sm">Loading Station Manager Portal...</span>
        </div>
      }
    >
      <StationManagerContent />
    </Suspense>
  );
}
