import React, { useEffect, useMemo, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useHistory } from "react-router-dom";
import { fetchSchools } from "../services/schoolService";
import { School } from "../types/school";
import "./SchoolMap.css";

type Language = "en" | "zh";

const HK_CENTER: [number, number] = [22.35, 114.15];
const DEFAULT_ZOOM = 11;

const SchoolMap: React.FC = () => {
  const history = useHistory();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("hk-school-app-lang") as Language) ?? "en"
  );

  useEffect(() => {
    localStorage.setItem("hk-school-app-lang", language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      setLoading(true);
      try {
        const items = await fetchSchools();
        if (!cancelled) {
          setSchools(items);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const schoolsWithCoords = useMemo(
    () => schools.filter((s) => s.latitude != null && s.longitude != null),
    [schools]
  );

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "school-map-dot",
        html: "<span></span>",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      }),
    []
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text={language === "en" ? "Back" : "返回"} />
          </IonButtons>
          <IonTitle>{language === "en" ? "School map" : "學校地圖"}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
              {language === "en" ? "中文" : "EN"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen scrollY={false} className="school-map-content">
        {loading ? (
          <div className="school-map-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <div className="school-map-fill">
            <MapContainer center={HK_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
                {schoolsWithCoords.map((school) => (
                  <Marker
                    key={school.id}
                    position={[school.latitude as number, school.longitude as number]}
                    icon={markerIcon}
                  >
                    <Popup className="school-map-popup">
                      <h3>{language === "en" ? school.nameEn : school.nameZh ?? school.nameEn}</h3>
                      <p>{language === "en" ? school.addressEn : school.addressZh ?? school.addressEn}</p>
                      <IonButton
                        size="small"
                        expand="block"
                        onClick={() => history.push(`/school/${encodeURIComponent(school.id)}`)}
                      >
                        {language === "en" ? "Details" : "詳情"}
                      </IonButton>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SchoolMap;
