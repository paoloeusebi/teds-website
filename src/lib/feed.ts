import { XMLParser } from 'fast-xml-parser';
import sanitizeHtml from 'sanitize-html';
import type { Loader } from 'astro/loaders';

export interface RawEpisode {
  id: string;
  number: number | null;
  title: string;
  slug: string;
  pubDate: Date;
  summary: string;
  html: string;
  audioUrl: string;
  audioType: string;
  durationSeconds: number | null;
  keywords: string[];
  authors: string;
  podigeeUrl: string;
  transcriptUrl: string | null;
}

const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const text = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)['#text']);
  return String(v);
};

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDuration(v: string): number | null {
  if (!v) return null;
  if (/^\d+$/.test(v)) return Number(v);
  const parts = v.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function parseFeed(xml: string): RawEpisode[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', cdataPropName: false });
  const doc = parser.parse(xml);
  const items = asArray(doc?.rss?.channel?.item);

  return items.map((item: Record<string, any>) => {
    const title = text(item['itunes:title'] || item.title).trim();
    const numRaw = text(item['itunes:episode'] || item['podcast:episode']);
    const number = numRaw ? Number(numRaw) : null;
    const podigeeUrl = text(item.link);
    // Reuse Podigee's slug (e.g. "28-using-frameworks...") so URLs stay recognisable.
    const fromLink = podigeeUrl.split('/').filter(Boolean).pop() ?? '';
    const slug = fromLink && /^[a-z0-9-]+$/.test(fromLink) ? fromLink : slugify(`${number ?? ''} ${title}`);
    const enclosure = item.enclosure ?? {};
    const transcripts = asArray(item['podcast:transcript']);
    const vtt = transcripts.find((t: any) => String(t['@_type'] ?? '').includes('vtt')) ?? transcripts[0];
    const rawHtml = text(item['content:encoded']) || text(item.description);

    return {
      id: text(item.guid) || slug,
      number: Number.isFinite(number) ? number : null,
      title,
      slug,
      pubDate: new Date(text(item.pubDate)),
      summary: text(item['itunes:summary'] || item.description).trim(),
      html: sanitizeHtml(rawHtml),
      audioUrl: text(enclosure['@_url']),
      audioType: text(enclosure['@_type']) || 'audio/mpeg',
      durationSeconds: parseDuration(text(item['itunes:duration'])),
      keywords: text(item['itunes:keywords']).split(',').map((k) => k.trim()).filter(Boolean),
      authors: text(item['itunes:author']).trim(),
      podigeeUrl,
      transcriptUrl: vtt ? text(vtt['@_url']) || null : null,
    };
  });
}

/**
 * Loads episodes from the podcast RSS feed at build time.
 * Set FEED_FILE to a local XML file to build offline (used in tests and sandboxes).
 */
export function podcastFeedLoader(opts: { url: string }): Loader {
  return {
    name: 'podcast-feed-loader',
    load: async ({ store, logger, parseData, generateDigest }) => {
      let xml: string;
      const file = process.env.FEED_FILE;
      if (file) {
        const { readFile } = await import('node:fs/promises');
        xml = await readFile(file, 'utf8');
        logger.info(`Reading episodes from local file ${file}`);
      } else {
        const res = await fetch(opts.url);
        if (!res.ok) throw new Error(`Feed request failed: ${res.status} ${res.statusText}`);
        xml = await res.text();
      }

      const episodes = parseFeed(xml);
      store.clear();
      for (const ep of episodes) {
        const { html, ...rest } = ep;
        const data = await parseData({ id: ep.slug, data: { ...rest } });
        store.set({ id: ep.slug, data, digest: generateDigest({ ...rest, html }), rendered: { html } });
      }
      logger.info(`Loaded ${episodes.length} episodes`);
    },
  };
}
