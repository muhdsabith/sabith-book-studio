# Sabith Book Studio

Public book catalogue with owner-only Add Book, image upload, Amazon links, and removal of uploaded books. Preserves the existing studio design and Cosy Moments cover. Built with React/Vinext, Cloudflare Workers, D1 and R2.

## Migration status

This is a standalone hosting adaptation, not an already deployed website. Production build, TypeScript check and nine authentication tests passed locally. Cloudflare resource creation, Access configuration and live upload/delete checks remain required. The existing ChatGPT-hosted website is unaffected.

The original live books table was empty when inspected on 28 October 2026. Cosy Moments is included in the home page and its cover is embedded in `app/images.ts`; no uploaded book records needed migration. Recheck the old database if books have been added since then.

## Deploy from GitHub to Cloudflare

1. Upload these files to `muhdsabith/sabith-book-studio`, keeping the folder structure. Do not upload node_modules, build output, credentials or environment files.
2. In your Cloudflare account create a D1 database named `sabith-books` and an R2 bucket named `sabith-book-covers`.
3. Replace the placeholder `database_id` in `wrangler.jsonc` with the new D1 database ID. Keep the bindings `DB` and `BUCKET` unchanged.
4. In Workers & Pages, create a Worker connected to this GitHub repository. Worker name: `sabith-book-studio`. Use Node 24 and the pinned pnpm version from package.json. Install: `pnpm install --frozen-lockfile`; build: `pnpm build`; deploy: `pnpm deploy`. The deploy script applies the D1 migration before uploading the Worker. The build API token needs permissions for this Worker's deployment, D1 migrations and R2 binding; keep tokens only in Cloudflare, never in this repository.
5. Complete the owner-login setup below before relying on Add Book. The code refuses all owner actions until it has valid Access settings and a verified owner token.
6. Open the resulting public URL and verify the cover, Amazon link, and mobile layout. Then log in at `/admin`, add a test book with a cover, view it from a signed-out browser and remove it. Only after these checks should the Instagram link change to the new URL.

### Owner login

Use Cloudflare Zero Trust Access with email one-time PIN or your preferred identity provider. Create a self-hosted Access application covering the new Worker's `/admin` and `/admin/*` routes. Allow only `sabith4400@gmail.com`; do not protect the public home page. Use the actual Worker hostname or a custom hostname supported by your account.

Set these Worker variables in `wrangler.jsonc` and redeploy:

- `ACCESS_TEAM_DOMAIN`: your team hostname, e.g. `your-team.cloudflareaccess.com` (no scheme or slash).
- `ACCESS_AUD`: the Access application's Audience tag.
- `OWNER_EMAIL`: `sabith4400@gmail.com`.

The API also verifies the Access application token from the same-origin cookie or assertion header, including its RSA signature, issuer, audience, expiration and owner email. Therefore `/api/books` and `/api/books/*` reject unauthenticated callers even without an Access path rule. If you protect those API paths at the edge, include them in the **same Access application** so the audience remains the same.

Visitors do not see Add Book or Studio login. The owner can bookmark `/admin`. The public home page can show the studio link when a valid owner cookie is present. No ChatGPT identity headers are trusted in this version. Never add a bypass that trusts a plain email header.

### Local development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev
pnpm check
pnpm test
pnpm build
```

Public pages can be previewed locally. Owner mutation testing needs a valid Access session/configuration; there is deliberately no development authentication bypass. R2 files and D1 rows persist in Cloudflare and are not stored in GitHub. Back them up independently. Cosy Moments is a built-in card; the remove control manages uploaded books only.

### References

- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

## Validation limits

No new Cloudflare deployment, live Access login, or live image upload has been completed for this migration. Local build and token checks do not replace those final checks. Existing hosting remains in place.
