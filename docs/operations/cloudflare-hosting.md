# Cloudflare hosting

The public dashboard (`pcfc.denizci.dev`) is a static build in `dist/`, served by a
Cloudflare Worker with static assets. There is no server code, database, binding, or
secret in the deployment. Configuration lives in `wrangler.jsonc`.

## Commands

| Command                | What it does                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run site:preview` | Builds `dist/` and serves it on loopback (Node, no Cloudflare runtime) |
| `npm run cf:dev`       | Builds `dist/` and serves it through Wrangler's local Workers runtime  |
| `npm run cf:deploy`    | Builds, runs the static-site checks, then uploads to Cloudflare        |

`cf:dev` needs the current Microsoft Visual C++ Redistributable on Windows; without it
the local runtime crashes with an access violation. `cf:deploy` does not depend on it.

## First-time setup

1. `npx wrangler login` (opens a browser to authorize Wrangler for the Cloudflare account).
2. `npm run cf:deploy`. The Worker `pcfc-intelligence-hub` is created and served at
   `https://pcfc-intelligence-hub.<account-subdomain>.workers.dev`. Check it there first.

## Custom domain cutover

`denizci.dev` DNS is currently managed at the registrar, with
`pcfc CNAME custom-domains.chatgpt.site` pointing at the old host.

- **Zone on Cloudflare (recommended):** add `denizci.dev` to Cloudflare, copy the
  existing records across, switch the registrar's nameservers to Cloudflare, then add
  `pcfc.denizci.dev` as a Custom Domain on the Worker (Workers & Pages → the worker →
  Settings → Domains & Routes). Cloudflare creates the DNS record and certificate.
- **DNS stays at the registrar:** Worker Custom Domains require a Cloudflare zone. Without
  one, either move the zone, or use a Cloudflare for SaaS custom hostname (paid add-on).

After the domain serves from Cloudflare, delete the old `pcfc` CNAME, the
`_openai-site-verification` TXT record, and `.openai/hosting.json`.
