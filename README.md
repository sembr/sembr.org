# sembr.org

Website for the [Semantic Line Breaks](https://sembr.org) specification.

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
