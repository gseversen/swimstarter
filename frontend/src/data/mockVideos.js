// ponytail: swap for real data (Supabase query or static content) later.
export const MOCK_VIDEOS = [
  { id: "vid-001", title: "50m Freestyle Sprint", genre: "race", stroke: "freestyle" },
  { id: "vid-002", title: "Butterfly Turn Drill", genre: "training", stroke: "butterfly" },
  { id: "vid-003", title: "Backstroke Start Session", genre: "training", stroke: "backstroke" },
];

/** Filter mock videos by optional genre and/or stroke (case-insensitive). */
export function searchVideos({ genre, stroke } = {}) {
  return MOCK_VIDEOS.filter(
    (v) =>
      (!genre || v.genre.toLowerCase() === genre.toLowerCase()) &&
      (!stroke || v.stroke.toLowerCase() === stroke.toLowerCase()),
  );
}
