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
import { RouteComponentProps } from "react-router-dom";
import {
  compareFields,
  getComparedValue,
  getSchoolDisplayName,
  valuesDiffer
} from "../compare/compareUtils";
import { sampleSchools } from "../data/sampleSchools";
import { fetchSchools, getCachedSchools } from "../services/schoolService";
import { School } from "../types/school";
import "./SchoolCompare.css";

type Params = { idBase: string; idOther: string };

type Props = RouteComponentProps<Params>;
type Language = "en" | "zh";

const resolveSchool = (list: School[], id: string): School | undefined => {
  const fromList = list.find((s) => s.id === id);
  if (fromList) {
    return fromList;
  }
  return sampleSchools.find((s) => s.id === id);
};

const SchoolCompare: React.FC<Props> = ({ match }) => {
  const idBase = decodeURIComponent(match.params.idBase);
  const idOther = decodeURIComponent(match.params.idOther);
  const [schools, setSchools] = useState<School[]>(() => getCachedSchools());
  const [loading, setLoading] = useState<boolean>(() => getCachedSchools().length === 0);
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

  const schoolA = useMemo(() => resolveSchool(schools, idBase), [schools, idBase]);
  const schoolB = useMemo(() => resolveSchool(schools, idOther), [schools, idOther]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/school/${encodeURIComponent(idBase)}`} />
          </IonButtons>
          <IonTitle>{language === "en" ? "School comparison" : "學校對照"}</IonTitle>
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
      <IonContent className="ion-padding school-compare-content">
        {loading ? (
          <div className="school-compare-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : !schoolA || !schoolB ? (
          <p>{language === "en" ? "Could not load one or both schools." : "無法載入其中一間或兩間學校的資料。"}</p>
        ) : (
          <div className="school-compare-table-wrap">
            <table className="school-compare-table">
              <thead>
                <tr>
                  <th scope="col" className="school-compare-col-field">
                    {language === "en" ? "Field" : "項目"}
                  </th>
                  <th scope="col" className="school-compare-col-school">
                    {getSchoolDisplayName(schoolA, language)}
                  </th>
                  <th scope="col" className="school-compare-col-school">
                    {getSchoolDisplayName(schoolB, language)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareFields.map((field) => {
                  const label = language === "en" ? field.enLabel : field.zhLabel;
                  const vA = getComparedValue(schoolA, field, language);
                  const vB = getComparedValue(schoolB, field, language);
                  const diff = valuesDiffer(vA, vB);
                  return (
                    <tr key={field.enLabel} className={diff ? "school-compare-row-diff" : undefined}>
                      <th scope="row" className="school-compare-col-field">
                        {label}
                      </th>
                      <td>{vA}</td>
                      <td>{vB}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="school-compare-legend">
              {language === "en"
                ? "Highlighted rows show different values."
                : "已突顯顯示數值不同的項目。"}
            </p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SchoolCompare;
