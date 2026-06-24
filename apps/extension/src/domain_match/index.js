export function isOriginHttps(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}
