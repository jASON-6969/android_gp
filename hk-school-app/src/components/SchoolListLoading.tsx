import { IonLabel, IonProgressBar, IonSpinner } from "@ionic/react";
import Lottie from "lottie-react";
import React, { useEffect, useState } from "react";
import "./SchoolListLoading.css";

type Language = "en" | "zh";

type Props = {
  language: Language;
  /** 0–1 determinate progress while loading */
  progress: number;
};

const SchoolListLoading: React.FC<Props> = ({ language, progress }) => {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    const base = process.env.PUBLIC_URL ?? "";
    void fetch(`${base}/lottie-loading.json`)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => setAnimationData(null));
  }, []);

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className="school-list-loading" role="status" aria-busy="true" aria-valuenow={pct}>
      <div className="school-list-loading-lottie">
        {animationData ? (
          <Lottie animationData={animationData} loop className="school-list-loading-lottie-inner" />
        ) : (
          <IonSpinner name="crescent" />
        )}
      </div>
      <IonLabel className="school-list-loading-label">
        {language === "en" ? "Loading schools..." : "正在載入學校資料..."}
      </IonLabel>
      <IonProgressBar value={progress} buffer={1} className="school-list-loading-bar" />
      <span className="school-list-loading-pct">
        {language === "en" ? `${pct}%` : `已完成 ${pct}%`}
      </span>
    </div>
  );
};

export default SchoolListLoading;
