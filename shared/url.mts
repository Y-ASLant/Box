const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const URI_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function normalizeHttpUrl(url: string): string {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) throw new TypeError('URL不能为空');
  if (URI_SCHEME_PATTERN.test(normalizedUrl) && !HTTP_PROTOCOL_PATTERN.test(normalizedUrl)) {
    throw new TypeError('仅支持HTTP(S)地址');
  }
  const candidate = HTTP_PROTOCOL_PATTERN.test(normalizedUrl)
    ? normalizedUrl
    : `http://${normalizedUrl}`;
  const parsedUrl = new URL(candidate);
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new TypeError('仅支持HTTP(S)地址');
  }
  return parsedUrl.toString();
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
