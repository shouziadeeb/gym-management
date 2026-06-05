/** Parse OAuth callback URL query/hash for code and errors. */
export function parseOAuthCallbackUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(
      parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash,
    );

    const codeFromQuery = parsed.searchParams.get('code');
    const codeFromHash = hashParams.get('code');

    return {
      href: url,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      code: codeFromQuery ?? codeFromHash,
      state: parsed.searchParams.get('state') ?? hashParams.get('state'),
      error: parsed.searchParams.get('error') ?? hashParams.get('error'),
      error_description:
        parsed.searchParams.get('error_description') ??
        hashParams.get('error_description'),
      queryParams: Object.fromEntries(parsed.searchParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
    };
  } catch {
    const codeMatch = url.match(/[?&#]code=([^&]+)/);
    return {
      href: url,
      pathname: null,
      search: null,
      hash: null,
      code: codeMatch ? decodeURIComponent(codeMatch[1]) : null,
      state: null,
      error: null,
      error_description: null,
      queryParams: {},
      hashParams: {},
    };
  }
}

/** Authorization code only — required by `exchangeCodeForSession(code)`, not the full URL. */
export function extractAuthCodeFromUrl(url: string): string | null {
  return parseOAuthCallbackUrl(url).code;
}
