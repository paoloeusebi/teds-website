# The Effective Data Scientist website

Static site for [The Effective Data Scientist](https://theeffectivedatascientist.podigee.io/) podcast, built with [Astro](https://astro.build) and deployed to GitHub Pages.

## How it works

- Episodes are not stored in this repository. At build time, `src/lib/feed.ts` reads the Podigee RSS feed and turns each item into a page under `/episodes/<slug>/`.
- The deploy workflow rebuilds the site on every push to `main` and once a day, so new episodes appear automatically.
- Brand colors and fonts live in `src/styles/global.css` as CSS variables.

## Local development

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run check      # type-check
```

To build without network access, point the loader at the sample feed:

```sh
FEED_FILE=test/fixtures/feed.xml npm run build
```

## Deployment

In the repository settings, under **Pages → Build and deployment**, set **Source** to **GitHub Actions**. The `Deploy to GitHub Pages` workflow does the rest.
