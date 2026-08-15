<img alt="i2i logo" src="images/i2i-logo.png" align="right" width="150px"/>

# Ideas 2 Innovation: Official Website

Welcome to the repository of Ideas 2 Innovation website! This repo holds three
independently deployed pieces — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
for how they fit together, and [`docs/SCHEMA.md`](docs/SCHEMA.md) for the database.

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

`images/` - Contains images for the website

All of the `HTML` files are located in the root directory.

**`admin/`** — the admin panel (Next.js + TypeScript + Chakra UI), hosted on
Vercel. See [`admin/README.md`](admin/README.md) to run it locally.

**`supabase/`** — database schema, RLS policies, and Storage bucket config as
SQL migrations. See [`supabase/README.md`](supabase/README.md) to set up or
apply changes.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch naming, PR checklist, and
who owns which part of the repo.
