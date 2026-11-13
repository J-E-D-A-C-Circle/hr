/**
 * Official DVLA Stations (Regional, District, and Ultra Offices).
 * Canonical names sourced from:
 * UPDATED LIST OF REGIONAL, DISTRICT, ULTRA HEADS AND OFFICE LOCATIONS (1).pdf
 * Matched with staff-management branch.
 */

export const OFFICIAL_STATIONS = [
  "HEAD OFFICE",
  "NARMAH/HAATSO/ACCRA OFFICE",
  "KUMASI",
  "TEMA",
  "WA",
  "TAKORADI",
  "KOFORIDUA",
  "TAMALE",
  "CAPE-COAST",
  "SUNYANI",
  "BOLGATANGA",
  "HO",
  "TARKWA",
  "OBUASI",
  "MAMPONG ASHANTI",
  "AGONA-ASHANTI",
  "NKAWKAW",
  "AKIM ODA",
  "WEIJA",
  "WINNEBA",
  "HOHOE",
  "TECHIMAN",
  "DUNKWA-ON-OFFIN",
  "BEKWAI",
  "GOASO",
  "SEFWI WIAWSO",
  "KINTAMPO",
  "OFFINSO",
  "WENCHI",
  "AXIM",
  "EFFIDUASI",
  "KUMAWU",
  "AKATSI",
  "DENU",
  "ADENTAN",
  "BOLE",
  "DORMAA",
  "BECHEM",
  "AKWATIA",
  "SALAGA OFFICE",
  "NAVRONGO OFFICE",
  "NALERIGU OFFICE",
  "TUMU OFFICE",
  "YENDI OFFICE",
  "NKORANZA OFFICE",
  "ASUOGYAMAN OFFICE",
  "ATEBUBU",
  "TWIFO PRASO",
  // DVLA Ultra Offices
  "BANTAMA",
  "BONWIRE",
  "ADUM",
  "ASAMANKESE",
  "ABUAKWA",
  "DANSOMAN",
  "CIRCLE",
  "SPINTEX",
  "BUEM-JASIKAN",
  "KASOA",
  "NORTH DAYI",
  "ASHAIMAN",
  "ANYAA",
  "NSAWAM",
  "TESHIE",
  "DOME",
  "AMRAHIA",
  "KWABENYA",
] as const;

export type OfficialStation = (typeof OFFICIAL_STATIONS)[number];

const OFFICIAL_SET = new Set<string>(OFFICIAL_STATIONS);

/**
 * Explicit alias map from legacy / messy database department strings
 * (trimmed & uppercased) to canonical official station names.
 */
export const STATION_ALIAS_MAP: Record<string, OfficialStation> = {
  // Head Office & Units
  "HEAD OFFICE": "HEAD OFFICE",
  "HEAD OFFICE ADMIN": "HEAD OFFICE",
  "HEAD OFFICE IT": "HEAD OFFICE",
  "HEAD OFFICE RBDI": "HEAD OFFICE",
  "HEAD OFFICE PR": "HEAD OFFICE",
  "HEAD OFFICE SERVICE EXCELLENCE": "HEAD OFFICE",
  "HEAD OFFICE DTTL": "HEAD OFFICE",
  "HEAD OFFICE HR": "HEAD OFFICE",
  "HEAD OFFICE PME": "HEAD OFFICE",
  "HEAD OFFICE FINANCE": "HEAD OFFICE",
  "HEAD OFFICE PRINT FARM": "HEAD OFFICE",
  "HEAD OFFICE VIR": "HEAD OFFICE",
  "HEAD OFFICE PROCUREMENT": "HEAD OFFICE",
  "HEAD OFFICE LEGAL": "HEAD OFFICE",
  "HEAD OFFICE (CLEANER)": "HEAD OFFICE",
  "HEAD OFFICE -COMPLIANCE UNIT": "HEAD OFFICE",
  "TERT DRIVE": "HEAD OFFICE",

  // Greater Accra / Narmah / Haatso
  "NARMAH/HAATSO/ACCRA OFFICE": "NARMAH/HAATSO/ACCRA OFFICE",
  "GREATER ACCRA": "NARMAH/HAATSO/ACCRA OFFICE",
  "GREATER ACCRA STORES": "NARMAH/HAATSO/ACCRA OFFICE",
  "GREATER ACCRA REGIONAL OFFICE": "NARMAH/HAATSO/ACCRA OFFICE",
  "LA PLASPACK": "NARMAH/HAATSO/ACCRA OFFICE",

  // Regional & District Offices
  "ADENTAN OFFICE": "ADENTAN",
  "ADENTAN DISTRICT OFFICE": "ADENTAN",
  "ADENTAN OFFICE(COMPLIANCE)": "ADENTAN",
  "ADENTA": "ADENTAN",
  "WEIJA OFFICE": "WEIJA",
  "KUMASI OFFICE": "KUMASI",
  "TEMA OFFICE": "TEMA",
  "TEMA HABOUR": "TEMA",
  "TEMA HARBOUR": "TEMA",
  "SUNYANI OFFICE": "SUNYANI",
  "BECHEM OFFICE": "BECHEM",
  "TAMALE OFFICE": "TAMALE",
  "WINNEBA OFFICE": "WINNEBA",
  "DORMAA AHENKRO": "DORMAA",
  "WA OFFICE": "WA",
  "CAPE COAST": "CAPE-COAST",
  "HO OFFICE": "HO",
  "HO REGIONAL OFFICE": "HO",
  "NKORANZA": "NKORANZA OFFICE",
  "AKWATIA OFFICE": "AKWATIA",
  "TUMU": "TUMU OFFICE",
  "HOHOE OFFICE": "HOHOE",
  "TECHIMAN OFFICE": "TECHIMAN",
  "NAVRONGO": "NAVRONGO OFFICE",
  "SALAGA": "SALAGA OFFICE",
  "TAKORADI OFFICE": "TAKORADI",
  "TAKORADI PORT": "TAKORADI",
  "AXIM OFFICE": "AXIM",
  "AGONA OFFICE": "AGONA-ASHANTI",
  "AGONA": "AGONA-ASHANTI",
  "GOASO OFFICE": "GOASO",
  "YENDI": "YENDI OFFICE",
  "KOFORIDUA OFFICE": "KOFORIDUA",
  "DENU OFFICE": "DENU",
  "MAMPONG OFFICE": "MAMPONG ASHANTI",
  "AKATSI OFFICE": "AKATSI",
  "TARKWA OFFICE": "TARKWA",
  "NALERIGU": "NALERIGU OFFICE",
  "OBUASI OFFICE": "OBUASI",
  "WENCHI OFFICE": "WENCHI",
  "ASUOGYAMAN": "ASUOGYAMAN OFFICE",
  "DUNKWA": "DUNKWA-ON-OFFIN",

  // Ultra Offices
  "CIRCLE OFFICE": "CIRCLE",
  "BUEM": "BUEM-JASIKAN",
  "AMRAHIA ULTRA CENTRE": "AMRAHIA",
  "ANYAA ULTRA": "ANYAA",
  "ANYAA ULTRA CENTRE": "ANYAA",
  "NSAWAM ULTRA CENTRE": "NSAWAM",
  "ASHAIMAN ULTRA CENTRE": "ASHAIMAN",
  "ASHIAMAN ULTRA CENTRE": "ASHAIMAN",
  "ADUM ULTRA CENTRE": "ADUM",
  "TESHIE ULTRA CENTRE": "TESHIE",
  "KWABENYA OFFICE": "KWABENYA",
  "KASOA OFFICE": "KASOA",
  "DOME ULTRA CENTRE": "DOME",
  "DANSOMAN ULTRA CENTRE": "DANSOMAN",
  "BONWIRE ULTRA CENTRE": "BONWIRE",
};

/**
 * Normalizes a raw station/department string into its canonical official station name
 * if it matches an official station or known legacy alias.
 */
export function normalizeStation(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, " ").toUpperCase();
  if (!cleaned || cleaned === "NULL") return "";

  if (OFFICIAL_SET.has(cleaned)) {
    return cleaned;
  }
  if (STATION_ALIAS_MAP[cleaned]) {
    return STATION_ALIAS_MAP[cleaned];
  }
  if (cleaned.startsWith("HEAD OFFICE")) {
    return "HEAD OFFICE";
  }

  // Try stripping common suffixes like " OFFICE" or " ULTRA CENTRE"
  const stripped = cleaned
    .replace(/\s+ULTRA\s+CENTRE$/i, "")
    .replace(/\s+ULTRA$/i, "")
    .replace(/\s+OFFICE(\(.*\))?$/i, "")
    .trim();

  if (OFFICIAL_SET.has(stripped)) {
    return stripped;
  }
  if (STATION_ALIAS_MAP[stripped]) {
    return STATION_ALIAS_MAP[stripped];
  }

  return cleaned;
}

export function isOfficialStation(value: string | null | undefined): boolean {
  if (!value) return false;
  return OFFICIAL_SET.has(value.trim().toUpperCase());
}
