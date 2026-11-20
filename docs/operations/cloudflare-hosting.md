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

## Account and domain

- Cloudflare account: the one whose `account_id` is set in `wrangler.jsonc`.
  Run `npx wrangler login` with that login before deploying.
- `denizci.dev` is a Cloudflare zone in the same account. `pcfc.denizci.dev` is attached as a
  Worker Custom Domain through `routes` in `wrangler.jsonc`; Cloudflare manages its DNS
  record and certificate, so there is nothing to edit by hand.
- The `workers.dev` URL is disabled because the custom domain is the only public entry point.

## History

Until 2026-11-20 the site was published to ChatGPT Sites (`.openai/hosting.json`, with
`pcfc CNAME custom-domains.chatgpt.site` and two verification TXT records). That
manifest and those three DNS records were removed at the Cloudflare cutover. The dated
`docs/verification/2026-10-18-*` reports describe the earlier host.
