export function isMobileDevice(): boolean {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS reports as Macintosh but exposes multiple touch points
  return navigator.maxTouchPoints > 1 && /Macintosh/.test(ua);
}
