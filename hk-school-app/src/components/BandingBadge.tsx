import { IonBadge } from "@ionic/react";
import React from "react";
import { getBandingBadgeColors } from "../utils/schoolBanding";
import "./BandingBadge.css";

type Props = {
  bandLabel: string;
  /** Stagger animation phase in lists (long lists are capped in parent). */
  staggerIndex?: number;
  /** When false, only the band text is shown (e.g. detail header already says “Band”). */
  showBandWord?: boolean;
  className?: string;
};

const BandingBadge: React.FC<Props> = ({
  bandLabel,
  staggerIndex = 0,
  showBandWord = true,
  className = ""
}) => {
  const { background, color } = getBandingBadgeColors(bandLabel);
  return (
    <IonBadge
      className={`banding-badge ${className}`.trim()}
      style={{
        backgroundColor: background,
        color,
        ["--band-stagger" as string]: String(staggerIndex)
      }}
    >
      {showBandWord ? `Band ${bandLabel}` : bandLabel}
    </IonBadge>
  );
};

export default BandingBadge;
