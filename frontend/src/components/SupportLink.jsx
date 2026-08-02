import { DONATION_URL } from "../config";
import { colors, radii, spacing } from "../theme";

export default function SupportLink() {
  if (!DONATION_URL) return null;

  return (
    <a
      href={DONATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `0.4rem ${spacing.md}`,
        fontSize: "0.82rem",
        fontWeight: 500,
        color: colors.text,
        textDecoration: "none",
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        backgroundColor: colors.surface,
        transition: "border-color 0.15s",
      }}
    >
      Support SwimStarter
    </a>
  );
}
