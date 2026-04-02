import React, { useEffect, useMemo, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { RouteComponentProps } from "react-router-dom";
import {
  getComparedValue,
  getTeachingLanguageSearchText,
  schoolLevelLabelMap,
  teachingLanguageField
} from "../compare/compareUtils";
import { sampleSchools } from "../data/sampleSchools";
import { fetchSchools, getCachedSchools } from "../services/schoolService";
import { School } from "../types/school";
import "./CompareSelect.css";

type Params = { id: string };

type Props = RouteComponentProps<Params>;
type Language = "en" | "zh";

const CompareSelect: React.FC<Props> = ({ match, history }) => {
  const baseId = decodeURIComponent(match.params.id);
  const [schools, setSchools] = useState<School[]>(() => getCachedSchools());
  const [loading, setLoading] = useState<boolean>(() => getCachedSchools().length === 0);
  const [query, setQuery] = useState<string>("");
  const [district, setDistrict] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [teachingLang, setTeachingLang] = useState<string>("all");
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("hk-school-app-lang") as Language) ?? "en"
  );

  useEffect(() => {
    if (schools.length > 0) {
      return;
    }
    void fetchSchools().then((items) => {
      setSchools(items);
      setLoading(false);
    });
  }, [schools.length]);

  useEffect(() => {
    setTeachingLang("all");
  }, [language]);

  const baseSchool = useMemo(() => {
    const fromList = schools.find((s) => s.id === baseId);
    if (fromList) {
      return fromList;
    }
    return sampleSchools.find((s) => s.id === baseId);
  }, [schools, baseId]);

  const candidates = useMemo(() => {
    const list = schools.length > 0 ? schools : sampleSchools;
    return list.filter((s) => s.id !== baseId);
  }, [schools, baseId]);

  const districts = useMemo(() => {
    const values = new Set<string>();
    candidates.forEach((school) => values.add(school.districtEn));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  const teachingLangOptions = useMemo(() => {
    const values = new Set<string>();
    candidates.forEach((school) => {
      const v = getComparedValue(school, teachingLanguageField, language);
      if (v !== "—") {
        values.add(v);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [candidates, language]);

  const filtered = useMemo(() => {
    let list = candidates;

    if (district !== "all") {
      list = list.filter((s) => s.districtEn === district);
    }
    if (level !== "all") {
      list = list.filter((s) => s.level === level);
    }
    if (teachingLang !== "all") {
      list = list.filter((s) => getComparedValue(s, teachingLanguageField, language) === teachingLang);
    }

    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter(
        (s) =>
          s.nameEn.toLowerCase().includes(q) ||
          (s.nameZh ?? "").toLowerCase().includes(q) ||
          s.districtEn.toLowerCase().includes(q) ||
          (s.districtZh ?? "").toLowerCase().includes(q) ||
          getTeachingLanguageSearchText(s).includes(q) ||
          getComparedValue(s, teachingLanguageField, language).toLowerCase().includes(q)
      );
    }

    return list;
  }, [candidates, district, level, teachingLang, language, query]);

  const pickOther = (other: School): void => {
    history.push(`/compare/${encodeURIComponent(baseId)}/${encodeURIComponent(other.id)}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/school/${encodeURIComponent(baseId)}`} />
          </IonButtons>
          <IonTitle>{language === "en" ? "Compare with…" : "與其他學校比較…"}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                const next = language === "en" ? "zh" : "en";
                localStorage.setItem("hk-school-app-lang", next);
                setLanguage(next);
              }}
            >
              {language === "en" ? "中文" : "EN"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding compare-select-content">
        {baseSchool && (
          <p className="compare-select-hint">
            {language === "en" ? "Base school: " : "基準學校："}
            <strong>
              {language === "en" ? baseSchool.nameEn : baseSchool.nameZh ?? baseSchool.nameEn}
            </strong>
          </p>
        )}

        <IonSearchbar
          value={query}
          placeholder={
            language === "en"
              ? "Search name, district, or teaching language"
              : "搜尋名稱、分區或教學語言"
          }
          onIonInput={(e) => setQuery(e.detail.value ?? "")}
        />

        <div className="compare-select-filter-row">
          <IonSelect
            interface="popover"
            label={language === "en" ? "District" : "分區"}
            labelPlacement="stacked"
            value={district}
            onIonChange={(e) => setDistrict(e.detail.value)}
          >
            <IonSelectOption value="all">{language === "en" ? "All districts" : "全部分區"}</IonSelectOption>
            {districts.map((item) => (
              <IonSelectOption key={item} value={item}>
                {language === "en" ? item : candidates.find((school) => school.districtEn === item)?.districtZh ?? item}
              </IonSelectOption>
            ))}
          </IonSelect>

          <IonSelect
            interface="popover"
            label={language === "en" ? "Level" : "學校類型"}
            labelPlacement="stacked"
            value={level}
            onIonChange={(e) => setLevel(e.detail.value)}
          >
            <IonSelectOption value="all">{language === "en" ? "All levels" : "全部類型"}</IonSelectOption>
            <IonSelectOption value="Kindergarten">{schoolLevelLabelMap.Kindergarten[language]}</IonSelectOption>
            <IonSelectOption value="Primary">{schoolLevelLabelMap.Primary[language]}</IonSelectOption>
            <IonSelectOption value="Secondary">{schoolLevelLabelMap.Secondary[language]}</IonSelectOption>
            <IonSelectOption value="Other">{schoolLevelLabelMap.Other[language]}</IonSelectOption>
          </IonSelect>
        </div>

        <IonSelect
          className="compare-select-moi-select"
          interface="popover"
          label={language === "en" ? "Teaching language" : "教學語言"}
          labelPlacement="stacked"
          value={teachingLang}
          onIonChange={(e) => setTeachingLang(e.detail.value)}
        >
          <IonSelectOption value="all">{language === "en" ? "All" : "全部"}</IonSelectOption>
          {teachingLangOptions.map((opt) => (
            <IonSelectOption key={opt} value={opt}>
              {opt}
            </IonSelectOption>
          ))}
        </IonSelect>

        <IonChip color="primary" outline className="compare-select-count-chip">
          <IonLabel>
            {language === "en" ? `${filtered.length} schools` : `${filtered.length} 間學校`}
          </IonLabel>
        </IonChip>

        {loading ? (
          <div className="compare-select-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <IonList inset>
            {filtered.map((school) => (
              <IonItem key={school.id} button onClick={() => pickOther(school)}>
                <IonLabel>
                  <h2>{language === "en" ? school.nameEn : school.nameZh ?? school.nameEn}</h2>
                  <p>{language === "en" ? school.districtEn : school.districtZh ?? school.districtEn}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CompareSelect;
