import React, { useEffect, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { heart, heartOutline, locationOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { loadFavoriteIds, useFavoriteHelpers } from "../hooks/useFavorites";
import { getStartupLocation, StartupLocation } from "../services/locationService";
import { fetchSchools } from "../services/schoolService";
import { School } from "../types/school";
import { haversineKm } from "../utils/geo";
import {
  getAllBandingValues,
  getBandingForSchool,
  normalizeBandingToken,
  schoolMatchesBandingFilter
} from "../utils/schoolBanding";
import "./Home.css";

type ViewMode = "all" | "favorites";
type Language = "en" | "zh";

const levelLabelMap: Record<School["level"], { en: string; zh: string }> = {
  Kindergarten: { en: "Kindergarten", zh: "幼稚園" },
  Primary: { en: "Primary", zh: "小學" },
  Secondary: { en: "Secondary", zh: "中學" },
  Other: { en: "Other", zh: "其他" }
};

const Home: React.FC = () => {
  const history = useHistory();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [district, setDistrict] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [banding, setBanding] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("hk-school-app-lang") as Language) ?? "en");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds());
  const [userLocation, setUserLocation] = useState<StartupLocation | null>(null);

  const { favoriteSet, toggleFavorite } = useFavoriteHelpers(favoriteIds);

  const loadInitialData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [items, location] = await Promise.all([fetchSchools(), getStartupLocation()]);
      setSchools(items);
      setUserLocation(location);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (): Promise<void> => {
    setLoading(true);
    const items = await fetchSchools();
    setSchools(items);
    setLoading(false);
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem("hk-school-app-lang", language);
  }, [language]);

  const districts = useMemo(() => {
    const values = new Set<string>();
    schools.forEach((school) => values.add(school.districtEn));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [schools]);

  const bandingOptions = useMemo(() => getAllBandingValues(), []);

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedQueryBanding = normalizeBandingToken(normalizedQuery);

    const filtered = schools.filter((school) => {
      if (viewMode === "favorites" && !favoriteSet.has(school.id)) {
        return false;
      }

      if (district !== "all" && school.districtEn !== district) {
        return false;
      }

      if (level !== "all" && school.level !== level) {
        return false;
      }

      if (banding !== "all" && !schoolMatchesBandingFilter(school, banding)) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const bandingInfo = school.level === "Secondary" ? getBandingForSchool(school) : null;
      const bandingStr = bandingInfo?.banding ?? "";
      const matchesBandingSearch =
        bandingStr.length > 0 &&
        normalizedQueryBanding.length > 0 &&
        normalizeBandingToken(bandingStr).includes(normalizedQueryBanding);

      return (
        school.nameEn.toLowerCase().includes(normalizedQuery) ||
        (school.nameZh ?? "").toLowerCase().includes(normalizedQuery) ||
        school.addressEn.toLowerCase().includes(normalizedQuery) ||
        (school.addressZh ?? "").toLowerCase().includes(normalizedQuery) ||
        matchesBandingSearch ||
        (bandingInfo?.rankingRange.toLowerCase().includes(normalizedQuery) ?? false)
      );
    });

    if (!userLocation) {
      return filtered;
    }

    const { latitude: uLat, longitude: uLng } = userLocation;
    return [...filtered].sort((a, b) => {
      const distA =
        a.latitude != null && a.longitude != null
          ? haversineKm(uLat, uLng, a.latitude, a.longitude)
          : Number.POSITIVE_INFINITY;
      const distB =
        b.latitude != null && b.longitude != null
          ? haversineKm(uLat, uLng, b.latitude, b.longitude)
          : Number.POSITIVE_INFINITY;
      return distA - distB;
    });
  }, [schools, viewMode, favoriteSet, district, level, banding, query, userLocation]);

  const handleRefresh = async (event: CustomEvent): Promise<void> => {
    await refreshData();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>HK School Explorer</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
              {language === "en" ? "中文" : "EN"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-filter-panel">
          <IonSearchbar
            value={query}
            placeholder={
              language === "en"
                ? "Search name, address, or banding (e.g. 1A)"
                : "搜尋名稱、地址或 Band（如 1A）"
            }
            onIonInput={(event) => setQuery(event.detail.value ?? "")}
          />

          <IonSegment value={viewMode} onIonChange={(event) => setViewMode(event.detail.value as ViewMode)}>
            <IonSegmentButton value="all">
              <IonLabel>{language === "en" ? "All Schools" : "全部學校"}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="favorites">
              <IonLabel>{language === "en" ? "Favorites" : "收藏"}</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div className="home-select-row">
            <IonSelect
              interface="popover"
              label={language === "en" ? "District" : "分區"}
              labelPlacement="stacked"
              value={district}
              onIonChange={(event) => setDistrict(event.detail.value)}
            >
              <IonSelectOption value="all">{language === "en" ? "All" : "全部"}</IonSelectOption>
              {districts.map((item) => (
                <IonSelectOption key={item} value={item}>
                  {language === "en" ? item : schools.find((school) => school.districtEn === item)?.districtZh ?? item}
                </IonSelectOption>
              ))}
            </IonSelect>

            <IonSelect
              interface="popover"
              label={language === "en" ? "Level" : "學校類型"}
              labelPlacement="stacked"
              value={level}
              onIonChange={(event) => setLevel(event.detail.value)}
            >
              <IonSelectOption value="all">{language === "en" ? "All" : "全部"}</IonSelectOption>
              <IonSelectOption value="Kindergarten">{levelLabelMap.Kindergarten[language]}</IonSelectOption>
              <IonSelectOption value="Primary">{levelLabelMap.Primary[language]}</IonSelectOption>
              <IonSelectOption value="Secondary">{levelLabelMap.Secondary[language]}</IonSelectOption>
              <IonSelectOption value="Other">{levelLabelMap.Other[language]}</IonSelectOption>
            </IonSelect>
          </div>

          <div className="home-select-row home-select-row-full">
            <IonSelect
              interface="popover"
              label={language === "en" ? "Secondary banding" : "中學 Band"}
              labelPlacement="stacked"
              value={banding}
              onIonChange={(event) => setBanding(event.detail.value)}
            >
              <IonSelectOption value="all">{language === "en" ? "All bands" : "全部 Band"}</IonSelectOption>
              {bandingOptions.map((value) => (
                <IonSelectOption key={value} value={value}>
                  {value}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          <IonChip color="primary" outline>
            <IonLabel>
              {language === "en" ? `${filteredSchools.length} schools` : `${filteredSchools.length} 間學校`}
            </IonLabel>
          </IonChip>

          {userLocation ? (
            <IonChip color="tertiary" outline className="home-location-chip">
              <IonIcon icon={locationOutline} />
              <IonLabel className="home-location-label">
                {userLocation.address ??
                  `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
              </IonLabel>
            </IonChip>
          ) : null}
        </div>

        {loading ? (
          <div className="home-loading">
            <IonSpinner name="crescent" />
            <IonLabel>{language === "en" ? "Loading schools..." : "正在載入學校資料..."}</IonLabel>
          </div>
        ) : (
          <IonList inset>
            {filteredSchools.map((school) => {
              const bandingInfo = school.level === "Secondary" ? getBandingForSchool(school) : null;
              const bandingLabel = bandingInfo?.banding?.trim();
              return (
              <IonItem key={school.id} button onClick={() => history.push(`/school/${encodeURIComponent(school.id)}`)}>
                <IonLabel>
                  <h2>{language === "en" ? school.nameEn : school.nameZh ?? school.nameEn}</h2>
                  <p>{language === "en" ? school.addressEn : school.addressZh ?? school.addressEn}</p>
                  <p className="home-meta-row">
                    <IonBadge color="medium">{levelLabelMap[school.level][language]}</IonBadge>
                    {bandingLabel ? (
                      <IonBadge color="secondary" className="home-banding-badge">
                        Band {bandingLabel}
                      </IonBadge>
                    ) : null}
                    <span>{language === "en" ? school.districtEn : school.districtZh ?? school.districtEn}</span>
                  </p>
                </IonLabel>
                <IonButtons slot="end">
                  <IonButton
                    fill="clear"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFavoriteIds(toggleFavorite(school.id));
                    }}
                  >
                    <IonIcon icon={favoriteSet.has(school.id) ? heart : heartOutline} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    onClick={(event) => {
                      event.stopPropagation();
                      const keyword = encodeURIComponent(
                        `${language === "en" ? school.nameEn : school.nameZh ?? school.nameEn} ${language === "en" ? school.addressEn : school.addressZh ?? school.addressEn}`
                      );
                      window.open(`https://www.google.com/maps/search/?api=1&query=${keyword}`, "_blank");
                    }}
                  >
                    <IonIcon icon={locationOutline} />
                  </IonButton>
                </IonButtons>
              </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
