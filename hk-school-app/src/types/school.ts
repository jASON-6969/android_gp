export interface School {
  id: string;
  nameEn: string;
  nameZh?: string;
  districtEn: string;
  districtZh?: string;
  level: "Kindergarten" | "Primary" | "Secondary" | "Other";
  addressEn: string;
  addressZh?: string;
  telephone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  source: string;
  rawData?: Record<string, string | number>;
}
