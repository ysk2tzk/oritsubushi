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
  prefecture: string | null;
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

export type HistoryYearSummary = {
  key: string;
  label: string;
  count: number;
};

export type HistoryMonthSummary = {
  key: string;
  label: string;
  count: number;
};

export type HistoryDaySummary = {
  key: string;
  label: string;
  count: number;
};

export type HistoryStationSummary = {
  id: number;
  name: string;
  companyName: string;
  isShinkansen: boolean;
  note: string | null;
};

export type HistoryPrefectureStationSummary = HistoryStationSummary & {
  isAchieved: boolean;
};

export type HistoryPrefectureSummary = {
  key: string;
  label: string;
  achievedCount: number;
  totalCount: number;
};

export type StationRecordExportItem =
  | {
      type: "station";
      name: string;
      firstAchievedOn: string | null;
      note: string | null;
    }
  | {
      type: "section";
      distance: number | null;
      firstAchievedOn: string | null;
      note: string | null;
    };

export type StationRecordExportLine = {
  companyId: number;
  id: number;
  name: string;
  companyName: string;
  companyType: number;
  items: StationRecordExportItem[];
};

export type StationRecordExportSheet = {
  key: string;
  name: string;
  companyIds: number[];
  lines: StationRecordExportLine[];
};

type TimelineItem =
  | { type: "station"; station: Station }
  | { type: "section"; section: Section };

type HistoryStationSnapshot = {
  id: number;
  company_id: number;
  prefecture: string | null;
  name: string;
  first_achieved_on: string | null;
  is_shinkansen: boolean;
  note: string | null;
};

const PREFECTURES: string[] = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県"
];

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

async function fetchAllRows<T>(tableName: string): Promise<T[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const pageSize = 1000;
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("is_deleted", false)
      .order("id", { ascending: true })
      .range(from, to);

    const page = (ensure(data, error) ?? []) as T[];
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function buildLineTimelineItems(
  line: Line,
  stationsById: Map<number, Station>,
  sectionsByLineId: Map<number, Section[]>,
  options?: { allowEmptyStart?: boolean }
): TimelineItem[] {
  const sections = sectionsByLineId.get(line.id) ?? [];
  const sectionByFrom = new Map(sections.map((section) => [section.from_station_id, section]));
  const startStation =
    stationsById.get(line.display_start_station_id) ??
    resolveLineStartStation(sections, stationsById);

  if (!startStation) {
    if (options?.allowEmptyStart) {
      return [];
    }
    throw new Error(`Line ${line.id} start station ${line.display_start_station_id} not found.`);
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

    const nextStation = stationsById.get(nextSection.to_station_id);
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

  return items;
}

function resolveLineStartStation(sections: Section[], stationsById: Map<number, Station>) {
  if (sections.length === 0) {
    return null;
  }

  const toStationIds = new Set(sections.map((section) => section.to_station_id));
  const startCandidate =
    sections.find(
      (section) =>
        stationsById.has(section.from_station_id) && !toStationIds.has(section.from_station_id)
    ) ??
    sections.find((section) => stationsById.has(section.from_station_id)) ??
    sections.find((section) => stationsById.has(section.to_station_id));

  if (!startCandidate) {
    return null;
  }

  return (
    stationsById.get(startCandidate.from_station_id) ??
    stationsById.get(startCandidate.to_station_id) ??
    null
  );
}

async function getHistoryStationSnapshots(): Promise<HistoryStationSnapshot[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const pageSize = 1000;
  const rows: Station[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseAdmin
      .from("mst_station")
      .select("*")
      .order("id", { ascending: true })
      .order("revision", { ascending: true })
      .range(from, to);

    const page = (ensure(data, error) ?? []) as Station[];
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  const grouped = new Map<number, Station[]>();
  for (const row of rows) {
    const group = grouped.get(row.id);
    if (group) {
      group.push(row);
    } else {
      grouped.set(row.id, [row]);
    }
  }

  const snapshots: HistoryStationSnapshot[] = [];

  for (const revisions of grouped.values()) {
    const currentRevision = revisions.find((revision) => revision.is_deleted === false);
    if (!currentRevision) {
      continue;
    }

    const firstAchievedRevision = revisions.find((revision) => revision.first_achieved_on !== null);
    const displayRevision = firstAchievedRevision ?? currentRevision;

    snapshots.push({
      id: currentRevision.id,
      company_id: currentRevision.company_id,
      prefecture: currentRevision.prefecture,
      name: displayRevision.name,
      first_achieved_on: displayRevision.first_achieved_on,
      is_shinkansen: displayRevision.is_shinkansen,
      note: displayRevision.note
    });
  }

  return snapshots;
}

export async function getCompanyTypes() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_company_type")
    .select("id, name")
    .order("id");
  return ensure(data, error) as CompanyType[];
}

export async function getCompanyType(companyTypeId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("mst_company_type")
    .select("id, name")
    .eq("id", companyTypeId)
    .single();
  return ensureOne(data, error) as CompanyType;
}

export function getDisplayCompanyTypeName(companyTypeName: string) {
  return companyTypeName.replace(/\s*\(1路線のみ\)$/, "");
}

export async function getCompaniesByType(companyTypeId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const query = supabaseAdmin
    .from("mst_company")
    .select("*")
    .eq("is_deleted", false)
    .order("name");

  const { data, error } =
    companyTypeId === 3
      ? await query.in("company_type", [3, 5])
      : await query.eq("company_type", companyTypeId);

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

export async function getStationHistoryYearSummaries(): Promise<{
  years: HistoryYearSummary[];
}> {
  const rows = (await getHistoryStationSnapshots()).filter((row) => row.first_achieved_on !== null);
  const summaryMap = new Map<string, number>();

  for (const row of rows) {
    const code = row.first_achieved_on;
    if (!code) {
      continue;
    }

    const key = code === "99999999" ? "unknown" : code.slice(0, 4);
    summaryMap.set(key, (summaryMap.get(key) ?? 0) + 1);
  }

  const years = Array.from(summaryMap.entries())
    .map(([key, count]) => ({
      key,
      label: key === "unknown" ? "不明" : `${key}年`,
      count
    }))
    .sort((a, b) => {
      if (a.key === "unknown") {
        return 1;
      }
      if (b.key === "unknown") {
        return -1;
      }
      return Number(b.key) - Number(a.key);
    });

  return { years };
}

export async function getStationHistoryMonthSummaries(year: string): Promise<{
  yearLabel: string;
  months: HistoryMonthSummary[];
}> {
  const rows = (await getHistoryStationSnapshots()).filter((row) => row.first_achieved_on !== null);
  const summaryMap = new Map<string, number>();

  for (const row of rows) {
    const code = row.first_achieved_on;
    if (!code) {
      continue;
    }

    if (year === "unknown") {
      if (code === "99999999") {
        summaryMap.set("unknown", (summaryMap.get("unknown") ?? 0) + 1);
      }
      continue;
    }

    if (!code.startsWith(year)) {
      continue;
    }

    const month = code.slice(4, 6);
    const key = month === "99" ? "unknown" : month;
    summaryMap.set(key, (summaryMap.get(key) ?? 0) + 1);
  }

  const months = Array.from(summaryMap.entries())
    .map(([key, count]) => ({
      key,
      label: key === "unknown" ? "不明" : `${Number(key)}月`,
      count
    }))
    .sort((a, b) => {
      if (a.key === "unknown") {
        return 1;
      }
      if (b.key === "unknown") {
        return -1;
      }
      return Number(b.key) - Number(a.key);
    });

  return {
    yearLabel: year === "unknown" ? "不明" : `${year}年`,
    months
  };
}

export async function getStationsByUnknownHistoryYear(): Promise<HistoryStationSummary[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const [stationsData, { data: companiesData, error: companiesError }] = await Promise.all([
    getHistoryStationSnapshots(),
    supabaseAdmin.from("mst_company").select("id, name").eq("is_deleted", false)
  ]);

  const stations = stationsData.filter((station) => station.first_achieved_on === "99999999");
  const companies = (ensure(companiesData, companiesError) ?? []) as Array<Pick<Company, "id" | "name">>;
  const companyMap = new Map(companies.map((company) => [company.id, company.name]));

  return stations
    .sort((a, b) => a.id - b.id)
    .map((station) => ({
      id: station.id,
      name: station.name,
      companyName: companyMap.get(station.company_id) ?? "会社不明",
      isShinkansen: station.is_shinkansen,
      note: station.note
    }));
}

export async function getStationHistoryDaySummaries(year: string, month: string): Promise<{
  yearLabel: string;
  monthLabel: string;
  days: HistoryDaySummary[];
}> {
  const rows = (await getHistoryStationSnapshots()).filter((row) => row.first_achieved_on !== null);
  const summaryMap = new Map<string, number>();

  for (const row of rows) {
    const code = row.first_achieved_on;
    if (!code || code === "99999999") {
      continue;
    }

    if (!code.startsWith(year)) {
      continue;
    }

    const rowMonth = code.slice(4, 6);
    if (month === "unknown") {
      if (rowMonth === "99") {
        summaryMap.set("unknown", (summaryMap.get("unknown") ?? 0) + 1);
      }
      continue;
    }

    if (rowMonth !== month) {
      continue;
    }

    const day = code.slice(6, 8);
    const key = day === "99" ? "unknown" : day;
    summaryMap.set(key, (summaryMap.get(key) ?? 0) + 1);
  }

  const days = Array.from(summaryMap.entries())
    .map(([key, count]) => ({
      key,
      label: key === "unknown" ? "不明" : `${Number(key)}日`,
      count
    }))
    .sort((a, b) => {
      if (a.key === "unknown") {
        return 1;
      }
      if (b.key === "unknown") {
        return -1;
      }
      return Number(a.key) - Number(b.key);
    });

  return {
    yearLabel: `${year}年`,
    monthLabel: month === "unknown" ? "不明" : `${Number(month)}月`,
    days
  };
}

export async function getStationsByHistoryDate(
  year: string,
  month: string,
  day: string
): Promise<{
  yearLabel: string;
  monthLabel: string;
  dayLabel: string;
  stations: HistoryStationSummary[];
}> {
  const supabaseAdmin = getSupabaseAdmin();
  const [stations, { data: companiesData, error: companiesError }] = await Promise.all([
    getHistoryStationSnapshots(),
    supabaseAdmin.from("mst_company").select("id, name").eq("is_deleted", false)
  ]);
  const companies = (ensure(companiesData, companiesError) ?? []) as Array<Pick<Company, "id" | "name">>;
  const companyMap = new Map(companies.map((company) => [company.id, company.name]));

  const filtered = stations.filter((station) => {
    const code = station.first_achieved_on;
    if (!code || code === "99999999" || !code.startsWith(year)) {
      return false;
    }

    const rowMonth = code.slice(4, 6);
    if (month === "unknown") {
      return rowMonth === "99";
    }

    if (rowMonth !== month) {
      return false;
    }

    const rowDay = code.slice(6, 8);
    if (day === "unknown") {
      return rowDay === "99";
    }

    return rowDay === day;
  });

  return {
    yearLabel: `${year}年`,
    monthLabel: month === "unknown" ? "不明" : `${Number(month)}月`,
    dayLabel: day === "unknown" ? "不明" : `${Number(day)}日`,
    stations: filtered
      .sort((a, b) => a.id - b.id)
      .map((station) => ({
        id: station.id,
        name: station.name,
        companyName: companyMap.get(station.company_id) ?? "会社不明",
        isShinkansen: station.is_shinkansen,
        note: station.note
      }))
  };
}

export async function getStationHistoryPrefectureSummaries(): Promise<{
  prefectures: HistoryPrefectureSummary[];
}> {
  const rows = (await getHistoryStationSnapshots()).filter((row) => row.prefecture !== null);
  const summaryMap = new Map<string, { achievedCount: number; totalCount: number }>(
    PREFECTURES.map((prefecture) => [prefecture, { achievedCount: 0, totalCount: 0 }])
  );

  for (const row of rows) {
    if (!row.prefecture) {
      continue;
    }

    const current = summaryMap.get(row.prefecture) ?? { achievedCount: 0, totalCount: 0 };
    current.totalCount += 1;
    if (row.first_achieved_on) {
      current.achievedCount += 1;
    }
    summaryMap.set(row.prefecture, current);
  }

  const prefectures = PREFECTURES.map((prefecture) => ({
    key: prefecture,
    label: prefecture,
    achievedCount: summaryMap.get(prefecture)?.achievedCount ?? 0,
    totalCount: summaryMap.get(prefecture)?.totalCount ?? 0
  }));

  return { prefectures };
}

export async function getStationsByHistoryPrefecture(prefecture: string): Promise<{
  prefectureLabel: string;
  achievedCount: number;
  totalCount: number;
  stations: HistoryPrefectureStationSummary[];
}> {
  const supabaseAdmin = getSupabaseAdmin();
  const [stations, { data: companiesData, error: companiesError }] = await Promise.all([
    getHistoryStationSnapshots(),
    supabaseAdmin.from("mst_company").select("id, name").eq("is_deleted", false)
  ]);
  const companies = (ensure(companiesData, companiesError) ?? []) as Array<Pick<Company, "id" | "name">>;
  const companyMap = new Map(companies.map((company) => [company.id, company.name]));

  const filtered = stations
    .filter((station) => station.prefecture === prefecture)
    .sort((a, b) => a.id - b.id);
  const achievedCount = filtered.filter((station) => station.first_achieved_on !== null).length;

  return {
    prefectureLabel: prefecture,
    achievedCount,
    totalCount: filtered.length,
    stations: filtered.map((station) => ({
      id: station.id,
      name: station.name,
      companyName: companyMap.get(station.company_id) ?? "会社不明",
      isShinkansen: station.is_shinkansen,
      note: station.note,
      isAchieved: station.first_achieved_on !== null
    }))
  };
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

  try {
    return {
      company,
      line,
      items: buildLineTimelineItems(
        line,
        new Map(stations.map((station) => [station.id, station])),
        new Map([[line.id, sections]])
      )
    };
  } catch {
    notFound();
  }
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

export async function getStationRecordExportSheets(): Promise<StationRecordExportSheet[]> {
  const [companies, lines, stations, sections] = await Promise.all([
    fetchAllRows<Company>("mst_company"),
    fetchAllRows<Line>("mst_line"),
    fetchAllRows<Station>("mst_station"),
    fetchAllRows<Section>("mst_section")
  ]);

  const stationsById = new Map(stations.map((station) => [station.id, station]));
  const sectionsByLineId = new Map<number, Section[]>();
  for (const section of sections) {
    const lineSections = sectionsByLineId.get(section.line_id);
    if (lineSections) {
      lineSections.push(section);
    } else {
      sectionsByLineId.set(section.line_id, [section]);
    }
  }

  const linesByCompanyId = new Map<number, Line[]>();
  for (const line of lines) {
    const companyLines = linesByCompanyId.get(line.company_id);
    if (companyLines) {
      companyLines.push(line);
    } else {
      linesByCompanyId.set(line.company_id, [line]);
    }
  }

  const buildLineExport = (line: Line, company: Company): StationRecordExportLine => ({
    companyId: company.id,
    id: line.id,
    name: line.name,
    companyName: company.name,
    companyType: company.company_type,
    items: buildLineTimelineItems(line, stationsById, sectionsByLineId, {
      allowEmptyStart: true
    }).map((item) =>
      item.type === "station"
        ? {
            type: "station",
            name: item.station.name,
            firstAchievedOn: item.station.first_achieved_on,
            note: item.station.note
          }
        : {
            type: "section",
            distance: item.section.distance,
            firstAchievedOn: item.section.first_achieved_on,
            note: item.section.note
          }
    )
  });
  const compareExportLines = (a: StationRecordExportLine, b: StationRecordExportLine) =>
    a.companyType === 5 && b.companyType === 5
      ? a.companyId - b.companyId || a.id - b.id
      : a.id - b.id;

  const sheets: StationRecordExportSheet[] = [];
  let otherSheet: StationRecordExportSheet | null = null;
  const exportedCompanyIds = new Set<number>();

  for (const company of companies.sort((a, b) => a.company_type - b.company_type || a.id - b.id)) {
    exportedCompanyIds.add(company.id);
    const companyLines = (linesByCompanyId.get(company.id) ?? []).sort((a, b) => a.id - b.id);

    if (company.company_type === 5) {
      if (!otherSheet) {
        otherSheet = {
          key: "other",
          name: "その他",
          companyIds: [],
          lines: []
        };
        sheets.push(otherSheet);
      }

      otherSheet.companyIds.push(company.id);
      otherSheet.lines.push(...companyLines.map((line) => buildLineExport(line, company)));
      otherSheet.lines.sort(compareExportLines);
      continue;
    }

    sheets.push({
      key: `company-${company.id}`,
      name: company.name,
      companyIds: [company.id],
      lines: companyLines.map((line) => buildLineExport(line, company))
    });
  }

  const orphanCompanyIds = Array.from(linesByCompanyId.keys())
    .filter((companyId) => !exportedCompanyIds.has(companyId))
    .sort((a, b) => a - b);

  for (const companyId of orphanCompanyIds) {
    const companyLines = (linesByCompanyId.get(companyId) ?? []).sort((a, b) => a.id - b.id);
    sheets.push({
      key: `company-missing-${companyId}`,
      name: `会社不明_${companyId}`,
      companyIds: [companyId],
      lines: companyLines.map((line) =>
        buildLineExport(line, {
          id: companyId,
          revision: 0,
          company_type: 0,
          name: `会社不明(${companyId})`,
          note: null,
          is_deleted: false
        })
      )
    });
  }

  return sheets;
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
