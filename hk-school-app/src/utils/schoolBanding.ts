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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Parse one segment like "1A", "2", "3C" for colour weighting. */
const segmentQuality = (segment: string): { tier: number; sub: number } => {
  const t = segment.trim().normalize("NFKC");
  const m = t.match(/^(\d+)([A-Ca-c])?$/);
  if (!m) {
    return { tier: 2, sub: 2 };
  }
  const tier = clamp(parseInt(m[1], 10), 1, 5);
  const letter = m[2]?.toUpperCase();
  const sub = letter === "A" ? 3 : letter === "B" ? 2 : letter === "C" ? 1 : 2;
  return { tier, sub };
};

export interface BandingBadgeColors {
  background: string;
  color: string;
}

/**
 * Derives pastel badge colours from a band label (e.g. 1A, 1B–1A, 3A–2C).
 * Ranges use the average of segments after normalising en-dash to hyphen.
 */
export const getBandingBadgeColors = (banding: string): BandingBadgeColors => {
  const raw = banding.trim();
  if (!raw) {
    return { background: "hsl(220 14% 90%)", color: "hsl(220 16% 28%)" };
  }

  const normalized = raw.normalize("NFKC").replace(/\u2013/g, "-");
  const segments = normalized
    .split("-")
    .map((s) => s.trim())
    .filter(Boolean);
  const parts = segments.length > 0 ? segments : [normalized.replace(/-/g, "").trim() || normalized];

  let tierSum = 0;
  let subSum = 0;
  let n = 0;
  for (const part of parts) {
    const q = segmentQuality(part);
    tierSum += q.tier;
    subSum += q.sub;
    n += 1;
  }

  const tierAvg = n ? tierSum / n : 2;
  const subAvg = n ? subSum / n : 2;

  const hue =
    tierAvg <= 1.35
      ? 150
      : tierAvg <= 1.85
        ? 142
        : tierAvg <= 2.35
          ? 199
          : tierAvg <= 2.85
            ? 212
            : tierAvg <= 3.35
              ? 32
              : 288;

  const sat = clamp(46 + subAvg * 5.5, 38, 76);
  const bgLight = clamp(93 - tierAvg * 3.2 - (3 - subAvg) * 1.1, 78, 94);
  const fgLight = clamp(30 + tierAvg * 2.4 - subAvg * 1.2, 22, 38);

  return {
    background: `hsl(${hue} ${Math.round(sat)}% ${Math.round(bgLight)}%)`,
    color: `hsl(${hue} 38% ${Math.round(fgLight)}%)`
  };
};
