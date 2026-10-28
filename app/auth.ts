import { headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { verifyOwnerToken } from './access-token';

export async function getOwner() {
  const h = await headers();
  // Cookie fallback permits the owner-only link on the public home page.
  const cookie = h.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const token = h.get('cf-access-jwt-assertion') || cookie;
  if (!token) return null;
  return verifyOwnerToken(token, { teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD, ownerEmail: env.OWNER_EMAIL });
}
