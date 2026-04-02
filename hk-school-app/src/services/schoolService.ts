import schoolRecords from "../data/SCH_LOC_EDB.json";
import { School } from "../types/school";

let schoolCache: School[] = [];

type EdBRecord = Record<string, string | number | undefined>;

const sanitizeRawData = (item: EdBRecord): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  Object.entries(item).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key] = value;
    }
  });
  return result;
};

const normalizeLevel = (value: string | undefined): School["level"] => {
  const source = (value ?? "").toLowerCase();
  if (source.includes("kind")) {
    return "Kindergarten";
  }
  if (source.includes("prim")) {
    return "Primary";
  }
  if (source.includes("second")) {
    return "Secondary";
  }
  return "Other";
};

const toNumberOrUndefined = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const mapRecord = (item: EdBRecord, index: number): School | null => {
  const name = String(item["ENGLISH NAME"] ?? item.SCH_NAM_E ?? "").trim();
  if (!name) {
    return null;
  }

  const districtEn = String(item.DISTRICT ?? item.DISTRICT_E ?? "").trim() || "Unknown";
  const districtZh = String(item["分區"] ?? "").trim() || undefined;
  const schoolLevel = String(item["SCHOOL LEVEL"] ?? item.SCH_TYPE ?? "").trim();

  return {
    id: `${name}-${index}`.toLowerCase().replace(/\s+/g, "-"),
    nameEn: name,
    nameZh: String(item["中文名稱"] ?? "").trim() || undefined,
    districtEn,
    districtZh,
    level: normalizeLevel(schoolLevel),
    addressEn: String(item["ENGLISH ADDRESS"] ?? item.ADDRESS_E ?? "").trim() || "Address not provided",
    addressZh: String(item["中文地址"] ?? "").trim() || undefined,
    telephone: String(item.TELEPHONE ?? item.TEL ?? "").trim() || undefined,
    website: String(item.WEBSITE ?? "").trim() || undefined,
    latitude: toNumberOrUndefined(String(item.LATITUDE ?? "")),
    longitude: toNumberOrUndefined(String(item.LONGITUDE ?? "")),
    source: "EDB Open Data",
    rawData: sanitizeRawData(item)
  };
};

export const fetchSchools = async (): Promise<School[]> => {
  if (schoolCache.length > 0) {
    return schoolCache;
  }

  const schools = (schoolRecords as EdBRecord[])
    .map((item, index) => mapRecord(item, index))
    .filter((item): item is School => item !== null);

  schoolCache = schools;
  return schools;
};

export const getCachedSchools = (): School[] => schoolCache;
