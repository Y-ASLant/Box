const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;

export function normalizeHttpUrl(url: string): string {
  const normalizedUrl = url.trim();
  return HTTP_PROTOCOL_PATTERN.test(normalizedUrl)
    ? normalizedUrl
    : `http://${normalizedUrl}`;
}
