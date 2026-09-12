import { Station } from './types/admin';

export const INITIAL_STATIONS: Station[] = [
  {
    id: 'st-headoffice',
    name: 'DVLA Head Office - Cantonments',
    region: 'Greater Accra',
    capacity: 50,
    departments: [
      'IT & Software Engineering',
      'Executive Secretariat',
      'Research & Development',
      'Administration & Human Resources',
      'Legal & Compliance',
      'Finance & Accounting',
      'Internal Audit',
      'Procurement & Supply Chain'
    ]
  },
  {
    id: 'st-37',
    name: 'Accra Regional Office - 37',
    region: 'Greater Accra',
    capacity: 35,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Customer Experience & Desk',
      'Revenue & Cashier'
    ]
  },
  {
    id: 'st-tema',
    name: 'Tema Regional Office',
    region: 'Greater Accra',
    capacity: 25,
    departments: [
      'Heavy Vehicle Inspection & Clearance',
      'Port Transit Clearance',
      'Driver Licensing',
      'Customer Service Desk'
    ]
  },
  {
    id: 'st-weija',
    name: 'Weija District Office',
    region: 'Greater Accra',
    capacity: 20,
    departments: [
      'Driver Licensing & Renewal',
      'Vehicle Inspection & Testing',
      'Client Records & Information'
    ]
  },
  {
    id: 'st-kumasi',
    name: 'Kumasi Regional Office - Adum',
    region: 'Ashanti',
    capacity: 30,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Certification',
      'Regional Administration',
      'Accounts & Revenue Desk'
    ]
  },
  {
    id: 'st-takoradi',
    name: 'Takoradi Regional Office',
    region: 'Western',
    capacity: 20,
    departments: [
      'Driver Testing & Certification',
      'Commercial & Logistics Vehicle Registry',
      'Client Services & Front Desk'
    ]
  },
  {
    id: 'st-tamale',
    name: 'Tamale Regional Office',
    region: 'Northern',
    capacity: 15,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Regional Records & Admin'
    ]
  },
  {
    id: 'st-sunyani',
    name: 'Sunyani Regional Office',
    region: 'Bono',
    capacity: 15,
    departments: [
      'Driver Licensing',
      'Vehicle Inspection',
      'Customer Service & Cashier'
    ]
  },
  {
    id: 'st-capecoast',
    name: 'Cape Coast Regional Office',
    region: 'Central',
    capacity: 15,
    departments: [
      'Driver Licensing & Renewal',
      'Vehicle Inspection & Testing',
      'Front Desk & Inquiries'
    ]
  },
  {
    id: 'st-ho',
    name: 'Ho Regional Office',
    region: 'Volta',
    capacity: 15,
    departments: [
      'Driver Testing & Licensing',
      'Vehicle Inspection Unit',
      'Administrative Support'
    ]
  },
  {
    id: 'st-koforidua',
    name: 'Koforidua Regional Office',
    region: 'Eastern',
    capacity: 15,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Client Records & Inquiries'
    ]
  }
];

const STORAGE_KEY = 'dvla_nss_stations_v1';

export function getStoredStations(): Station[] {
  if (typeof window === 'undefined') return INITIAL_STATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STATIONS;
  } catch (err) {
    return INITIAL_STATIONS;
  }
}

export function saveStoredStations(stations: Station[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch (err) {
    console.error('Failed to save stations to localStorage:', err);
  }
}
