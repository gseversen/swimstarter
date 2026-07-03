import { ADS_ENABLED } from "../config";

// ponytail: render a real ad unit (Carbon/EthicalAds/AdSense) once ADS_ENABLED.
export default function AdSlot() {
  if (!ADS_ENABLED) return null;

  return (
    <div
      style={{
        marginTop: "1.5rem",
        padding: "0.75rem",
        border: "1px dashed #cbd5e1",
        borderRadius: "8px",
        textAlign: "center",
        color: "#94a3b8",
        fontSize: "0.85rem",
      }}
    >
      Ad slot
    </div>
  );
}
