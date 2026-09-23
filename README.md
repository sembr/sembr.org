# sembr.org

Website for the [Semantic Line Breaks](https://sembr.org) specification.

## Content sources

The build fetches the specification from
[`sembr/specification`'s README](https://github.com/sembr/specification/blob/main/README.md)
and skill documents from
[`sembr/skills`](https://github.com/sembr/skills).
Both sources use the `main` branch.
The website serves the skill documents through
[`/.well-known/agent-skills/`](https://sembr.org/.well-known/agent-skills/index.json).

Edit the specification and installation quick start in `sembr/specification`.
The [full installation and management guide](https://github.com/sembr/skills#installing)
belongs in `sembr/skills`.

Changes to the specification README trigger its deployment workflow,
which builds and deploys this website.
Cloudflare Workers Builds also builds and deploys this repository,
and runs builds for pull requests.
Changes to skill documents also need a website rebuild;
after merging them, run the specification repository's
[Deploy workflow](https://github.com/sembr/specification/actions/workflows/deploy.yml)
manually or use the deployment commands below.
When adding a skill, update the skill list in `src/content.config.ts`.

## Requirements

- Node.js `>=22.12.0`
- npm

## Setup

```sh
npm install
```

## Development

```sh
npm run dev
```

Starts the local Astro dev server at `http://localhost:4321`.

## Build

```sh
npm run build
npm run preview
```

`npm run build` writes the production site to `dist/`.
`npm run preview` serves that build locally.

## Deploy

```sh
npm run preview:worker
npm run deploy
```

`npm run preview:worker` builds the site and serves it locally with Wrangler.
`npm run deploy` builds the site and deploys it to Cloudflare Workers.
