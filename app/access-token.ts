type AccessConfig = { teamDomain: string; audience: string; ownerEmail: string };
type JWK = JsonWebKey & { kid?: string };
const cache = new Map<string, { keys: JWK[]; expires: number }>();
function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

// Never trust identity headers without verifying an Access signature.
export async function verifyOwnerToken(token: string, config: AccessConfig, fetcher = fetch) {
  try {
    const { teamDomain, audience, ownerEmail } = config;
    if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain) || !audience || !ownerEmail || token.length > 16384) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const now = Date.now() / 1000;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    if (claims.iss !== `https://${teamDomain}` || !Array.isArray(claims.aud) || !claims.aud.includes(audience)) return null;
    if (typeof claims.exp !== 'number' || claims.exp <= now || (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || claims.nbf > now))) return null;
    if (typeof claims.email !== 'string' || claims.email.toLowerCase() !== ownerEmail.toLowerCase() || typeof claims.sub !== 'string') return null;
    let entry = cache.get(teamDomain);
    if (!entry || entry.expires <= Date.now() || !entry.keys.some(k => k.kid === header.kid)) {
      const response = await fetcher(`https://${teamDomain}/cdn-cgi/access/certs`);
      if (!response.ok) return null;
      const body = await response.json() as { keys: JWK[] };
      if (!Array.isArray(body.keys)) return null;
      entry = { keys: body.keys, expires: Date.now() + 300000 };
      cache.set(teamDomain, entry);
    }
    const jwk = entry.keys.find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid ? { email: claims.email as string, userId: claims.sub as string } : null;
  } catch { return null; }
}
