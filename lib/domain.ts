import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type CompanyType = {
  id: number;
  name: string;
};

export type Company = {
  id: number;
  revision: number;
  company_type: number;
  name: string;
  note: string | null;
  is_deleted: boolean;
};

export type Line = {
  id: number;
  revision: number;
  name: string;
  company_id: number;
  display_start_station_id: number;
  note: string | null;
  is_deleted: boolean;
};

export type Station = {
  id: number;
  revision: number;
  name: string;
  company_id: number;
  is_shinkansen: boolean;
  first_achieved_on: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  is_deleted: boolean;
};

export type Section = {
  id: number;
  revision: number;
  line_id: number;
  from_station_id: number;
  to_station_id: number;
  distance: number | null;
  first_achieved_on: string | null;
  note: string | null;
  is_deleted: boolean;
};

export type NearbyStation = Station & {
  company_name: string;
  distance_meters: number;
};

export type OrderedLinePath = {
  stations: Station[];
  sections: Section[];
};

type TimelineItem =
  | { type: "station"; station: Station }
  | { type: "section"; section: Section };

function ensure<T>(data: T | null, error: { message?: string } | null | undefined) {
  if (error) {
    throw new Error(error.message ?? "Database request failed.");
  }
  return data;
}

function ensureOne<T>(data: T | null, error: { message?: string } | null | undefined) {
  const resolved = ensure(data, error);
  if (resolved === null) {
    throw new Error("Record not found.");
  }
  return resolved;
}

export async function getCompanyTypes() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_company_type")
    .select("id, name")
    .order("id");
  return ensure(data, error) as CompanyType[];
}

export async function getCompaniesByType(companyTypeId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_company")
    .select("*")
    .eq("is_deleted", false)
    .eq("company_type", companyTypeId)
    .order("name");
  return ensure(data, error) as Company[];
}

export async function getCompany(companyId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_company")
    .select("*")
    .eq("id", companyId)
    .eq("is_deleted", false)
    .single();
  return ensureOne(data, error) as Company;
}

export async function getLinesByCompany(companyId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_line")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("id");
  return ensure(data, error) as Line[];
}

export async function getLine(lineId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_line")
    .select("*")
    .eq("id", lineId)
    .eq("is_deleted", false)
    .single();
  return ensureOne(data, error) as Line;
}

export async function getStationsByCompany(companyId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_station")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false);
  return ensure(data, error) as Station[];
}

async function getStationsByIds(stationIds: number[]) {
  if (stationIds.length === 0) {
    return [] as Station[];
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_station")
    .select("*")
    .in("id", stationIds)
    .eq("is_deleted", false);
  return ensure(data, error) as Station[];
}

export async function getStation(stationId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_station")
    .select("*")
    .eq("id", stationId)
    .eq("is_deleted", false)
    .single();
  return ensureOne(data, error) as Station;
}

export async function getSection(sectionId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_section")
    .select("*")
    .eq("id", sectionId)
    .eq("is_deleted", false)
    .single();
  return ensureOne(data, error) as Section;
}

export async function getSectionsByLine(lineId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_section")
    .select("*")
    .eq("line_id", lineId)
    .eq("is_deleted", false);
  return ensure(data, error) as Section[];
}

export async function getNearbyStations(latitude: number, longitude: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: stationsData, error: stationsError }, { data: companiesData, error: companiesError }] =
    await Promise.all([
      supabaseAdmin
        .from("mst_station")
        .select("*")
        .eq("is_deleted", false)
        .not("latitude", "is", null)
        .not("longitude", "is", null),
      supabaseAdmin.from("mst_company").select("id, name").eq("is_deleted", false)
    ]);

  const stations = ensure(stationsData, stationsError) as Station[];
  const companies = ensure(companiesData, companiesError) as Array<Pick<Company, "id" | "name">>;
  const companyMap = new Map(companies.map((company) => [company.id, company.name]));

  return stations
    .map((station) => ({
      ...station,
      company_name: companyMap.get(station.company_id) ?? "会社不明",
      distance_meters: haversineMeters(
        latitude,
        longitude,
        Number(station.latitude),
        Number(station.longitude)
      )
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, 10) as NearbyStation[];
}

export async function getLineTimeline(lineId: number): Promise<{
  company: Company;
  line: Line;
  items: TimelineItem[];
}> {
  const line = await getLine(lineId);
  const [company, sections] = await Promise.all([
    getCompany(line.company_id),
    getSectionsByLine(lineId)
  ]);

  const stationIds = Array.from(
    new Set([
      line.display_start_station_id,
      ...sections.flatMap((section) => [section.from_station_id, section.to_station_id])
    ])
  );
  const stations = await getStationsByIds(stationIds);

  const stationMap = new Map(stations.map((station) => [station.id, station]));
  const sectionByFrom = new Map(sections.map((section) => [section.from_station_id, section]));

  const startStation = stationMap.get(line.display_start_station_id);
  if (!startStation) {
    notFound();
  }

  const visitedStations = new Set<number>();
  const visitedSections = new Set<number>();
  const items: TimelineItem[] = [];
  let currentStation = startStation;

  while (currentStation) {
    items.push({ type: "station", station: currentStation });
    visitedStations.add(currentStation.id);

    const nextSection = sectionByFrom.get(currentStation.id);
    if (!nextSection || visitedSections.has(nextSection.id)) {
      break;
    }

    items.push({ type: "section", section: nextSection });
    visitedSections.add(nextSection.id);

    const nextStation = stationMap.get(nextSection.to_station_id);
    if (!nextStation) {
      break;
    }

    if (nextStation.id === startStation.id) {
      items.push({ type: "station", station: nextStation });
      break;
    }

    if (visitedStations.has(nextStation.id)) {
      break;
    }

    currentStation = nextStation;
  }

  return { company, line, items };
}

export async function getOrderedLinePath(lineId: number): Promise<OrderedLinePath> {
  const { items } = await getLineTimeline(lineId);
  const stations: Station[] = [];
  const sections: Section[] = [];

  for (const item of items) {
    if (item.type === "station") {
      if (stations.at(-1)?.id !== item.station.id) {
        stations.push(item.station);
      }
      continue;
    }

    sections.push(item.section);
  }

  return { stations, sections };
}

export async function getStationRecordContext(stationId: number) {
  const station = await getStation(stationId);
  const company = await getCompany(station.company_id);
  return { station, company };
}

export async function getSectionRecordContext(sectionId: number) {
  const section = await getSection(sectionId);
  const [fromStation, toStation] = await Promise.all([
    getStation(section.from_station_id),
    getStation(section.to_station_id)
  ]);
  const company = await getCompany(fromStation.company_id);
  return { section, fromStation, toStation, company };
}

export async function updateStationRecord(
  stationId: number,
  payload: { first_achieved_on: string | null; note: string | null }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const stationQuery = supabaseAdmin.from("mst_station") as any;
  const { error } = await (stationQuery
    .update(payload)
    .eq("id", stationId)
    .eq("is_deleted", false)) as { error: { message?: string } | null };

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSectionRecord(
  sectionId: number,
  payload: { first_achieved_on: string | null; note: string | null }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const sectionQuery = supabaseAdmin.from("mst_section") as any;
  const { error } = await (sectionQuery
    .update(payload)
    .eq("id", sectionId)
    .eq("is_deleted", false)) as { error: { message?: string } | null };

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordLineSectionsInRange(
  lineId: number,
  payload: {
    fromStationId: number;
    toStationId: number;
    firstAchievedOn: string;
  }
) {
  const { stations, sections } = await getOrderedLinePath(lineId);
  const fromIndex = stations.findIndex((station) => station.id === payload.fromStationId);
  const toIndex = stations.findIndex((station) => station.id === payload.toStationId);

  if (fromIndex === -1 || toIndex === -1) {
    throw new Error("駅が見つかりません。");
  }

  if (fromIndex >= toIndex) {
    throw new Error("発駅と着駅の選択を見直してください。");
  }

  const targetSections = sections.slice(fromIndex, toIndex);
  if (targetSections.length === 0) {
    return { updatedCount: 0 };
  }

  const targetSectionIds = targetSections.map((section) => section.id);
  const supabaseAdmin = getSupabaseAdmin();
  const sectionQuery = supabaseAdmin.from("mst_section") as any;
  const { error, count } = await (sectionQuery
    .update({ first_achieved_on: payload.firstAchievedOn })
    .in("id", targetSectionIds)
    .is("first_achieved_on", null)
    .eq("is_deleted", false)
    .select("id", { count: "exact", head: true })) as {
    error: { message?: string } | null;
    count: number | null;
  };

  if (error) {
    throw new Error(error.message);
  }

  return { updatedCount: count ?? 0 };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}
