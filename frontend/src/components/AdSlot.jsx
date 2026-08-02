import { ADS_ENABLED } from "../config";
import { colors, radii, spacing, typography } from "../theme";

// ponytail: render a real ad unit (Carbon/EthicalAds/AdSense) once ADS_ENABLED.
export default function AdSlot() {
  if (!ADS_ENABLED) return null;

  return (
    <div
      style={{
        marginTop: spacing.lg,
        padding: spacing.md,
        border: `1px dashed ${colors.border}`,
        borderRadius: radii.md,
        textAlign: "center",
        color: colors.textMuted,
        ...typography.small,
      }}
    >
      Ad slot
    </div>
  );
}
