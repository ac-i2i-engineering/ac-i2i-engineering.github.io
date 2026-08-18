<img alt="i2i logo" src="images/i2i-logo.png" align="right" width="150px"/>

# Ideas 2 Innovation: Official Website

Welcome to the repository of Ideas 2 Innovation website! This repo holds three
independently deployed pieces — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
for how they fit together, [`docs/SCHEMA.md`](docs/SCHEMA.md) for the database,
and [`docs/AUTH.md`](docs/AUTH.md) for admin roles/authentication.

**Quickstart:** [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) to run
everything locally, [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) to ship it.

## Directory Structure

**Public website** (this directory) — static HTML/CSS/vanilla JS, hosted on GitHub Pages.

`css/` - The home of all the `.css` files for this website

- `styles.css` contains global styles (styles used throughout the entire website)
- All other `css` files include styles for the corresponding `HTML` page (e.g. `about.css` and `about.html`)

`js/` - All of the JavaScript files are located in this directory

- `app.js` contains JavaScript related to the entire website
- `initAOS.js` is used to configure scroll animations
- `vanilla-tilt.js` is a third-party library
- `supabase-client.js` creates the one shared Supabase client (`supabaseClient`)
  every data-driven page uses — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
  Always reuse this client rather than hardcoding the Supabase URL/key again
  in a page's own `<script>` block.

`images/` - Contains images for the website

`team.json`, `startups.json`, `data/media.json` - **Legacy.** No page reads
these anymore; Team, Startups, and Media all fetch live from Supabase via
`js/supabase-client.js`. Kept only as the historical source the initial
database seed was generated from.

All of the `HTML` files are located in the root directory.

**`admin/`** — the admin panel (Next.js + TypeScript + Chakra UI), hosted on
Vercel. See [`admin/README.md`](admin/README.md) to run it locally.

**`supabase/`** — database schema, RLS policies, and Storage bucket config as
SQL migrations. See [`supabase/README.md`](supabase/README.md) to set up or
apply changes.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch naming, PR checklist, and
who owns which part of the repo.
