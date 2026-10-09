import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

const DEFAULT_STATIONS = [
  {
    station_code: 'st-headoffice',
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
      'Procurement & Supply Chain',
    ],
  },
  {
    station_code: 'st-37',
    name: 'Accra Regional Office - 37',
    region: 'Greater Accra',
    capacity: 35,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Customer Experience & Desk',
      'Revenue & Cashier',
    ],
  },
  {
    station_code: 'st-tema',
    name: 'Tema Regional Office',
    region: 'Greater Accra',
    capacity: 25,
    departments: [
      'Heavy Vehicle Inspection & Clearance',
      'Port Transit Clearance',
      'Driver Licensing',
      'Customer Service Desk',
    ],
  },
  {
    station_code: 'st-weija',
    name: 'Weija District Office',
    region: 'Greater Accra',
    capacity: 20,
    departments: [
      'Driver Licensing & Renewal',
      'Vehicle Inspection & Testing',
      'Client Records & Information',
    ],
  },
  {
    station_code: 'st-kumasi',
    name: 'Kumasi Regional Office - Adum',
    region: 'Ashanti',
    capacity: 30,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Certification',
      'Regional Administration',
      'Accounts & Revenue Desk',
    ],
  },
  {
    station_code: 'st-takoradi',
    name: 'Takoradi Regional Office',
    region: 'Western',
    capacity: 20,
    departments: [
      'Driver Testing & Certification',
      'Commercial & Logistics Vehicle Registry',
      'Client Services & Front Desk',
    ],
  },
  {
    station_code: 'st-tamale',
    name: 'Tamale Regional Office',
    region: 'Northern',
    capacity: 15,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Regional Records & Admin',
    ],
  },
  {
    station_code: 'st-sunyani',
    name: 'Sunyani Regional Office',
    region: 'Bono',
    capacity: 15,
    departments: [
      'Driver Licensing',
      'Vehicle Inspection',
      'Customer Service & Cashier',
    ],
  },
  {
    station_code: 'st-capecoast',
    name: 'Cape Coast Regional Office',
    region: 'Central',
    capacity: 15,
    departments: [
      'Driver Licensing & Renewal',
      'Vehicle Inspection & Testing',
      'Front Desk & Inquiries',
    ],
  },
  {
    station_code: 'st-ho',
    name: 'Ho Regional Office',
    region: 'Volta',
    capacity: 15,
    departments: [
      'Driver Testing & Licensing',
      'Vehicle Inspection Unit',
      'Administrative Support',
    ],
  },
  {
    station_code: 'st-koforidua',
    name: 'Koforidua Regional Office',
    region: 'Eastern',
    capacity: 15,
    departments: [
      'Driver Licensing & Testing',
      'Vehicle Inspection & Registration',
      'Client Records & Inquiries',
    ],
  },
] as const;

async function ensureStationsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS stations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      station_code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(100) NOT NULL,
      capacity INT NOT NULL DEFAULT 20,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_region (region)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      station_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      UNIQUE KEY idx_station_dept (station_id, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const existingStations = await query<{ count: number }[]>(`SELECT COUNT(*) AS count FROM stations`);
  const count = Number(existingStations?.[0]?.count ?? 0);

  if (count > 0) return;

  for (const station of DEFAULT_STATIONS) {
    const result = await query<any>(
      `INSERT INTO stations (station_code, name, region, capacity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), region = VALUES(region), capacity = VALUES(capacity)`,
      [station.station_code, station.name, station.region, station.capacity]
    );

    const stationRow = await query<{ id: number }[]>(`SELECT id FROM stations WHERE station_code = ?`, [station.station_code]);
    const stationId = stationRow?.[0]?.id;

    if (!stationId) continue;

    for (const department of station.departments) {
      await query(
        `INSERT INTO departments (station_id, name)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [stationId, department]
      );
    }
  }
}

function normalizeStations(rows: any[]): any[] {
  return rows.map((station) => ({
    id: String(station.id),
    name: station.name,
    region: station.region,
    capacity: Number(station.capacity),
    departments: Array.isArray(station.departments) ? station.departments : [],
  }));
}

async function readStationsFromDb() {
  await ensureStationsTables();

  const stations = await query<any[]>(`SELECT id, station_code, name, region, capacity FROM stations ORDER BY name ASC`);
  if (!stations || stations.length === 0) return [];

  const allDepts = await query<any[]>(`SELECT station_id, name FROM departments ORDER BY name ASC`);
  const deptMap: Record<number, string[]> = {};
  if (Array.isArray(allDepts)) {
    for (const d of allDepts) {
      if (!deptMap[d.station_id]) deptMap[d.station_id] = [];
      deptMap[d.station_id].push(d.name);
    }
  }

  return stations.map((st) => ({
    id: String(st.id),
    station_code: st.station_code,
    name: st.name,
    region: st.region,
    capacity: Number(st.capacity),
    departments: deptMap[st.id] || [],
  }));
}

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const stations = await readStationsFromDb();
    return NextResponse.json({ stations });
  } catch (error: any) {
    console.error('Fetch stations error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load stations' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { stations: incomingStations } = await request.json();
    if (!Array.isArray(incomingStations)) {
      return NextResponse.json({ error: 'Stations payload is required.' }, { status: 400 });
    }

    await ensureStationsTables();

    const departmentRowsToInsert: [number, string][] = [];

    for (const station of incomingStations) {
      const stationName = String(station.name || '').trim();
      const region = String(station.region || 'Greater Accra').trim();
      const capacity = Number(station.capacity || 20);
      const departments = Array.isArray(station.departments) ? station.departments.filter(Boolean) : [];

      if (!stationName) continue;

      let stationId: number | null = null;
      const rawId = station.id ? String(station.id) : '';

      if (rawId && !rawId.startsWith('st-') && !isNaN(Number(rawId))) {
        const stationRow = await query<{ id: number }[]>(`SELECT id FROM stations WHERE id = ?`, [Number(rawId)]);
        stationId = stationRow?.[0]?.id ?? null;
      }

      if (stationId === null) {
        const code = (rawId && rawId.startsWith('st-')) ? rawId : `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await query(
          `INSERT INTO stations (station_code, name, region, capacity)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), region = VALUES(region), capacity = VALUES(capacity)`,
          [code, stationName, region, capacity]
        );

        const base = await query<{ id: number }[]>(`SELECT id FROM stations WHERE name = ? ORDER BY id DESC LIMIT 1`, [stationName]);
        stationId = base?.[0]?.id ?? null;
      } else {
        await query(
          `UPDATE stations SET name = ?, region = ?, capacity = ? WHERE id = ?`,
          [stationName, region, capacity, stationId]
        );
      }

      if (!stationId) continue;

      await query(`DELETE FROM departments WHERE station_id = ?`, [stationId]);

      for (const dept of departments) {
        const dName = String(dept).trim();
        if (dName) {
          departmentRowsToInsert.push([stationId, dName]);
        }
      }
    }

    if (departmentRowsToInsert.length > 0) {
      const placeholders = departmentRowsToInsert.map(() => '(?, ?)').join(', ');
      const flatParams = departmentRowsToInsert.flat();
      await query(
        `INSERT INTO departments (station_id, name) VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        flatParams
      );
    }

    const stations = await readStationsFromDb();
    return NextResponse.json({ stations, message: 'Stations saved successfully.' });
  } catch (error: any) {
    console.error('Save stations error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save stations' }, { status: 500 });
  }
}

