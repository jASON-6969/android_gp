import { School } from "../types/school";

export type CompareLanguage = "en" | "zh";

export type CompareField = {
  enLabel: string;
  zhLabel: string;
  enKey?: string;
  zhKey?: string;
  fallbackKeys?: string[];
};

/** UI labels for school level (filters, etc.). */
export const schoolLevelLabelMap: Record<School["level"], { en: string; zh: string }> = {
  Kindergarten: { en: "Kindergarten", zh: "幼稚園" },
  Primary: { en: "Primary", zh: "小學" },
  Secondary: { en: "Secondary", zh: "中學" },
  Other: { en: "Other", zh: "其他" }
};

export const teachingLanguageField: CompareField = {
  enLabel: "Teaching language",
  zhLabel: "教學語言",
  enKey: "TEACHING LANGUAGE",
  zhKey: "教學語言",
  fallbackKeys: [
    "MEDIUM OF INSTRUCTION",
    "MOI",
    "中學教學語言",
    "主要教學語言",
    "SECONDARY MEDIUM OF INSTRUCTION"
  ]
};

/** Rows shown in the side-by-side compare table (subset of detail fields). */
export const compareFields: CompareField[] = [
  { enLabel: "District", zhLabel: "分區", enKey: "DISTRICT", zhKey: "分區" },
  { enLabel: "School Level", zhLabel: "學校類型", enKey: "SCHOOL LEVEL", zhKey: "學校類型" },
  { enLabel: "Category", zhLabel: "類別", enKey: "ENGLISH CATEGORY", zhKey: "中文類別" },
  { enLabel: "Students Gender", zhLabel: "就讀學生性別", enKey: "STUDENTS GENDER", zhKey: "就讀學生性別" },
  { enLabel: "Session", zhLabel: "學校授課時間", enKey: "SESSION", zhKey: "學校授課時間" },
  teachingLanguageField,
  { enLabel: "Finance Type", zhLabel: "資助種類", enKey: "FINANCE TYPE", zhKey: "資助種類" },
  { enLabel: "Religion", zhLabel: "宗教", enKey: "RELIGION", zhKey: "宗教" }
];

export const getSchoolDisplayName = (school: School, language: CompareLanguage): string =>
  language === "en" ? school.nameEn : school.nameZh ?? school.nameEn;

const readFromRaw = (school: School, field: CompareField, language: CompareLanguage): string | null => {
  const data = school.rawData ?? {};
  const preferred = language === "en" ? field.enKey : field.zhKey;
  const fallback = language === "en" ? field.zhKey : field.enKey;
  const keys = [preferred, fallback, ...(field.fallbackKeys ?? [])].filter((key): key is string => Boolean(key));

  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }
  return null;
};

export const getComparedValue = (school: School, field: CompareField, language: CompareLanguage): string => {
  const raw = readFromRaw(school, field, language);
  if (raw !== null) {
    return raw;
  }

  if (field.enLabel === "District") {
    return language === "en" ? school.districtEn : school.districtZh ?? school.districtEn;
  }
  if (field.enLabel === "School Level") {
    return schoolLevelLabelMap[school.level][language];
  }

  return "—";
};

/** EN + ZH teaching-language text for search matching. */
export const getTeachingLanguageSearchText = (school: School): string => {
  const en = readFromRaw(school, teachingLanguageField, "en") ?? "";
  const zh = readFromRaw(school, teachingLanguageField, "zh") ?? "";
  return `${en} ${zh}`.trim().toLowerCase();
};

export const valuesDiffer = (a: string, b: string): boolean =>
  a.trim().toLowerCase().replace(/\s+/g, " ") !== b.trim().toLowerCase().replace(/\s+/g, " ");
