import { NextResponse } from 'next/server';
import { db, query } from '@/lib/db';
import { nssApplications } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { INITIAL_STATIONS } from '@/lib/stations-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedStationFilter = searchParams.get('station');

    // 1. Fetch live assigned counts per station directly from MySQL
    let countsMap: Record<string, number> = {};
    let totalApprovedOverall = 0;
    try {
      const countsResult = await query<{ posting_station: string; count: number }[]>(
        `SELECT posting_station, COUNT(*) AS count
         FROM nss_applications
         WHERE status = 'approved' AND posting_station IS NOT NULL AND TRIM(posting_station) != ''
         GROUP BY posting_station`
      );
      if (Array.isArray(countsResult)) {
        for (const row of countsResult) {
          if (row.posting_station) {
            countsMap[row.posting_station.trim().toLowerCase()] = Number(row.count);
            countsMap[row.posting_station.trim()] = Number(row.count);
            totalApprovedOverall += Number(row.count);
          }
        }
      }
    } catch (countErr) {
      console.warn('Could not query station counts:', countErr);
    }

    // 2. Fetch stations from database table `stations` if exists, otherwise fallback to INITIAL_STATIONS
    let stations: any[] = INITIAL_STATIONS;
    try {
      const dbStations = await query<any[]>(
        `SELECT id, station_code, name, region, capacity FROM stations ORDER BY name ASC`
      );
      if (Array.isArray(dbStations) && dbStations.length > 0) {
        const allDepts = await query<any[]>(
          `SELECT station_id, name FROM departments ORDER BY name ASC`
        );
        const deptMap: Record<number, string[]> = {};
        if (Array.isArray(allDepts)) {
          for (const d of allDepts) {
            if (!deptMap[d.station_id]) deptMap[d.station_id] = [];
            deptMap[d.station_id].push(d.name);
          }
        }
        stations = dbStations.map((st) => ({
          id: String(st.id),
          station_code: st.station_code,
          name: st.name,
          region: st.region,
          capacity: Number(st.capacity),
          departments: deptMap[st.id] || [],
          personnelCount: countsMap[st.name] || countsMap[st.name.toLowerCase()] || 0,
        }));
      } else {
        stations = INITIAL_STATIONS.map((st) => ({
          ...st,
          personnelCount: countsMap[st.name] || countsMap[st.name.toLowerCase()] || 0,
        }));
      }
    } catch (dbErr) {
      stations = INITIAL_STATIONS.map((st) => ({
        ...st,
        personnelCount: countsMap[st.name] || countsMap[st.name.toLowerCase()] || 0,
      }));
    }

    // 3. Dynamically add any custom station present in nss_applications (e.g. "DOME") if missing
    try {
      const distinctAssigned = await query<{ posting_station: string; posting_region?: string }[]>(
        `SELECT DISTINCT posting_station, posting_region
         FROM nss_applications
         WHERE status = 'approved' AND posting_station IS NOT NULL AND TRIM(posting_station) != ''`
      );
      if (Array.isArray(distinctAssigned)) {
        for (const item of distinctAssigned) {
          const stationName = item.posting_station.trim();
          const exists = stations.some(
            (s) => s.name.toLowerCase() === stationName.toLowerCase()
          );
          if (!exists) {
            stations.push({
              id: `custom-${stationName.toLowerCase().replace(/\s+/g, '-')}`,
              name: stationName,
              region: item.posting_region || 'Greater Accra',
              capacity: 25,
              departments: ['General Deployment'],
              personnelCount: countsMap[stationName] || countsMap[stationName.toLowerCase()] || 0,
            });
          }
        }
      }
    } catch (distinctErr) {
      console.warn('Could not query distinct stations:', distinctErr);
    }

    // Enforce strict deduplication by normalized station name
    const uniqueStationsMap = new Map<string, any>();
    for (const st of stations) {
      const normalizedKey = String(st.name || '').trim().toLowerCase();
      if (!normalizedKey) continue;
      if (!uniqueStationsMap.has(normalizedKey)) {
        uniqueStationsMap.set(normalizedKey, { ...st, name: st.name.trim() });
      } else {
        const existing = uniqueStationsMap.get(normalizedKey);
        existing.personnelCount = (existing.personnelCount || 0) + (st.personnelCount || 0);
      }
    }
    stations = Array.from(uniqueStationsMap.values());

    // Sort stations alphabetically
    stations.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Fetch approved applications assigned to stations
    let appsQuery = db
      .select({
        id: nssApplications.id,
        nss_number: nssApplications.nssNumber,
        first_name: nssApplications.firstName,
        last_name: nssApplications.lastName,
        middle_name: nssApplications.middleName,
        date_of_birth: nssApplications.dateOfBirth,
        gender: nssApplications.gender,
        nationality: nssApplications.nationality,
        phone_number: nssApplications.phoneNumber,
        email: nssApplications.email,
        residential_address: nssApplications.residentialAddress,
        region: nssApplications.region,
        district: nssApplications.district,
        institution_name: nssApplications.institutionName,
        course_program: nssApplications.courseProgram,
        year_of_completion: nssApplications.yearOfCompletion,
        posting_region: nssApplications.postingRegion,
        posting_district: nssApplications.postingDistrict,
        posting_station: nssApplications.postingStation,
        posting_department: nssApplications.postingDepartment,
        service_year: nssApplications.serviceYear,
        service_period_start: nssApplications.servicePeriodStart,
        service_period_end: nssApplications.servicePeriodEnd,
        additional_info: nssApplications.additionalInfo,
        status: nssApplications.status,
        created_at: nssApplications.createdAt,
        reviewed_at: nssApplications.reviewedAt,
      })
      .from(nssApplications)
      .where(eq(nssApplications.status, 'approved'))
      .$dynamic();

    // If specific station filter is applied
    if (selectedStationFilter && selectedStationFilter !== 'all') {
      const decodedFilter = decodeURIComponent(selectedStationFilter).trim();
      
      // Match by exact name or matched station name
      const matched = stations.find(
        (s) =>
          s.name.toLowerCase() === decodedFilter.toLowerCase() ||
          s.station_code?.toLowerCase() === decodedFilter.toLowerCase() ||
          s.id === decodedFilter
      );
      const targetStationName = matched ? matched.name : decodedFilter;

      appsQuery = appsQuery.where(
        and(
          eq(nssApplications.status, 'approved'),
          eq(nssApplications.postingStation, targetStationName)
        )
      );
    }

    const rawApplications = await appsQuery.orderBy(desc(nssApplications.reviewedAt));

    // 5. Sanitize data: completely strip out all file uploads (passports, IDs, certificates)
    // and format appointment letter data for read-only preview and printing
    const sanitizedApplications = rawApplications.map((app) => {
      let appointmentLetterData: any = null;
      if (app.additional_info) {
        try {
          const parsed =
            typeof app.additional_info === 'string'
              ? JSON.parse(app.additional_info)
              : app.additional_info;
          appointmentLetterData = parsed.appointmentLetterData || parsed;
        } catch (e) {
          appointmentLetterData = null;
        }
      }

      // Ensure fallback reference number exists for official letter printing
      if (!appointmentLetterData || !appointmentLetterData.customRefNumber) {
        const fallbackRef = `DVLA/HQ/NSS/2026/${String(app.id).padStart(3, '0')}`;
        appointmentLetterData = {
          ...(appointmentLetterData || {}),
          customRefNumber: fallbackRef,
        };
      }

      const fullName = `${app.first_name || ''} ${
        app.middle_name ? app.middle_name + ' ' : ''
      }${app.last_name || ''}`.trim();

      return {
        id: app.id,
        nss_number: app.nss_number,
        first_name: app.first_name,
        last_name: app.last_name,
        middle_name: app.middle_name,
        full_name: fullName || 'NSS Personnel',
        gender: app.gender,
        date_of_birth: app.date_of_birth,
        nationality: app.nationality,
        phone_number: app.phone_number,
        email: app.email,
        residential_address: app.residential_address,
        region: app.region,
        district: app.district,
        institution_name: app.institution_name,
        course_program: app.course_program,
        year_of_completion: app.year_of_completion,
        posting_region: app.posting_region,
        posting_district: app.posting_district,
        posting_station: app.posting_station,
        posting_department: app.posting_department,
        service_year: app.service_year,
        service_period_start: app.service_period_start,
        service_period_end: app.service_period_end,
        status: app.status,
        created_at: app.created_at,
        reviewed_at: app.reviewed_at,
        appointmentLetterData,
      };
    });

    return NextResponse.json({
      stations,
      applications: sanitizedApplications,
      totalCount: sanitizedApplications.length,
      totalApprovedOverall,
    });
  } catch (error: any) {
    console.error('Station Manager API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch station personnel: ' + error.message },
      { status: 500 }
    );
  }
}
