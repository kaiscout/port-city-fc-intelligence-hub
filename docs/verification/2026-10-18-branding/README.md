# Product naming update — 18 October 2026

Approved name: **Port City FC Business Intelligence & Analytics**.

The existing public site and custom domain were preserved. Public release
version 8 is deployed at <https://pcfc.denizci.dev/>. This is a naming release,
not club acceptance or private-application deployment.

## Scope and provenance

- Updated browser titles, navigation branding, sharing metadata, public export
  metadata, application metadata, README and the profile-project description.
- Updated GitHub description, topics, homepage and a bounded branding commit:
  `43c522b82e2c575ecf73f77818d7afd2ea57d5e5`.
- Follow-up export-branding assertion and paced real-download test:
  `dcd4eed8871b59922d6659b91c54f61eca20cb1d`.
- Kept repository and Sites slugs unchanged to preserve existing links.
- Sites source commit: `2debe9953e4d467047e334340a013fdc402bf7db`.
- Deployment: `appgdep_6ad4d85f78bc8191b939b467372af059`, succeeded.
- Deployment archive SHA-256:
  `057282e359bb08648bfc3f8d73b20eb6ff5e6cf12c26b8e1e7c448853a83c05b`.
- Archive contains only the hosting manifest and eight static public assets.
- Data comparison against the preceding public build found only product-name
  and build-timestamp changes. No financial values or equations changed.
- Existing primary working-tree changes were preserved. GitHub branding was
  committed from an isolated clone; unrelated local changes were not pushed.

## Verification

- Public numerical/export suite: 78 cases passed.
- Current public browser suite: 95 checks passed, including 54 filter/export
  combinations and all nine mobile workspaces; no console errors.
- Responsive/design suite: 25 checks passed across four viewports and two themes.
- Separate native Next.js production build: passed, with 43 unit tests passing.
- Live HTTPS: all nine routes checked at 1600px and 390px, without horizontal
  page overflow. Product titles and synthetic-data boundaries were present.
- Live finance CSV contained the new project name and evidence disclaimer.
- Full live browser verification subsequently passed 103 checks, including
  matching all eight deployed asset hashes, 54 filter/export combinations and
  all nine mobile workspaces, with no console errors.
- Four refreshed PNGs visually reviewed; screenshot provenance and live results
  are in `outputs/linkedin-business-intelligence-analytics-2026-10-18/ready/`.

The Pi executed compatible public builds and browser checks. Limited Pi disk
capacity required the separate native build to use fresh isolated Dell staging.
An initial staging junction was rejected by Turbopack; a fresh dependency
installation resolved that environment limitation without application changes.

GitHub CI twice timed out waiting for a scenario CSV download. That exact
source passed all 94 browser checks on the Pi. A bounded follow-up preserves
every assertion, spaces real download starts by at least 250ms, adds download
failure diagnostics, allows a configured Chromium executable and asserts the
new project name in every CSV. The updated GitHub source also passed its 94
browser checks and 77 numerical/export cases on the Pi. The final CI result is
recorded below when available. No product calculation was changed to address
the test failure. Do not infer that the public static site deploys or tests
the private PostgreSQL application.

Final GitHub CI: **passed** for
`dcd4eed8871b59922d6659b91c54f61eca20cb1d`, including public browser verification
and the separate private-application desktop tests. See
[the successful run](https://github.com/kaiscout/port-city-fc-intelligence-hub/actions/runs/39137058153).
The initial timeout records remain available; the successful follow-up does not
erase or mislabel them.

## Preserved boundaries

Public figures remain synthetic/generalized and are not PCFC actuals. The
private application and database were not deployed or connected. No LinkedIn
account action was performed. Earlier binary recordings and dated screenshots
remain historical evidence; they were not silently relabeled or overwritten.
