import { DONATION_URL } from "../config";

export default function SupportLink() {
  if (!DONATION_URL) return null;

  return (
    <a
      href={DONATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#0f172a", fontSize: "0.9rem", textDecoration: "none" }}
    >
      Support SwimStarter
    </a>
  );
}
