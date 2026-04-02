import React, { useEffect, useMemo, useState } from "react";
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { callOutline, chevronDownOutline, chevronForwardOutline, gitCompareOutline, globeOutline, heart, heartOutline, locationOutline } from "ionicons/icons";
import { RouteComponentProps } from "react-router-dom";
import { sampleSchools } from "../data/sampleSchools";
import { loadFavoriteIds } from "../hooks/useFavorites";
import { fetchSchools, getCachedSchools } from "../services/schoolService";
import { School } from "../types/school";
import "./SchoolDetail.css";

interface DetailParams {
  id: string;
}

type DetailProps = RouteComponentProps<DetailParams>;
type Language = "en" | "zh";
type FieldConfig = {
  enLabel: string;
  zhLabel: string;
  enKey?: string;
  zhKey?: string;
  fallbackKeys?: string[];
};
type SectionConfig = {
  enTitle: string;
  zhTitle: string;
  fields: FieldConfig[];
};

const levelLabelMap: Record<School["level"], { en: string; zh: string }> = {
  Kindergarten: { en: "Kindergarten", zh: "幼稚園" },
  Primary: { en: "Primary", zh: "小學" },
  Secondary: { en: "Secondary", zh: "中學" },
  Other: { en: "Other", zh: "其他" }
};

const detailSections: SectionConfig[] = [
  {
    enTitle: "School Identity",
    zhTitle: "學校識別資料",
    fields: [
      { enLabel: "School No.", zhLabel: "學校編號", enKey: "SCHOOL NO." },
      { enLabel: "School Name", zhLabel: "學校名稱", enKey: "ENGLISH NAME", zhKey: "中文名稱" },
      { enLabel: "Category", zhLabel: "類別", enKey: "ENGLISH CATEGORY", zhKey: "中文類別" }
    ]
  },
  {
    enTitle: "Address and District",
    zhTitle: "地址與分區",
    fields: [
      { enLabel: "Address", zhLabel: "地址", enKey: "ENGLISH ADDRESS", zhKey: "中文地址" },
      { enLabel: "District", zhLabel: "分區", enKey: "DISTRICT", zhKey: "分區" }
    ]
  },
  {
    enTitle: "Contact",
    zhTitle: "聯絡資料",
    fields: [
      { enLabel: "Telephone", zhLabel: "電話", enKey: "TELEPHONE", zhKey: "聯絡電話" },
      { enLabel: "Fax Number", zhLabel: "傳真號碼", enKey: "FAX NUMBER", zhKey: "傳真號碼" },
      { enLabel: "Website", zhLabel: "網站", enKey: "WEBSITE", zhKey: "網頁" }
    ]
  },
  {
    enTitle: "School Profile",
    zhTitle: "學校概況",
    fields: [
      { enLabel: "School Level", zhLabel: "學校類型", enKey: "SCHOOL LEVEL", zhKey: "學校類型" },
      { enLabel: "Students Gender", zhLabel: "就讀學生性別", enKey: "STUDENTS GENDER", zhKey: "就讀學生性別" },
      { enLabel: "Session", zhLabel: "學校授課時間", enKey: "SESSION", zhKey: "學校授課時間" },
      { enLabel: "Finance Type", zhLabel: "資助種類", enKey: "FINANCE TYPE", zhKey: "資助種類" },
      { enLabel: "Religion", zhLabel: "宗教", enKey: "RELIGION", zhKey: "宗教" }
    ]
  }
];

const SchoolDetail: React.FC<DetailProps> = ({ match, history }) => {
  const decodedId = decodeURIComponent(match.params.id);
  const [schools, setSchools] = useState<School[]>(() => getCachedSchools());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds());
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("hk-school-app-lang") as Language) ?? "en");
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    if (schools.length > 0) {
      return;
    }

    void fetchSchools().then((items) => setSchools(items));
  }, [schools.length]);

  const school = useMemo(() => {
    const fromRuntime = schools.find((item) => item.id === decodedId);
    if (fromRuntime) {
      return fromRuntime;
    }

    return sampleSchools.find((item) => item.id === decodedId);
  }, [schools, decodedId]);

  if (!school) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>{language === "en" ? "School Details" : "學校詳情"}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonLabel>{language === "en" ? "School not found." : "找不到學校資料。"}</IonLabel>
        </IonContent>
      </IonPage>
    );
  }

  const isFavorite = favoriteIds.includes(school.id);
  const getFieldValue = (field: FieldConfig): string | null => {
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

  const toggleFavorite = (): void => {
    const next = isFavorite ? favoriteIds.filter((item) => item !== school.id) : [...favoriteIds, school.id];
    localStorage.setItem("hk-school-app-favorites", JSON.stringify(next));
    setFavoriteIds(next);
  };

  const openInMap = (): void => {
    const data = school.rawData ?? {};
    const latRaw = data.LATITUDE ?? data.緯度;
    const lngRaw = data.LONGITUDE ?? data.經度;
    const lat = latRaw !== undefined ? Number(latRaw) : NaN;
    const lng = lngRaw !== undefined ? Number(lngRaw) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
      return;
    }
    const query = encodeURIComponent(
      `${language === "en" ? school.nameEn : school.nameZh ?? school.nameEn} ${language === "en" ? school.addressEn : school.addressZh ?? school.addressEn}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const toggleSection = (title: string): void => {
    setOpenSections((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{language === "en" ? "School Details" : "學校詳情"}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                const nextLang = language === "en" ? "zh" : "en";
                localStorage.setItem("hk-school-app-lang", nextLang);
                setLanguage(nextLang);
              }}
            >
              {language === "en" ? "中文" : "EN"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>{language === "en" ? school.nameEn : school.nameZh ?? school.nameEn}</h1>
        <IonBadge color="primary">{levelLabelMap[school.level][language]}</IonBadge>
        <p>{language === "en" ? school.districtEn : school.districtZh ?? school.districtEn}</p>

        <IonButton expand="block" fill="outline" onClick={openInMap}>
          <IonIcon slot="start" icon={locationOutline} />
          {language === "en" ? "Open in map" : "在地圖中開啟"}
        </IonButton>

        <IonButton
          expand="block"
          fill="outline"
          onClick={() => history.push(`/school/${encodeURIComponent(school.id)}/compare`)}
        >
          <IonIcon slot="start" icon={gitCompareOutline} />
          {language === "en" ? "Compare with another school" : "與其他學校比較"}
        </IonButton>

        <div className="school-detail-accordion">
          {detailSections.map((section) => {
            const rows = section.fields
              .map((field) => ({ field, value: getFieldValue(field) }))
              .filter((entry) => entry.value !== null);
            if (rows.length === 0) {
              return null;
            }
            const isOpen = openSections.includes(section.enTitle);
            return (
              <div key={section.enTitle}>
                <IonItem button onClick={() => toggleSection(section.enTitle)}>
                  <IonLabel>{language === "en" ? section.enTitle : section.zhTitle}</IonLabel>
                  <IonIcon
                    slot="end"
                    icon={isOpen ? chevronDownOutline : chevronForwardOutline}
                  />
                </IonItem>
                {isOpen && (
                  <IonList lines="none" className="school-detail-accordion-content">
                    {rows.map((entry) => (
                      <IonItem key={`${section.enTitle}-${entry.field.enLabel}`}>
                        <IonLabel>
                          <h3>{language === "en" ? entry.field.enLabel : entry.field.zhLabel}</h3>
                          <p>{entry.value}</p>
                        </IonLabel>
                        {entry.field.enLabel === "Telephone" && school.telephone && (
                          <IonButton fill="clear" href={`tel:${school.telephone}`} slot="end">
                            <IonIcon icon={callOutline} />
                          </IonButton>
                        )}
                        {entry.field.enLabel === "Website" && school.website && (
                          <IonButton fill="clear" href={school.website} target="_blank" rel="noreferrer" slot="end">
                            <IonIcon icon={globeOutline} />
                          </IonButton>
                        )}
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </div>
            );
          })}
        </div>

        <IonButton expand="block" onClick={toggleFavorite}>
          <IonIcon slot="start" icon={isFavorite ? heart : heartOutline} />
          {isFavorite
            ? language === "en"
              ? "Remove from Favorites"
              : "移除收藏"
            : language === "en"
              ? "Add to Favorites"
              : "加入收藏"}
        </IonButton>

        <p>
          <strong>{language === "en" ? "Data Source:" : "資料來源："}</strong> {school.source}
        </p>
      </IonContent>
    </IonPage>
  );
};

export default SchoolDetail;
