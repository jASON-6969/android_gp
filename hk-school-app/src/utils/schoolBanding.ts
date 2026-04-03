import bandingRows from "../data/school_banding.json";
import { School } from "../types/school";

export interface SchoolBandingInfo {
  banding: string;
  englishIndex: number;
  rankingRange: string;
  region: string;
}

type RawBandingRow = {
  english_name: string;
  chinese_name: string;
  region: string;
  english_index: number;
  banding: string;
  ranking_range: string;
};

const rawList = bandingRows as RawBandingRow[];

export const normalizeSchoolNameKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFKC");

/** Unify en-dash / hyphen for search matching. */
export const normalizeBandingToken = (value: string): string =>
  value.trim().toLowerCase().normalize("NFKC").replace(/\u2013/g, "-");

const toInfo = (row: RawBandingRow): SchoolBandingInfo => ({
  banding: row.banding.trim(),
  englishIndex: row.english_index,
  rankingRange: row.ranking_range.trim(),
  region: row.region.trim()
});

const register = (map: Map<string, SchoolBandingInfo>, key: string, info: SchoolBandingInfo): void => {
  if (!key) {
    return;
  }
  if (!map.has(key)) {
    map.set(key, info);
  }
};

let lookupCache: Map<string, SchoolBandingInfo> | null = null;

const buildLookup = (): Map<string, SchoolBandingInfo> => {
  const map = new Map<string, SchoolBandingInfo>();
  for (const row of rawList) {
    const info = toInfo(row);
    register(map, normalizeSchoolNameKey(row.english_name), info);
    register(map, normalizeSchoolNameKey(row.chinese_name), info);
  }
  return map;
};

export const getSchoolBandingLookup = (): Map<string, SchoolBandingInfo> => {
  if (!lookupCache) {
    lookupCache = buildLookup();
  }
  return lookupCache;
};

export const getBandingForSchool = (school: Pick<School, "nameEn" | "nameZh">): SchoolBandingInfo | null => {
  const map = getSchoolBandingLookup();
  const enKey = normalizeSchoolNameKey(school.nameEn);
  if (enKey) {
    const fromEn = map.get(enKey);
    if (fromEn) {
      return fromEn;
    }
  }
  if (school.nameZh) {
    const zhKey = normalizeSchoolNameKey(school.nameZh);
    if (zhKey) {
      return map.get(zhKey) ?? null;
    }
  }
  return null;
};

let allBandingValuesCache: string[] | null = null;

export const getAllBandingValues = (): string[] => {
  if (!allBandingValuesCache) {
    const set = new Set<string>();
    for (const row of rawList) {
      const b = row.banding.trim();
      if (b) {
        set.add(b);
      }
    }
    allBandingValuesCache = Array.from(set).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  }
  return allBandingValuesCache;
};

export const schoolMatchesBandingFilter = (school: School, bandingFilter: string): boolean => {
  if (school.level !== "Secondary") {
    return false;
  }
  const info = getBandingForSchool(school);
  return Boolean(info?.banding && info.banding === bandingFilter);
};
